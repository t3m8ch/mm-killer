import { it, expect } from "vitest";
import { createRouterClient } from "@orpc/server";
import { isolatedDatabase, clock } from "../../../tests/helpers/database";
import { connect } from "../../platform";
import { api } from "./index";
it("конкурентные записи сохраняются независимо", async () => {
  const database = await isolatedDatabase("race");
  const second = connect(database.url);
  try {
    const time = clock();
    const firstClient = createRouterClient(api, { context: { db: database.db, now: time.now } });
    const secondClient = createRouterClient(api, { context: { db: second.db, now: time.now } });
    const [a, b] = await Promise.all([
      firstClient.create({ text: "Первая" }),
      secondClient.create({ text: "Вторая" }),
    ]);
    expect(a.id).not.toBe(b.id);
    expect(await firstClient.list()).toEqual(expect.arrayContaining([a, b]));
  } finally {
    await second.pool.end();
    await database.close();
  }
});
