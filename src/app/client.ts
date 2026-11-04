import { createIsomorphicFn } from "@tanstack/react-start";
import { serverClient } from "./server-client";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { api } from "./api";

const getClient = createIsomorphicFn()
  .server(() => serverClient())
  .client((): RouterClient<typeof api> =>
    createORPCClient(new RPCLink({ url: () => `${window.location.origin}/rpc` })),
  );
const client: RouterClient<typeof api> = getClient();

export const rpc = createTanstackQueryUtils(client);
