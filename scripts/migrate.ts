import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connect, readConfig, createLogger } from "../src/platform/index.ts";

const config = readConfig();
const logger = createLogger(config.LOG_LEVEL);
const { db, pool } = connect(config.DATABASE_URL, logger);

try {
  await migrate(db, { migrationsFolder: "migrations" });
} finally {
  await pool.end();
}
