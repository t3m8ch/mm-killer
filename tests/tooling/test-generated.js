import { readFileSync, writeFileSync, readdirSync } from "node:fs";
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
      for (const args of [["procedure", "course-notes", "publish"]]) {
        const result = spawnSync(process.execPath, ["scripts/generate.js", ...args], {
          stdio: "inherit",
        });

        if (result.status !== 0) {
          throw new Error(`Не прошла генерация: ${args.join(" ")}`);
        }
      }

      // Проверить PostgreSQL и API на значениях выше Number.MAX_SAFE_INTEGER.
      const folder = readdirSync("migrations").find((name) =>
        name.endsWith("_create_course_notes"),
      );

      if (!folder) {
        throw new Error("Drizzle Kit не создал миграцию");
      }

      const migration = `migrations/${folder}/migration.sql`;

      writeFileSync(
        migration,
        readFileSync(migration, "utf8").replace("START WITH 1", "START WITH 9007199254740993"),
      );
      for (const { command, args } of [
        {
          command: "oxlint",
          args: ["--type-aware", "--type-check", "--threads", "2", "src"],
        },
        {
          command: "node",
          args: ["scripts/generate.js", "screen", "course-notes"],
        },
        // Типы нового маршрута обновляет Vite при запуске приложения.
        { command: "oxlint", args: ["--threads", "2", "src"] },
        { command: "vitest", args: ["run"] },
      ]) {
        const result = spawnSync(
          command === "node" ? process.execPath : resolve(`node_modules/.bin/${command}`),
          args,
          { stdio: "inherit" },
        );

        if (result.status !== 0) {
          throw new Error(`Не прошла проверка сгенерированного модуля: ${command}`);
        }
      }
    },
    { ...options, moduleName: "course-notes" },
  );
}
