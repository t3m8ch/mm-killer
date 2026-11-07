import { pino, type DestinationStream, type LevelWithSilent } from "pino";

export function createLogger(level: LevelWithSilent = "info", destination?: DestinationStream) {
  const options = {
    level,
    redact: [
      "DATABASE_URL",
      "connectionString",
      "password",
      "token",
      "headers.authorization",
      "headers.cookie",
      "req.headers.authorization",
      "req.headers.cookie",
    ],
  };

  return destination ? pino(options, destination) : pino(options);
}
