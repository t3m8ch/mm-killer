import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";

export function connect(url: string) {
  const pool = new Pool({ connectionString: url });

  pool.on("error", (error) => {
    console.error("Ошибка простаивающего соединения Postgres:", error.message);
  });

  return { pool, db: drizzle({ client: pool }) };
}

export type Database = ReturnType<typeof connect>["db"];
export type Transaction = Parameters<Parameters<Database["transaction"]>[0]>[0];
