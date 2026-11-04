import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { withFixture } from "./fixture-workspace.js";
for (const options of [
  {},
  { updatedAt: true },
  { updatedBy: true },
  { updatedAt: true, updatedBy: true },
]) {
  withFixture(
    () => {
      for (const { command, args } of [
        {
          command: "oxlint",
          args: ["--type-aware", "--type-check", "--threads", "2", "src/modules"],
        },
        { command: "vitest", args: ["run"] },
      ]) {
        const result = spawnSync(resolve(`node_modules/.bin/${command}`), args, {
          stdio: "inherit",
        });
        if (result.status !== 0)
          throw new Error(`Не прошла проверка сгенерированного модуля: ${command}`);
      }
    },
    { ...options, moduleName: "course-notes" },
  );
}
