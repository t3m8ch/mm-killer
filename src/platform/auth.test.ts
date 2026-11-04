import { createRouterClient } from "@orpc/server";
import { expect, it } from "vitest";
import { authApi, seedUsers, resolveUser } from "./index";
import { rollbackTest } from "../../tests/helpers/database";

it("вход выдаёт сессию, выход отзывает доступ", () =>
  rollbackTest(async (context) => {
    await seedUsers(context.db, context.now());
    let cookie = "";
    const client = createRouterClient(authApi, {
      context: {
        ...context,
        setSessionCookie: (value: string) => {
          cookie = value;
        },
      },
    });
    const [user] = await client.users();

    expect(await client.login({ userId: user.id })).toEqual(user);

    const token = cookie.split(";")[0].split("=")[1];
    const current = await resolveUser(context.db, token, context.now());

    expect(current).toEqual(user);

    const authed = createRouterClient(authApi, {
      context: { ...context, user: current, sessionToken: token, setSessionCookie: () => {} },
    });

    expect(await authed.me()).toEqual(user);
    await authed.logout();
    expect(await resolveUser(context.db, token, context.now())).toBeNull();
  }));

it("истечение и отзыв всех сессий закрывают доступ", () =>
  rollbackTest(async (context) => {
    await seedUsers(context.db, context.now());
    const tokens: string[] = [];
    const client = createRouterClient(authApi, {
      context: {
        ...context,
        setSessionCookie: (value: string) => {
          tokens.push(value.split(";")[0].slice(8));
        },
      },
    });
    const [user] = await client.users();

    await client.login({ userId: user.id });
    await client.login({ userId: user.id });
    expect(
      await resolveUser(context.db, tokens[0], new Date("2026-12-04T12:00:00.000Z")),
    ).toBeNull();
    expect(await resolveUser(context.db, "forged", context.now())).toBeNull();

    const authenticated = createRouterClient(authApi, {
      context: { ...context, user, sessionToken: tokens[0] },
    });

    await authenticated.logoutAll();
    expect(await resolveUser(context.db, tokens[0], context.now())).toBeNull();
    expect(await resolveUser(context.db, tokens[1], context.now())).toBeNull();
  }));

it("защищённый API отклоняет анонимного пользователя", () =>
  rollbackTest(async (context) => {
    const client = createRouterClient(authApi, { context });

    await expect(client.me()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(client.logout()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(client.logoutAll()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    await expect(client.login({ userId: 9223372036854775807n })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  }));
