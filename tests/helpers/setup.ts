import { migrate } from "drizzle-orm/node-postgres/migrator";
import { connect } from "../../src/platform";
export default async function setup() {
  const admin = connect(process.env.TEST_DATABASE_URL ?? "postgres://mm:mm@127.0.0.1:54329/mm");
  const name = `mm_template_${crypto.randomUUID().replaceAll("-", "")}`;
  await admin.pool.query(`CREATE DATABASE "${name}"`);
  const url = new URL(process.env.TEST_DATABASE_URL ?? "postgres://mm:mm@127.0.0.1:54329/mm");
  url.pathname = `/${name}`;
  const template = connect(url.toString());
  try {
    await migrate(template.db, { migrationsFolder: "migrations" });
  } finally {
    await template.pool.end();
  }
  process.env.MM_TEST_TEMPLATE = name;
  return async () => {
    await admin.pool.query(`DROP DATABASE "${name}"`);
    await admin.pool.end();
  };
}
