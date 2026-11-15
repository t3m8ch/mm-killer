import { useState } from "react";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Anchor,
  Alert,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  Textarea,
  Title,
  Select,
} from "@mantine/core";
import { coursesRpc } from "./client.ui.ts";

export function courseBreadcrumb(course: { id: bigint; name: string }) {
  return { label: course.name, href: `/courses/${course.id}` };
}

export function CourseList() {
  const { data } = useSuspenseQuery(coursesRpc.list.queryOptions());
  const cache = useQueryClient();
  const [name, setName] = useState("");
  const create = useMutation({
    mutationFn: () => coursesRpc.create.call({ name, description: "" }),
    onSuccess: async () => {
      setName("");
      await cache.invalidateQueries();
    },
  });

  return (
    <Stack>
      <Title order={2}>Мои курсы</Title>
      {data.map((course) => (
        <Anchor key={String(course.id)} href={courseBreadcrumb(course).href}>
          {course.name} · {course.state === "draft" ? "В подготовке" : "Открыт"}
        </Anchor>
      ))}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          create.mutate();
        }}
      >
        <Group align="end">
          <TextInput
            label="Название нового курса"
            required
            maxLength={200}
            value={name}
            onChange={(event) => setName(event.currentTarget.value)}
          />
          <Button type="submit" loading={create.isPending}>
            Создать курс
          </Button>
        </Group>
      </form>
      {create.error && <Alert color="red">Не удалось создать курс</Alert>}
    </Stack>
  );
}

export function CoursePage({ courseId }: { courseId: bigint }) {
  const { data } = useSuspenseQuery(coursesRpc.get.queryOptions({ input: { courseId } }));

  if (data.kind === "preparing") {
    return (
      <Stack>
        <Title>{data.name}</Title>
        <Text>Курс готовится</Text>
      </Stack>
    );
  }

  return (
    <Stack>
      <Anchor href="/">Мои курсы</Anchor>
      <Title>{data.course.name}</Title>
      <Text>{data.course.description}</Text>
      {data.course.role !== "student" && <CourseManagement course={data.course} />}
    </Stack>
  );
}

function CourseManagement({
  course,
}: {
  course: {
    id: bigint;
    name: string;
    description: string;
    state: "draft" | "open";
    role: "owner" | "teacher" | "student";
  };
}) {
  const courseId = course.id;
  const { data: participants } = useSuspenseQuery(
    coursesRpc.participants.queryOptions({ input: { courseId } }),
  );
  const { data: groups } = useSuspenseQuery(
    coursesRpc.groups.queryOptions({ input: { courseId } }),
  );
  const cache = useQueryClient();

  const [name, setName] = useState(course.name);
  const [description, setDescription] = useState(course.description);
  const [groupName, setGroupName] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const action = useMutation({
    mutationFn: (run: () => Promise<unknown>) => run(),
    onSuccess: async () => {
      await cache.invalidateQueries();
    },
  });

  return (
    <Stack>
      <Title order={2}>Настройки</Title>
      <TextInput
        label="Название"
        value={name}
        onChange={(event) => setName(event.currentTarget.value)}
      />
      <Textarea
        label="Описание"
        value={description}
        onChange={(event) => setDescription(event.currentTarget.value)}
      />
      <Group>
        <Button
          onClick={() =>
            action.mutate(() =>
              coursesRpc.configure.call({ courseId, name, description, state: course.state }),
            )
          }
        >
          Сохранить
        </Button>
        <Button
          onClick={() =>
            action.mutate(() =>
              coursesRpc.configure.call({
                courseId,
                name,
                description,
                state: course.state === "draft" ? "open" : "draft",
              }),
            )
          }
        >
          {course.state === "draft" ? "Открыть курс" : "Вернуть в подготовку"}
        </Button>
      </Group>
      <Title order={2}>Участники</Title>
      {participants.map((member) => (
        <Group key={String(member.userId)}>
          <Text>
            {String(member.userId)} ·{" "}
            {{ owner: "Владелец", teacher: "Преподаватель", student: "Студент" }[member.role]}
          </Text>
          {member.role === "student" && (
            <>
              <Select
                aria-label="Подгруппа"
                value={String(member.groupId)}
                data={groups.map((group) => ({ value: String(group.id), label: group.name }))}
                onChange={(value) => {
                  if (value) {
                    action.mutate(() =>
                      coursesRpc.moveStudent.call({
                        courseId,
                        userId: member.userId,
                        groupId: BigInt(value),
                      }),
                    );
                  }
                }}
              />
              <Button
                color="red"
                onClick={() =>
                  action.mutate(() =>
                    coursesRpc.removeStudent.call({ courseId, userId: member.userId }),
                  )
                }
              >
                Исключить
              </Button>
            </>
          )}
          {course.role === "owner" && member.role === "teacher" && (
            <Button
              onClick={() =>
                action.mutate(() =>
                  coursesRpc.setTeacher.call({ courseId, userId: member.userId, enabled: false }),
                )
              }
            >
              Удалить преподавателя
            </Button>
          )}
        </Group>
      ))}
      {course.role === "owner" && (
        <Group align="end">
          <TextInput
            label="ID преподавателя"
            value={teacherId}
            onChange={(event) => setTeacherId(event.currentTarget.value)}
          />
          <Button
            disabled={!/^[1-9][0-9]*$/.test(teacherId)}
            onClick={() =>
              action.mutate(() =>
                coursesRpc.setTeacher.call({ courseId, userId: BigInt(teacherId), enabled: true }),
              )
            }
          >
            Добавить преподавателя
          </Button>
        </Group>
      )}
      <Title order={2}>Подгруппы</Title>
      {groups.map((group) => (
        <Group key={String(group.id)}>
          <TextInput
            aria-label="Название подгруппы"
            defaultValue={group.name}
            onBlur={(event) => {
              const value = event.currentTarget.value;

              if (value !== group.name) {
                action.mutate(() =>
                  coursesRpc.renameGroup.call({ courseId, groupId: group.id, name: value }),
                );
              }
            }}
          />
          <Button
            color="red"
            onClick={() =>
              action.mutate(() => coursesRpc.deleteGroup.call({ courseId, groupId: group.id }))
            }
          >
            Удалить
          </Button>
        </Group>
      ))}
      <Group align="end">
        <TextInput
          label="Новая подгруппа"
          value={groupName}
          onChange={(event) => setGroupName(event.currentTarget.value)}
        />
        <Button
          onClick={() =>
            action.mutate(() => coursesRpc.createGroup.call({ courseId, name: groupName }))
          }
        >
          Добавить
        </Button>
      </Group>
      {action.error && (
        <Alert color="red">
          Операция недоступна. Проверьте права, состав курса и уникальность названия.
        </Alert>
      )}
    </Stack>
  );
}
