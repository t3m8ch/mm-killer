import { migrate } from "drizzle-orm/node-postgres/migrator";
import { it, expect } from "vitest";
import { isolatedDatabase } from "./database";
import { connect } from "../../src/platform";
it("закрывает независимые соединения перед удалением тестовой базы", async () => {
  const admin = connect(process.env.TEST_DATABASE_URL ?? "postgres://mm:mm@127.0.0.1:54329/mm");
  try {
    for (let iteration = 0; iteration < 10; iteration++) {
      const database = await isolatedDatabase("lifecycle");
      const second = connect(database.url);
      await Promise.all([database.pool.query("SELECT 1"), second.pool.query("SELECT 1")]);
      await second.pool.end();
      await database.close();
      const name = new URL(database.url).pathname.slice(1);
      const result = await admin.pool.query("SELECT datname FROM pg_database WHERE datname = $1", [
        name,
      ]);
      expect(result.rows).toEqual([]);
    }
  } finally {
    await admin.pool.end();
  }
});

it("повторное применение миграций не выполняет SQL заново", async () => {
  const database = await isolatedDatabase("migration");
  try {
    await expect(migrate(database.db, { migrationsFolder: "migrations" })).resolves.toBeUndefined();
    await expect(migrate(database.db, { migrationsFolder: "migrations" })).resolves.toBeUndefined();
  } finally {
    await database.close();
  }
});
