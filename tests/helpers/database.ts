import { afterAll } from "vitest";
import { connect } from "../../src/platform";
import type { Context } from "../../src/platform";

const baseUrl = () => process.env.TEST_DATABASE_URL ?? "postgres://mm:mm@127.0.0.1:54329/mm";

export function clock(initial = "2026-11-04T12:00:00.000Z") {
  let value = new Date(initial);

  return {
    now: () => new Date(value),
    set: (next: string) => {
      value = new Date(next);
    },
  };
}

export async function isolatedDatabase(label: string) {
  const url = new URL(baseUrl());
  const name = `mm_test_${process.pid}_${label}_${crypto.randomUUID().replaceAll("-", "")}`;
  const admin = connect(baseUrl());
  const template = process.env.MM_TEST_TEMPLATE;

  if (!template || !/^mm_template_[0-9a-f]+$/.test(template)) {
    throw new Error("Run via Vitest global setup");
  }

  await admin.pool.query(`CREATE DATABASE "${name}" TEMPLATE "${template}"`);

  url.pathname = `/${name}`;

  const connection = connect(url.toString());

  return {
    ...connection,
    url: url.toString(),
    async close() {
      await connection.pool.end();
      await admin.pool.query(`DROP DATABASE "${name}"`);
      await admin.pool.end();
    },
  };
}

let workerDatabase: ReturnType<typeof isolatedDatabase> | undefined;

afterAll(async () => {
  if (workerDatabase) {
    await (await workerDatabase).close();
  }
});
export async function rollbackTest(run: (context: Context) => Promise<void>) {
  const database = await (workerDatabase ??= isolatedDatabase(
    `worker${process.env.VITEST_POOL_ID ?? "0"}`,
  ));
  const rollback = new Error("rollback");

  try {
    await database.db.transaction(async (db) => {
      await run({ db, now: clock().now });

      throw rollback;
    });
  } catch (error) {
    if (error !== rollback) {
      throw error;
    }
  }
}
