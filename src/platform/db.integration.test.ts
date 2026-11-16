import { migrate } from "drizzle-orm/node-postgres/migrator";
import { once } from "node:events";
import { it, expect } from "vitest";
import { isolatedDatabase } from "../../tests/helpers/database";
import { connect, createLogger } from "./public.server.ts";

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

    const idleError = once(connection.pool, "error", { signal: AbortSignal.timeout(5000) });

    await Promise.all([
      idleError,
      admin.pool.query("SELECT pg_terminate_backend($1)", [rows[0].pid]),
    ]);

    expect(messages.join(" ")).toContain("terminating connection");
    const result = await connection.pool.query("SELECT 1 AS value");

    expect(result.rows).toEqual([{ value: 1 }]);
  } finally {
    await connection.pool.end();
    await admin.pool.end();
    await database.close();
  }
});
