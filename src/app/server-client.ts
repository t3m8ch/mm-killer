import { createServerOnlyFn } from "@tanstack/react-start";
import { createRouterClient } from "@orpc/server";
import { db } from "./database";
import { api } from "./api";
export const serverClient = createServerOnlyFn(() =>
  createRouterClient(api, { context: { db, now: () => new Date() } }),
);
