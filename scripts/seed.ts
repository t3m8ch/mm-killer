import { connect, readConfig, seedUsers } from "../src/platform/index.ts";

const { db, pool } = connect(readConfig().DATABASE_URL);

try {
  await seedUsers(db, new Date());
} finally {
  await pool.end();
}
