import { readFile } from "node:fs/promises";
import { defineServerEntry } from "nitro";
import { HTTPError } from "nitro/h3";

let shell: Promise<string> | undefined;

export default defineServerEntry({
  gracefulShutdown: true,
  fetch: (request) => {
    const { pathname } = new URL(request.url);

    if (
      pathname.startsWith("/rpc/") ||
      pathname.startsWith("/_serverFn/") ||
      ["/health/live", "/health/ready"].includes(pathname)
    ) {
      return;
    }

    // Nitro обслуживает существующую статику раньше этого обработчика.
    if (/^\/(rpc|health|assets|_serverFn)(\/|$)/.test(pathname) || /\.[^/]+$/.test(pathname)) {
      // Обычный Response(404) в middleware H3 означает продолжить цепочку.
      throw new HTTPError({ status: 404, message: "Not found" });
    }

    if (!["GET", "HEAD"].includes(request.method)) {
      return new Response("Method not allowed", { status: 405, headers: { Allow: "GET, HEAD" } });
    }

    // В dev Start сам отдаёт оболочку; preview сборки должен сначала её создать.
    if (import.meta.env.DEV || process.env.TSS_PRERENDERING === "true") {
      return;
    }

    shell ??= readFile(new URL("../public/_shell.html", import.meta.url), "utf8");

    return shell.then(
      (html) =>
        new Response(request.method === "HEAD" ? null : html, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        }),
    );
  },
});
