import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ActionIcon, Loader, Tooltip } from "@mantine/core";
import {
  ArrowClockwiseIcon,
  ClockCounterClockwiseIcon,
  GearSixIcon,
  ListChecksIcon,
  UsersIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import type { CourseBranchState, NavigationCourse, NavigationLink } from "./navigation-types";
import "./sidebar.css";

const icons = {
  tasks: ListChecksIcon,
  attempts: ClockCounterClockwiseIcon,
  members: UsersIcon,
  settings: GearSixIcon,
};

function NavigationItem({ link, path }: { link: NavigationLink; path: string }) {
  const Icon = link.icon ? icons[link.icon] : undefined;
  const active = path === link.href;

  return (
    <Link
      activeOptions={{ exact: true }}
      to={link.href}
      className={`mm-nav-item${active ? " active" : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {Icon && <Icon size={18} aria-hidden="true" />}
      <span>{link.label}</span>
    </Link>
  );
}

export function CourseBranch({
  course,
  heading,
  state,
  path,
}: {
  course: NavigationCourse;
  heading: ReactNode;
  state: CourseBranchState;
  path: string;
}) {
  return (
    <div className="mm-course-content">
      <div className="mm-course-sticky-header">
        {heading}
        {state.status !== "error" && (
          <div className="mm-course-overview mm-nested">
            <NavigationItem
              path={path}
              link={{ href: course.href, label: "Все задания", icon: "tasks" }}
            />
            {state.status === "ready" && state.refreshing && (
              <Loader className="mm-tree-refresh" size={12} aria-label="Обновление раздела" />
            )}
          </div>
        )}
      </div>
      <div className="mm-nested">
        {state.status === "pending" && (
          <div className="mm-tree-loading" role="status">
            <Loader size={14} />
            Загрузка раздела…
          </div>
        )}
        {state.status === "error" && (
          <div className="mm-tree-error" role="alert">
            <WarningCircleIcon className="mm-tree-error-icon" size={16} aria-hidden="true" />
            <span>Не удалось загрузить раздел</span>
            <Tooltip label="Повторить загрузку">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                aria-label="Повторить загрузку раздела"
                onClick={state.retry}
              >
                <ArrowClockwiseIcon size={16} aria-hidden="true" />
              </ActionIcon>
            </Tooltip>
          </div>
        )}
        {state.status === "ready" && (
          <>
            <div className="mm-task-links" aria-label="Задания курса">
              {state.tasks.map((link) => (
                <NavigationItem key={link.href} path={path} link={link} />
              ))}
            </div>
            <div className="mm-course-actions" aria-label="Разделы курса">
              {state.sections.map((link) => (
                <NavigationItem key={link.href} path={path} link={link} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
