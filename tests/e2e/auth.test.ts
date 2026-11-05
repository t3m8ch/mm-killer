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

  await page.getByRole("button", { name: "Выйти", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await page.context().cookies()).some((cookie) => cookie.name === "session")).toBe(false);

  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);
});
