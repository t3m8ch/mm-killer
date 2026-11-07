import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export function readConfig(environment: NodeJS.ProcessEnv = process.env) {
  return createEnv({
    server: {
      DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, hostname: /.+/ }),
      LOG_LEVEL: z
        .enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"])
        .default("info"),
    },
    clientPrefix: "VITE_",
    client: {},
    runtimeEnvStrict: { DATABASE_URL: environment.DATABASE_URL, LOG_LEVEL: environment.LOG_LEVEL },
    onValidationError: (issues) => {
      const names = [
        ...new Set(
          issues.map((issue) => issue.path?.[0]).filter((name) => typeof name === "string"),
        ),
      ].join(", ");

      throw new Error(`Некорректные переменные окружения: ${names}`);
    },
    onInvalidAccess: () => {
      throw new Error("Серверная конфигурация недоступна в браузере");
    },
  });
}
