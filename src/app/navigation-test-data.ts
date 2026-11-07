import { queryOptions } from "@tanstack/react-query";
import type { NavigationCourse } from "../platform/ui.ts";

const courses: NavigationCourse[] = [
  {
    id: 1n,
    name: "Алгоритмы и структуры данных",
    emoji: "🧩",
    canManage: true,
    tasks: [
      { id: 1n, name: "Бинарный поиск" },
      { id: 2n, name: "Сортировка слиянием" },
      ...Array.from({ length: 20 }, (_, index) => ({
        id: BigInt(index + 3),
        name: `Дополнительное задание ${index + 1}`,
      })),
    ],
  },
  {
    id: 2n,
    name: "Практикум по программированию на Python и разработке приложений",
    emoji: "🐍",
    canManage: false,
    tasks: [{ id: 1n, name: "Первая программа" }],
  },
];

export const navigationTestCourses = courses.map(({ tasks: _tasks, ...course }) => ({
  ...course,
  tasks: [],
}));

export async function loadNavigationCourse(courseId: bigint) {
  const course = courses.find((item) => item.id === courseId);

  if (!course) {
    throw new Error("Тестовый курс не найден");
  }

  return course;
}

export function navigationCourseQuery(courseId: bigint) {
  return queryOptions({
    queryKey: ["navigation", "course", courseId.toString()],
    queryFn: () => loadNavigationCourse(courseId),
    staleTime: 30_000,
    gcTime: 300_000,
  });
}
