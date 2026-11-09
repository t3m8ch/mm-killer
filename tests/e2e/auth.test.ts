import { expect, test } from "@playwright/test";

test("вход и выход защищают страницу", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
  await page.getByRole("button", { name: "Анна Иванова" }).click();
  await expect(page.getByText("anna@example.test")).toBeVisible();

  const session = (await page.context().cookies()).find((cookie) => cookie.name === "session");

  expect(session).toMatchObject({ httpOnly: true, sameSite: "Lax", path: "/" });

  await page.reload();
  await expect(page.getByText("anna@example.test")).toBeVisible();

  const documents: string[] = [];

  page.on("request", (request) => {
    if (request.resourceType() === "document") {
      documents.push(request.url());
    }
  });
  await page.evaluate(() => {
    window.history.pushState(null, "", "/login");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await expect(page.getByRole("heading", { name: "Вход в MergeMinds" })).toBeVisible();
  await page.goBack();
  await expect(page.getByText("anna@example.test")).toBeVisible();
  expect(documents).toEqual([]);

  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.context().cookies()).some((cookie) => cookie.name === "session")).toBe(false);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});

test("оболочка не содержит данных, две сессии получают своего пользователя через RPC", async ({
  browser,
}) => {
  const anna = await browser.newContext();
  const ivan = await browser.newContext();

  try {
    for (const [context, name, email] of [
      [anna, "Анна Иванова", "anna@example.test"],
      [ivan, "Иван Петров", "ivan@example.test"],
    ] as const) {
      const page = await context.newPage();
      const rpcRequests: string[] = [];

      page.on("request", (request) => {
        if (new URL(request.url()).pathname.startsWith("/rpc/")) {
          rpcRequests.push(request.url());
        }
      });
      await page.goto("/login");
      await page.getByRole("button", { name }).click();
      await expect(page.getByText(email)).toBeVisible();
      expect(rpcRequests.some((url) => url.includes("/auth/me"))).toBe(true);

      const document = await context.request.get("/");
      const html = await document.text();

      expect(document.status()).toBe(200);
      expect(html).not.toMatch(
        /anna@example|ivan@example|Анна Иванова|Иван Петров|fullName|queryKey/,
      );
      await page.reload();
      await expect(page.getByText(email)).toBeVisible();
    }

    const annaPage = anna.pages()[0];

    await annaPage.getByRole("button", { name: "Выйти со всех устройств" }).click();
    await expect(annaPage).toHaveURL(/\/login$/);
    await ivan.pages()[0].reload();
    await expect(ivan.pages()[0].getByText("ivan@example.test")).toBeVisible();
  } finally {
    await anna.close();
    await ivan.close();
  }
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
