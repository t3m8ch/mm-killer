import { createServerOnlyFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createRouterClient } from "@orpc/server";
import { authContext } from "./auth-context";
import { api } from "./api";

export const serverClient = createServerOnlyFn(() =>
  createRouterClient(api, { context: () => authContext(getRequest()) }),
);
