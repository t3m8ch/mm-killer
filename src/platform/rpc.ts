import { os } from "@orpc/server";
import type { Database, Transaction } from "./db";
export type Context = { db: Database | Transaction; now: () => Date };
export const mutationTransaction = os
  .$context<Context>()
  .middleware(({ context, next }) =>
    context.db.transaction(async (db) => await next({ context: { db } })),
  );
