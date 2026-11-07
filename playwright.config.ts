import { defineConfig } from "@playwright/test";

const production = process.env.PLAYWRIGHT_PRODUCTION === "true";

export default defineConfig({
  testDir: "./tests/e2e",
  testIgnore: "navigation.test.ts",
  use: { baseURL: "http://127.0.0.1:4312" },
  webServer: {
    command: production
      ? "NODE_ENV=production HOST=127.0.0.1 PORT=4312 node .output/server/index.mjs"
      : "node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4312 --strictPort",
    url: "http://127.0.0.1:4312",
    reuseExistingServer: false,
  },
});
