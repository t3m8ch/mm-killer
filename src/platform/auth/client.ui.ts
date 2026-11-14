import { createRpcClient } from "../rpc-client.ui.ts";
import type { authContract } from "./contract.shared.ts";

export const authRpc = createRpcClient<typeof authContract>("auth");
