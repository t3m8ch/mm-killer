import { createLogger } from "./logger.server.ts";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

export function connect(url: string, logger = createLogger()) {
  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000 });

  pool.on("error", (error) => {
    logger.error(
      { err: error, event: "postgres.idle_connection_error" },
      "Ошибка простаивающего соединения Postgres",
    );
  });

  return { pool, db: drizzle({ client: pool }) };
}

export type Database = ReturnType<typeof connect>["db"];
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
