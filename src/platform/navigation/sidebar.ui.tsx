import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "@mantine/core";
import { useMounted } from "@mantine/hooks";
import {
  BooksIcon,
  CaretDownIcon,
  CaretRightIcon,
  GearSixIcon,
  SignOutIcon,
} from "@phosphor-icons/react";
import type { NavigationCourse } from "./contract.shared.ts";
import "./styles.css";

export interface SidebarProps {
  path: string;
  courses: readonly NavigationCourse[];
  currentCourseId?: string;
  renderCourseBranch: (course: NavigationCourse, heading: ReactNode) => ReactNode;
  user?: {
    name: string;
    onLogout: () => void;
    busy: boolean;
    settingsHref?: string;
  };
  drawer?: boolean;
}

export function Sidebar({
  path,
  courses,
  currentCourseId,
  renderCourseBranch,
  user,
  drawer = false,
}: SidebarProps) {
  const ready = useMounted();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [previousLocation, setPreviousLocation] = useState({ path, currentCourseId });

  if (previousLocation.path !== path || previousLocation.currentCourseId !== currentCourseId) {
    setPreviousLocation({ path, currentCourseId });
    if (currentCourseId) {
      setExpanded((old) => ({ ...old, [currentCourseId]: true }));
    }
  }

  return (
    <div className="mm-sidebar">
      {!drawer && (
        <Link activeOptions={{ exact: true }} to="/" className="mm-brand">
          <strong>MergeMinds</strong>
        </Link>
      )}
      <Link
        activeOptions={{ exact: true }}
        to="/"
        className={`mm-nav-item${path === "/" ? " active" : ""}`}
        aria-current={path === "/" ? "page" : undefined}
      >
        <BooksIcon size={18} />
        Мои курсы
      </Link>
      <div className="mm-sidebar-scroll">
        <p className="mm-group-label">Курсы</p>
        {courses.map((course) => {
          const open = expanded[course.id] ?? currentCourseId === course.id;
          const id = `course-${course.id}-${drawer ? "drawer" : "page"}`;
          const heading = (
            <div className="mm-course-heading">
              <button
                className="mm-course-toggle"
                disabled={!ready}
                aria-label={`${open ? "Свернуть" : "Раскрыть"} курс: ${course.label}`}
                aria-expanded={open}
                aria-controls={id}
                onClick={() => setExpanded((old) => ({ ...old, [course.id]: !open }))}
              >
                {open ? <CaretDownIcon size={14} /> : <CaretRightIcon size={14} />}
              </button>
              <Link
                activeOptions={{ exact: true }}
                to={course.href}
                className={`mm-course-name${currentCourseId === course.id ? " selected" : ""}`}
              >
                <span className="mm-course-emoji" aria-hidden="true">
                  {course.emoji}
                </span>
                <span>{course.label}</span>
              </Link>
            </div>
          );

          return (
            <div className="mm-course-group" key={course.id} id={id}>
              {open ? renderCourseBranch(course, heading) : heading}
            </div>
          );
        })}
      </div>
      {user && (
        <div className="mm-account">
          <Menu position="top-start" width="target" offset={8}>
            <Menu.Target>
              <button
                disabled={!ready}
                className="mm-user"
                aria-label={`Меню аккаунта: ${user.name}`}
              >
                <span className="mm-avatar" aria-hidden="true">
                  {user.name
                    .split(" ")
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <span className="mm-user-name">{user.name}</span>
                <CaretDownIcon size={16} className="mm-user-caret" />
              </button>
            </Menu.Target>
            <Menu.Dropdown>
              {user.settingsHref && (
                <Menu.Item
                  component={Link}
                  activeOptions={{ exact: true }}
                  to={user.settingsHref}
                  leftSection={<GearSixIcon size={18} />}
                >
                  Личные настройки
                </Menu.Item>
              )}
              <Menu.Item
                onClick={user.onLogout}
                disabled={user.busy}
                leftSection={<SignOutIcon size={18} />}
              >
                Выйти
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      )}
    </div>
  );
}
