import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { AnyContractRouter, ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

const link = new RPCLink({ url: () => `${window.location.origin}/rpc` });

export function createRpcClient<T extends AnyContractRouter>(module: string) {
  const path = [module];
  const client = createORPCClient<ContractRouterClient<T>>(link, { path });

  return createTanstackQueryUtils(client, { path });
}
