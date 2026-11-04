import { describe, expect, it } from "vitest";
import { databaseUrl } from "../../src/platform";

describe("конфигурация подключения к Postgres", () => {
  it.each(["postgres://user:password@host/database", "postgresql://host/database"])(
    "принимает URL из окружения: %s",
    (value) => {
      expect(databaseUrl({ DATABASE_URL: value })).toBe(value);
    },
  );

  it.each([
    undefined,
    "",
    "invalid-secret",
    "postgres:secret",
    "postgresql:///database",
    "https://user:secret@host/database",
  ])("отклоняет отсутствующий или некорректный URL без раскрытия значения", (value) => {
    expect(() => databaseUrl({ DATABASE_URL: value })).toThrow(
      "Задать DATABASE_URL с корректным URL подключения к Postgres",
    );
  });
});
