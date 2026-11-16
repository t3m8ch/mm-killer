import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { globSync } from "node:fs";
import { resolve } from "node:path";

await test("unit проходит без Postgres и DB global setup", () => {
  const result = spawnSync("pnpm", ["test:unit"], {
    encoding: "utf8",
    env: {
      ...process.env,
      TEST_DATABASE_URL: "postgres://unavailable:unavailable@127.0.0.1:1/unavailable",
      MM_TEST_TEMPLATE: "unit_must_not_use_a_template",
    },
  });

  assert.ifError(result.error);
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
});

await test("проекты не пересекаются и вместе включают все Vitest-файлы", () => {
  const list = (project) => {
    const result = spawnSync(
      resolve("node_modules/.bin/vitest"),
      ["list", "--filesOnly", "--json", ...(project ? ["--project", project] : [])],
      { encoding: "utf8" },
    );

    assert.ifError(result.error);
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);

    return JSON.parse(result.stdout);
  };
  const unit = list("unit");
  const integration = list("integration");
  const all = list();
  const files = [...unit, ...integration].map(({ file }) => file);
  const expected = globSync(["src/**/*.test.ts", "tests/helpers/**/*.test.ts"]).map((file) =>
    resolve(file),
  );

  assert.ok(unit.length > 0);
  assert.ok(integration.length > 0);
  assert.equal(new Set(files).size, files.length, "Файл попал в оба проекта");

  assert.deepEqual(new Set(files), new Set(expected));
  assert.deepEqual(new Set(all.map(({ file }) => file)), new Set(expected));
  assert.ok(
    unit.every(
      ({ file, projectName }) => projectName === "unit" && !file.endsWith(".integration.test.ts"),
    ),
  );
  assert.ok(
    integration.every(
      ({ file, projectName }) =>
        projectName === "integration" && file.endsWith(".integration.test.ts"),
    ),
  );
});
