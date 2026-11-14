import type { Router } from "@orpc/server";
import { authApi, type Context } from "../platform/public.server.ts";
import type { contract } from "./contract.shared.ts";
// plop:imports

export const api = {
  auth: authApi,
  // plop:api
} satisfies Router<typeof contract, Context>;
