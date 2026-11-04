import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connect, databaseUrl } from "../src/platform/index.ts";

const { db, pool } = connect(databaseUrl());

try {
  await migrate(db, { migrationsFolder: "migrations" });
} finally {
  await pool.end();
}
