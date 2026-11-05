// THROWAWAY: три структуры навигации на /prototype/$; ?variant=A|B|C.
// Вопрос: как перемещаться между курсами и проверкой, сохраняя контекст?
import { useEffect, useState, type ReactNode, type ComponentPropsWithRef } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import {
  BooksIcon,
  ListChecksIcon,
  ClockCounterClockwiseIcon,
  UsersIcon,
  GearSixIcon,
  SignOutIcon,
  CaretDownIcon,
  CaretRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ListIcon,
  SidebarSimpleIcon,
  FileCodeIcon,
  ArrowClockwiseIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
  CheckIcon,
  type Icon,
} from "@phosphor-icons/react";
import {
  prototypePageQuery,
  prototypeStaleTime,
  prototypeCourseTreeQuery,
  prototypeTasks,
} from "./page-query";
import { useMounted } from "@mantine/hooks";
import {
  Link,
  useNavigate,
  useParams,
  useSearch,
  useRouterState,
  useLoaderData,
} from "@tanstack/react-router";
import {
  Button,
  Drawer,
  Menu,
  Select,
  TextInput,
  Textarea,
  Badge,
  Loader,
  useMantineColorScheme,
  useComputedColorScheme,
} from "@mantine/core";
import "./navigation-prototype.css";

const courses = [
  {
    id: "1",
    emoji: "🧩",
    name: "Алгоритмы и структуры данных",
    short: "А",
    teacher: "Алексей Смирнов",
    term: "Осень 2026",
  },
  {
    id: "2",
    emoji: "🐍",
    name: "Практикум по программированию на Python и разработке приложений",
    short: "П",
    teacher: "Мария Волкова",
    term: "Осень 2026",
  },
  {
    id: "3",
    emoji: "🗄️",
    name: "Базы данных",
    short: "Б",
    teacher: "Алексей Смирнов",
    term: "Весна 2027",
  },
  {
    id: "4",
    emoji: "♟️",
    name: "Дискретная математика",
    short: "Д",
    teacher: "Мария Волкова",
    term: "Осень 2026",
  },
  {
    id: "5",
    emoji: "⚙️",
    name: "Операционные системы",
    short: "О",
    teacher: "Алексей Смирнов",
    term: "Осень 2026",
  },
  {
    id: "6",
    emoji: "🌐",
    name: "Компьютерные сети",
    short: "С",
    teacher: "Мария Волкова",
    term: "Весна 2027",
  },
  {
    id: "7",
    emoji: "📈",
    name: "Математический анализ",
    short: "М",
    teacher: "Алексей Смирнов",
    term: "Осень 2026",
  },
  {
    id: "8",
    emoji: "📐",
    name: "Линейная алгебра и аналитическая геометрия",
    short: "Л",
    teacher: "Мария Волкова",
    term: "Осень 2026",
  },
  {
    id: "9",
    emoji: "🎲",
    name: "Теория вероятностей и математическая статистика",
    short: "Т",
    teacher: "Алексей Смирнов",
    term: "Весна 2027",
  },
  {
    id: "10",
    emoji: "💻",
    name: "Архитектура компьютера",
    short: "А",
    teacher: "Мария Волкова",
    term: "Осень 2026",
  },
  {
    id: "11",
    emoji: "🧠",
    name: "Функциональное программирование",
    short: "Ф",
    teacher: "Алексей Смирнов",
    term: "Весна 2027",
  },
  {
    id: "12",
    emoji: "🌍",
    name: "Разработка веб-приложений",
    short: "В",
    teacher: "Мария Волкова",
    term: "Весна 2027",
  },
  {
    id: "13",
    emoji: "🧪",
    name: "Тестирование и обеспечение качества программного обеспечения",
    short: "Т",
    teacher: "Алексей Смирнов",
    term: "Весна 2027",
  },
  {
    id: "14",
    emoji: "🤖",
    name: "Основы машинного обучения",
    short: "М",
    teacher: "Мария Волкова",
    term: "Весна 2027",
  },
  {
    id: "15",
    emoji: "🚀",
    name: "Командный проект: разработка и сопровождение программного продукта",
    short: "К",
    teacher: "Алексей Смирнов",
    term: "Весна 2027",
  },
];
const variants = ["A", "B", "C"];
const names: Record<string, string> = {
  A: "Единое дерево",
  B: "Курсы + разделы",
  C: "Рабочее пространство",
};

const themeOptions = [
  { value: "light", label: "Светлая", icon: SunIcon },
  { value: "dark", label: "Тёмная", icon: MoonIcon },
  { value: "auto", label: "Системная", icon: MonitorIcon },
] as const;

type NavProps = { path: string; ariaLabel?: string } & Omit<ComponentPropsWithRef<"a">, "href">;

function Nav({ path, children, className, ariaLabel, onClick, ...anchorProps }: NavProps) {
  return (
    <Link
      {...anchorProps}
      to="/prototype/$"
      activeOptions={{ exact: true }}
      preload={false}
      params={{ _splat: path.replace(/^\//, "") }}
      search={(old) => ({
        variant: old.variant ?? "A",
        role: old.role ?? "teacher",
        status: old.status ?? "all",
      })}
      className={className}
      aria-label={ariaLabel ?? anchorProps["aria-label"]}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function NavItem({
  path,
  label,
  icon: ItemIcon,
  active,
}: {
  path: string;
  label: string;
  icon?: Icon;
  active: boolean;
}) {
  return (
    <Nav path={path} className={`np-nav-item ${active ? "active" : ""}`}>
      {ItemIcon && (
        <span aria-hidden="true" className="np-icon">
          <ItemIcon size={18} weight="regular" />
        </span>
      )}
      <span>{label}</span>
    </Nav>
  );
}

function CourseNavigation({
  courseId,
  path,
  teacher,
  withTasks = false,
  loadedTasks = [],
  hideOverview = false,
}: {
  courseId: string;
  path: string;
  teacher: boolean;
  withTasks?: boolean;
  loadedTasks?: { id: string; name: string }[];
  hideOverview?: boolean;
}) {
  const base = `/courses/${courseId}`;

  return (
    <>
      {!hideOverview && (
        <NavItem
          path={base}
          label={withTasks ? "Все задания" : "Задания"}
          icon={ListChecksIcon}
          active={path === base || (!withTasks && path.startsWith(`${base}/tasks/`))}
        />
      )}
      {withTasks && (
        <div className="np-task-links" aria-label="Задания курса">
          {loadedTasks.map(({ id, name }) => (
            <NavItem
              key={id}
              path={`${base}/tasks/${id}`}
              label={name}
              active={path === `${base}/tasks/${id}`}
            />
          ))}
        </div>
      )}
      <div className={withTasks ? "np-course-actions" : undefined} aria-label="Разделы курса">
        <NavItem
          path={`${base}/attempts`}
          label={teacher ? "Попытки" : "Мои попытки"}
          icon={ClockCounterClockwiseIcon}
          active={path.startsWith(`${base}/attempts`)}
        />
        <NavItem
          path={`${base}/members`}
          label="Участники"
          icon={UsersIcon}
          active={path === `${base}/members`}
        />
        {teacher && (
          <NavItem
            path={`${base}/settings`}
            label="Настройки курса"
            icon={GearSixIcon}
            active={path === `${base}/settings`}
          />
        )}
      </div>
    </>
  );
}

function CourseTreeContent({
  courseId,
  path,
  teacher,
  heading,
  childrenId,
}: {
  courseId: string;
  path: string;
  teacher: boolean;
  heading: ReactNode;
  childrenId: string;
}) {
  const mounted = useMounted();
  const query = useQuery({ ...prototypeCourseTreeQuery(courseId, teacher), enabled: mounted });

  return (
    <div className="np-course-content" data-fetching={query.isFetching}>
      <div className="np-course-sticky-header">
        {heading}
        {query.data && (
          <div className="np-course-overview np-nested">
            <NavItem
              path={`/courses/${courseId}`}
              label="Все задания"
              icon={ListChecksIcon}
              active={path === `/courses/${courseId}`}
            />
            {query.isFetching && (
              <span className="np-tree-refresh" role="status" title="Обновление раздела">
                <Loader size={12} aria-hidden="true" />
                <span className="np-sr-only">Обновление раздела</span>
              </span>
            )}
          </div>
        )}
      </div>
      <div id={childrenId} className="np-nested">
        {query.data ? (
          <CourseNavigation
            courseId={courseId}
            path={path}
            teacher={teacher}
            withTasks
            hideOverview
            loadedTasks={query.data.tasks}
          />
        ) : (
          <div className="np-tree-loading" role="status" aria-busy="true">
            <Loader size={14} />
            Загрузка раздела…
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({
  variant,
  path,
  courseId,
  teacher,
  placement = "page",
  onNavigate,
}: {
  placement?: string;
  onNavigate?: () => void;
  variant: string;
  path: string;
  courseId: string;
  teacher: boolean;
}) {
  const base = `/courses/${courseId}`;
  const tasks = prototypeTasks(courseId);
  const course = courses.find((item) => item.id === courseId) ?? courses[0];
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [previousPath, setPreviousPath] = useState(path);

  if (previousPath !== path) {
    setPreviousPath(path);
    if (path.startsWith("/courses/")) {
      setExpanded((old) => ({ ...old, [courseId]: true }));
    }
  }

  const links = <CourseNavigation courseId={courseId} path={path} teacher={teacher} />;

  return (
    <div className={`np-sidebar np-sidebar-${variant}`}>
      <Nav path="/" className="np-brand">
        <span className="np-logo">m</span>
        <strong>MergeMinds</strong>
      </Nav>
      {variant !== "B" && (
        <NavItem path="/" label="Мои курсы" icon={BooksIcon} active={path === "/"} />
      )}
      {variant === "C" && (
        <Menu width={270} position="bottom-start">
          <Menu.Target>
            <button className="np-course-select">
              {course.name}
              <CaretDownIcon size={14} aria-hidden="true" />
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            {courses.map((item) => (
              <Menu.Item key={item.id} component={Nav} path={`/courses/${item.id}`}>
                {item.name}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      )}
      <div className="np-sidebar-scroll">
        {variant === "A" ? (
          <>
            <p className="np-group-label">Курсы</p>
            {courses.map((item) => {
              const isExpanded =
                expanded[item.id] ?? (courseId === item.id && path.startsWith("/courses/"));
              const childrenId = `prototype-course-${item.id}-${placement}`;

              const heading = (
                <div className="np-course-heading">
                  <button
                    className="np-course-toggle"
                    aria-label={`${isExpanded ? "Свернуть" : "Раскрыть"} курс: ${item.name}`}
                    aria-expanded={isExpanded}
                    aria-controls={childrenId}
                    onClick={() => setExpanded((old) => ({ ...old, [item.id]: !isExpanded }))}
                  >
                    <span aria-hidden="true">
                      {isExpanded ? <CaretDownIcon size={14} /> : <CaretRightIcon size={14} />}
                    </span>
                  </button>
                  <Nav
                    path={`/courses/${item.id}`}
                    className={`np-course-name ${courseId === item.id && path.startsWith("/courses/") ? "selected" : ""}`}
                  >
                    <span className="np-course-emoji" aria-hidden="true">
                      {item.emoji}
                    </span>
                    <span>{item.name}</span>
                  </Nav>
                </div>
              );

              return (
                <div key={item.id} className="np-course-group">
                  {isExpanded ? (
                    <CourseTreeContent
                      courseId={item.id}
                      path={path}
                      teacher={teacher}
                      heading={heading}
                      childrenId={childrenId}
                    />
                  ) : (
                    <>
                      {heading}
                      <div id={childrenId} hidden />
                    </>
                  )}
                </div>
              );
            })}
          </>
        ) : (
          <>
            <p className="np-group-label">{variant === "B" ? course.name : "Курс"}</p>
            {links}
            <p className="np-group-label">Задания</p>
            {tasks.map((name, index) => (
              <NavItem
                key={name}
                path={`${base}/tasks/${index + 1}`}
                label={name}
                active={path === `${base}/tasks/${index + 1}`}
              />
            ))}
          </>
        )}
      </div>
      <div className="np-account">
        <Menu position="top-start" width="target" offset={8}>
          <Menu.Target>
            <button className="np-user" aria-label="Меню аккаунта: Алексей Смирнов">
              <span className="np-avatar" aria-hidden="true">
                АС
              </span>
              <span className="np-user-name">Алексей Смирнов</span>
              <CaretDownIcon className="np-user-caret" size={16} aria-hidden="true" />
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item
              component={Nav}
              path="/settings"
              onClick={onNavigate}
              leftSection={<GearSixIcon size={18} aria-hidden="true" />}
            >
              Личные настройки
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              component={Nav}
              path="/login"
              onClick={onNavigate}
              leftSection={<SignOutIcon size={18} aria-hidden="true" />}
            >
              Выйти
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </div>
    </div>
  );
}

function Breadcrumbs({
  path,
  courseId,
  variant,
  courseName,
}: {
  path: string;
  courseId: string;
  variant: string;
  courseName: string;
}) {
  const base = `/courses/${courseId}`;
  const tasks = prototypeTasks(courseId);
  const taskId = Number(path.split("/tasks/")[1] ?? 1);

  const diff = /\/attempts\/\d+$/.test(path);
  const parts = [{ name: "Мои курсы", path: "/" }];

  if (path.startsWith("/courses/")) {
    parts.push({ name: courseName, path: base });
    if (path.includes("/tasks/") || diff) {
      parts.push({ name: tasks[taskId - 1] ?? tasks[0], path: `${base}/tasks/${taskId}` });
    }

    if (diff) {
      parts.push({ name: `Попытка #${path.split("/").at(-1)}`, path });
    }

    if (path.endsWith("/attempts")) {
      parts.push({ name: "Попытки", path });
    }

    if (path.endsWith("/members")) {
      parts.push({ name: "Участники", path });
    }

    if (path.endsWith("/settings")) {
      parts.push({ name: "Настройки курса", path });
    }
  } else if (path !== "/") {
    const labels: Record<string, string> = {
      "/settings": "Личные настройки",
      "/login": "Вход",
      "/invites/demo": "Приглашение",
    };

    parts.push({ name: labels[path] ?? "Страница", path });
  }

  return (
    <nav aria-label="Хлебные крошки" className={`np-breadcrumbs np-breadcrumbs-${variant}`}>
      <ol>
        {parts.map((part, i) => (
          <li key={part.path}>
            {i > 0 && (
              <span className="np-separator" aria-hidden="true">
                {variant === "C" ? "/" : <CaretRightIcon size={12} />}
              </span>
            )}
            {i === parts.length - 1 ? (
              <span aria-current="page" title={part.name}>
                {part.name}
              </span>
            ) : (
              <Nav path={part.path}>{part.name}</Nav>
            )}
            {variant === "B" && i === 1 && (
              <Menu>
                <Menu.Target>
                  <button aria-label="Выбрать курс" className="np-crumb-menu">
                    <CaretDownIcon size={12} aria-hidden="true" />
                  </button>
                </Menu.Target>
                <Menu.Dropdown>
                  {courses.map((item) => (
                    <Menu.Item key={item.id} component={Nav} path={`/courses/${item.id}`}>
                      {item.name}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            )}
            {variant === "C" && part.path.includes("/tasks/") && (
              <Menu>
                <Menu.Target>
                  <button aria-label="Выбрать задание" className="np-crumb-menu">
                    <CaretDownIcon size={12} aria-hidden="true" />
                  </button>
                </Menu.Target>
                <Menu.Dropdown>
                  {tasks.map((name, index) => (
                    <Menu.Item key={name} component={Nav} path={`${base}/tasks/${index + 1}`}>
                      {name}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function VariantA({
  sidebar,
  header,
  children,
  hidden,
}: {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  hidden: boolean;
}) {
  return (
    <div className={`np-shell np-a ${hidden ? "np-hidden" : ""}`}>
      <aside className="np-permanent">{sidebar}</aside>
      <section className="np-work">
        {header}
        {children}
      </section>
    </div>
  );
}

function VariantB({
  sidebar,
  header,
  children,
  hidden,
  courseId,
}: {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  hidden: boolean;
  courseId: string;
}) {
  return (
    <div className={`np-shell np-b ${hidden ? "np-hidden" : ""}`}>
      <aside className="np-permanent np-rail">
        <Nav path="/" className="np-rail-logo">
          m
        </Nav>
        <Nav path="/" className="np-rail-item" ariaLabel="Мои курсы">
          <BooksIcon size={20} aria-hidden="true" />
        </Nav>
        {courses.map((course) => (
          <Nav
            key={course.id}
            path={`/courses/${course.id}`}
            className={`np-rail-item ${course.id === courseId ? "active" : ""}`}
          >
            <span title={course.name}>{course.short}</span>
          </Nav>
        ))}
        <Nav path="/settings" className="np-rail-bottom" ariaLabel="Личные настройки">
          <GearSixIcon size={20} aria-hidden="true" />
        </Nav>
      </aside>
      <aside className="np-permanent">{sidebar}</aside>
      <section className="np-work">
        {header}
        {children}
      </section>
    </div>
  );
}

function VariantC({
  sidebar,
  header,
  children,
  hidden,
}: {
  sidebar: ReactNode;
  header: ReactNode;
  children: ReactNode;
  hidden: boolean;
}) {
  return (
    <div className={`np-shell np-c ${hidden ? "np-hidden" : ""}`}>
      <div className="np-c-top">{header}</div>
      <div className="np-c-body">
        <aside className="np-permanent">{sidebar}</aside>
        <section className="np-work">{children}</section>
      </div>
    </div>
  );
}

export function NavigationPrototype() {
  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme("light");
  const mounted = useMounted();

  const loading = useRouterState({ select: (state) => state.isLoading });
  const { data: initialData, fromCache } = useLoaderData({ from: "/prototype/$" });
  const { _splat = "" } = useParams({ from: "/prototype/$" });
  const search = useSearch({ from: "/prototype/$" });
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const refreshCache = useMutation({
    mutationFn: () => queryClient.invalidateQueries({ queryKey: ["navigation-prototype"] }),
  });

  const query = useQuery({
    ...prototypePageQuery(_splat, search),
    initialData,
    initialDataUpdatedAt: initialData.loadedAt,
  });
  const { delayMs } = query.data;
  const refreshing = !loading && query.isFetching;

  const path = `/${_splat}`.replace(/\/$/, "") || "/";
  const courseId = path.split("/")[2] ?? "1";
  const course = courses.find((item) => item.id === courseId) ?? courses[0];

  const [renamed, setRenamed] = useState<Record<string, string>>({});
  const [drawer, setDrawer] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [file, setFile] = useState("search.py");

  const diff = /\/attempts\/\d+$/.test(path);
  const hidden = diff || collapsed;
  const teacher = search.role === "teacher";
  const { variant } = search;
  const changeVariant = (delta: number) => {
    const next = variants[(variants.indexOf(variant) + delta + 3) % 3];

    void navigate({
      to: "/prototype/$",
      params: { _splat },
      search: { ...search, variant: next },
      replace: true,
    });
  };

  const [previousPath, setPreviousPath] = useState(path);

  if (previousPath !== path) {
    setPreviousPath(path);
    setDrawer(false);
    setCollapsed(false);
  }

  useEffect(() => {
    const handle = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLElement &&
        event.target.closest("input, textarea, select, button, [role=menu], [contenteditable]")
      ) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        changeVariant(event.key === "ArrowLeft" ? -1 : 1);
      }
    };

    window.addEventListener("keydown", handle);

    return () => window.removeEventListener("keydown", handle);
  });

  const sidebar = <Sidebar variant={variant} path={path} courseId={courseId} teacher={teacher} />;
  const header = (
    <header className="np-header">
      <button
        className="np-panel-toggle"
        aria-label={hidden ? "Открыть навигацию" : "Скрыть навигацию"}
        onClick={() => (hidden ? setDrawer(true) : setCollapsed(true))}
        title="Навигация"
      >
        <SidebarSimpleIcon size={20} aria-hidden="true" />
      </button>
      <Breadcrumbs
        path={path}
        courseId={courseId}
        variant={variant}
        courseName={renamed[courseId] || course.name}
      />
      {(loading || refreshing) && (
        <span className="np-loading-label" role="status">
          <Loader size={14} />
          {loading ? "Загрузка…" : "Обновление…"}
        </span>
      )}
      <div className="np-header-right">
        {diff && (
          <Badge color="orange" variant="light">
            На проверке
          </Badge>
        )}
        <Menu position="bottom-end" width={190}>
          <Menu.Target>
            <button
              className="np-theme-button"
              aria-label="Тема оформления"
              title="Тема оформления"
            >
              <SunIcon size={20} weight="regular" aria-hidden="true" />
            </button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Тема оформления</Menu.Label>
            {themeOptions.map(({ value, label, icon: OptionIcon }) => (
              <Menu.Item
                key={value}
                leftSection={<OptionIcon size={18} weight="regular" aria-hidden="true" />}
                rightSection={
                  colorScheme === value ? <CheckIcon size={16} aria-label="Выбрано" /> : undefined
                }
                aria-current={colorScheme === value ? "true" : undefined}
                onClick={() => setColorScheme(value)}
              >
                {label}
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>
      </div>
    </header>
  );
  const content = (
    <div className="np-loading-content" aria-busy={loading}>
      <div inert={loading}>
        <PageContent
          path={path}
          courseId={courseId}
          courseName={renamed[courseId] || course.name}
          teacher={teacher}
          file={file}
          setFile={setFile}
          rename={(name) => setRenamed((old) => ({ ...old, [courseId]: name }))}
        />
      </div>
    </div>
  );

  return (
    <div
      className="np-root"
      data-ready={mounted}
      data-loading={loading}
      data-refreshing={refreshing}
    >
      {variant === "A" && (
        <VariantA sidebar={sidebar} header={header} hidden={hidden}>
          {content}
        </VariantA>
      )}
      {variant === "B" && (
        <VariantB sidebar={sidebar} header={header} hidden={hidden} courseId={courseId}>
          {content}
        </VariantB>
      )}
      {variant === "C" && (
        <VariantC sidebar={sidebar} header={header} hidden={hidden}>
          {content}
        </VariantC>
      )}
      <button
        className="np-mobile-toggle"
        aria-label="Открыть мобильную навигацию"
        onClick={() => setDrawer(true)}
      >
        <ListIcon size={20} aria-hidden="true" />
      </button>
      <Drawer
        classNames={{ content: "np-drawer-surface" }}
        opened={drawer}
        onClose={() => setDrawer(false)}
        title="Навигация"
        size={{ A: 332, B: 350, C: 290 }[variant]}
        position="left"
      >
        <div
          className="np-drawer-content"
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest("a")) {
              setDrawer(false);
            }
          }}
        >
          {variant === "B" && (
            <div className="np-drawer-courses">
              {courses.map((item) => (
                <Nav key={item.id} path={`/courses/${item.id}`}>
                  {item.short}
                </Nav>
              ))}
            </div>
          )}
          <Sidebar
            variant={variant}
            path={path}
            courseId={courseId}
            teacher={teacher}
            placement="drawer"
            onNavigate={() => setDrawer(false)}
          />
        </div>
      </Drawer>
      {import.meta.env.DEV && (
        <div className="np-prototype-bar">
          <span
            className="np-prototype-tag"
            title="Первый запрос с задержкой, кэш свежий 30 секунд, затем фоновое обновление"
          >
            Средний интернет · кэш
          </span>
          <button aria-label="Предыдущий вариант" onClick={() => changeVariant(-1)}>
            <ArrowLeftIcon size={16} aria-hidden="true" />
          </button>
          <span className="np-variant-name">
            {variant} · {names[variant]}
          </span>
          <button aria-label="Следующий вариант" onClick={() => changeVariant(1)}>
            <ArrowRightIcon size={16} aria-hidden="true" />
          </button>
          <Select
            id="prototype-role"
            aria-label="Роль в курсе"
            size="xs"
            w={145}
            value={search.role}
            data={[
              { value: "teacher", label: "Преподаватель" },
              { value: "student", label: "Студент" },
            ]}
            onChange={(value) => {
              void navigate({
                to: "/prototype/$",
                params: { _splat },
                search: { ...search, role: value ?? "teacher" },
              });
            }}
          />

          <button
            className="np-cache-refresh"
            aria-label="Обновить кэш"
            aria-busy={refreshCache.isPending}
            disabled={refreshCache.isPending}
            title="Пометить все запросы прототипа устаревшими и обновить открытые в фоне"
            onClick={() => refreshCache.mutate()}
          >
            <ArrowClockwiseIcon size={15} aria-hidden="true" />
            {refreshCache.isPending ? "Обновление кэша…" : "Обновить кэш"}
          </button>
          <details>
            <summary>Состояние</summary>
            <pre>
              {JSON.stringify(
                {
                  colorScheme,
                  computedColorScheme,
                  loading,
                  delayMs,
                  fromCache,
                  refreshing,
                  refreshingCache: refreshCache.isPending,
                  queryKey: prototypePageQuery(_splat, search).queryKey,
                  staleTimeMs: prototypeStaleTime,
                  dataUpdatedAt: query.data.loadedAt,
                  variant,
                  path,
                  role: search.role,
                  mode: diff ? "diff" : "обычный",
                  sidebar: hidden ? "за кнопкой" : "виден",
                  drawer,
                  courseId,
                  status: search.status,
                  file,
                  renamed,
                },
                null,
                2,
              )}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

function PageContent({
  path,
  courseId,
  courseName,
  teacher,
  file,
  setFile,
  rename,
}: {
  path: string;
  courseId: string;
  courseName: string;
  teacher: boolean;
  file: string;
  setFile: (file: string) => void;
  rename: (name: string) => void;
}) {
  const search = useSearch({ from: "/prototype/$" });
  const navigate = useNavigate();
  const base = `/courses/${courseId}`;
  const tasks = prototypeTasks(courseId);
  const taskId = Number(path.split("/tasks/")[1] ?? 1);

  if (/\/attempts\/\d+$/.test(path)) {
    return (
      <div className="np-diff">
        <aside className="np-files">
          <strong>
            Изменённые файлы <span>3</span>
          </strong>
          {["search.py", "tests/test_search.py", "README.md"].map((name) => (
            <button
              key={name}
              className={file === name ? "active" : ""}
              onClick={() => setFile(name)}
            >
              <span className="np-file-name">
                <FileCodeIcon size={16} aria-hidden="true" />
                {name}
              </span>
              <small>+12 −3</small>
            </button>
          ))}
          <Nav path={`${base}/attempts`}>Вернуться к попыткам</Nav>
        </aside>
        <main className="np-code">
          <div className="np-diff-toolbar">
            <strong>{file}</strong>
            <span>Александр Котов · 4 ноября, 18:42</span>
          </div>
          <div className="np-code-lines">
            {[
              "def binary_search(items, target):",
              "    left, right = 0, len(items) - 1",
              "    while left <= right:",
              "        middle = (left + right) // 2",
              "        if items[middle] == target:",
              "            return middle",
              "        if items[middle] < target:",
              "            left = middle + 1",
              "        else:",
              "            right = middle - 1",
              "    return -1",
            ].map((line, i) => (
              <div key={line} className={i > 5 ? "added" : ""}>
                <span>{i + 1}</span>
                <code>{line}</code>
              </div>
            ))}
          </div>
          <div className="np-review">
            <h3>Обсуждение</h3>
            <p>Мария Волкова: проверь случай пустого массива.</p>
            <Textarea placeholder="Комментарий к попытке" aria-label="Комментарий к попытке" />
            <Button
              mt="sm"
              variant="light"
              onClick={() => window.alert("Комментарий в прототипе не отправляется")}
            >
              Добавить комментарий
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (path === "/") {
    return (
      <main className="np-page">
        <div className="np-page-heading">
          <div>
            <p className="np-muted">Осень 2026</p>
            <h1>Мои курсы</h1>
          </div>
          {teacher && (
            <Nav path="/invites/demo" className="np-text-link">
              Приглашение в курс
            </Nav>
          )}
        </div>
        <div className="np-course-list">
          {courses.map((course) => (
            <Nav key={course.id} path={`/courses/${course.id}`} className="np-course-card">
              <span className="np-course-symbol">{course.short}</span>
              <div>
                <h2>{course.name}</h2>
                <p>{course.teacher}</p>
                <small>
                  {course.term} · {prototypeTasks(course.id).length}{" "}
                  {course.id === "15" ? "заданий" : "задания"}
                </small>
              </div>
              <span>
                <CaretRightIcon size={16} aria-hidden="true" />
              </span>
            </Nav>
          ))}
        </div>
      </main>
    );
  }

  if (path === "/login") {
    return (
      <main className="np-page">
        <h1>Вход</h1>
        <p>Выберите пользователя для просмотра навигации.</p>
        <Nav path="/" className="np-button">
          Продолжить как Алексей Смирнов
        </Nav>
        <p className="np-muted">Временный экран прототипа, без авторизации.</p>
      </main>
    );
  }

  if (path.startsWith("/invites/")) {
    return (
      <main className="np-page">
        <h1>Приглашение в курс</h1>
        <p>Вас пригласили на курс «Алгоритмы и структуры данных».</p>
        <Nav path="/courses/1" className="np-button">
          Присоединиться
        </Nav>
      </main>
    );
  }

  if (path === "/settings") {
    return (
      <main className="np-page">
        <h1>Личные настройки</h1>
        <h2>SSH-ключи</h2>
        <Textarea label="Публичный SSH-ключ" placeholder="ssh-ed25519 …" />
        <h2>Письма</h2>
        <label>
          <input type="checkbox" defaultChecked /> Получать уведомления о проверке
        </label>
        <h2>Календарь ICS</h2>
        <TextInput label="Адрес подписки" value="https://example.org/calendar/demo.ics" readOnly />
      </main>
    );
  }

  if (path.endsWith("/settings")) {
    return (
      <main className="np-page">
        <h1>Настройки курса</h1>
        <TextInput
          id="prototype-course-name"
          label="Название курса (обновляет хлебные крошки)"
          placeholder={courseName}
          onChange={(event) => rename(event.target.value)}
        />
        <h2>Задания и сроки</h2>
        {tasks.map((task, index) => (
          <div className="np-row" key={task}>
            <Nav path={`${base}/tasks/${index + 1}`}>{task}</Nav>
            <span>15 ноября, 23:59</span>
          </div>
        ))}
      </main>
    );
  }

  if (path.endsWith("/members")) {
    return (
      <main className="np-page">
        <div className="np-page-heading">
          <h1>Участники</h1>
          {teacher && (
            <Nav path="/invites/demo" className="np-text-link">
              Пригласить
            </Nav>
          )}
        </div>
        <p className="np-muted">Основная группа · 24 участника</p>
        {["Александр Котов", "Екатерина Белова", "Дмитрий Орлов"].map((name) => (
          <div className="np-row" key={name}>
            <span>{name}</span>
            <Badge variant="light">Студент</Badge>
          </div>
        ))}
      </main>
    );
  }

  if (path.endsWith("/attempts")) {
    return (
      <main className="np-page">
        <div className="np-page-heading">
          <h1>{teacher ? "Попытки" : "Мои попытки"}</h1>
          <Select
            id="prototype-status"
            aria-label="Статус попытки"
            value={search.status}
            data={[
              { value: "all", label: "Все статусы" },
              { value: "pending", label: "На проверке" },
              { value: "accepted", label: "Зачтено" },
            ]}
            onChange={(value) => {
              void navigate({
                to: "/prototype/$",
                params: { _splat: path.slice(1) },
                search: { ...search, status: value ?? "all" },
              });
            }}
          />
        </div>
        {[1, 2, 3]
          .filter(
            (id) => search.status === "all" || (search.status === "pending" ? id !== 3 : id === 3),
          )
          .map((id) => (
            <Nav path={`${base}/attempts/${id}`} key={id} className="np-attempt">
              <span>
                <strong>Попытка #{id}</strong>
                <small>
                  {tasks[0]} · {teacher ? "Александр Котов" : "Алексей Смирнов"}
                </small>
              </span>
              <Badge color={id === 3 ? "green" : "orange"} variant="light">
                {id === 3 ? "Зачтено" : "На проверке"}
              </Badge>
              <span>
                <CaretRightIcon size={16} aria-hidden="true" />
              </span>
            </Nav>
          ))}
      </main>
    );
  }

  if (path.includes("/tasks/")) {
    return (
      <main className="np-page">
        <p className="np-muted">
          Задание {taskId} из {tasks.length}
        </p>
        <h1>{tasks[taskId - 1] ?? tasks[0]}</h1>
        <p>
          {courseId === "15"
            ? "Подготовьте результат этапа командного проекта и разместите его в репозитории."
            : "Реализуйте алгоритм поиска элемента в отсортированном массиве."}
        </p>
        <p>Срок сдачи: 15 ноября, 23:59</p>
        <h2>Сдача задания</h2>
        <TextInput label="Коммит" placeholder="Вставьте хеш коммита" />
        <h2>История попыток</h2>
        <Nav path={`${base}/attempts/1`} className="np-attempt">
          <span>
            <strong>Попытка #1</strong>
            <small>4 ноября, 18:42</small>
          </span>
          <Badge color="orange" variant="light">
            На проверке
          </Badge>
          <span className="np-open-diff">
            Открыть diff{" "}
            <span>
              <CaretRightIcon size={16} aria-hidden="true" />
            </span>
          </span>
        </Nav>
      </main>
    );
  }

  return (
    <main className="np-page">
      <p className="np-muted">{courses.find((course) => course.id === courseId)?.term}</p>
      <h1>{courseName}</h1>
      <p className="np-muted">
        24 студента · {tasks.length} {courseId === "15" ? "заданий" : "задания"}
      </p>
      <h2>Задания</h2>
      {tasks.map((task, index) => (
        <Nav path={`${base}/tasks/${index + 1}`} key={task} className="np-task">
          <span className="np-task-number">{index + 1}</span>
          <span>
            <strong>{task}</strong>
            <small>До 15 ноября · {index === 0 ? "Есть попытка на проверке" : "Нет попыток"}</small>
          </span>
          <span>
            <CaretRightIcon size={16} aria-hidden="true" />
          </span>
        </Nav>
      ))}
      <div className="np-inline-links">
        <Nav path={`${base}/attempts`}>Все попытки</Nav>
        <Nav path={`${base}/members`}>Участники</Nav>
        {teacher && <Nav path={`${base}/settings`}>Настройки курса</Nav>}
      </div>
    </main>
  );
}
