import { definePlugin } from "nitro";
import { pool, logger } from "./database";

export default definePlugin((app) => {
  app.hooks.hook("close", async () => {
    await pool.end();
    logger.info({ event: "postgres.pool_closed" }, "Пул Postgres закрыт");
  });
});
