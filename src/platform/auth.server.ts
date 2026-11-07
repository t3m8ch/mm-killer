import { createHash, randomBytes } from "node:crypto";
import { implement } from "@orpc/server";
import { and, eq, gt } from "drizzle-orm";
import { authContract } from "./auth-contract.shared.ts";
import { users, sessions } from "./auth-schema.server.ts";
import { authed, transaction } from "./rpc.server.ts";
import type { Context } from "./context.server.ts";
import type { Database, Transaction } from "./db.server.ts";

const hash = (token: string) => createHash("sha256").update(token).digest();
const serialize = (row: typeof users.$inferSelect) => ({
  id: row.id,
  fullName: row.fullName,
  email: row.email,
  createdAt: row.createdAt.toISOString(),
  updatedAt: row.updatedAt.toISOString(),
});

export type User = ReturnType<typeof serialize>;

const duration = 60 * 60 * 24 * 30;

export async function seedUsers(db: Database | Transaction, now: Date) {
  await db
    .insert(users)
    .values([
      { fullName: "Анна Иванова", email: "anna@example.test", createdAt: now, updatedAt: now },
      { fullName: "Иван Петров", email: "ivan@example.test", createdAt: now, updatedAt: now },
    ])
    .onConflictDoNothing({ target: users.email });
}

export async function resolveUser(
  db: Database | Transaction,
  token: string | undefined,
  now: Date,
): Promise<User | null> {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return null;
  }

  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, hash(token)), gt(sessions.expiresAt, now)));

  return row ? serialize(row.user) : null;
}

const os = implement(authContract).$context<Context>();

export const authApi = {
  users: os.users.handler(async ({ context }) =>
    (await context.db.select().from(users).orderBy(users.id)).map(serialize),
  ),
  login: os.login.use(transaction).handler(async ({ context, input, errors }) => {
    const [user] = await context.db.select().from(users).where(eq(users.id, input.userId));

    if (!user) {
      throw errors.NOT_FOUND();
    }

    const token = randomBytes(32).toString("base64url");
    const now = context.now();

    if (context.sessionToken) {
      await context.db.delete(sessions).where(eq(sessions.tokenHash, hash(context.sessionToken)));
    }

    await context.db.insert(sessions).values({
      tokenHash: hash(token),
      userId: user.id,
      createdAt: now,
      expiresAt: new Date(now.getTime() + duration * 1000),
    });
    context.setSessionCookie?.(token, duration);

    return serialize(user);
  }),
  me: os.me.use(authed).handler(({ context }) => context.user),
  logout: os.logout
    .use(authed)
    .use(transaction)
    .handler(async ({ context }) => {
      if (context.sessionToken) {
        await context.db.delete(sessions).where(eq(sessions.tokenHash, hash(context.sessionToken)));
      }

      context.setSessionCookie?.("", 0);

      return { ok: true };
    }),
  logoutAll: os.logoutAll
    .use(authed)
    .use(transaction)
    .handler(async ({ context }) => {
      await context.db.delete(sessions).where(eq(sessions.userId, context.user.id));
      context.setSessionCookie?.("", 0);

      return { ok: true };
    }),
};
