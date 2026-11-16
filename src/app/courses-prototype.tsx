// THROWAWAY / #5: проверить три компоновки участников в существующей оболочке.
// Данные в памяти; роли и сохранность данных здесь не являются серверными гарантиями.
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Checkbox,
  Divider,
  Group,
  Menu,
  Modal,
  Popover,
  ScrollArea,
  Select,
  Stack,
  Table,
  Tabs,
  Text,
  Textarea,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  DotsThreeIcon,
} from "@phosphor-icons/react";
import { AppLayout } from "../platform/public.ui.ts";
import { AppSidebar } from "./sidebar";
import { CourseBranch } from "./course-branch";
import "./courses-prototype.css";

type Student = { id: number; name: string; group: string };
type Course = {
  id: number;
  name: string;
  emoji: string;
  description: string;
  status: "draft" | "open";
  groups: string[];
  students: Student[];
  teachers: string[];
  removed: Student[];
};
type Search = { variant: string; course: number; view: string };
type Navigate = (next: Partial<Search>) => void;
const initialDescription =
  "## О курсе\nОт первых программ до уверенной работы с Python.\n\nРазбираем язык на практике и учимся писать понятный код.\n\n### Что будем изучать\n- Типы данных и коллекции\n- Функции и модули\n- Работа с файлами\n\n**Перед началом:** установите Python и Git. Увидимся на занятии! 🚀";
const names = [
  "Александрова Мария Сергеевна",
  "Белов Иван Андреевич",
  "Васильева Анна Дмитриевна",
  "Громов Михаил Олегович",
  "Данилова Софья Игоревна",
  "Егоров Артём Павлович",
  "Жукова Полина Алексеевна",
  "Зайцев Даниил Романович",
  "Ильина Елизавета Максимовна",
  "Козлов Никита Сергеевич",
  "Лебедева Дарья Олеговна",
  "Морозов Александр Ильич",
];

const seed: Course[] = [
  {
    id: 1,
    name: "Основы программирования на Python",
    emoji: "🐍",
    description: initialDescription,
    status: "open",
    groups: ["Подгруппа 1", "Подгруппа 2", "Подгруппа 3"],
    students: names.map((name, i) => ({ id: i + 1, name, group: `Подгруппа ${(i % 2) + 1}` })),
    teachers: ["Кудяков Артём", "Соколова Екатерина"],
    removed: [],
  },
  {
    id: 2,
    name: "Алгоритмы и структуры данных",
    emoji: "🧮",
    description: "## Алгоритмы\nУчимся выбирать структуры данных и оценивать сложность.",
    status: "draft",
    groups: ["Подгруппа 1"],
    students: [],
    teachers: ["Кудяков Артём"],
    removed: [],
  },
  {
    id: 3,
    name: "Практикум по веб-разработке",
    emoji: "💻",
    description: "## Веб-разработка\nОт HTTP до первого приложения.",
    status: "open",
    groups: ["Подгруппа 1"],
    students: [],
    teachers: ["Кудяков Артём"],
    removed: [],
  },
];
const emojis = [
  ["📚", "книга книги book books"],
  ["💻", "компьютер laptop computer"],
  ["🧪", "пробирка химия test chemistry"],
  ["🧮", "счёты математика math abacus"],
  ["🎓", "выпуск graduation"],
  ["📝", "заметка memo write"],
  ["💡", "идея лампа idea bulb"],
  ["🎯", "цель target"],
  ["🚀", "ракета rocket"],
  ["🛠️", "инструменты tools"],
  ["✅", "галочка check"],
  ["🔥", "огонь fire"],
  ["🐍", "змея python snake"],
  ["🌍", "земля earth"],
  ["🔬", "микроскоп microscope"],
  ["🎨", "искусство art"],
];

function EmojiPicker({
  children,
  onPick,
  frequent,
  remember,
}: {
  children: ReactNode;
  onPick: (emoji: string) => void;
  frequent: Record<string, number>;
  remember: (emoji: string) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [query, setQuery] = useState("");
  const recent = Object.keys(frequent).sort((a, b) => frequent[b] - frequent[a]);
  const defaultEmojis = recent.length ? recent.map((symbol) => [symbol, ""]) : emojis.slice(0, 12);
  const matches = query
    ? emojis.filter(([symbol, words]) => (symbol + words).includes(query.toLowerCase()))
    : defaultEmojis;

  return (
    <Popover opened={opened} onChange={setOpened} width={290} position="bottom-start" shadow="md">
      <Popover.Target>
        <Button variant="default" aria-label="Выбрать эмодзи" onClick={() => setOpened(!opened)}>
          {children}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Stack gap="sm">
          <TextInput
            aria-label="Поиск эмодзи"
            placeholder="Поиск / Search"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
          />
          <Text size="xs" c="dimmed">
            {recent.length ? "Часто используемые" : "Популярные"}
          </Text>
          <Group gap={4}>
            {matches.map(([symbol]) => (
              <ActionIcon
                variant="subtle"
                color="gray"
                size={36}
                key={symbol}
                aria-label={`Эмодзи ${symbol}`}
                onClick={() => {
                  onPick(symbol);
                  remember(symbol);
                  setOpened(false);
                  setQuery("");
                }}
              >
                <Text size="xl">{symbol}</Text>
              </ActionIcon>
            ))}
          </Group>
          {query &&
            !emojis.some(([symbol, words]) => (symbol + words).includes(query.toLowerCase())) && (
              <Text size="sm">Эмодзи не найдены</Text>
            )}
          <Text size="xs" c="dimmed">
            Демо-набор. История хранится до перезагрузки.
          </Text>
        </Stack>
      </Popover.Dropdown>
    </Popover>
  );
}

function inline(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
    if (part.startsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }

    if (part.startsWith("*")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }

    return part;
  });
}

function Markdown({ source }: { source: string }) {
  // React экранирует текст; HTML намеренно не интерпретируется. Только демо-подмножество Markdown.
  return (
    <div className="cp-markdown">
      {source.split("\n").map((line, i) => {
        if (line.startsWith("### ")) {
          return (
            <Title order={3} key={i}>
              {inline(line.slice(4))}
            </Title>
          );
        }

        if (line.startsWith("## ")) {
          return (
            <Title order={2} key={i}>
              {inline(line.slice(3))}
            </Title>
          );
        }

        if (line.startsWith("# ")) {
          return (
            <Title order={1} key={i}>
              {inline(line.slice(2))}
            </Title>
          );
        }

        if (line.startsWith("- ")) {
          return (
            <ul key={i}>
              <li>{inline(line.slice(2))}</li>
            </ul>
          );
        }

        return line ? <Text key={i}>{inline(line)}</Text> : <Box h={10} key={i} />;
      })}
    </div>
  );
}

function CourseForm({
  course,
  save,
  cancel,
  frequent,
  remember,
}: {
  course?: Course;
  save: (data: Pick<Course, "name" | "emoji" | "description">) => void;
  cancel: () => void;
  frequent: Record<string, number>;
  remember: (emoji: string) => void;
}) {
  const [name, setName] = useState(course?.name ?? "");
  const [emoji, setEmoji] = useState(course?.emoji ?? "📚");
  const [description, setDescription] = useState(course?.description ?? "");
  const [tab, setTab] = useState<string | null>("write");

  const editor = useRef<HTMLTextAreaElement>(null);
  const selection = useRef({ start: 0, end: 0 });
  const insert = (before: string, after = "") => {
    const { start, end } = selection.current;
    const selected = description.slice(start, end);

    setDescription(
      description.slice(0, start) + before + selected + after + description.slice(end),
    );
    setTab("write");
    requestAnimationFrame(() => {
      editor.current?.focus();
      editor.current?.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save({ name, emoji, description });
      }}
    >
      <Stack gap="lg" maw={760}>
        <Group align="end">
          <Stack gap={6}>
            <Text size="sm" fw={500}>
              Эмодзи
            </Text>
            <EmojiPicker frequent={frequent} remember={remember} onPick={setEmoji}>
              {emoji}
            </EmojiPicker>
          </Stack>
          <TextInput
            flex={1}
            label="Название курса"
            placeholder="Например, основы программирования"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
          />
        </Group>
        <Stack gap={6}>
          <Text size="sm" fw={500}>
            Описание
          </Text>
          <Tabs value={tab} onChange={setTab} variant="default">
            <Tabs.List>
              <Tabs.Tab value="write">Редактирование</Tabs.Tab>
              <Tabs.Tab value="preview">Предпросмотр</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="write">
              <Box className="cp-editor">
                <Group gap={4} p="xs">
                  <Button
                    variant="subtle"
                    color="gray"
                    size="compact-sm"
                    aria-label="Жирный"
                    onClick={() => insert("**", "**")}
                  >
                    <b>Ж</b>
                  </Button>
                  <Button
                    variant="subtle"
                    color="gray"
                    size="compact-sm"
                    aria-label="Курсив"
                    onClick={() => insert("*", "*")}
                  >
                    <i>К</i>
                  </Button>
                  <Button
                    variant="subtle"
                    color="gray"
                    size="compact-sm"
                    aria-label="Заголовок"
                    onClick={() => insert("\n## ")}
                  >
                    H₂
                  </Button>
                  <Button
                    variant="subtle"
                    color="gray"
                    size="compact-sm"
                    aria-label="Список"
                    onClick={() => insert("\n- ")}
                  >
                    Список
                  </Button>
                  <EmojiPicker
                    frequent={frequent}
                    remember={remember}
                    onPick={(value) => insert(value)}
                  >
                    ☺
                  </EmojiPicker>
                </Group>
                <Textarea
                  ref={editor}
                  aria-label="Текст описания"
                  minRows={12}
                  autosize
                  variant="unstyled"
                  px="md"
                  value={description}
                  onSelect={(e) => {
                    selection.current = {
                      start: e.currentTarget.selectionStart,
                      end: e.currentTarget.selectionEnd,
                    };
                  }}
                  onChange={(e) => setDescription(e.currentTarget.value)}
                />
              </Box>
            </Tabs.Panel>
            <Tabs.Panel value="preview">
              <Box mih={325} py="md">
                <Markdown source={description} />
              </Box>
            </Tabs.Panel>
          </Tabs>
          <Text size="xs" c="dimmed">
            Markdown: заголовки, выделение и списки. Без вложений.
          </Text>
        </Stack>
        <Group>
          <Button type="submit">{course ? "Сохранить изменения" : "Создать курс"}</Button>
          <Button variant="default" onClick={cancel}>
            Отмена
          </Button>
        </Group>
        {!course && (
          <Text size="sm" c="dimmed">
            Вы станете владельцем. Курс будет в подготовке; создастся подгруппа по умолчанию.
          </Text>
        )}
        <Text size="xs" c="dimmed">
          Прототип не задаёт production-ограничения длины и обязательности полей.
        </Text>
      </Stack>
    </form>
  );
}

function Members({
  course,
  update,
  variant,
  role,
  notify,
}: {
  course: Course;
  update: (next: Course) => void;
  variant: string;
  role: string;
  notify: (message: string) => void;
}) {
  const [group, setGroup] = useState("all");
  const [selected, setSelected] = useState<number[]>([]);
  const [target, setTarget] = useState<string | null>(null);
  const [dialog, setDialog] = useState<string | null>(null);
  const [value, setValue] = useState("");

  const [error, setError] = useState("");
  const [remove, setRemove] = useState<Student | null>(null);
  const visible = course.students.filter((student) => group === "all" || student.group === group);
  const chooseGroup = (next: string) => {
    setGroup(next);
    setSelected([]);
  };
  const openDialog = (next: string, initial = "") => {
    setValue(initial);
    setError("");
    setDialog(next);
  };

  const groupControls = (
    <Group gap="xs">
      <Button
        variant="default"
        size="xs"
        leftSection={<PlusIcon />}
        onClick={() => openDialog("create")}
      >
        Подгруппа
      </Button>
      <Menu>
        <Menu.Target>
          <ActionIcon variant="default" aria-label="Действия с подгруппой">
            <DotsThreeIcon />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>{group === "all" ? "Сначала выберите подгруппу" : group}</Menu.Label>
          <Menu.Item disabled={group === "all"} onClick={() => openDialog("rename", group)}>
            Переименовать
          </Menu.Item>
          <Menu.Item
            color="red"
            disabled={
              group === "all" ||
              course.students.some((s) => s.group === group) ||
              course.groups.length === 1
            }
            onClick={() => {
              update({ ...course, groups: course.groups.filter((g) => g !== group) });
              chooseGroup("all");
              notify("Пустая подгруппа удалена");
            }}
          >
            Удалить пустую подгруппу
          </Menu.Item>
          <Menu.Label>Удаляется только пустая и не последняя</Menu.Label>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
  const table = (rows: Student[]) => (
    <ScrollArea>
      <Table verticalSpacing={9} highlightOnHover miw={590}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox
                aria-label="Выбрать всех в списке"
                checked={rows.length > 0 && rows.every((s) => selected.includes(s.id))}
                indeterminate={
                  rows.some((s) => selected.includes(s.id)) &&
                  !rows.every((s) => selected.includes(s.id))
                }
                onChange={(e) => {
                  const checked = e.currentTarget.checked;

                  setSelected(
                    checked
                      ? [...new Set([...selected, ...rows.map((s) => s.id)])]
                      : selected.filter((id) => !rows.some((s) => s.id === id)),
                  );
                }}
              />
            </Table.Th>
            <Table.Th>ФИО</Table.Th>
            <Table.Th>Подгруппа</Table.Th>
            <Table.Th w={45} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((student) => (
            <Table.Tr
              key={student.id}
              bg={selected.includes(student.id) ? "var(--mantine-color-blue-light)" : undefined}
            >
              <Table.Td>
                <Checkbox
                  aria-label={`Выбрать: ${student.name}`}
                  checked={selected.includes(student.id)}
                  onChange={(e) =>
                    setSelected(
                      e.currentTarget.checked
                        ? [...selected, student.id]
                        : selected.filter((id) => id !== student.id),
                    )
                  }
                />
              </Table.Td>
              <Table.Td>{student.name}</Table.Td>
              <Table.Td>
                <Text size="sm" c="dimmed">
                  {student.group}
                </Text>
              </Table.Td>
              <Table.Td>
                <Menu>
                  <Menu.Target>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      aria-label={`Действия: ${student.name}`}
                    >
                      <DotsThreeIcon size={20} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Item color="red" onClick={() => setRemove(student)}>
                      Исключить из курса
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <div>
          <Title order={3}>Преподаватели</Title>
          <Text size="sm" c="dimmed">
            Владелец управляет составом; преподаватели работают со студентами.
          </Text>
        </div>
        {role === "owner" && (
          <Button variant="default" size="xs" onClick={() => openDialog("teacher")}>
            Добавить преподавателя
          </Button>
        )}
      </Group>
      <Stack gap={8}>
        {course.teachers.map((name, index) => (
          <Group key={name} justify="space-between">
            <Group gap="sm">
              <Text size="sm">{name}</Text>
              <Badge variant="light" color="gray" size="sm">
                {index === 0 ? "Владелец" : "Преподаватель"}
              </Badge>
            </Group>
            {index > 0 && role === "owner" && (
              <Button
                variant="subtle"
                color="red"
                size="compact-xs"
                onClick={() => {
                  update({ ...course, teachers: course.teachers.filter((n) => n !== name) });
                  notify("Преподаватель удалён из состава курса");
                }}
              >
                Удалить
              </Button>
            )}
          </Group>
        ))}
      </Stack>
      <Divider />
      <Group justify="space-between">
        <Group gap="sm">
          <Title order={3}>Студенты</Title>
          <Text c="dimmed" size="sm">
            {course.students.length}
          </Text>
        </Group>
        {groupControls}
      </Group>
      <Box className={variant === "B" ? "cp-members-split" : undefined}>
        {variant === "B" ? (
          <Stack gap={4} className="cp-group-rail">
            {["all", ...course.groups].map((g) => (
              <Button
                key={g}
                justify="space-between"
                variant={g === group ? "light" : "subtle"}
                color={g === group ? "blue" : "gray"}
                onClick={() => chooseGroup(g)}
                rightSection={
                  <Text size="xs">
                    {course.students.filter((s) => g === "all" || s.group === g).length}
                  </Text>
                }
              >
                {g === "all" ? "Все подгруппы" : g}
              </Button>
            ))}
          </Stack>
        ) : (
          <Select
            mb="md"
            w={250}
            aria-label="Подгруппа"
            value={group}
            onChange={(next) => chooseGroup(next ?? "all")}
            data={[
              { value: "all", label: "Все подгруппы" },
              ...course.groups.map((g) => ({ value: g, label: g })),
            ]}
          />
        )}
        <Stack gap="sm" miw={0}>
          {selected.length > 0 && (
            <Group className="cp-bulk" p="sm">
              <Text size="sm" fw={500}>
                Выбрано: {selected.length}
              </Text>
              <Select
                w={180}
                placeholder="В подгруппу…"
                aria-label="Целевая подгруппа"
                value={target}
                onChange={setTarget}
                data={course.groups}
              />
              <Button
                size="sm"
                disabled={!target}
                onClick={() => {
                  if (!target) {
                    return;
                  }

                  update({
                    ...course,
                    students: course.students.map((s) =>
                      selected.includes(s.id) ? { ...s, group: target } : s,
                    ),
                  });
                  notify(
                    `Переведено студентов: ${selected.length}. Учебные данные не изменены (демо).`,
                  );
                  setSelected([]);
                }}
              >
                Перевести
              </Button>
              <Button variant="subtle" size="sm" onClick={() => setSelected([])}>
                Сбросить
              </Button>
            </Group>
          )}
          {variant === "C" && group === "all" ? (
            course.groups.map((g) => (
              <Stack key={g} gap="xs">
                <Group gap="sm">
                  <Text fw={600} size="sm">
                    {g}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {course.students.filter((s) => s.group === g).length} студентов
                  </Text>
                </Group>
                {course.students.some((s) => s.group === g) ? (
                  table(course.students.filter((s) => s.group === g))
                ) : (
                  <Text c="dimmed" size="sm" pb="md">
                    В подгруппе пока нет студентов
                  </Text>
                )}
              </Stack>
            ))
          ) : (
            <>
              {table(visible)}
              {!visible.length && (
                <Text c="dimmed" ta="center" py="xl">
                  В подгруппе пока нет студентов
                </Text>
              )}
            </>
          )}
        </Stack>
      </Box>
      {course.removed.length > 0 && (
        <Alert color="gray" title="Демонстрация восстановления доступа">
          <Text size="sm">
            Исключённые студенты: {course.removed.map((s) => s.name).join(", ")}. В прототипе
            учебных данных нет; их сохранность должна проверяться на сервере.
          </Text>
          <Button
            mt="sm"
            variant="default"
            size="xs"
            onClick={() => {
              update({
                ...course,
                students: [
                  ...course.students,
                  ...course.removed.map((s) => ({ ...s, group: course.groups[0] })),
                ],
                removed: [],
              });
              notify("Участие восстановлено (демо повторного вступления)");
            }}
          >
            Восстановить участие
          </Button>
        </Alert>
      )}
      <Modal
        opened={dialog !== null}
        onClose={() => setDialog(null)}
        title={dialog === "teacher" ? "Добавить преподавателя" : "Подгруппа"}
      >
        <Stack>
          <TextInput
            label={dialog === "teacher" ? "ФИО" : "Название подгруппы"}
            value={value}
            onChange={(e) => setValue(e.currentTarget.value)}
            error={error}
          />
          <Button
            onClick={() => {
              const name = value.trim();

              if (!name) {
                setError("Введите название или ФИО для демонстрации");

                return;
              }

              if (
                dialog !== "teacher" &&
                course.groups.some(
                  (g) =>
                    g.toLocaleLowerCase() === name.toLocaleLowerCase() &&
                    !(dialog === "rename" && g === group),
                )
              ) {
                setError("Подгруппа с таким названием уже есть");

                return;
              }

              if (dialog === "teacher") {
                update({ ...course, teachers: [...new Set([...course.teachers, name])] });
              }

              if (dialog === "create") {
                update({ ...course, groups: [...course.groups, name] });
              }

              if (dialog === "rename") {
                update({
                  ...course,
                  groups: course.groups.map((g) => (g === group ? name : g)),
                  students: course.students.map((s) =>
                    s.group === group ? { ...s, group: name } : s,
                  ),
                });
                chooseGroup(name);
              }

              setDialog(null);
              notify("Состав курса обновлён");
            }}
          >
            Сохранить
          </Button>
        </Stack>
      </Modal>
      <Modal opened={remove !== null} onClose={() => setRemove(null)} title="Исключить студента?">
        <Stack>
          <Text>
            {remove?.name} потеряет доступ к курсу. Учебные данные должны сохраниться для повторного
            вступления.
          </Text>
          <Text size="xs" c="dimmed">
            Это демонстрация интерфейса, не проверка хранения данных.
          </Text>
          <Group>
            <Button variant="default" onClick={() => setRemove(null)}>
              Отмена
            </Button>
            <Button
              color="red"
              onClick={() => {
                if (remove) {
                  update({
                    ...course,
                    students: course.students.filter((s) => s.id !== remove.id),
                    removed: [...course.removed, remove],
                  });
                }

                setRemove(null);
                notify("Студент исключён из курса (демо)");
              }}
            >
              Исключить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

export function CoursesPrototype({ search, navigate }: { search: Search; navigate: Navigate }) {
  const [courses, setCourses] = useState<Course[]>(structuredClone(seed));
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("owner");
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [frequent, setFrequent] = useState<Record<string, number>>({});

  const course = courses.find((c) => c.id === search.course);
  const variantNames: Record<string, string> = {
    A: "Таблица и фильтр",
    B: "Подгруппы сбоку",
    C: "Секции подгрупп",
  };
  const switchVariant = (delta: number) => {
    const keys = ["A", "B", "C"];

    navigate({ variant: keys[(keys.indexOf(search.variant) + delta + 3) % 3] });
  };
  const update = (next: Course) =>
    setCourses((old) => old.map((c) => (c.id === next.id ? next : c)));
  const remember = (emoji: string) =>
    setFrequent((old) => ({ ...old, [emoji]: (old[emoji] ?? 0) + 1 }));
  const path = course ? `/prototype/courses/${course.id}/${search.view}` : "/prototype/courses";

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("input,textarea,select,[contenteditable], [role=dialog]")
      ) {
        return;
      }

      if (document.querySelector('[role="dialog"]')) {
        return;
      }

      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        switchVariant(event.key === "ArrowRight" ? 1 : -1);
      }
    };

    window.addEventListener("keydown", handler);

    return () => window.removeEventListener("keydown", handler);
  });

  const state = {
    variant: search.variant,
    view: search.view,
    role,
    courses: courses.map((c) => ({
      id: c.id,
      name: c.name,
      emoji: c.emoji,
      description: c.description,
      status: c.status,
      groups: c.groups,
      students: c.students,
      teachers: c.teachers,
      removed: c.removed,
    })),
    frequent,
  };

  return (
    <AppLayout
      path={path}
      breadcrumbs={[
        { label: "Мои курсы", href: "/prototype/courses" },
        ...(course
          ? [{ label: course.name, href: `/prototype/courses?course=${course.id}&view=home` }]
          : []),
        ...(search.view === "create"
          ? [{ label: "Создание курса", href: "/prototype/courses?view=create" }]
          : []),
      ]}
      renderSidebar={({ drawer }) => (
        <div
          onClickCapture={(e) => {
            if (!(e.target instanceof Element)) {
              return;
            }

            const anchor = e.target.closest("a");

            if (!anchor) {
              return;
            }

            e.preventDefault();
            e.stopPropagation();
            const url = new URL(anchor.href);

            navigate({
              course: Number(url.searchParams.get("course")) || 0,
              view: url.searchParams.get("view") ?? "list",
            });
          }}
        >
          <AppSidebar
            path={path}
            drawer={drawer}
            currentCourseId={course ? String(course.id) : undefined}
            courses={courses.map((c) => ({
              id: String(c.id),
              label: c.name,
              emoji: c.emoji,
              href: `/prototype/courses?course=${c.id}&view=home`,
            }))}
            user={{
              name: "Кудяков Артём",
              busy: false,
              onLogout: () => setMessage("Авторизация не подключена: это прототип"),
            }}
            renderCourseBranch={(c, heading) => (
              <CourseBranch
                course={c}
                heading={heading}
                path={path}
                state={{
                  status: "ready",
                  refreshing: false,
                  tasks: [],
                  sections: [
                    {
                      label: "Участники",
                      href: `/prototype/courses?course=${c.id}&view=members`,
                      icon: "members",
                    },
                    {
                      label: "Настройки",
                      href: `/prototype/courses?course=${c.id}&view=settings`,
                      icon: "settings",
                    },
                  ],
                }}
              />
            )}
          />
        </div>
      )}
    >
      <Stack gap="xl" className="cp-page">
        <Group justify="space-between" gap="sm">
          <Text size="xs" c="dimmed">
            Прототип #5 · изменения только в памяти
          </Text>
          <Group gap="sm">
            <Select
              aria-label="Демонстрационная роль"
              size="xs"
              w={150}
              value={role}
              onChange={(value) => setRole(value ?? "owner")}
              data={[
                { value: "owner", label: "Владелец" },
                { value: "teacher", label: "Преподаватель" },
                { value: "student", label: "Студент" },
              ]}
            />
            <Button
              variant="subtle"
              color="gray"
              size="compact-xs"
              onClick={() => {
                setCourses(structuredClone(seed));
                setMessage("");
                navigate({ course: 0, view: "list" });
              }}
            >
              Сбросить демо
            </Button>
          </Group>
        </Group>
        {message && (
          <Alert withCloseButton onClose={() => setMessage("")} color="blue" role="status">
            {message}
          </Alert>
        )}
        {search.view === "list" && (
          <Stack gap="lg">
            <Group justify="space-between">
              <div>
                <Title order={2}>Мои курсы</Title>
                <Text size="sm" c="dimmed" mt={4}>
                  Курсы, которые вы ведёте или изучаете
                </Text>
              </div>
              <Button
                leftSection={<PlusIcon size={16} />}
                onClick={() => navigate({ view: "create", course: 0 })}
              >
                Создать курс
              </Button>
            </Group>
            <TextInput
              maw={440}
              placeholder="Найти курс по названию"
              aria-label="Поиск курсов"
              leftSection={<MagnifyingGlassIcon size={16} />}
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
            />
            <Stack gap={0}>
              {courses
                .filter((c) => c.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
                .map((c) => (
                  <UnstyledButton
                    key={c.id}
                    className="cp-course-row"
                    onClick={() => navigate({ course: c.id, view: "home" })}
                  >
                    <Group wrap="nowrap">
                      <Text size="xl">{c.emoji}</Text>
                      <Box flex={1}>
                        <Text size="sm" fw={500}>
                          {c.name || "Без названия"}
                        </Text>
                        <Text size="xs" c="dimmed">
                          Владелец
                        </Text>
                      </Box>
                      <Badge
                        color={c.status === "open" ? "teal" : "gray"}
                        variant="light"
                        size="sm"
                      >
                        {c.status === "open" ? "Открыт" : "В подготовке"}
                      </Badge>
                      <ArrowRightIcon size={16} />
                    </Group>
                  </UnstyledButton>
                ))}
            </Stack>
            {!courses.filter((c) => c.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
              .length && (
              <Text c="dimmed" py="xl">
                {courses.length
                  ? "Курсы не найдены. Попробуйте другое название."
                  : "У вас пока нет курсов. Создайте первый курс."}
              </Text>
            )}
            <Button
              variant="subtle"
              color="gray"
              size="compact-xs"
              w="fit-content"
              onClick={() => setCourses([])}
            >
              Демо: пустой список
            </Button>
          </Stack>
        )}
        {search.view === "create" && (
          <Stack gap="xl">
            <Title order={2}>Создание курса</Title>
            <CourseForm
              frequent={frequent}
              remember={remember}
              cancel={() => navigate({ view: "list" })}
              save={(data) => {
                const next: Course = {
                  ...data,
                  id: Math.max(0, ...courses.map((c) => c.id)) + 1,
                  status: "draft",
                  groups: ["Подгруппа 1"],
                  students: [],
                  teachers: ["Кудяков Артём"],
                  removed: [],
                };

                setCourses([...courses, next]);
                navigate({ course: next.id, view: "home" });
                setMessage("Курс создан в подготовке");
              }}
            />
          </Stack>
        )}
        {course && search.view !== "create" && (
          <Stack gap="xl">
            <Group justify="space-between">
              <Group gap="sm">
                <Text size="30px">{course.emoji}</Text>
                <Title order={2}>{course.name || "Без названия"}</Title>
              </Group>
              <Badge variant="light" color={course.status === "open" ? "teal" : "gray"}>
                {course.status === "open" ? "Открыт" : "В подготовке"}
              </Badge>
            </Group>
            <Tabs value={search.view} onChange={(view) => navigate({ view: view ?? "home" })}>
              <Tabs.List>
                <Tabs.Tab value="home">О курсе</Tabs.Tab>
                {role !== "student" && <Tabs.Tab value="members">Участники</Tabs.Tab>}
                {role === "owner" && <Tabs.Tab value="settings">Настройки</Tabs.Tab>}
              </Tabs.List>
            </Tabs>
            {role === "student" && course.status === "draft" ? (
              <Alert color="gray" title="Курс готовится">
                Содержимое появится, когда преподаватель откроет курс.
              </Alert>
            ) : (
              <>
                {search.view === "home" && (
                  <Box maw={760}>
                    <Markdown source={course.description} />
                  </Box>
                )}
                {search.view === "members" && role !== "student" && (
                  <Members
                    key={course.id}
                    course={course}
                    update={update}
                    variant={search.variant}
                    role={role}
                    notify={setMessage}
                  />
                )}
                {search.view === "settings" && role === "owner" && (
                  <Stack gap="xl">
                    <CourseForm
                      key={course.id}
                      course={course}
                      frequent={frequent}
                      remember={remember}
                      cancel={() => navigate({ view: "home" })}
                      save={(data) => {
                        update({ ...course, ...data });
                        setMessage("Изменения сохранены. Адрес курса не изменился.");
                      }}
                    />
                    <Divider />
                    <Stack gap="sm" maw={760}>
                      <Title order={3}>Состояние курса</Title>
                      <Text size="sm" c="dimmed">
                        {course.status === "draft"
                          ? "Курс в подготовке. Студенты не видят содержимое."
                          : "Студенты могут читать содержимое курса."}
                      </Text>
                      {course.status === "draft" ? (
                        <Button w="fit-content" onClick={() => setConfirmOpen(true)}>
                          Открыть курс
                        </Button>
                      ) : (
                        <>
                          <Button
                            w="fit-content"
                            variant="default"
                            disabled={course.students.length > 0}
                            onClick={() => {
                              update({ ...course, status: "draft" });
                              setMessage("Курс возвращён в подготовку");
                            }}
                          >
                            Вернуть в подготовку
                          </Button>
                          {course.students.length > 0 && (
                            <Text size="sm" c="dimmed">
                              Нельзя вернуть курс в подготовку, пока в нём есть студенты.
                            </Text>
                          )}
                        </>
                      )}
                    </Stack>
                  </Stack>
                )}
                {((role !== "owner" && search.view === "settings") ||
                  (role === "student" && search.view === "members")) && (
                  <Alert color="gray">
                    Этот раздел недоступен выбранной роли. Откройте «О курсе».
                  </Alert>
                )}
              </>
            )}
          </Stack>
        )}
        <details className="cp-state">
          <summary>
            Состояние прототипа · {search.variant} / {variantNames[search.variant]}
          </summary>
          <pre>{JSON.stringify(state, null, 2)}</pre>
        </details>
      </Stack>
      {import.meta.env.DEV && (
        <Group className="cp-switcher" gap="sm" wrap="nowrap">
          <ActionIcon
            variant="transparent"
            color="white"
            aria-label="Предыдущий вариант"
            onClick={() => switchVariant(-1)}
          >
            <ArrowLeftIcon size={18} />
          </ActionIcon>
          <Text size="sm">
            {search.variant} · {variantNames[search.variant]}
          </Text>
          <ActionIcon
            variant="transparent"
            color="white"
            aria-label="Следующий вариант"
            onClick={() => switchVariant(1)}
          >
            <ArrowRightIcon size={18} />
          </ActionIcon>
        </Group>
      )}
      <Modal opened={confirmOpen} onClose={() => setConfirmOpen(false)} title="Открыть курс?">
        <Stack>
          <Text>Студенты получат доступ к содержимому курса.</Text>
          <Text size="sm" c="dimmed">
            Вернуть курс в подготовку можно, только если в нём нет студентов.
          </Text>
          <Group justify="end">
            <Button variant="default" onClick={() => setConfirmOpen(false)}>
              Отмена
            </Button>
            <Button
              onClick={() => {
                if (course) {
                  update({ ...course, status: "open" });
                }

                setConfirmOpen(false);
                setMessage("Курс открыт");
              }}
            >
              Открыть курс
            </Button>
          </Group>
        </Stack>
      </Modal>
    </AppLayout>
  );
}
