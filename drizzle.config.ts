import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/modules/*/schema.ts", "./src/platform/auth-schema.ts"],
  out: "./migrations",
});
