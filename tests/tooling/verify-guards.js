import { withFixture } from "./fixture-workspace.js";
import { writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";

const probes = [
  {
    file: "src/modules/fixture/guard-probe.shared.tsx",
    command: ["oxlint"],
    source: "export const value = 1;",
    expected: "Файл модуля должен иметь суффикс",
  },
  {
    file: "src/modules/fixture/guard-probe.ts",
    command: ["oxlint"],
    source: "export function run() { const value = 1; return value; }",
    expected: "padding-line-between-statements",
  },
  {
    file: "src/modules/fixture/guard-probe.ts",
    command: ["oxlint"],
    source: "export function run() { if (true) return 1; }",
    expected: "curly",
  },
  {
    file: "src/modules/fixture/guard-probe.ts",
    command: ["oxlint"],
    source: "export const value = true ? 1 : false ? 2 : 3;",
    expected: "no-nested-ternary",
  },
  {
    file: "src/modules/fixture/guard-probe.ts",
    command: ["oxlint"],
    source:
      "export function run() { console.log(1); console.log(2); console.log(3); console.log(4); console.log(5); console.log(6); console.log(7); }",
    expected: "max-unseparated-statements",
  },
  {
    file: "src/modules/fixture/guard-probe.tsx",
    command: ["oxlint"],
    source: 'export const Probe = () => <div className="bad" style={{color:"red"}} />;',
    expected: "module-boundaries",
  },
  {
    file: "src/modules/fixture/guard-probe.ts",
    command: ["oxlint"],
    source: 'import { sql } from "drizzle-orm"; export const query = sql`DELETE FROM other_table`;',
    expected: "module-boundaries",
  },
  {
    file: "src/modules/fixture/guard-probe.ts",
    command: ["oxlint", "--type-aware", "--type-check"],
    source: 'export const wrong: number = "bad";',
    expected: "TS2322",
  },
  {
    file: "src/modules/fixture/guard-probe.ts",
    command: ["oxlint", "--type-aware", "--type-check"],
    source:
      'export function incomplete(value: "one" | "two") { switch(value) { case "one": return 1; } }',
    expected: "switch-exhaustiveness-check",
  },
  {
    file: "src/platform/guard-probe.server.ts",
    command: ["easement", "check"],
    source: 'export { api } from "../modules/fixture/public.server.ts";',
    expected: "dependency",
  },
  {
    file: "src/modules/fixture/guard-probe.ts",
    command: ["easement", "check"],
    source: 'export { clock } from "../../../tests/helpers/database";',
    expected: "dependency",
  },
  {
    file: "src/app/guard-probe.ts",
    command: ["easement", "check"],
    source: 'export { fixture } from "../modules/fixture/schema.server.ts";',
    expected: "privacy",
  },
];

withFixture(() => {
  for (const probe of probes) {
    try {
      writeFileSync(probe.file, probe.source);
      const result = spawnSync(
        probe.command[0],
        [...probe.command.slice(1), ...(probe.command[0] === "oxlint" ? ["--threads", "2"] : [])],
        { encoding: "utf8" },
      );
      const output = `${result.stdout}${result.stderr}`;

      if (result.status !== 1 || !output.includes(probe.expected)) {
        throw new Error(
          `Проверка ${probe.expected} не обнаружила нарушение: ${result.status} ${result.signal} ${result.error ?? ""} ${output}`,
        );
      }

      console.log(`PASS ${probe.expected}: ${probe.file}`);
    } finally {
      unlinkSync(probe.file);
    }
  }
});
