import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { withFixture } from "./fixture-workspace.js";
withFixture(() => {
  const result = spawnSync(resolve("node_modules/.bin/vitest"), ["run"], { stdio: "inherit" });
  if (result.status !== 0) throw new Error("Не прошли тесты сгенерированного модуля");
});
