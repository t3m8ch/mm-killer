import { createFileRoute } from "@tanstack/react-router";
import { RPCHandler } from "@orpc/server/fetch";
import { connect } from "../../platform";
import { api } from "../../app/api";
const { db } = connect(process.env.DATABASE_URL ?? "postgres://mm:mm@127.0.0.1:54329/mm");
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
