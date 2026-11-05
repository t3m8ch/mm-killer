import { createServerOnlyFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createRouterClient } from "@orpc/server";
import { createRequestContext } from "./request-context";
import { api } from "./api";

export const serverClient = createServerOnlyFn(() =>
  createRouterClient(api, { context: () => createRequestContext(getRequest()) }),
);
