// THROWAWAY: три структуры навигации на /prototype/$; ?variant=A|B|C.
// Вопрос: как перемещаться между курсами и проверкой, сохраняя контекст?
import { useEffect, useState, type ReactNode } from "react";
import { useMounted } from "@mantine/hooks";
import { Link, useNavigate, useParams, useSearch } from "@tanstack/react-router";
import { Button, Drawer, Menu, Select, TextInput, Textarea, Badge } from "@mantine/core";
import "./navigation-prototype.css";

const courses = [
  {
    id: "1",
    name: "Алгоритмы и структуры данных",
    short: "А",
    teacher: "Алексей Смирнов",
    term: "Осень 2026",
  },
  {
    id: "2",
    name: "Практикум по программированию на Python и разработке приложений",
    short: "П",
    teacher: "Мария Волкова",
    term: "Осень 2026",
  },
  { id: "3", name: "Базы данных", short: "Б", teacher: "Алексей Смирнов", term: "Весна 2027" },
  {
    id: "4",
    name: "Дискретная математика",
    short: "Д",
    teacher: "Мария Волкова",
    term: "Осень 2026",
  },
  {
    id: "5",
    name: "Операционные системы",
    short: "О",
    teacher: "Алексей Смирнов",
    term: "Осень 2026",
  },
  { id: "6", name: "Компьютерные сети", short: "С", teacher: "Мария Волкова", term: "Весна 2027" },
  {
    id: "7",
    name: "Математический анализ",
    short: "М",
    teacher: "Алексей Смирнов",
    term: "Осень 2026",
  },
  {
    id: "8",
    name: "Линейная алгебра и аналитическая геометрия",
    short: "Л",
    teacher: "Мария Волкова",
    term: "Осень 2026",
  },
  {
    id: "9",
    name: "Теория вероятностей и математическая статистика",
    short: "Т",
    teacher: "Алексей Смирнов",
    term: "Весна 2027",
  },
  {
    id: "10",
    name: "Архитектура компьютера",
    short: "А",
    teacher: "Мария Волкова",
    term: "Осень 2026",
  },
  {
    id: "11",
    name: "Функциональное программирование",
    short: "Ф",
    teacher: "Алексей Смирнов",
    term: "Весна 2027",
  },
  {
    id: "12",
    name: "Разработка веб-приложений",
    short: "В",
    teacher: "Мария Волкова",
    term: "Весна 2027",
  },
  {
    id: "13",
    name: "Тестирование и обеспечение качества программного обеспечения",
    short: "Т",
    teacher: "Алексей Смирнов",
    term: "Весна 2027",
  },
  {
    id: "14",
    name: "Основы машинного обучения",
    short: "М",
    teacher: "Мария Волкова",
    term: "Весна 2027",
  },
  {
    id: "15",
    name: "Командный проект: разработка и сопровождение программного продукта",
    short: "К",
    teacher: "Алексей Смирнов",
    term: "Весна 2027",
  },
];
const tasks = ["Двоичный поиск", "Сортировки и оценка сложности", "Деревья и обход графа"];
const variants = ["A", "B", "C"];
const names: Record<string, string> = {
  A: "Единое дерево",
  B: "Курсы + разделы",
  C: "Рабочее пространство",
};

type NavProps = { path: string; children: ReactNode; className?: string; onClick?: () => void };

function Nav({ path, children, className, onClick }: NavProps) {
  return (
    <Link
      to="/prototype/$"
      activeOptions={{ exact: true }}
      params={{ _splat: path.replace(/^\//, "") }}
      search={(old) => ({
        variant: old.variant ?? "A",
        role: old.role ?? "teacher",
        status: old.status ?? "all",
      })}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}

function NavItem({
  path,
  label,
  icon,
  active,
}: {
  path: string;
  label: string;
  icon: string;
  active: boolean;
}) {
  return (
    <Nav path={path} className={`np-nav-item ${active ? "active" : ""}`}>
      <span aria-hidden="true" className="np-icon">
        {icon}
      </span>
      <span>{label}</span>
    </Nav>
  );
}

function Sidebar({
  variant,
  path,
  courseId,
  teacher,
}: {
  variant: string;
  path: string;
  courseId: string;
  teacher: boolean;
}) {
  const base = `/courses/${courseId}`;
  const course = courses.find((item) => item.id === courseId) ?? courses[0];
  const links = (
    <>
      <NavItem
        path={base}
        label="Задания"
        icon="▤"
        active={path === base || path.includes("/tasks/")}
      />
      <NavItem
        path={`${base}/attempts`}
        label={teacher ? "Попытки" : "Мои попытки"}
        icon="◷"
        active={path.includes("/attempts")}
      />
      <NavItem
        path={`${base}/members`}
        label="Участники"
        icon="♧"
        active={path.endsWith("/members")}
      />
      {teacher && (
        <NavItem
          path={`${base}/settings`}
          label="Настройки курса"
          icon="⚙"
          active={path.endsWith("/settings")}
        />
      )}
    </>
  );

  return (
    <div className={`np-sidebar np-sidebar-${variant}`}>
      <Nav path="/" className="np-brand">
        <span className="np-logo">m</span>
        <strong>MergeMinds</strong>
      </Nav>
      {variant !== "B" && <NavItem path="/" label="Мои курсы" icon="▦" active={path === "/"} />}
      {variant === "C" && (
        <Menu width={270} position="bottom-start">
          <Menu.Target>
            <button className="np-course-select">
              {course.name}
              <span>⌄</span>
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
            {courses.map((item) => (
              <div key={item.id} className="np-course-group">
                <Nav
                  path={`/courses/${item.id}`}
                  className={`np-course-name ${courseId === item.id ? "selected" : ""}`}
                >
                  <span className="np-course-dot">{item.short}</span>
                  {item.name}
                </Nav>
                {courseId === item.id && path.startsWith("/courses/") && (
                  <div className="np-nested">{links}</div>
                )}
              </div>
            ))}
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
                icon="·"
                active={path === `${base}/tasks/${index + 1}`}
              />
            ))}
          </>
        )}
      </div>
      <div className="np-account">
        <NavItem path="/settings" label="Личные настройки" icon="⚙" active={path === "/settings"} />
        <Nav path="/login" className="np-user">
          <span className="np-avatar">АС</span>
          <span>
            Алексей Смирнов<small>{teacher ? "Преподаватель" : "Студент"}</small>
          </span>
          <span>⌄</span>
        </Nav>
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
                {variant === "C" ? "/" : "›"}
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
                    ⌄
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
                    ⌄
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
        <Nav path="/" className="np-rail-item">
          ▦
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
        <Nav path="/settings" className="np-rail-bottom">
          ⚙
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
  const mounted = useMounted();
  const { _splat = "" } = useParams({ from: "/prototype/$" });
  const search = useSearch({ from: "/prototype/$" });
  const navigate = useNavigate();

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
        <svg
          width="19"
          height="19"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
        >
          <rect x="2" y="3" width="16" height="14" rx="2" />
          <path d="M7 3v14M4 7h1M4 10h1" />
        </svg>
      </button>
      <Breadcrumbs
        path={path}
        courseId={courseId}
        variant={variant}
        courseName={renamed[courseId] || course.name}
      />
      <span className="np-header-right">
        {diff && (
          <Badge color="orange" variant="light">
            На проверке
          </Badge>
        )}
        <span className="np-avatar">АС</span>
      </span>
    </header>
  );
  const content = (
    <PageContent
      path={path}
      courseId={courseId}
      courseName={renamed[courseId] || course.name}
      teacher={teacher}
      file={file}
      setFile={setFile}
      rename={(name) => setRenamed((old) => ({ ...old, [courseId]: name }))}
    />
  );

  return (
    <div className="np-root" data-ready={mounted}>
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
        ☰
      </button>
      <Drawer
        opened={drawer}
        onClose={() => setDrawer(false)}
        title="Навигация"
        size={variant === "B" ? 350 : 290}
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
          {sidebar}
        </div>
      </Drawer>
      {import.meta.env.DEV && (
        <div className="np-prototype-bar">
          <span className="np-prototype-tag">Прототип</span>
          <button aria-label="Предыдущий вариант" onClick={() => changeVariant(-1)}>
            ←
          </button>
          <span className="np-variant-name">
            {variant} · {names[variant]}
          </span>
          <button aria-label="Следующий вариант" onClick={() => changeVariant(1)}>
            →
          </button>
          <Select
            id="prototype-role"
            aria-label="Роль"
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
          <details>
            <summary>Состояние</summary>
            <pre>
              {JSON.stringify(
                {
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
              <span>▤ {name}</span>
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
                <small>{course.term} · 3 задания</small>
              </div>
              <span>›</span>
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
              <span>›</span>
            </Nav>
          ))}
      </main>
    );
  }

  if (path.includes("/tasks/")) {
    return (
      <main className="np-page">
        <p className="np-muted">Задание {taskId} из 3</p>
        <h1>{tasks[taskId - 1] ?? tasks[0]}</h1>
        <p>Реализуйте алгоритм поиска элемента в отсортированном массиве.</p>
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
          <span>Открыть diff ›</span>
        </Nav>
      </main>
    );
  }

  return (
    <main className="np-page">
      <p className="np-muted">{courses.find((course) => course.id === courseId)?.term}</p>
      <h1>{courseName}</h1>
      <p className="np-muted">24 студента · 3 задания</p>
      <h2>Задания</h2>
      {tasks.map((task, index) => (
        <Nav path={`${base}/tasks/${index + 1}`} key={task} className="np-task">
          <span className="np-task-number">{index + 1}</span>
          <span>
            <strong>{task}</strong>
            <small>До 15 ноября · {index === 0 ? "Есть попытка на проверке" : "Нет попыток"}</small>
          </span>
          <span>›</span>
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
