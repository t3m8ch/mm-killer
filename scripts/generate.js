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
const env = {
  ...process.env,
  PATH: `${resolve("node_modules/.bin")}${delimiter}${process.env.PATH ?? ""}`,
};
const plop = spawnSync("plop", ["--plopfile", "plopfile.js", ...parameters], {
  stdio: "inherit",
  env,
});
if (plop.error) throw plop.error;
process.exitCode = plop.status ?? 1;
if (plop.status === 0 && generator === "module") {
  const kit = spawnSync(
    "drizzle-kit",
    ["generate", "--name", `create_${parameters[1].replaceAll("-", "_")}`],
    { stdio: "inherit", env },
  );
  if (kit.error) throw kit.error;
  process.exitCode = kit.status ?? 1;
}
