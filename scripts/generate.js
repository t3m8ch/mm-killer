import { parseArgs } from "node:util";
import { resolve, delimiter } from "node:path";
import { spawnSync } from "node:child_process";
const [generator, ...args] = process.argv.slice(2);
let parameters = generator ? [generator, ...args] : [];
if (generator === "module") {
  const { values, positionals } = parseArgs({
    args,
    options: {
      updatedAt: { type: "boolean", default: false },
      updatedBy: { type: "boolean", default: false },
    },
    allowPositionals: true,
  });
  if (positionals.length !== 1) throw new Error("Указать одно имя модуля");
  parameters = [
    "module",
    positionals[0],
    "--",
    "--updatedAt",
    String(values.updatedAt),
    "--updatedBy",
    String(values.updatedBy),
  ];
}
const result = spawnSync("plop", ["--plopfile", "plopfile.js", ...parameters], {
  stdio: "inherit",
  env: {
    ...process.env,
    PATH: `${resolve("node_modules/.bin")}${delimiter}${process.env.PATH ?? ""}`,
  },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
