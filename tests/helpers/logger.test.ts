import { describe, expect, it } from "vitest";
import { createLogger } from "../../src/platform/public.server.ts";

function capture(level: "info" | "warn" = "info") {
  const lines: string[] = [];
  const logger = createLogger(level, {
    write: (line) => {
      lines.push(line);
    },
  });

  return { logger, lines };
}

describe("структурированные логи", () => {
  it("сохраняют контекст дочернего логгера и ошибку со стеком", () => {
    const { logger, lines } = capture();
    const error = new Error("Сбой операции");

    logger.child({ requestId: "request-1" }).error({ err: error }, "Операция не выполнена");

    expect(JSON.parse(lines[0])).toMatchObject({
      level: 50,
      requestId: "request-1",
      msg: "Операция не выполнена",
      err: { type: "Error", message: error.message, stack: error.stack },
    });
  });

  it("отбрасывают события ниже выбранного уровня", () => {
    const { logger, lines } = capture("warn");

    logger.info("Пропустить");
    logger.warn("Сохранить");

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0]).msg).toBe("Сохранить");
  });

  it("скрывают секреты в настроенных полях и сохраняют полезный контекст", () => {
    const { logger, lines } = capture();

    logger.info(
      {
        DATABASE_URL: "postgres://user:db-secret@host/db",
        connectionString: "postgres://user:connection-secret@host/db",
        password: "password-secret",
        token: "token-secret",
        req: { headers: { authorization: "auth-secret", cookie: "cookie-secret" } },
        courseId: "42",
      },
      "Событие",
    );

    expect(lines[0]).not.toContain("secret");
    expect(JSON.parse(lines[0])).toMatchObject({ courseId: "42", DATABASE_URL: "[Redacted]" });
  });
});
