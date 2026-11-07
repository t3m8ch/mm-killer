import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/modules/*/schema.server.ts", "./src/platform/auth/schema.server.ts"],
  out: "./migrations",
});
