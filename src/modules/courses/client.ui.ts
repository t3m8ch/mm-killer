import { createRpcClient } from "../../platform/public.ui.ts";
import type { coursesContract } from "./contract.shared.ts";

export const coursesRpc = createRpcClient<typeof coursesContract>("courses");
