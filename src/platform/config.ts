import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export function readConfig(environment: NodeJS.ProcessEnv = process.env) {
  return createEnv({
    server: {
      DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/, hostname: /.+/ }),
    },
    clientPrefix: "VITE_",
    client: {},
    runtimeEnvStrict: { DATABASE_URL: environment.DATABASE_URL },
    onValidationError: () => {
      throw new Error("Задать DATABASE_URL с корректным URL подключения к Postgres");
    },
    onInvalidAccess: () => {
      throw new Error("Серверная конфигурация недоступна в браузере");
    },
  });
}
