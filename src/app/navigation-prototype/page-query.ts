// THROWAWAY: моковый запрос страницы с настоящим кэшем TanStack Query.
import { queryOptions } from "@tanstack/react-query";

export const prototypeStaleTime = 30_000;

export function prototypePageQuery(splat: string, search: { role: string; status: string }) {
  const path = `/${splat}`.replace(/\/$/, "") || "/";
  const status = path.endsWith("/attempts") ? search.status : "all";

  return queryOptions({
    queryKey: ["navigation-prototype", "page", path, search.role, status],
    queryFn: async () => {
      const diff = /\/attempts\/\d+$/.test(path);
      const delayMs = Math.round((diff ? 1400 : 700) + Math.random() * (diff ? 1200 : 900));

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      return { path, delayMs, loadedAt: Date.now() };
    },
    staleTime: prototypeStaleTime,
    gcTime: 5 * 60_000,
  });
}

const defaultTasks = ["Двоичный поиск", "Сортировки и оценка сложности", "Деревья и обход графа"];

const projectTasks = [
  "Выбор темы и состава команды",
  "Описание пользователей и сценариев работы",
  "Формулировка требований к программному продукту",
  "Прототип интерфейса",
  "Проектирование модели данных",
  "Настройка репозитория и рабочего окружения",
  "Первый вертикальный срез приложения",
  "Авторизация и разграничение доступа",
  "Основные пользовательские сценарии",
  "Интеграция с внешними сервисами",
  "Автоматизированное тестирование",
  "Обработка ошибок и наблюдаемость",
  "Проверка производительности на реалистичных объёмах данных",
  "Развёртывание, документация и подготовка демонстрации",
  "Защита командного проекта и план дальнейшего сопровождения",
];

export function prototypeTasks(courseId: string) {
  return courseId === "15" ? projectTasks : defaultTasks;
}

export function prototypeCourseTreeQuery(courseId: string, teacher: boolean) {
  return queryOptions({
    queryKey: ["navigation-prototype", "course-tree", courseId, teacher ? "teacher" : "student"],
    queryFn: async () => {
      const delayMs = Math.round(700 + Math.random() * 900);

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      return {
        tasks: prototypeTasks(courseId).map((name, index) => ({ id: String(index + 1), name })),
        delayMs,
        loadedAt: Date.now(),
      };
    },
    staleTime: prototypeStaleTime,
    gcTime: 5 * 60_000,
  });
}
