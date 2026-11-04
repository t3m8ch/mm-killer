import { builtinModules } from "node:module";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tanstackStart({
      importProtection: {
        behavior: "error",
        client: {
          specifiers: [
            "@tanstack/react-start/server",
            ...builtinModules.flatMap((name) => [name, `node:${name}`]),
            /^node:/,
            /^(pg|pg-pool|drizzle-orm|nitro)(\/|$)/,
            /^@orpc\/server(\/|$)/,
          ],
          files: [
            "**/*.server.*",
            "**/src/app/database.ts",
            "**/src/app/server-client.ts",
            "**/src/app/api.ts",
            "**/src/app/auth-context.ts",
            "**/src/platform/auth.ts",
            "**/src/platform/auth-schema.ts",
            "**/src/platform/db.ts",
            "**/src/platform/rpc.ts",
            "**/src/modules/*/api.ts",
            "**/src/modules/*/schema.ts",
          ],
        },
      },
    }),
    nitro({
      preset: "node_server",
      serverEntry: "./src/app/server-entry.ts",
      plugins: ["./src/app/lifecycle.ts"],
    }),
    react(),
  ],
});
