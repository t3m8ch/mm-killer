import { test, expect } from "@playwright/test";
test("открывает главную страницу", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "MergeMinds" })).toBeVisible();
});
