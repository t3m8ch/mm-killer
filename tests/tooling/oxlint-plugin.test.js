import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const statements = (count, separator = "\n") => Array(count).fill("work();").join(separator);

function lint(source, rule = "project/max-unseparated-statements", filename = "probe.ts") {
  const directory = mkdtempSync(join(tmpdir(), "mm-lint-"));

  try {
    const config = join(directory, ".oxlintrc.json");
    const file = join(directory, filename);

    writeFileSync(
      config,
      JSON.stringify({
        categories: { correctness: "off" },
        jsPlugins: [{ name: "project", specifier: resolve("scripts/oxlint-plugin.js") }],
        rules: { [rule]: rule === "curly" ? ["error", "all"] : "error" },
      }),
    );
    mkdirSync(resolve(file, ".."), { recursive: true });
    writeFileSync(file, source);

    const result = spawnSync(
      resolve("node_modules/.bin/oxlint"),
      ["--config", config, "--threads", "2", "--format", "json", file],
      { encoding: "utf8" },
    );

    assert.ifError(result.error);
    assert.ok(result.status === 0 || result.status === 1, result.stderr);

    return JSON.parse(result.stdout).diagnostics;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

for (const [name, source, violations] of [
  ["пропускает шесть стейтментов", statements(6), 0],
  ["отмечает седьмой стейтмент", statements(7), 1],
  ["отмечает длинную группу один раз", statements(10), 1],
  ["пустая строка разделяет группы", `${statements(6)}\n\n${statements(6)}`, 0],
  ["поддерживает CRLF", statements(7, "\r\n"), 1],
  ["пропускает пустую строку с пробелами", `${statements(6)}\n \t\n${statements(6)}`, 0],
  ["комментарий не заменяет пустую строку", `${statements(6)}\n// пояснение\nwork();`, 1],
  ["пустые строки внутри выражения не разделяют стейтменты", `${statements(6)}\nwork(\n\n1);`, 1],
  ["проверяет вложенные блоки отдельно", `function run() { if (ready) { ${statements(7)} } }`, 1],
  [
    "не складывает соседние блоки",
    `function first() { ${statements(6)} }\nfunction second() { ${statements(6)} }`,
    0,
  ],
  ["проверяет ветку switch", `switch (kind) { case 1: ${statements(7)} }`, 1],
  ["проверяет static-блок", `class Example { static { ${statements(7)} } }`, 1],
  ["считает стейтменты на одной строке", statements(7, " "), 1],
  [
    "не считает импорты стейтментами",
    `${Array.from({ length: 8 }, (_, i) => `import "package-${i}";`).join("\n")}\n${statements(6)}`,
    0,
  ],
]) {
  await test(name, () => {
    const diagnostics = lint(source);

    assert.equal(diagnostics.length, violations, JSON.stringify(diagnostics));
    assert.ok(diagnostics.every((item) => item.code === "project(max-unseparated-statements)"));
  });
}

for (const source of [
  "if (ready) work();",
  "if (ready) {} else work();",
  "for (;;) work();",
  "for (const item of items) work(item);",
  "for (const key in object) work(key);",
  "while (ready) work();",
  "do work(); while (ready);",
]) {
  await test(`curly отклоняет тело без скобок: ${source}`, () => {
    assert.ok(lint(source, "curly").some((item) => item.code === "eslint(curly)"));
  });
}

await test("разрешает else if с фигурными скобками", () => {
  assert.deepEqual(lint("if (first) {} else if (second) {} else {}", "curly"), []);
});

await test("запрещает вложенный тернарник", () => {
  assert.ok(
    lint("const value = a ? b : c ? d : e;", "no-nested-ternary").some(
      (item) => item.code === "eslint(no-nested-ternary)",
    ),
  );
});

await test("разрешает один тернарник", () => {
  assert.deepEqual(lint("const value = ready ? first : second;", "no-nested-ternary"), []);
});

for (const [name, source, violations] of [
  [
    "разрешает className и style в предметном UI",
    'export const Probe = () => <div className="local" style={{ color: "red" }} />;',
    0,
  ],
  ...["css", "scss", "sass", "less"].map((extension) => [
    `разрешает импорт ${extension} в предметном UI`,
    `import "./styles.${extension}";`,
    0,
  ]),
  ["сохраняет запрет raw SQL", 'import { sql } from "drizzle-orm";', 1],
  ["сохраняет запрет прямого драйвера", 'import "pg";', 1],
  ["сохраняет запрет execute", "database.execute();", 1],
]) {
  await test(name, () => {
    const diagnostics = lint(source, "project/module-boundaries", "src/modules/probe/view.ui.tsx");

    assert.equal(diagnostics.length, violations, JSON.stringify(diagnostics));
    assert.ok(diagnostics.every((item) => item.code === "project(module-boundaries)"));
  });
}

await test("сохраняет проверку суффикса среды предметного модуля", () => {
  const diagnostics = lint(
    "export const value = 1;",
    "project/module-boundaries",
    "src/modules/probe/view.ts",
  );

  assert.equal(diagnostics.length, 1, JSON.stringify(diagnostics));
  assert.match(diagnostics[0].message, /суффикс/);
});
