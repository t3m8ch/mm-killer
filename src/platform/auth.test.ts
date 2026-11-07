import { createRouterClient } from "@orpc/server";
import { expect, it } from "vitest";
import { authApi, seedUsers, resolveUser } from "./index.public.server.ts";
import type { Context } from "./index.public.server.ts";
import { rollbackTest, clock } from "../../tests/helpers/database";

function clientFor(context: Context, session = { token: "" }) {
  const client = createRouterClient(authApi, {
    context: async () => ({
      ...context,
      user: await resolveUser(context.db, session.token, context.now()),
      sessionToken: session.token,
      setSessionCookie: (value: string) => {
        session.token = value;
      },
    }),
  });

  return { client, session };
}

it("вход выдаёт сессию, выход отзывает доступ", () =>
  rollbackTest(async (context) => {
    await seedUsers(context.db, context.now());
    const { client, session } = clientFor(context);
    const [user] = await client.users();

    expect(await client.login({ userId: user.id })).toEqual(user);
    expect(await client.me()).toEqual(user);

    const revokedToken = session.token;

    await client.logout();
    await expect(client.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });

    // Повторное использование старого токена тоже не возвращает доступ.
    session.token = revokedToken;

    await expect(client.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  }));

it("истёкшая сессия больше не даёт доступ", () =>
  rollbackTest(async (context) => {
    const time = clock();

    await seedUsers(context.db, time.now());

    const { client } = clientFor({ ...context, now: time.now });
    const [user] = await client.users();

    await client.login({ userId: user.id });
    expect(await client.me()).toEqual(user);

    time.set("2026-12-04T12:00:00.000Z");

    await expect(client.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  }));

it("выход со всех устройств отзывает все сессии пользователя", () =>
  rollbackTest(async (context) => {
    await seedUsers(context.db, context.now());
    const first = clientFor(context).client;
    const second = clientFor(context).client;
    const other = clientFor(context).client;
    const [user, otherUser] = await first.users();

    await first.login({ userId: user.id });
    await second.login({ userId: user.id });
    await other.login({ userId: otherUser.id });
    expect(await first.me()).toEqual(user);
    expect(await second.me()).toEqual(user);

    await first.logoutAll();

    await expect(first.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(second.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(await other.me()).toEqual(otherUser);
  }));

it.each(["forged", "x".repeat(43)])("поддельный токен не даёт доступ: %s", (token) =>
  rollbackTest(async (context) => {
    const { client } = clientFor(context, { token });

    await expect(client.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  }),
);

it("защищённый API отклоняет анонимного пользователя", () =>
  rollbackTest(async (context) => {
    const { client } = clientFor(context);

    await expect(client.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(client.logout()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(client.logoutAll()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(client.login({ userId: 9223372036854775807n })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  }));
