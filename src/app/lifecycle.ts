import { definePlugin } from "nitro";
import { pool } from "./database";

export default definePlugin((app) => {
  app.hooks.hook("close", async () => {
    await pool.end();
    console.info("Пул Postgres закрыт");
  });
});
