import type { Router } from "@orpc/server";
import { authApi, type Context } from "../platform/public.server.ts";
import type { contract } from "./contract.shared.ts";
import { coursesApi } from "../modules/courses/public.server.ts";
// plop:imports

export const api = {
  auth: authApi,
  courses: coursesApi,
  // plop:api
} satisfies Router<typeof contract, Context>;
