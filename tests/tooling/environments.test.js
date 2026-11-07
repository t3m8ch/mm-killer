import assert from "node:assert/strict";
import { test } from "node:test";
import { writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { withFixture } from "./fixture-workspace.js";

await test("публичные входы и транзитивные границы сред", () => {
  withFixture(() => {
    const run = (config, allowed, expected) => {
      const result = spawnSync("easement", ["check", "-c", config], { encoding: "utf8" });
      const output = `${result.stdout}${result.stderr}`;

      assert.equal(result.status, allowed ? 0 : 1, output);

      if (expected) {
        assert.match(output, expected);
      }
    };

    // Новый публичный вход автоматически доступен без изменения easement.yml.
    writeFileSync("src/modules/fixture/extra.public.shared.ts", "export const value = 1;\n");
    writeFileSync(
      "src/app/probe.ts",
      'export { value } from "../modules/fixture/extra.public.shared.ts";\n',
    );
    run("easement.yml", true);

    writeFileSync("src/modules/fixture/private.shared.ts", "export const value = 1;\n");
    writeFileSync(
      "src/app/probe.ts",
      'export { value } from "../modules/fixture/private.shared.ts";\n',
    );
    run("easement.yml", false, /privacy/);
    unlinkSync("src/app/probe.ts");

    for (const [source, target] of [
      ["server", "browser"],
      ["shared", "server"],
      ["shared", "ui"],
      ["shared", "browser"],
      ["ui", "browser"],
      ["browser", "server"],
    ]) {
      writeFileSync(`src/modules/fixture/target.${target}.ts`, "export const value = 1;\n");
      // Несуффиксный посредник не должен скрывать достижимость.
      writeFileSync(
        "src/app/middle.ts",
        `export { value } from "../modules/fixture/target.${target}.ts";\n`,
      );
      const probe = `src/modules/fixture/probe.${source}.ts`;

      writeFileSync(probe, 'export { value } from "../../app/middle.ts";\n');
      run("easement.environments.yml", false, /reach/);
      unlinkSync(probe);
      unlinkSync(`src/modules/fixture/target.${target}.ts`);
      unlinkSync("src/app/middle.ts");
    }

    writeFileSync("src/app/middle.ts", 'export { readFileSync } from "node:fs";\n');
    writeFileSync("src/app/probe.shared.ts", 'export { readFileSync } from "./middle.ts";\n');
    run("easement.environments.yml", false, /reach|dependency/);
    unlinkSync("src/app/probe.shared.ts");
    unlinkSync("src/app/middle.ts");

    for (const entry of [
      "src/platform/index.public.server.ts",
      "src/platform/index.public.shared.ts",
      "src/modules/fixture/index.public.server.ts",
      "src/modules/fixture/index.public.shared.ts",
    ]) {
      const result = spawnSync(
        process.execPath,
        ["--input-type=module", "-e", `await import('./${entry}')`],
        { encoding: "utf8" },
      );

      assert.equal(result.status, 0, result.stderr);
    }
  });
});
