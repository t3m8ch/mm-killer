import { createFileRoute } from "@tanstack/react-router";
import { RPCHandler } from "@orpc/server/fetch";
import { createRequestContext } from "../../app/request-context.server.ts";
import { api } from "../../app/api.server.ts";

const handler = new RPCHandler(api);

export const Route = createFileRoute("/rpc/$")({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const context = await createRequestContext(request);
        const { response } = await handler.handle(request, {
          prefix: "/rpc",
          context,
        });

        return response ?? new Response("Not found", { status: 404 });
      },
    },
  },
});
