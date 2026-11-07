import assert from "node:assert/strict";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { withFixture } from "./fixture-workspace.js";

const probes = [
  {
    name: "изоморфный RPC-клиент",
    imports: 'import { rpc } from "../app/client";',
    expression: "String(Boolean(rpc))",
    allowed: true,
  },
  {
    name: "TanStack server",
    imports: 'import { getRequest } from "@tanstack/react-start/server";',
    expression: "String(getRequest)",
  },
  {
    name: "файл .server.ts",
    imports: 'import { secret } from "../app/bundle-probe.server";',
    expression: "secret()",
  },
  { name: "обычный клиент", imports: "", expression: '"MergeMinds"', allowed: true },
  { name: "pg", imports: 'import pg from "pg";', expression: "String(pg.Pool)" },
  { name: "Drizzle", imports: 'import { sql } from "drizzle-orm";', expression: "String(sql)" },
  {
    name: "oRPC server",
    imports: 'import { createRouterClient } from "@orpc/server";',
    expression: "String(createRouterClient)",
  },
  {
    name: "Nitro",
    imports: 'import { definePlugin } from "nitro";',
    expression: "String(definePlugin)",
  },
  {
    name: "node:fs",
    imports: 'import { readFileSync } from "node:fs";',
    expression: "String(readFileSync)",
  },
  {
    name: "fs без префикса",
    imports: 'import { readFileSync } from "fs";',
    expression: "String(readFileSync)",
  },
  { name: "модуль БД", imports: 'import { db } from "../app/database";', expression: "String(db)" },
  {
    name: "реэкспорт",
    imports: 'import { pg } from "../app/bundle-probe";',
    expression: "String(pg.Pool)",
  },
  {
    name: "динамический импорт",
    imports: "",
    expression: '<button onClick={() => import("pg")}>Загрузить</button>',
  },
  {
    name: "import type",
    imports:
      'import type { Pool } from "pg";\ntype Count = Pool["totalCount"];\nconst count: Count = 0;',
    expression: "count",
    allowed: true,
  },
];

withFixture(() => {
  const route = "src/routes/_authenticated.index.tsx";
  const original = readFileSync(route, "utf8");
  const env = { ...process.env };

  delete env.DATABASE_URL;
  writeFileSync("src/app/bundle-probe.ts", 'export { default as pg } from "pg";\n');

  writeFileSync("src/app/bundle-probe.server.ts", 'export const secret = () => "server";\n');

  try {
    for (const probe of probes) {
      writeFileSync(
        route,
        `
import { createFileRoute } from "@tanstack/react-router";
import { Title } from "@mantine/core";
${probe.imports}
export const Route = createFileRoute("/_authenticated/")({ component: () => <Title>{${probe.expression}}</Title> });
`,
      );

      const result = spawnSync(resolve("node_modules/.bin/vite"), ["build"], {
        encoding: "utf8",
        env,
        timeout: 60000,
        maxBuffer: 4 * 1024 * 1024,
      });
      const output = `${result.stdout}${result.stderr}`;

      assert.ifError(result.error);
      assert.equal(result.signal, null, output);
      assert.equal(result.status, probe.allowed ? 0 : 1, `${probe.name}: ${output}`);

      if (!probe.allowed) {
        assert.match(output, /import.protection/i, output);
      }

      console.log(`PASS client bundle: ${probe.name}`);
    }
  } finally {
    writeFileSync(route, original);
    unlinkSync("src/app/bundle-probe.ts");
    unlinkSync("src/app/bundle-probe.server.ts");
  }
});
