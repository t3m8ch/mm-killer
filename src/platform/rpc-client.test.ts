import { createServer } from "node:http";
import { once } from "node:events";
import { implement } from "@orpc/server";
import { RPCHandler } from "@orpc/server/node";
import { oc } from "@orpc/contract";
import { QueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { expect, it, vi } from "vitest";
import { createRpcClient } from "./public.ui.ts";

it("клиент модуля вызывает свою процедуру по HTTP и разделяет кэш", async () => {
  const contract = {
    get: oc.input(z.object({ id: z.number() })).output(z.object({ name: z.string() })),
  };
  const os = implement(contract);
  const handler = new RPCHandler({
    courses: { get: os.get.handler(({ input }) => ({ name: `Курс ${input.id}` })) },
    tasks: { get: os.get.handler(({ input }) => ({ name: `Задание ${input.id}` })) },
  });
  const server = createServer(async (request, response) => {
    const { matched } = await handler.handle(request, response, { prefix: "/rpc" });

    if (!matched) {
      response.writeHead(404).end();
    }
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();

  if (!address || typeof address === "string") {
    throw new Error("HTTP-сервер не получил порт");
  }

  vi.stubGlobal("window", { location: { origin: `http://127.0.0.1:${address.port}` } });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

  try {
    const courses = createRpcClient<typeof contract>("courses");
    const tasks = createRpcClient<typeof contract>("tasks");
    const course = courses.get.queryOptions({ input: { id: 1 } });
    const task = tasks.get.queryOptions({ input: { id: 1 } });

    expect(await queryClient.fetchQuery(course)).toEqual({ name: "Курс 1" });
    expect(await queryClient.fetchQuery(task)).toEqual({ name: "Задание 1" });
    expect(queryClient.getQueryData(course.queryKey)).toEqual({ name: "Курс 1" });
    expect(queryClient.getQueryData(task.queryKey)).toEqual({ name: "Задание 1" });
    expect(courses.get.queryOptions({ input: { id: 1 } }).queryKey).toEqual(course.queryKey);
  } finally {
    queryClient.clear();
    vi.unstubAllGlobals();
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
