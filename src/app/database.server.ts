import { connect, readConfig, createLogger } from "../platform/public.server.ts";

declare global {
  var mergeMindsDatabase:
    | (ReturnType<typeof connect> & { logger: ReturnType<typeof createLogger> })
    | undefined;
}

export function getDatabase() {
  if (!globalThis.mergeMindsDatabase) {
    const config = readConfig();
    const logger = createLogger(config.LOG_LEVEL);

    globalThis.mergeMindsDatabase = { ...connect(config.DATABASE_URL, logger), logger };
  }

  return globalThis.mergeMindsDatabase;
}
