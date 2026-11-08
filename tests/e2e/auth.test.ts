import { expect, test } from "@playwright/test";

test("вход и выход защищают страницу", async ({ page }) => {
  const errors: string[] = [];
  const userReads: string[] = [];

  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/rpc/auth/me") {
      userReads.push(request.url());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Анна Иванова" }).click();
  await expect(page.getByText("anna@example.test")).toBeVisible();

  const session = (await page.context().cookies()).find((cookie) => cookie.name === "session");

  expect(session).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });

  await page.getByRole("button", { name: "Тема оформления" }).click();
  await page.getByRole("menuitem", { name: "Тёмная" }).click();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");
  await expect(page.getByText("anna@example.test")).toBeVisible();
  await expect(page.getByRole("button", { name: "Меню аккаунта: Анна Иванова" })).toBeEnabled();
  expect(userReads).toEqual([]);

  const serverPage = await page.request.get("/");

  expect(serverPage.status()).toBe(200);
  expect(await serverPage.text()).toContain("anna@example.test");

  await page.getByRole("button", { name: "Меню аккаунта: Анна Иванова" }).click();
  await page.getByRole("menuitem", { name: "Выйти", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.context().cookies()).some((cookie) => cookie.name === "session")).toBe(false);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);

  expect(errors).toEqual([]);
});

test("SSR-кэш пользователя изолирован между сессиями", async ({ browser }) => {
  const anna = await browser.newContext();
  const ivan = await browser.newContext();

  try {
    const annaPage = await anna.newPage();
    const ivanPage = await ivan.newPage();

    await annaPage.goto("/login");
    await annaPage.getByRole("button", { name: "Анна Иванова" }).click();
    await expect(annaPage.getByText("anna@example.test")).toBeVisible();
    await ivanPage.goto("/login");
    await ivanPage.getByRole("button", { name: "Иван Петров" }).click();
    await expect(ivanPage.getByText("ivan@example.test")).toBeVisible();

    const [annaResponse, ivanResponse] = await Promise.all([
      anna.request.get("/"),
      ivan.request.get("/"),
    ]);
    const annaHtml = await annaResponse.text();
    const ivanHtml = await ivanResponse.text();

    expect(annaResponse.status()).toBe(200);
    expect(ivanResponse.status()).toBe(200);
    expect(annaHtml).toContain("anna@example.test");
    expect(annaHtml).not.toContain("ivan@example.test");
    expect(ivanHtml).toContain("ivan@example.test");
    expect(ivanHtml).not.toContain("anna@example.test");
  } finally {
    await Promise.all([anna.close(), ivan.close()]);
  }
});
