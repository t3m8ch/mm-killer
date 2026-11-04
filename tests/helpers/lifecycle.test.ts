import { migrate } from "drizzle-orm/node-postgres/migrator";
import { it, expect, vi } from "vitest";
import { isolatedDatabase } from "./database";
import { connect, createLogger } from "../../src/platform";

it("database.close() удаляет БД после закрытия дополнительных соединений", async () => {
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

it("пул из connect() выполняет следующий запрос после потери простаивающего соединения", async () => {
  const database = await isolatedDatabase("idle_error");
  const messages: string[] = [];
  const logger = createLogger("info", {
    write: (line) => {
      messages.push(line);
    },
  });
  const connection = connect(database.url, logger);
  const admin = connect(database.url);

  try {
    const { rows } = await connection.pool.query<{ pid: number }>("SELECT pg_backend_pid() AS pid");

    await admin.pool.query("SELECT pg_terminate_backend($1)", [rows[0].pid]);
    await vi.waitFor(() => {
      expect(messages.join(" ")).toContain("terminating connection");
    });
    const result = await connection.pool.query("SELECT 1 AS value");

    expect(result.rows).toEqual([{ value: 1 }]);
  } finally {
    await connection.pool.end();
    await admin.pool.end();
    await database.close();
  }
});
