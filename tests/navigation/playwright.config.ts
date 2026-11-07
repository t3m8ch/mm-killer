import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: "*.test.ts",
  use: { baseURL: "http://127.0.0.1:4313" },
  webServer: {
    command:
      "node node_modules/vite/bin/vite.js --config tests/navigation/vite.config.ts --host 127.0.0.1 --port 4313 --strictPort",
    url: "http://127.0.0.1:4313",
    cwd: process.cwd(),
    reuseExistingServer: true,
  },
});
