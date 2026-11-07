import { createRoot } from "react-dom/client";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  useRouterState,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Button, Text, Title } from "@mantine/core";
import { z } from "zod";
import { Layout, CourseBranch } from "../../../src/platform/public.ui.ts";
import type { NavigationCourse } from "../../../src/platform/public.shared.ts";
import { NavigationComposition, type RouteNavigation } from "../../../src/app/navigation";
import type { ReactNode } from "react";

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const schema = z.object({
  id: z.string(),
  name: z.string(),
  tasks: z.array(z.object({ id: z.string(), name: z.string() })),
});
let renamed = false;
const courseQuery = (id: string) => ({
  queryKey: ["course", id],
  staleTime: 30_000,
  queryFn: async () => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    return {
      id,
      name:
        id === "1"
          ? ["Python", "Обновлённый Python"][Number(renamed)]
          : "Командный проект: разработка и сопровождение программного продукта",
      tasks: Array.from({ length: 30 }, (_, index) => ({
        id: String(index + 1),
        name: `Задание ${index + 1}: длинное название для проверки прокрутки`,
      })),
    };
  },
});

function courseBreadcrumbs(data: unknown) {
  const course = schema.parse(data);

  return [{ label: course.name, href: `/courses/${course.id}` }];
}

const navigation: RouteNavigation[] = [
  { routeId: "__root__", breadcrumbs: () => [{ label: "Мои курсы", href: "/" }] },
  {
    routeId: "/courses/$courseId",
    breadcrumbs: courseBreadcrumbs,
    query: (data) => courseQuery(schema.parse(data).id),
    courseId: (data) => schema.parse(data).id,
  },
  {
    routeId: "/courses/$courseId/tasks/$taskId",
    breadcrumbs: () => [{ label: "Задание 7", href: "/courses/1/tasks/7" }],
  },
  {
    routeId: "/courses/$courseId/attempts/$attemptId",
    breadcrumbs: () => [
      { label: "Задание 7", href: "/courses/1/tasks/7" },
      { label: "Попытка #9", href: "/courses/1/attempts/9" },
    ],
  },
];

function Branch({ course, heading }: { course: NavigationCourse; heading: ReactNode }) {
  const query = useQuery(courseQuery(course.id));
  const path = useRouterState({ select: (state) => state.location.pathname });

  return (
    <CourseBranch
      course={course}
      heading={heading}
      path={path}
      state={
        query.data
          ? {
              status: "ready",
              tasks: query.data.tasks.map((task) => ({
                label: task.name,
                href: `${course.href}/tasks/${task.id}`,
              })),
              sections: [{ label: "Попытки", href: `${course.href}/attempts`, icon: "attempts" }],
              refreshing: query.isFetching,
            }
          : { status: "pending" }
      }
    />
  );
}

function Root() {
  const first = useQuery(courseQuery("1"));
  const courses = [1, 2].map((id) => ({
    id: String(id),
    label:
      id === 1
        ? (first.data?.name ?? "Python")
        : "Командный проект: разработка и сопровождение программного продукта",
    href: `/courses/${id}`,
    emoji: id === 1 ? "🐍" : "🧩",
  }));

  return (
    <Layout>
      <NavigationComposition
        routes={navigation}
        courses={courses}
        renderCourse={(course, heading) => <Branch course={course} heading={heading} />}
        user={{ name: "Анна Иванова", busy: false, onLogout: () => {} }}
      >
        <Outlet />
      </NavigationComposition>
    </Layout>
  );
}

function Page() {
  return (
    <>
      <Title>Тестовый экран</Title>
      <a href="/courses/1/attempts/9">Открыть diff</a>
      <Button
        onClick={() => {
          renamed = true;
          void client.invalidateQueries({ queryKey: ["course", "1"] });
        }}
      >
        Обновить название
      </Button>
      <Text>Содержимое страницы</Text>
    </>
  );
}

const root = createRootRoute({ component: Root });
const home = createRoute({ getParentRoute: () => root, path: "/", component: Page });

const course = createRoute({
  getParentRoute: () => root,
  path: "/courses/$courseId",
  loader: ({ params }) => client.ensureQueryData(courseQuery(params.courseId)),
  component: Outlet,
});
const overview = createRoute({ getParentRoute: () => course, path: "/", component: Page });
const task = createRoute({ getParentRoute: () => course, path: "/tasks/$taskId", component: Page });
const attempts = createRoute({ getParentRoute: () => course, path: "/attempts", component: Page });
const diff = createRoute({
  getParentRoute: () => course,
  path: "/attempts/$attemptId",
  staticData: { navigationMode: "diff" },
  component: Page,
});
const router = createRouter({
  routeTree: root.addChildren([home, course.addChildren([overview, task, attempts, diff])]),
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={client}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
