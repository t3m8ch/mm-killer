import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import type { Pool } from "pg";
export async function migrate(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(18364002)");
    await client.query(
      "CREATE TABLE IF NOT EXISTS platform_migrations (name text PRIMARY KEY, checksum text NOT NULL)",
    );
    for (const name of (await readdir("migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort()) {
      const sql = await readFile(`migrations/${name}`, "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const { rows } = await client.query<{ checksum: string }>(
        "SELECT checksum FROM platform_migrations WHERE name = $1",
        [name],
      );
      if (rows.length) {
        if (rows[0].checksum !== checksum)
          throw new Error(`Изменена применённая миграция: ${name}`);
      } else {
        await client.query(sql);
        await client.query("INSERT INTO platform_migrations (name, checksum) VALUES ($1, $2)", [
          name,
          checksum,
        ]);
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
