import { describe, expect, it, vi } from "vitest";
import { readConfig } from "../../src/platform";

describe("конфигурация подключения к Postgres", () => {
  it.each(["postgres://user:password@host/database", "postgresql://host/database"])(
    "принимает URL из окружения: %s",
    (value) => {
      expect(readConfig({ DATABASE_URL: value }).DATABASE_URL).toBe(value);
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
    expect(() => readConfig({ DATABASE_URL: value })).toThrow(
      "Некорректные переменные окружения: DATABASE_URL",
    );
  });
  it("по умолчанию выбирает уровень info", () => {
    expect(readConfig({ DATABASE_URL: "postgres://host/database" }).LOG_LEVEL).toBe("info");
  });

  it("отклоняет неизвестный уровень логирования без вывода значения", () => {
    expect(() =>
      readConfig({ DATABASE_URL: "postgres://host/database", LOG_LEVEL: "secret" }),
    ).toThrow("Некорректные переменные окружения: LOG_LEVEL");
  });

  it("блокирует чтение серверной переменной в браузере", () => {
    vi.stubGlobal("window", {});

    try {
      const config = readConfig({ DATABASE_URL: "postgres://user:secret@host/database" });

      expect(() => config.DATABASE_URL).toThrow("Серверная конфигурация недоступна в браузере");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
