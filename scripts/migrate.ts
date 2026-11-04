import { connect, migrate } from "../src/platform/index.ts";
const { pool } = connect(process.env.DATABASE_URL ?? "postgres://mm:mm@127.0.0.1:54329/mm");
try {
  await migrate(pool);
} finally {
  await pool.end();
}
