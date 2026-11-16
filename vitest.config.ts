import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "unit",
          include: ["src/**/*.test.ts", "tests/helpers/**/*.test.ts"],
          exclude: ["**/*.integration.test.ts"],
        },
      },
      {
        test: {
          name: "integration",
          include: ["src/**/*.integration.test.ts", "tests/helpers/**/*.integration.test.ts"],
          globalSetup: ["./tests/helpers/setup.ts"],
        },
      },
    ],
  },
});
