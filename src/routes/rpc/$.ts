import { createFileRoute } from "@tanstack/react-router";
import { RPCHandler } from "@orpc/server/fetch";
import { authContext } from "../../app/auth-context";
import { api } from "../../app/api";

const handler = new RPCHandler(api);

export const Route = createFileRoute("/rpc/$")({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const context = await authContext(request);
        const { response } = await handler.handle(request, {
          prefix: "/rpc",
          context,
        });

        return response ?? new Response("Not found", { status: 404 });
      },
    },
  },
});
