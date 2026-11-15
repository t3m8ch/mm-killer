import { test, expect } from "../helpers/network";

test("прямое открытие, дерево и независимая загрузка веток", async ({ page, holdRequest }) => {
  const course = await holdRequest("**/__fixture__/courses/2/ready", { status: 204 });

  await page.goto("/courses/1/tasks/7?holdCourse=2");
  const sidebar = page.getByRole("complementary");

  await expect(sidebar.getByRole("button", { name: "Свернуть курс: Python" })).toBeVisible();

  await expect(sidebar.getByRole("link", { name: /^Задание 7:/ })).toHaveAttribute(
    "aria-current",
    "page",
  );

  await sidebar.getByRole("button", { name: /^Раскрыть курс:/ }).click();

  await course.requested;
  await expect(sidebar.getByRole("status")).toContainText("Загрузка раздела");

  await expect(sidebar.getByRole("link", { name: "Python", exact: true })).toBeVisible();

  course.release();

  await expect(sidebar.getByRole("link", { name: /^Задание 30:/ })).toHaveCount(2);

  await sidebar.getByRole("button", { name: "Свернуть курс: Python" }).click();

  await expect(page).toHaveURL(/tasks\/7\?holdCourse=2$/);
});

test("diff без отступа, Drawer и возвращение обычной панели", async ({ page }) => {
  await page.goto("/courses/1/attempts/9");

  await expect(page.getByRole("complementary")).toBeHidden();

  await expect(page.getByRole("navigation", { name: "Хлебные крошки" })).toContainText(
    "PythonЗадание 7: длинное название для проверки прокруткиПопытка #9",
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

test("мобильная панель показывает профиль и закрывается по Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/courses/1/tasks/7");

  await expect(page.getByRole("complementary")).toBeHidden();

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

test("тёмная тема сохраняется при переходах и перезагрузке", async ({ page }) => {
  await page.goto("/courses/1/tasks/7");
  await page.getByRole("button", { name: "Тема оформления" }).click();
  await page.getByRole("menuitem", { name: "Тёмная" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");

  await page.getByRole("link", { name: "Открыть diff", exact: true }).click();
  await expect(page).toHaveURL(/attempts\/9$/);
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");

  await page.getByRole("button", { name: "Переключить навигацию" }).click();
  await page
    .getByRole("dialog")
    .getByRole("link", { name: /^Задание 7:/ })
    .click();
  await expect(page).toHaveURL(/tasks\/7$/);
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");
});

test("повторный переход на текущую страницу закрывает мобильный Drawer", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/courses/1/tasks/7");
  await page.getByRole("button", { name: "Переключить навигацию" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();

  await page
    .getByRole("dialog")
    .getByRole("link", { name: /^Задание 7:/ })
    .click();

  await expect(page).toHaveURL(/tasks\/7$/);
  await expect(page.getByRole("dialog")).toBeHidden();
});

test("системная тема сохраняется и реагирует на настройки устройства", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/courses/1/tasks/7");
  // Сначала выбрать явную тему, чтобы проверка не зависела от режима по умолчанию.
  await page.getByRole("button", { name: "Тема оформления" }).click();
  await page.getByRole("menuitem", { name: "Светлая" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "light");

  await page.getByRole("button", { name: "Тема оформления" }).click();
  await page.getByRole("menuitem", { name: "Системная" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "dark");

  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-mantine-color-scheme", "light");
});

test("медленный переход сохраняет согласованную навигацию и блокирует старую страницу", async ({
  page,
  holdRequest,
}) => {
  const course = await holdRequest("**/__fixture__/courses/2/ready", { status: 204 });

  await page.goto("/courses/1/tasks/7?holdCourse=2");

  const sidebar = page.getByRole("complementary");
  const main = page.locator("main");
  const breadcrumbs = page.getByRole("navigation", { name: "Хлебные крошки" });

  await sidebar
    .getByRole("link", {
      name: "Командный проект: разработка и сопровождение программного продукта",
      exact: true,
    })
    .click();

  await course.requested;
  await expect(main).toHaveAttribute("aria-busy", "true");
  await expect(main.locator("[inert]")).toHaveCount(1);
  await expect(breadcrumbs).toContainText("Python");
  await expect(sidebar.getByRole("link", { name: /^Задание 7:/ })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(sidebar.getByRole("link", { name: "Python", exact: true })).toHaveClass(/selected/);

  const action = main.getByRole("button", { name: "Действие страницы", includeHidden: true });

  expect(
    await action.evaluate((element) => {
      element.focus();

      return document.activeElement === element;
    }),
  ).toBe(false);
  expect(
    await action.evaluate((element) => {
      const rect = element.getBoundingClientRect();

      return element.contains(
        document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2),
      );
    }),
  ).toBe(false);

  course.release();

  await expect(main).toHaveAttribute("aria-busy", "false");
  await expect(main.locator("[inert]")).toHaveCount(0);
  await expect(breadcrumbs).toContainText("Командный проект");
  await expect(sidebar.getByRole("link", { name: /^Задание 7:/ }).first()).not.toHaveAttribute(
    "aria-current",
    "page",
  );
  await action.focus();
  await expect(action).toBeFocused();
});

test("крошки попыток используют загруженные курс, задание и попытку", async ({ page }) => {
  for (const record of [
    { courseId: "1", attemptId: "9", taskId: "7", courseName: "Python" },
    { courseId: "2", attemptId: "12", taskId: "23", courseName: "Командный проект" },
  ]) {
    await page.goto(`/courses/${record.courseId}/attempts/${record.attemptId}`);
    const breadcrumbs = page.getByRole("navigation", { name: "Хлебные крошки" });

    await expect(breadcrumbs).toContainText(record.courseName);
    await expect(
      breadcrumbs.getByRole("link", { name: new RegExp(`^Задание ${record.taskId}:`) }),
    ).toHaveAttribute("href", `/courses/${record.courseId}/tasks/${record.taskId}`);
    await expect(breadcrumbs.locator('[aria-current="page"]')).toHaveText(
      `Попытка #${record.attemptId}`,
    );
  }
});

test("оболочка не меняет оформление ссылок, кнопок и заголовков страницы", async ({ page }) => {
  await page.goto("/courses/1/tasks/7");

  for (const selector of ["main h1", 'main a[href="#content"]', "main button"]) {
    const styles = await page
      .locator(selector)
      .first()
      .evaluate((element) => {
        const reference = element.cloneNode(true);

        if (!(reference instanceof HTMLElement)) {
          throw new Error("Ожидался HTML-элемент");
        }

        document.body.append(reference);
        const properties = [
          "color",
          "text-decoration-line",
          "font-size",
          "font-weight",
          "line-height",
          "letter-spacing",
          "margin-top",
          "margin-bottom",
          "cursor",
        ];
        const read = (target: Element) =>
          properties.map((property) => getComputedStyle(target).getPropertyValue(property));
        const actual = read(element);
        const expected = read(reference);

        reference.remove();

        return { actual, expected };
      });

    expect(styles.actual, selector).toEqual(styles.expected);
  }
});
