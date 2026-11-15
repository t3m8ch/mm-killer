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
import { Layout } from "../../../src/platform/public.ui.ts";
import { AppSidebar } from "../../../src/app/sidebar";
import { CourseBranch } from "../../../src/app/course-branch";
import type { NavigationCourse } from "../../../src/app/navigation-types";
import { NavigationComposition, routeNavigation } from "../../../src/app/navigation";
import type { ReactNode } from "react";

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const heldCourseId = new URLSearchParams(window.location.search).get("holdCourse");
let renamed = false;
const courseQuery = (id: string) => ({
  queryKey: ["course", id],
  staleTime: 30_000,
  queryFn: async () => {
    if (heldCourseId === id) {
      // Браузерный тест удерживает этот запрос до завершения проверок перехода.
      await fetch(`/__fixture__/courses/${id}/ready`);
    } else {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

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

function taskBreadcrumbs(task: Awaited<ReturnType<ReturnType<typeof taskQuery>["queryFn"]>>) {
  return [{ label: task.name, href: `/courses/${task.courseId}/tasks/${task.id}` }];
}

function courseBreadcrumbs(course: Awaited<ReturnType<ReturnType<typeof courseQuery>["queryFn"]>>) {
  return [{ label: course.name, href: `/courses/${course.id}` }];
}

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
          <AppSidebar
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
const navigation = [
  routeNavigation(root, { breadcrumbs: () => [{ label: "Мои курсы", href: "/" }] }),
  routeNavigation(course, {
    breadcrumbs: courseBreadcrumbs,
    query: (data) => courseQuery(data.id),
    courseId: (data) => data.id,
  }),
  routeNavigation(task, {
    breadcrumbs: taskBreadcrumbs,
    query: (data) => taskQuery(data.courseId, data.id),
  }),
  routeNavigation(diff, {
    breadcrumbs: (attempt) => [
      ...taskBreadcrumbs(attempt.task),
      {
        label: `Попытка #${attempt.id}`,
        href: `/courses/${attempt.courseId}/attempts/${attempt.id}`,
      },
    ],
    query: (attempt) => attemptQuery(attempt.courseId, attempt.id),
  }),
];

const router = createRouter({
  routeTree: root.addChildren([home, course.addChildren([overview, task, attempts, diff])]),
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={client}>
    <RouterProvider router={router} />
  </QueryClientProvider>,
);
