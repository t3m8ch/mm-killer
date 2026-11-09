import { definePlugin } from "nitro";
import { getDatabase } from "./database.server.ts";

export default definePlugin((app) => {
  // Nitro создаёт статическую оболочку без runtime-конфигурации.
  if (import.meta.prerender) {
    return;
  }

  const { pool, logger } = getDatabase();

  app.hooks.hook("close", async () => {
    await pool.end();
    logger.info({ event: "postgres.pool_closed" }, "Пул Postgres закрыт");
  });
});
