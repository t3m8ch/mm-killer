import { createRoot } from "react-dom/client";
import {
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
  Outlet,
  useRouterState,
  Link,
} from "@tanstack/react-router";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Button, Text, Title } from "@mantine/core";
import { z } from "zod";
import { CourseBranch, Layout, Sidebar } from "../../../src/platform/public.ui.ts";
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

const taskSchema = z.object({ courseId: z.string(), id: z.string(), name: z.string() });
const attemptSchema = z.object({ courseId: z.string(), id: z.string(), taskId: z.string() });
const attemptRecords = [
  { courseId: "1", id: "9", taskId: "7" },
  { courseId: "2", id: "12", taskId: "23" },
];
const taskQuery = (courseId: string, id: string) => ({
  queryKey: ["task", courseId, id],
  staleTime: 30_000,
  queryFn: async () => {
    const course = await client.ensureQueryData(courseQuery(courseId));
    const task = course.tasks.find((item) => item.id === id);

    if (!task) {
      throw new Error("Задание не найдено");
    }

    return { ...task, courseId };
  },
});
const attemptQuery = (courseId: string, id: string) => ({
  queryKey: ["attempt", courseId, id],
  staleTime: 30_000,
  queryFn: async () => {
    const attempt = attemptRecords.find((item) => item.courseId === courseId && item.id === id);

    if (!attempt) {
      throw new Error("Попытка не найдена");
    }

    const task = await client.ensureQueryData(taskQuery(courseId, attempt.taskId));

    return { ...attempt, task };
  },
});
const loadedAttemptSchema = attemptSchema.extend({ task: taskSchema });

function taskBreadcrumbs(data: unknown) {
  const task = taskSchema.parse(data);

  return [{ label: task.name, href: `/courses/${task.courseId}/tasks/${task.id}` }];
}

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
    breadcrumbs: taskBreadcrumbs,
    query: (data) => {
      const task = taskSchema.parse(data);

      return taskQuery(task.courseId, task.id);
    },
  },
  {
    routeId: "/courses/$courseId/attempts/$attemptId",
    breadcrumbs: (data) => {
      const attempt = loadedAttemptSchema.parse(data);

      return [
        ...taskBreadcrumbs(attempt.task),
        {
          label: `Попытка #${attempt.id}`,
          href: `/courses/${attempt.courseId}/attempts/${attempt.id}`,
        },
      ];
    },
    query: (data) => {
      const attempt = loadedAttemptSchema.parse(data);

      return attemptQuery(attempt.courseId, attempt.id);
    },
  },
];

function Branch({ course, heading }: { course: NavigationCourse; heading: ReactNode }) {
  const query = useQuery(courseQuery(course.id));
  const path = useRouterState({ select: (state) => state.matches.at(-1)?.pathname ?? "/" });

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
        renderSidebar={(sidebarProps) => (
          <Sidebar
            {...sidebarProps}
            courses={courses}
            renderCourseBranch={(course, heading) => <Branch course={course} heading={heading} />}
            user={{ name: "Анна Иванова", busy: false, onLogout: () => {} }}
          />
        )}
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
      <Link<typeof router, string, typeof diff.fullPath>
        to={diff.fullPath}
        params={{ courseId: "1", attemptId: "9" }}
      >
        Открыть diff
      </Link>
      <Button
        onClick={() => {
          renamed = true;
          void client.invalidateQueries({ queryKey: ["course", "1"] });
        }}
      >
        Обновить название
      </Button>
      <a href="#content">Ссылка страницы</a>
      <button type="button">Действие страницы</button>
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
const task = createRoute({
  getParentRoute: () => course,
  path: "/tasks/$taskId",
  loader: ({ params }) => client.ensureQueryData(taskQuery(params.courseId, params.taskId)),
  component: Page,
});
const attempts = createRoute({ getParentRoute: () => course, path: "/attempts", component: Page });
const diff = createRoute({
  getParentRoute: () => course,
  path: "/attempts/$attemptId",
  loader: ({ params }) => client.ensureQueryData(attemptQuery(params.courseId, params.attemptId)),
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
