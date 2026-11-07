import type { Breadcrumb, NavigationCourse, NavigationTask } from "../../platform/ui.ts";

export function courseBreadcrumbs(course: NavigationCourse): Breadcrumb[] {
  return [{ label: course.name, to: `/courses/${course.id}` }];
}

export function courseSectionBreadcrumbs(
  course: NavigationCourse,
  section: "attempts" | "members" | "settings",
): Breadcrumb[] {
  const labels = {
    attempts: "Попытки",
    members: "Участники",
    settings: "Настройки курса",
  };

  return [
    ...courseBreadcrumbs(course),
    { label: labels[section], to: `/courses/${course.id}/${section}` },
  ];
}

export function taskBreadcrumbs(course: NavigationCourse, task: NavigationTask): Breadcrumb[] {
  return [
    ...courseBreadcrumbs(course),
    { label: task.name, to: `/courses/${course.id}/tasks/${task.id}` },
  ];
}

export function attemptBreadcrumbs(
  course: NavigationCourse,
  task: NavigationTask,
  attemptId: bigint,
): Breadcrumb[] {
  return [
    ...taskBreadcrumbs(course, task),
    {
      label: `Попытка #${attemptId}`,
      to: `/courses/${course.id}/attempts/${attemptId}`,
    },
  ];
}
