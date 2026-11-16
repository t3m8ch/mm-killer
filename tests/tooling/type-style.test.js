import assert from "node:assert/strict";
import { test } from "node:test";
import { writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { withFixture } from "./fixture-workspace.js";

await test("Oxlint запрещает interface, когда достаточно type", () => {
  withFixture(() => {
    const file = "src/app/type-style-probe.ts";

    try {
      writeFileSync(file, "export interface Probe { value: string }\n");
      const result = spawnSync("oxlint", ["--threads", "2", file], { encoding: "utf8" });

      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(result.stdout + result.stderr, /consistent-type-definitions/);
    } finally {
      unlinkSync(file);
    }
  });
});

for (const [name, file, source] of [
  ["разрешает type", "src/app/type-style-probe.ts", "export type Probe = { value: string };\n"],
  [
    "разрешает документированное слияние деклараций",
    "src/app/type-style-probe.ts",
    'export {};\ndeclare module "@tanstack/react-router" {\n  // oxlint-disable-next-line typescript/consistent-type-definitions -- module augmentation: слияние с типами TanStack Router\n  interface StaticDataRouteOption { fixtureMetadata?: string }\n}\n',
  ],
  [
    "не проверяет стороннее сгенерированное дерево маршрутов",
    "src/routeTree.gen.ts",
    "export interface GeneratedRoute { path: string }\n",
  ],
]) {
  await test(`Oxlint ${name}`, () => {
    withFixture(() => {
      writeFileSync(file, source);
      const result = spawnSync("oxlint", ["--threads", "2", "src"], { encoding: "utf8" });

      assert.equal(result.status, 0, result.stdout + result.stderr);
    });
  });
}
