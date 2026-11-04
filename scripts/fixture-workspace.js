import { mkdtempSync, cpSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
export function withFixture(run, options = {}) {
  const root = process.cwd();
  const directory = mkdtempSync(join(tmpdir(), "mm-fixture-"));
  try {
    for (const path of [
      "src",
      "tests",
      "scripts",
      "generators",
      "migrations",
      "package.json",
      "plopfile.js",
      "tsconfig.json",
      "vitest.config.ts",
      "easement.yml",
      ".oxlintrc.json",
      ".gitignore",
    ])
      cpSync(path, join(directory, path), { recursive: true });
    symlinkSync(join(root, "node_modules"), join(directory, "node_modules"), "dir");
    process.chdir(directory);
    const result = spawnSync(
      process.execPath,
      [
        join(directory, "scripts/generate.js"),
        "module",
        options.moduleName ?? "fixture",
        ...(options.updatedAt ? ["--updatedAt"] : []),
        ...(options.updatedBy ? ["--updatedBy"] : []),
      ],
      { stdio: "inherit" },
    );
    if (result.status !== 0) throw new Error("Не удалось сгенерировать тестовый модуль");
    run();
  } finally {
    process.chdir(root);
    rmSync(directory, { recursive: true, force: true });
  }
}
