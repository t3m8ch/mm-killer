import { test, expect } from "@playwright/test";
test("запись сохраняется после перезагрузки", async ({ page }) => {
  const text = `Проверка ${crypto.randomUUID()}`;
  await page.goto("/");
  await page.getByLabel("Текст записи").fill(text);
  await page.getByRole("button", { name: "Добавить запись" }).click();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText(text, { exact: true })).toBeVisible();
});
