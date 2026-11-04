import { createServerOnlyFn } from "@tanstack/react-start";
import { createRouterClient } from "@orpc/server";
import { connect } from "../platform";
import { api } from "./api";
const { db } = connect(process.env.DATABASE_URL ?? "postgres://mm:mm@127.0.0.1:54329/mm");
export const serverClient = createServerOnlyFn(() =>
  createRouterClient(api, { context: { db, now: () => new Date() } }),
);
