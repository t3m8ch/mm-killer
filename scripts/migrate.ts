import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connect } from "../src/platform/index.ts";
const { db, pool } = connect(process.env.DATABASE_URL ?? "postgres://mm:mm@127.0.0.1:54329/mm");
try {
  await migrate(db, { migrationsFolder: "migrations" });
} finally {
  await pool.end();
}
