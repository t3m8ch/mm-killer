import { useMatches } from "@tanstack/react-router";
import { useQueries } from "@tanstack/react-query";
import {
  attemptBreadcrumbs,
  courseBreadcrumbs,
  courseSectionBreadcrumbs,
  taskBreadcrumbs,
} from "../modules/courses/index.ts";
import type { Breadcrumb, NavigationCourse, NavigationTask } from "../platform/ui.ts";
import { navigationCourseQuery } from "./navigation-test-data.ts";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    hideNavigation?: boolean;
  }
}

interface NavigationMatchData {
  navigationCourses?: NavigationCourse[];
  navigation?:
    | { kind: "course"; course: NavigationCourse }
    | { kind: "section"; course: NavigationCourse; section: "attempts" | "members" | "settings" }
    | { kind: "task"; course: NavigationCourse; task: NavigationTask }
    | { kind: "attempt"; course: NavigationCourse; task: NavigationTask; attemptId: bigint };
}

type NavigationData = NonNullable<NavigationMatchData["navigation"]>;

function withCurrentCourse(data: NavigationData, course: NavigationCourse): NavigationData {
  switch (data.kind) {
    case "course":
      return { ...data, course };
    case "section":
      return { ...data, course };
    case "task":
    case "attempt":
      return {
        ...data,
        course,
        task: course.tasks.find((task) => task.id === data.task.id) ?? data.task,
      };
  }
}

function breadcrumbsFor(data: NavigationData): Breadcrumb[] {
  switch (data.kind) {
    case "course":
      return courseBreadcrumbs(data.course);
    case "section":
      return courseSectionBreadcrumbs(data.course, data.section);
    case "task":
      return taskBreadcrumbs(data.course, data.task);
    case "attempt":
      return attemptBreadcrumbs(data.course, data.task, data.attemptId);
  }
}

export function useNavigation() {
  const matches = useMatches();
  const navigation = matches.flatMap((match) => {
    const data = match.loaderData as NavigationMatchData | undefined;

    return data?.navigation ? [data.navigation] : [];
  });
  const courseQueries = useQueries({
    queries: navigation.map((data) => navigationCourseQuery(data.course.id)),
  });

  let navigationIndex = 0;
  let breadcrumbs: Breadcrumb[] = [{ label: "Мои курсы", to: "/" }];
  let courses: NavigationCourse[] = [];
  let hideNavigation = false;

  for (const match of matches) {
    const data = match.loaderData as NavigationMatchData | undefined;

    if (data?.navigationCourses) {
      courses = data.navigationCourses;
    }

    if (data?.navigation) {
      const course = courseQueries[navigationIndex]?.data;
      const current = course ? withCurrentCourse(data.navigation, course) : data.navigation;

      navigationIndex += 1;
      breadcrumbs = [...breadcrumbs, ...breadcrumbsFor(current)];
    }

    if (match.staticData.hideNavigation) {
      hideNavigation = true;
    }
  }

  return { breadcrumbs, courses, hideNavigation };
}
