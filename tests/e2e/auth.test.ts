import { expect, test } from "@playwright/test";

test("вход и выход защищают страницу", async ({ page }) => {
  const anonymousDocument = await page.request.get("/");
  const anonymousHtml = await anonymousDocument.text();

  expect(anonymousDocument.status()).toBe(200);
  expect(anonymousHtml).not.toMatch(/Анна Иванова|anna@example\.test/);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Анна Иванова" }).click();
  await expect(page.getByText("anna@example.test")).toBeVisible();

  const authenticatedDocument = await page.request.get("/");
  const authenticatedHtml = await authenticatedDocument.text();

  expect(authenticatedDocument.status()).toBe(200);
  expect(authenticatedHtml).not.toMatch(/Анна Иванова|anna@example\.test/);
  // В dev Start заново генерирует служебные метаданные на каждый запрос.
  if (process.env.PLAYWRIGHT_PRODUCTION === "true") {
    expect(authenticatedHtml).toBe(anonymousHtml);
  }

  const session = (await page.context().cookies()).find((cookie) => cookie.name === "session");

  expect(session).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });

  await page.reload();
  await expect(page.getByText("anna@example.test")).toBeVisible();

  await page.getByRole("button", { name: "Меню аккаунта: Анна Иванова" }).click();
  await page.getByRole("menuitem", { name: "Выйти", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.context().cookies()).some((cookie) => cookie.name === "session")).toBe(false);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("прямой вложенный URL и обновление показывают клиентскую 404", async ({ page }) => {
  const response = await page.goto("/missing/nested/page");

  expect(response?.status()).toBe(process.env.PLAYWRIGHT_PRODUCTION === "true" ? 200 : 404);
  if (process.env.PLAYWRIGHT_PRODUCTION === "true") {
    expect(await response?.text()).not.toContain("Страница не найдена");
  }

  await expect(page.getByText("Страница не найдена")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Страница не найдена")).toBeVisible();
});
