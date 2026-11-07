import { expect, test } from "@playwright/test";

async function layoutReady(page: import("@playwright/test").Page) {
  await expect(page.locator(".app-shell")).toHaveAttribute("data-ready", "true");
}

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.getByRole("button", { name: "Анна Иванова" }).click();
  await expect(page).toHaveURL(/\/$/);
  await layoutReady(page);
}

test("дерево, крошки и diff-layout работают при прямом открытии и переходах", async ({ page }) => {
  await login(page);
  await page.goto("/courses/1/tasks/2");
  await layoutReady(page);

  await expect(page.getByLabel("Хлебные крошки")).toContainText("Сортировка слиянием");
  await expect(page.getByRole("link", { name: "Сортировка слиянием", exact: true })).toBeVisible();

  const courseToggle = page.getByRole("button", { name: "Свернуть курс: Алгоритмы" });

  await expect(courseToggle).toHaveAttribute("aria-expanded", "true");
  await courseToggle.click();
  await expect(page.getByRole("button", { name: "Раскрыть курс: Алгоритмы" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  await expect(page.getByRole("link", { name: "Попытки", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Раскрыть курс: Алгоритмы" }).click();
  await page.getByRole("link", { name: "Попытки", exact: true }).click();
  await expect(page).toHaveURL(/\/courses\/1\/attempts\?status=all$/);

  await page.getByRole("link", { name: "Открыть тестовую попытку" }).click();
  await expect(page).toHaveURL(/\/courses\/1\/attempts\/1$/);
  await expect(page.getByText("Diff и проверка", { exact: true })).toBeVisible();

  await expect(page.locator(".mantine-AppShell-navbar")).not.toBeVisible();
  await expect(page.getByLabel("Хлебные крошки")).toContainText("Попытка #1");
  await page.getByRole("button", { name: "Открыть навигацию", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page.getByRole("dialog").getByRole("link", { name: "Все задания" }).click();
  await expect(page).toHaveURL(/\/courses\/1$/);
  await expect(page.locator(".mantine-AppShell-navbar")).toBeVisible();
  await page.getByRole("button", { name: "Скрыть навигацию" }).click();
  await expect(page.locator(".mantine-AppShell-navbar")).not.toBeVisible();

  await page.getByRole("button", { name: "Показать навигацию" }).click();
  await expect(page.locator(".mantine-AppShell-navbar")).toBeVisible();
});

test("diff-layout скрывает панель при прямом открытии", async ({ page }) => {
  await login(page);
  await page.goto("/courses/1/attempts/1");
  await layoutReady(page);

  await expect(page.locator(".app-shell")).toHaveAttribute("data-hide-navigation", "true");
  await expect(page.locator(".mantine-AppShell-navbar")).toHaveCount(0);
  await expect(page.getByLabel("Хлебные крошки")).toContainText("Попытка #1");
});

test("крошки обновляются при изменении Query-кэша", async ({ page }) => {
  await login(page);
  await page.goto("/courses/1");
  await layoutReady(page);

  await page.getByRole("button", { name: "Обновить название курса" }).click();

  await expect(page.getByLabel("Хлебные крошки")).toContainText("Обновлённые алгоритмы");
  await expect(page.getByLabel("Хлебные крошки")).not.toContainText("Алгоритмы и структуры данных");
});

test("на мобильном экране длинное дерево прокручивается в Drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 420 });
  await login(page);
  await page.goto("/courses/1");
  await layoutReady(page);

  await page.getByRole("button", { name: "Открыть мобильную навигацию" }).click();

  const drawer = page.getByRole("dialog");

  await expect(drawer).toBeVisible();
  await expect(drawer.getByRole("button", { name: "Меню аккаунта: Анна Иванова" })).toBeVisible();
  await drawer.getByRole("link", { name: "Дополнительное задание 20" }).scrollIntoViewIfNeeded();
  await expect(drawer.getByRole("link", { name: "Дополнительное задание 20" })).toBeVisible();

  const courseToggle = drawer.getByRole("button", { name: "Свернуть курс: Алгоритмы" });

  await courseToggle.click();
  await expect(drawer.getByRole("button", { name: "Раскрыть курс: Алгоритмы" })).toHaveAttribute(
    "aria-expanded",
    "false",
  );

  await drawer.getByRole("button", { name: "Раскрыть курс: Алгоритмы" }).click();
  await drawer.getByRole("link", { name: "Бинарный поиск" }).click();
  await expect(page).toHaveURL(/\/courses\/1\/tasks\/1$/);
  await expect(drawer).not.toBeVisible();
});
