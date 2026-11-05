import { os, ORPCError } from "@orpc/server";
import type { Database, Transaction } from "./db.ts";
import type { User } from "./auth.ts";

export type Context = {
  db: Database | Transaction;
  now: () => Date;
  user?: User | null;
  userId?: bigint;
  sessionToken?: string;
  setSessionCookie?: (token: string, maxAge: number) => void;
};
export const transaction = os.$context<Context>().middleware(({ context, next }) =>
  context.db.transaction(async (db) => await next({ context: { db } }), {
    isolationLevel: "read committed",
  }),
);
export const authed = os.$context<Context>().middleware(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({ context: { user: context.user, userId: context.user.id } });
});
