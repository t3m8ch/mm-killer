import { readFileSync, writeFileSync } from "node:fs";
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
      // Проверить PostgreSQL и API на значениях выше Number.MAX_SAFE_INTEGER.
      const migration = "migrations/course-notes.sql";
      writeFileSync(
        migration,
        readFileSync(migration, "utf8").replace(
          "GENERATED ALWAYS AS IDENTITY",
          "GENERATED ALWAYS AS IDENTITY (START WITH 9007199254740993)",
        ),
      );
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
