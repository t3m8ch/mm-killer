import {
  createContext,
  createElement,
  useContext,
  useState,
  type ComponentPropsWithRef,
  type ComponentType,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useMounted } from "@mantine/hooks";
import {
  ActionIcon,
  AppShell,
  Avatar,
  Box,
  Breadcrumbs,
  Burger,
  Drawer,
  Group,
  Loader,
  Menu,
  NavLink,
  ScrollArea,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import {
  BooksIcon,
  CaretDownIcon,
  CaretRightIcon,
  CheckIcon,
  ClockCounterClockwiseIcon,
  GearSixIcon,
  ListChecksIcon,
  MonitorIcon,
  MoonIcon,
  SignOutIcon,
  SunIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import type { Breadcrumb, NavigationCourse, NavigationUser } from "./navigation.ts";
import "./app-layout.css";

type LinkComponent = ComponentType<ComponentPropsWithRef<"a"> & { to: string }>;

const LinkContext = createContext<LinkComponent | null>(null);

function NavigationAnchor({ to, ...props }: ComponentPropsWithRef<"a"> & { to: string }) {
  const Component = useContext(LinkContext);

  if (!Component) {
    throw new Error("AppLayout requires linkComponent");
  }

  return createElement(Component, { ...props, to });
}

interface AppLayoutProps {
  breadcrumbs: Breadcrumb[];
  courses: NavigationCourse[];
  hideNavigation: boolean;
  linkComponent: LinkComponent;
  loadCourse: (courseId: bigint) => Promise<NavigationCourse>;
  logout: () => void;
  logoutPending: boolean;
  pathname: string;
  user: NavigationUser;
  children: ReactNode;
}

interface SidebarProps {
  courses: NavigationCourse[];
  loadCourse: AppLayoutProps["loadCourse"];
  pathname: string;
  user: NavigationUser;
  logout: () => void;
  logoutPending: boolean;
  drawer?: boolean;
  onNavigate?: () => void;
}

function NavigationLink({
  to,
  label,
  icon,
  active,
  onClick,
}: {
  to: string;
  label: string;
  icon?: ReactNode;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <NavLink
      component={NavigationAnchor}
      to={to}
      label={label}
      leftSection={icon}
      active={active}
      onClick={onClick}
      className="app-nav-link"
    />
  );
}

function CourseBranch({
  course,
  loadCourse,
  pathname,
  expanded,
  onToggle,
  onNavigate,
  placement,
}: {
  course: NavigationCourse;
  loadCourse: AppLayoutProps["loadCourse"];
  pathname: string;
  expanded: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  placement: string;
}) {
  const mounted = useMounted();
  const query = useQuery({
    queryKey: ["navigation", "course", course.id.toString()],
    queryFn: () => loadCourse(course.id),
    enabled: expanded && mounted,
    staleTime: 30_000,
    gcTime: 300_000,
  });
  const data = mounted ? query.data : undefined;
  const base = `/courses/${course.id}`;
  const selected = pathname.startsWith(`${base}/`) || pathname === base;
  const childrenId = `course-${course.id}-${placement}`;

  const heading = (
    <Group className="app-course-heading" gap={0} wrap="nowrap">
      <ActionIcon
        variant="subtle"
        aria-label={`${expanded ? "Свернуть" : "Раскрыть"} курс: ${course.name}`}
        aria-expanded={expanded}
        aria-controls={childrenId}
        onClick={onToggle}
      >
        {expanded ? <CaretDownIcon size={14} /> : <CaretRightIcon size={14} />}
      </ActionIcon>
      <NavigationAnchor
        to={base}
        className="app-course-name"
        data-selected={selected}
        onClick={onNavigate}
      >
        <span className="app-course-emoji" aria-hidden="true">
          {course.emoji}
        </span>
        <span>{course.name}</span>
      </NavigationAnchor>
    </Group>
  );

  if (!expanded) {
    return (
      <Box className="app-course-group">
        {heading}
        <div id={childrenId} hidden />
      </Box>
    );
  }

  return (
    <Box className="app-course-group">
      <Box className="app-course-sticky-header">
        {heading}
        {data && (
          <Box className="app-course-overview">
            <NavigationLink
              to={base}
              label="Все задания"
              icon={<ListChecksIcon size={18} />}
              active={pathname === base}
              onClick={onNavigate}
            />
            {query.isFetching && <Loader size={12} aria-label="Обновление раздела" />}
          </Box>
        )}
      </Box>
      <Box id={childrenId} className="app-course-children">
        {data ? (
          <>
            <Box className="app-task-links" aria-label="Задания курса">
              {data.tasks.map((task) => (
                <NavigationLink
                  key={task.id}
                  to={`${base}/tasks/${task.id}`}
                  label={task.name}
                  active={pathname === `${base}/tasks/${task.id}`}
                  onClick={onNavigate}
                />
              ))}
            </Box>
            <Box className="app-course-actions" aria-label="Разделы курса">
              <NavigationLink
                to={`${base}/attempts`}
                label="Попытки"
                icon={<ClockCounterClockwiseIcon size={18} />}
                active={pathname.startsWith(`${base}/attempts`)}
                onClick={onNavigate}
              />
              <NavigationLink
                to={`${base}/members`}
                label="Участники"
                icon={<UsersIcon size={18} />}
                active={pathname === `${base}/members`}
                onClick={onNavigate}
              />
              {data.canManage && (
                <NavigationLink
                  to={`${base}/settings`}
                  label="Настройки курса"
                  icon={<GearSixIcon size={18} />}
                  active={pathname === `${base}/settings`}
                  onClick={onNavigate}
                />
              )}
            </Box>
          </>
        ) : (
          <Group className="app-tree-loading" gap={8} role="status">
            <Loader size={14} />
            <span>Загрузка раздела…</span>
          </Group>
        )}
      </Box>
    </Box>
  );
}

function Sidebar({
  courses,
  loadCourse,
  pathname,
  user,
  logout,
  logoutPending,
  drawer,
  onNavigate,
}: SidebarProps) {
  const courseId = pathname.match(/^\/courses\/(\d+)/)?.[1];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [previousPath, setPreviousPath] = useState(pathname);

  if (previousPath !== pathname) {
    setPreviousPath(pathname);

    if (courseId) {
      setExpanded((old) => ({ ...old, [courseId]: true }));
    }
  }

  return (
    <Box className="app-sidebar" data-drawer={drawer}>
      {!drawer && (
        <NavigationAnchor to="/" className="app-brand">
          MergeMinds
        </NavigationAnchor>
      )}
      <NavigationLink
        to="/"
        label="Мои курсы"
        icon={<BooksIcon size={18} />}
        active={pathname === "/"}
        onClick={onNavigate}
      />
      <ScrollArea className="app-sidebar-scroll" type="auto">
        <Text className="app-group-label">Курсы</Text>
        {courses.map((course) => {
          const id = course.id.toString();
          const isExpanded = expanded[id] ?? id === courseId;

          return (
            <CourseBranch
              key={id}
              course={course}
              loadCourse={loadCourse}
              pathname={pathname}
              expanded={isExpanded}
              onToggle={() => setExpanded((old) => ({ ...old, [id]: !isExpanded }))}
              onNavigate={onNavigate}
              placement={drawer ? "drawer" : "page"}
            />
          );
        })}
      </ScrollArea>
      <Box className="app-account">
        <Menu position="top-start" width="target" offset={8}>
          <Menu.Target>
            <button className="app-user" aria-label={`Меню аккаунта: ${user.fullName}`}>
              <Avatar size={30} radius="xl" color="teal" aria-hidden="true">
                {user.fullName
                  .split(" ")
                  .map((part) => part[0])
                  .join("")}
              </Avatar>
              <span className="app-user-name">{user.fullName}</span>
              <CaretDownIcon size={16} aria-hidden="true" />
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              component={NavigationAnchor}
              to="/settings"
              leftSection={<GearSixIcon size={18} />}
              onClick={onNavigate}
            >
              Личные настройки
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              leftSection={<SignOutIcon size={18} />}
              disabled={logoutPending}
              onClick={logout}
            >
              Выйти
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Box>
    </Box>
  );
}

function ThemeMenu() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const options = [
    { value: "light", label: "Светлая", icon: SunIcon },
    { value: "dark", label: "Тёмная", icon: MoonIcon },
    { value: "auto", label: "Системная", icon: MonitorIcon },
  ] as const;

  return (
    <Menu position="bottom-end" width={190}>
      <Menu.Target>
        <ActionIcon variant="subtle" size="lg" aria-label="Тема оформления" title="Тема оформления">
          <SunIcon size={20} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Тема оформления</Menu.Label>
        {options.map(({ value, label, icon: OptionIcon }) => (
          <Menu.Item
            key={value}
            leftSection={<OptionIcon size={18} />}
            rightSection={
              colorScheme === value ? <CheckIcon size={16} aria-label="Выбрано" /> : null
            }
            aria-current={colorScheme === value ? "true" : undefined}
            onClick={() => setColorScheme(value)}
          >
            {label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}

function navigationToggleLabel(hideNavigation: boolean, collapsed: boolean) {
  if (hideNavigation) {
    return "Открыть навигацию";
  }

  return collapsed ? "Показать навигацию" : "Скрыть навигацию";
}

export function AppLayout(props: AppLayoutProps) {
  const mounted = useMounted();
  const {
    breadcrumbs,
    courses,
    hideNavigation,
    loadCourse,
    logout,
    logoutPending,
    pathname,
    user,
    children,
  } = props;
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [previousPath, setPreviousPath] = useState(pathname);

  if (previousPath !== pathname) {
    setPreviousPath(pathname);
    setDrawer(false);
    setCollapsed(false);
  }

  const sidebar = (inDrawer = false) => (
    <Sidebar
      courses={courses}
      loadCourse={loadCourse}
      pathname={pathname}
      user={user}
      logout={logout}
      logoutPending={logoutPending}
      drawer={inDrawer}
      onNavigate={inDrawer ? () => setDrawer(false) : undefined}
    />
  );

  const navigationLabel = navigationToggleLabel(hideNavigation, collapsed);

  return (
    <LinkContext.Provider value={props.linkComponent}>
      <AppShell
        className="app-shell"
        data-ready={mounted}
        data-hide-navigation={hideNavigation}
        header={{ height: 60 }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { desktop: hideNavigation || collapsed, mobile: true },
        }}
        padding={0}
      >
        <AppShell.Header className="app-header">
          <Group h="100%" px="md" gap="sm" wrap="nowrap">
            <Burger
              className="app-mobile-toggle"
              opened={drawer}
              onClick={() => setDrawer(true)}
              aria-label="Открыть мобильную навигацию"
              size="sm"
            />
            <ActionIcon
              className="app-desktop-toggle"
              variant="subtle"
              aria-label={navigationLabel}
              aria-expanded={hideNavigation ? drawer : !collapsed}
              onClick={() => (hideNavigation ? setDrawer(true) : setCollapsed((value) => !value))}
            >
              <ListChecksIcon size={20} />
            </ActionIcon>
            <Breadcrumbs
              className="app-breadcrumbs"
              separator={<CaretRightIcon size={12} />}
              aria-label="Хлебные крошки"
            >
              {breadcrumbs.map((item, index) =>
                index === breadcrumbs.length - 1 ? (
                  <Text key={item.to} aria-current="page" title={item.label} span>
                    {item.label}
                  </Text>
                ) : (
                  <NavigationAnchor key={item.to} to={item.to}>
                    {item.label}
                  </NavigationAnchor>
                ),
              )}
            </Breadcrumbs>
            <ThemeMenu />
          </Group>
        </AppShell.Header>
        {!hideNavigation && !collapsed && <AppShell.Navbar>{sidebar()}</AppShell.Navbar>}
        <AppShell.Main className="app-main">{children}</AppShell.Main>
        <Drawer
          opened={drawer}
          onClose={() => setDrawer(false)}
          title={
            <NavigationAnchor to="/" className="app-brand" onClick={() => setDrawer(false)}>
              MergeMinds
            </NavigationAnchor>
          }
          closeButtonProps={{ "aria-label": "Закрыть меню" }}
          size={332}
          position="left"
          classNames={{ content: "app-drawer-surface", body: "app-drawer-body" }}
        >
          {sidebar(true)}
        </Drawer>
      </AppShell>
    </LinkContext.Provider>
  );
}
