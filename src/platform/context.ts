import type { Database, Transaction } from "./db.ts";
import type { User } from "./auth.ts";

export type Context = {
  db: Database | Transaction;
  now: () => Date;
  user?: User | null;
  sessionToken?: string;
  setSessionCookie?: (token: string, maxAge: number) => void;
};
