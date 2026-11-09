import { definePlugin } from "nitro";
import { getDatabase } from "./database.server.ts";

export default definePlugin((app) => {
  // Start запускает preview для общей оболочки без runtime-конфигурации.
  if (process.env.TSS_PRERENDERING === "true") {
    return;
  }

  const { pool, logger } = getDatabase();

  app.hooks.hook("close", async () => {
    await pool.end();
    logger.info({ event: "postgres.pool_closed" }, "Пул Postgres закрыт");
  });
});
