import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connect, readConfig } from "../src/platform/index.ts";

const { db, pool } = connect(readConfig().DATABASE_URL);

try {
  await migrate(db, { migrationsFolder: "migrations" });
} finally {
  await pool.end();
}
