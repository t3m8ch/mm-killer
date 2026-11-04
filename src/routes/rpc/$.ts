import { createFileRoute } from "@tanstack/react-router";
import { RPCHandler } from "@orpc/server/fetch";
import { authContext } from "../../app/auth-context";
import { api } from "../../app/api";

const handler = new RPCHandler(api);

export const Route = createFileRoute("/rpc/$")({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const origin = request.headers.get("origin");

        if (origin && origin !== new URL(request.url).origin) {
          return new Response("Forbidden", { status: 403 });
        }

        const headers = new Headers();
        const context = await authContext(request, headers);
        const { response } = await handler.handle(request, {
          prefix: "/rpc",
          context,
        });

        if (response) {
          headers.forEach((value, key) => response.headers.append(key, value));
        }

        return response ?? new Response("Not found", { status: 404 });
      },
    },
  },
});
