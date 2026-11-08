import { test, expect } from "@playwright/test";

test("прямое открытие, дерево и независимая загрузка веток", async ({ page }) => {
  await page.goto("/courses/1/tasks/7");
  const sidebar = page.getByRole("complementary");

  await expect(sidebar.getByRole("button", { name: "Свернуть курс: Python" })).toBeVisible();

  await expect(sidebar.getByRole("link", { name: /^Задание 7:/ })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await sidebar.getByRole("button", { name: /^Раскрыть курс:/ }).click();

  await expect(sidebar.getByRole("status")).toContainText("Загрузка раздела");

  await expect(sidebar.getByRole("link", { name: "Python", exact: true })).toBeVisible();

  await expect(sidebar.getByRole("link", { name: /^Задание 30:/ })).toHaveCount(2);

  await sidebar.getByRole("button", { name: "Свернуть курс: Python" }).click();

  await expect(page).toHaveURL(/tasks\/7$/);
});

test("diff без отступа, Drawer и возвращение обычной панели", async ({ page }) => {
  await page.goto("/courses/1/attempts/9");

  await expect(page.getByRole("complementary")).toBeHidden();

  await expect(page.getByRole("navigation", { name: "Хлебные крошки" })).toContainText(
    "PythonЗадание 7Попытка #9",
  );
  expect((await page.locator("main").boundingBox())?.x).toBe(0);

  await page.getByRole("button", { name: "Переключить навигацию" }).click();

  await page.getByRole("dialog").getByRole("link", { name: "Все задания" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();

  await expect(page.getByRole("complementary")).toBeVisible();

  await page.getByRole("button", { name: "Переключить навигацию" }).click();

  await expect(page.getByRole("complementary")).toBeHidden();

  await page.getByRole("button", { name: "Переключить навигацию" }).click();

  await expect(page.getByRole("complementary")).toBeVisible();
});

test("название из общего кэша обновляет крошки и дерево без блокировки", async ({ page }) => {
  await page.goto("/courses/1/tasks/7");

  await page.getByRole("button", { name: "Обновить название" }).click();

  await expect(page.getByRole("navigation", { name: "Хлебные крошки" })).toContainText(
    "Обновлённый Python",
  );

  await expect(
    page.getByRole("complementary").getByRole("link", { name: "Обновлённый Python", exact: true }),
  ).toBeVisible();
});

test("мобильная панель, профиль, тема и Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/courses/1/tasks/7");

  await expect(page.getByRole("complementary")).toBeHidden();

  await page.getByRole("button", { name: "Тема оформления" }).click();

  await page.getByRole("menuitem", { name: "Тёмная" }).click();

  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");

  await page.getByRole("button", { name: "Переключить навигацию" }).click();

  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Меню аккаунта: Анна Иванова" }),
  ).toBeInViewport();

  await page.keyboard.press("Escape");

  await expect(page.getByRole("dialog")).toBeHidden();
});

test("выбранный курс раскрывается после завершения загрузки перехода", async ({ page }) => {
  await page.goto("/courses/1/tasks/7");
  const sidebar = page.getByRole("complementary");
  const name = "Командный проект: разработка и сопровождение программного продукта";

  await sidebar.getByRole("button", { name: `Раскрыть курс: ${name}` }).click();
  await sidebar.getByRole("button", { name: `Свернуть курс: ${name}` }).click();
  await sidebar.getByRole("link", { name, exact: true }).click();

  await expect(page).toHaveURL(/courses\/2$/);
  await expect(sidebar.getByRole("button", { name: `Свернуть курс: ${name}` })).toBeVisible();
});

test("ссылки и перезагрузка сохраняют тему, повторный переход закрывает панель", async ({
  page,
}) => {
  await page.goto("/courses/1/tasks/7");
  await page.getByRole("button", { name: "Тема оформления" }).click();
  await page.getByRole("menuitem", { name: "Тёмная" }).click();

  await page.getByRole("link", { name: "Открыть diff", exact: true }).click();
  await expect(page).toHaveURL(/attempts\/9$/);
  await expect(page.getByRole("complementary")).toBeHidden();
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");

  await page.getByRole("button", { name: "Переключить навигацию" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /^Задание 7:/ })
    .click();
  await expect(page).toHaveURL(/tasks\/7$/);
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Переключить навигацию" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /^Задание 7:/ })
    .click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");

  await page.emulateMedia({ colorScheme: "dark" });
  await page.getByRole("button", { name: "Тема оформления" }).click();
  await page.getByRole("menuitem", { name: "Системная" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "light");
});
