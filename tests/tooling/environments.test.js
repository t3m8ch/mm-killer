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

    // Новый файл регистрации и предметный UI не требуют новых исключений.
    const routerProbe = "src/platform/router-probe.ui.ts";
    const moduleRouterProbe = "src/modules/fixture/router-probe.ui.ts";
    const routeMetadata = "src/app/extra-route-metadata.ts";

    writeFileSync(
      routeMetadata,
      'export {};\ndeclare module "@tanstack/react-router" { interface StaticDataRouteOption { fixtureMetadata?: string } }\n',
    );
    writeFileSync(routerProbe, 'export { Link } from "@tanstack/react-router";\n');
    writeFileSync(moduleRouterProbe, 'export { Link } from "@tanstack/react-router";\n');
    run("easement.yml", true);
    run("easement.environments.yml", true);

    writeFileSync(routerProbe, 'export { getRouter } from "../router.tsx";\n');
    run("easement.yml", false, /dependency/);
    run("easement.environments.yml", false, /dependency|reach/);
    unlinkSync(routerProbe);
    unlinkSync(moduleRouterProbe);
    unlinkSync(routeMetadata);

    // Новый публичный вход автоматически доступен без изменения easement.yml.
    writeFileSync("src/modules/fixture/public.ui.ts", "export const value = 1;\n");
    writeFileSync("src/app/probe.ts", 'export { value } from "../modules/fixture/public.ui.ts";\n');
    run("easement.yml", true);

    writeFileSync("src/modules/fixture/private.shared.ts", "export const value = 1;\n");
    writeFileSync(
      "src/app/probe.ts",
      'export { value } from "../modules/fixture/private.shared.ts";\n',
    );
    run("easement.yml", false, /privacy/);
    writeFileSync("src/app/probe.ts", 'export { Layout } from "../platform/layout.ui.tsx";\n');
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
      "src/platform/public.server.ts",
      "src/platform/public.shared.ts",
      "src/modules/fixture/public.server.ts",
      "src/modules/fixture/public.shared.ts",
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
