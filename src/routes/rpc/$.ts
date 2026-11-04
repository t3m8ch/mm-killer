import { createFileRoute } from "@tanstack/react-router";
import { RPCHandler } from "@orpc/server/fetch";
import { db } from "../../app/database";
import { api } from "../../app/api";
const handler = new RPCHandler(api);
export const Route = createFileRoute("/rpc/$")({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const { response } = await handler.handle(request, {
          prefix: "/rpc",
          context: { db, now: () => new Date() },
        });
        return response ?? new Response("Not found", { status: 404 });
      },
    },
  },
});
