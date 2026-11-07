import { notFound } from "@tanstack/react-router";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { Badge, Button, Group, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { navigationCourseQuery, navigationTestCourses } from "./navigation-test-data.ts";

export function numericId(value: string) {
  try {
    const id = BigInt(value);

    if (id <= 0n) {
      throw notFound();
    }

    return id;
  } catch {
    throw notFound();
  }
}

export async function loadTestCourse(queryClient: QueryClient, courseId: bigint) {
  if (!import.meta.env.DEV) {
    throw notFound();
  }

  const course = await queryClient.ensureQueryData(navigationCourseQuery(courseId));

  return {
    navigationCourses: navigationTestCourses,
    navigation: { kind: "course" as const, course },
  };
}

export async function loadTestSection(
  queryClient: QueryClient,
  courseId: bigint,
  section: "attempts" | "members" | "settings",
) {
  const data = await loadTestCourse(queryClient, courseId);

  return {
    navigationCourses: navigationTestCourses,
    navigation: { kind: "section" as const, course: data.navigation.course, section },
  };
}

export async function loadTestTask(queryClient: QueryClient, courseId: bigint, taskId: bigint) {
  const data = await loadTestCourse(queryClient, courseId);
  const task = data.navigation.course.tasks.find((item) => item.id === taskId);

  if (!task) {
    throw notFound();
  }

  return {
    navigationCourses: navigationTestCourses,
    navigation: { kind: "task" as const, course: data.navigation.course, task },
  };
}

export async function loadTestAttempt(
  queryClient: QueryClient,
  courseId: bigint,
  attemptId: bigint,
) {
  const data = await loadTestTask(queryClient, courseId, 1n);

  return {
    navigationCourses: navigationTestCourses,
    navigation: {
      kind: "attempt" as const,
      course: data.navigation.course,
      task: data.navigation.task,
      attemptId,
    },
  };
}

export function TestPage({
  title,
  diff = false,
  children,
}: {
  title: string;
  diff?: boolean;
  children?: ReactNode;
}) {
  return (
    <Stack className={diff ? undefined : "app-page"} p={diff ? "xl" : undefined}>
      <Group justify="space-between">
        <Title order={1}>{title}</Title>
        {diff && <Badge color="orange">На проверке</Badge>}
      </Group>
      <Text>
        Тестовый маршрут общего layout. Предметный экран будет подключён отдельным модулем.
      </Text>
      {diff && (
        <Text>
          Дерево файлов из T07b займет левую часть этого экрана без отступа от основной панели.
        </Text>
      )}
      {children}
    </Stack>
  );
}

export function TestCoursePage({ courseId }: { courseId: bigint }) {
  const queryClient = useQueryClient();

  return (
    <TestPage title="Задания курса">
      <Button
        w="fit-content"
        onClick={() => {
          const query = navigationCourseQuery(courseId);

          queryClient.setQueryData(query.queryKey, (course) =>
            course ? { ...course, name: "Обновлённые алгоритмы" } : course,
          );
        }}
      >
        Обновить название курса
      </Button>
    </TestPage>
  );
}
