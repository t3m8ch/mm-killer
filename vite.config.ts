import { builtinModules } from "node:module";
import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    tanstackStart({
      spa: { enabled: true },
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
          files: ["**/*.server.*"],
        },
        server: {
          files: ["**/*.browser.*"],
        },
      },
    }),
    nitro({
      preset: "node_server",
      serverEntry: "./src/app/server-entry.server.ts",
      plugins: ["./src/app/lifecycle.server.ts"],
    }),
    react(),
  ],
});
