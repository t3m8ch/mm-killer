import { createRootRoute, createRoute } from "@tanstack/react-router";
import { routeNavigation } from "../../../src/app/navigation";

// Проверяется командой typecheck; функция не исполняется в браузерном стенде.
function checkNavigationTypes() {
  const root = createRootRoute();
  const course = createRoute({
    getParentRoute: () => root,
    path: "/courses/$courseId",
    loader: ({ params }) => ({ id: params.courseId, name: "Python" }),
  });

  routeNavigation(course, {
    breadcrumbs: (data) => [{ label: data.name, href: `/courses/${data.id}` }],
    courseId: (data) => data.id,
    query: (data) => ({
      queryKey: ["course", data.id],
      queryFn: async () => ({ id: data.id, name: "Новое имя" }),
    }),
  });

  routeNavigation(course, {
    // @ts-expect-error Данные другого loader несовместимы с маршрутом курса.
    breadcrumbs: (data: { taskId: string }) => [{ label: data.taskId, href: "/" }],
  });

  routeNavigation(course, {
    breadcrumbs: () => [],
    // @ts-expect-error Query должен возвращать те же данные, что и loader.
    query: () => ({ queryKey: ["task"], queryFn: async () => ({ taskId: "7" }) }),
  });

  routeNavigation(course, {
    breadcrumbs: (data) => {
      // @ts-expect-error Тип loader выводится автоматически, поля taskId в нём нет.
      return [{ label: data.taskId, href: "/" }];
    },
  });
}

void checkNavigationTypes;
