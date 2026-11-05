import { os, ORPCError } from "@orpc/server";
import type { Context } from "./context.ts";

export const transaction = os.$context<Context>().middleware(({ context, next }) =>
  context.db.transaction(async (db) => await next({ context: { db } }), {
    isolationLevel: "read committed",
  }),
);
export const authed = os.$context<Context>().middleware(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({ context: { user: context.user } });
});
