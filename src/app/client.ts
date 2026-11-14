import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import type { contract } from "./contract.shared.ts";

const client: ContractRouterClient<typeof contract> = createORPCClient(
  new RPCLink({ url: () => `${window.location.origin}/rpc` }),
);

export const rpc = createTanstackQueryUtils(client);
