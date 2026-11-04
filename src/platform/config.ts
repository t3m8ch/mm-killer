export function databaseUrl(environment: NodeJS.ProcessEnv = process.env) {
  const value = environment.DATABASE_URL;

  if (
    !value ||
    !URL.canParse(value) ||
    !["postgres:", "postgresql:"].includes(new URL(value).protocol) ||
    !new URL(value).hostname
  ) {
    throw new Error("Задать DATABASE_URL с корректным URL подключения к Postgres");
  }

  return value;
}
