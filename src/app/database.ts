import { connect, readConfig } from "../platform";

declare global {
  var mergeMindsDatabase: ReturnType<typeof connect> | undefined;
}

// Nitro и SSR собираются отдельно; оба используют один пул в процессе.
const connection = (globalThis.mergeMindsDatabase ??= connect(readConfig().DATABASE_URL));

export const { db, pool } = connection;
