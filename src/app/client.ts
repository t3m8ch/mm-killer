import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { api } from "./api.server.ts";

const client: RouterClient<typeof api> = createORPCClient(
  new RPCLink({ url: () => `${window.location.origin}/rpc` }),
);

export const rpc = createTanstackQueryUtils(client);
