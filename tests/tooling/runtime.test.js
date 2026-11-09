import { test, after, describe } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtempSync, cpSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { setTimeout } from "node:timers/promises";
import { Pool } from "pg";

await describe("production-релиз", async () => {
  const testUrl = process.env.TEST_DATABASE_URL;

  assert.ok(testUrl, "Задать TEST_DATABASE_URL для проверок production-релиза");

  const release = mkdtempSync(join(tmpdir(), "mm-release-"));

  cpSync(".output", join(release, ".output"), { recursive: true });
  after(() => rmSync(release, { recursive: true, force: true }));

  function launch(environment, entry = join(release, ".output/server/index.mjs")) {
    const env = { ...process.env, HOST: "127.0.0.1", PORT: "0", LOG_LEVEL: "info", ...environment };

    delete env.NITRO_HOST;
    delete env.NITRO_PORT;

    const child = spawn(process.execPath, [entry], { cwd: release, env });
    const exited = once(child, "exit");
    let output = "";
    let stdout = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk;
      output += chunk;
    });
    child.stderr.on("data", (chunk) => {
      output += chunk;
    });

    return { child, exited, output: () => output, stdout: () => stdout };
  }

  async function listen(server) {
    for (let attempt = 0; attempt < 200; attempt++) {
      const match = server.output().match(/http:\/\/127\.0\.0\.1:(\d+)/);

      if (match) {
        return match[0];
      }

      assert.equal(server.child.exitCode, null, server.output());
      await setTimeout(25);
    }

    throw new Error(`Сервер не начал слушать порт: ${server.output()}`);
  }

  async function stop(server, signal = "SIGTERM") {
    server.child.kill(signal);

    return await server.exited;
  }

  await test(
    "production-сервер сохраняет HTTP-контракт SPA и API",
    { timeout: 15000 },
    async (t) => {
      const server = launch({ DATABASE_URL: testUrl });

      t.after(() => server.child.kill("SIGKILL"));

      const url = await listen(server);
      const live = await fetch(`${url}/health/live`);
      const ready = await fetch(`${url}/health/ready`);

      assert.equal(live.status, 200);
      assert.deepEqual(await live.json(), { status: "ok" });
      assert.equal(ready.status, 200);
      assert.deepEqual(await ready.json(), { status: "ready" });

      const page = await fetch(url);
      const html = await page.text();
      const asset = html.match(/(?:src|href)="([^"]*\/assets\/[^"]+)"/);

      assert.equal(page.status, 200);
      assert.ok(asset, "HTML-оболочка должна ссылаться на собранные клиентские ресурсы");
      assert.equal((await fetch(new URL(asset[1], url))).status, 200);

      for (const path of ["/login", "/missing/nested/page"]) {
        const response = await fetch(`${url}${path}`);

        assert.equal(response.status, 200);
        assert.equal(await response.text(), html);
      }

      for (const path of [
        "/rpc",
        "/rpc/missing",
        "/health",
        "/health/missing",
        "/assets/missing.js",
      ]) {
        const response = await fetch(`${url}${path}`, { headers: { Accept: "text/html" } });

        assert.equal(response.status, 404, path);
        assert.notEqual(await response.text(), html, path);
      }

      const unauthorized = await fetch(`${url}/rpc/auth/me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: null }),
      });

      assert.equal(unauthorized.status, 401);
      assert.doesNotMatch(await unauthorized.text(), /<html/i);

      await stop(server);
    },
  );

  for (const signal of ["SIGTERM", "SIGINT"]) {
    await test(
      `production-сервер закрывает пул Postgres по ${signal}`,
      { timeout: 15000 },
      async (t) => {
        const server = launch({ DATABASE_URL: testUrl });

        t.after(() => server.child.kill("SIGKILL"));

        const url = await listen(server);
        const ready = await fetch(`${url}/health/ready`);

        assert.equal(ready.status, 200);

        const [code, receivedSignal] = await stop(server, signal);

        assert.equal(receivedSignal, null, server.output());
        assert.equal(code, 0, server.output());
        const closed = server
          .stdout()
          .split("\n")
          .find((line) => line.startsWith("{") && line.includes('"event":"postgres.pool_closed"'));

        assert.ok(closed, server.output());
        assert.equal(JSON.parse(closed).level, 30);
      },
    );
  }

  await test(
    "готовность возвращает 503 при недоступной БД, процесс остаётся жив",
    { timeout: 15000 },
    async (t) => {
      const server = launch({ DATABASE_URL: "postgres://test:test@127.0.0.1:1/missing" });

      t.after(() => server.child.kill("SIGKILL"));

      const url = await listen(server);
      const ready = await fetch(`${url}/health/ready`);

      assert.equal(ready.status, 503);
      assert.deepEqual(await ready.json(), { status: "unavailable" });
      assert.equal((await fetch(`${url}/health/live`)).status, 200);
      await stop(server);
    },
  );

  for (const entry of [undefined, resolve("scripts/migrate.ts")]) {
    await test(
      `${entry ? "мигратор" : "сервер"} отклоняет отсутствие DATABASE_URL`,
      { timeout: 10000 },
      async (t) => {
        const server = launch({ DATABASE_URL: "" }, entry);

        t.after(() => server.child.kill("SIGKILL"));

        const [code] = await server.exited;

        assert.notEqual(code, 0);
        assert.match(server.output(), /Некорректные переменные окружения: DATABASE_URL/);
      },
    );
  }

  await test(
    "отдельный процесс миграции использует DATABASE_URL своего окружения",
    { timeout: 15000 },
    async () => {
      const admin = new Pool({ connectionString: testUrl });
      const name = `mm_release_${crypto.randomUUID().replaceAll("-", "")}`;
      const url = new URL(testUrl);

      url.pathname = `/${name}`;
      await admin.query(`CREATE DATABASE "${name}"`);

      const database = new Pool({ connectionString: url.toString() });

      try {
        // CLI ищет каталог миграций относительно рабочего каталога релиза.
        cpSync("migrations", join(release, "migrations"), { recursive: true });

        const migration = launch({ DATABASE_URL: url.toString() }, resolve("scripts/migrate.ts"));
        const [code] = await migration.exited;

        assert.equal(code, 0, migration.output());
        assert.equal(
          (await database.query("SELECT to_regclass('drizzle.__drizzle_migrations') AS name"))
            .rows[0].name,
          "drizzle.__drizzle_migrations",
        );
      } finally {
        await database.end();
        await admin.query(`DROP DATABASE "${name}"`);
        await admin.end();
      }
    },
  );
});
