import { connect, readConfig, createLogger } from "../platform/public.server.ts";

declare global {
  var mergeMindsDatabase: ReturnType<typeof connect> | undefined;
}

const config = readConfig();

export const logger = createLogger(config.LOG_LEVEL);

// Nitro и SSR собираются отдельно; оба используют один пул в процессе.
const connection = (globalThis.mergeMindsDatabase ??= connect(config.DATABASE_URL, logger));

export const { db, pool } = connection;
