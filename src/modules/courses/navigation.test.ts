import { describe, expect, it } from "vitest";
import type { NavigationCourse } from "../../platform/ui.ts";
import { attemptBreadcrumbs, courseSectionBreadcrumbs, taskBreadcrumbs } from "./index.ts";

const course: NavigationCourse = {
  id: 12n,
  name: "Алгоритмы",
  emoji: "🧩",
  canManage: true,
  tasks: [],
};
const task = { id: 34n, name: "Бинарный поиск" };

describe("построение хлебных крошек", () => {
  it("строит путь к заданию по данным, а не по глубине URL", () => {
    expect(taskBreadcrumbs(course, task)).toEqual([
      { label: "Алгоритмы", to: "/courses/12" },
      { label: "Бинарный поиск", to: "/courses/12/tasks/34" },
    ]);
  });

  it("добавляет попытку к курсу и заданию", () => {
    expect(attemptBreadcrumbs(course, task, 56n)).toEqual([
      { label: "Алгоритмы", to: "/courses/12" },
      { label: "Бинарный поиск", to: "/courses/12/tasks/34" },
      { label: "Попытка #56", to: "/courses/12/attempts/56" },
    ]);
  });

  it("не добавляет задание к разделам курса", () => {
    expect(courseSectionBreadcrumbs(course, "members").map((item) => item.label)).toEqual([
      "Алгоритмы",
      "Участники",
    ]);
  });
});
