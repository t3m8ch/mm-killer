import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button, Drawer, Loader, Menu, Tooltip, useMantineColorScheme } from "@mantine/core";
import { useMediaQuery, useMounted } from "@mantine/hooks";
import {
  BooksIcon,
  CaretDownIcon,
  CaretRightIcon,
  CheckIcon,
  ClockCounterClockwiseIcon,
  DesktopIcon,
  GearSixIcon,
  ListChecksIcon,
  MoonIcon,
  SidebarSimpleIcon,
  SignOutIcon,
  SunIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import type {
  Breadcrumb,
  CourseBranchState,
  NavigationCourse,
  NavigationLink,
} from "./contract.shared.ts";
import "./styles.css";

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
        <div className="mm-course-overview mm-nested">
          <NavigationItem
            path={path}
            link={{ href: course.href, label: "Все задания", icon: "tasks" }}
          />
          {state.status === "ready" && state.refreshing && (
            <Loader className="mm-tree-refresh" size={12} aria-label="Обновление раздела" />
          )}
        </div>
      </div>
      <div className="mm-nested">
        {state.status === "pending" && (
          <div className="mm-tree-loading" role="status">
            <Loader size={14} />
            Загрузка раздела…
          </div>
        )}
        {state.status === "error" && (
          <div role="alert">
            <p>Не удалось загрузить раздел</p>
            <Button variant="subtle" onClick={state.retry}>
              Повторить
            </Button>
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

export interface AppLayoutProps {
  children: ReactNode;
  path: string;
  breadcrumbs: readonly Breadcrumb[];
  mode?: "normal" | "diff";
  pending?: boolean;
  courses: readonly NavigationCourse[];
  currentCourseId?: string;
  renderCourseBranch: (course: NavigationCourse, heading: ReactNode) => ReactNode;
  user?: {
    name: string;
    onLogout: () => void;
    busy: boolean;
    settingsHref?: string;
  };
}

function Sidebar({
  path,
  courses,
  currentCourseId,
  renderCourseBranch,
  user,
  drawer = false,
}: AppLayoutProps & { drawer?: boolean }) {
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

function ThemeMenu() {
  const ready = useMounted();
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const options = [
    { value: "light", label: "Светлая", icon: SunIcon },
    { value: "dark", label: "Тёмная", icon: MoonIcon },
    { value: "auto", label: "Системная", icon: DesktopIcon },
  ] as const;

  return (
    <Menu position="bottom-end">
      <Menu.Target>
        <Tooltip label="Тема оформления">
          <button disabled={!ready} className="mm-theme-button" aria-label="Тема оформления">
            <SunIcon size={18} />
          </button>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        {options.map(({ value, label, icon: Icon }) => (
          <Menu.Item
            key={value}
            leftSection={<Icon size={18} />}
            rightSection={colorScheme === value ? <CheckIcon size={14} /> : undefined}
            onClick={() => setColorScheme(value)}
          >
            {label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

export function AppLayout(props: AppLayoutProps) {
  const { path, mode = "normal", breadcrumbs, children, pending } = props;
  const ready = useMounted();
  const mobile = useMediaQuery("(max-width: 720px)");
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [previousPath, setPreviousPath] = useState(path);

  if (previousPath !== path) {
    setPreviousPath(path);
    setDrawer(false);
    setCollapsed(false);
  }

  return (
    <div className="mm-root">
      <div className={`mm-shell${mode === "diff" || collapsed ? " mm-hidden" : ""}`}>
        <aside className="mm-permanent" aria-label="Основная навигация">
          <Sidebar {...props} />
        </aside>
        <div className="mm-work">
          <header className="mm-header">
            <button
              className="mm-panel-toggle"
              disabled={!ready}
              aria-label="Переключить навигацию"
              aria-expanded={drawer || (!collapsed && mode !== "diff" && !mobile)}
              onClick={() =>
                mobile || mode === "diff" ? setDrawer(true) : setCollapsed((value) => !value)
              }
            >
              <SidebarSimpleIcon size={20} />
            </button>
            <nav className="mm-breadcrumbs" aria-label="Хлебные крошки">
              <ol>
                {breadcrumbs.map((crumb, index) => (
                  <li key={crumb.href}>
                    {index > 0 && <CaretRightIcon size={12} aria-hidden="true" />}
                    {index === breadcrumbs.length - 1 ? (
                      <span aria-current="page" title={crumb.label}>
                        {crumb.label}
                      </span>
                    ) : (
                      <Link activeOptions={{ exact: true }} to={crumb.href} title={crumb.label}>
                        {crumb.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
            {pending && <Loader size={14} aria-label="Загрузка страницы" />}
            <ThemeMenu />
          </header>
          <main className={mode === "diff" ? "mm-diff-page" : "mm-page"} aria-busy={pending}>
            {children}
          </main>
        </div>
      </div>
      <Drawer
        opened={drawer}
        onClose={() => setDrawer(false)}
        size={300}
        title={
          <Link
            activeOptions={{ exact: true }}
            to="/"
            className="mm-drawer-brand"
            onClick={() => setDrawer(false)}
          >
            MergeMinds
          </Link>
        }
        classNames={{
          content: "mm-drawer-surface",
          body: "mm-drawer-body",
          header: "mm-drawer-header",
        }}
      >
        <div
          className="mm-drawer-content"
          onClickCapture={(event) => {
            // Переход выполняет Link; здесь только закрытие панели, в том числе для текущей страницы.
            if (
              event.button === 0 &&
              !event.metaKey &&
              !event.ctrlKey &&
              !event.shiftKey &&
              !event.altKey &&
              event.target instanceof Element &&
              event.target.closest("a[href]")
            ) {
              setDrawer(false);
            }
          }}
        >
          <Sidebar {...props} drawer />
        </div>
      </Drawer>
    </div>
  );
}
