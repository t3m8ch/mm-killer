import { createRouterClient } from "@orpc/server";
import { expect, it } from "vitest";
import { authApi, seedUsers } from "../../platform/public.server.ts";
import { coursesApi } from "./public.server.ts";
import { rollbackTest } from "../../../tests/helpers/database";

it("создать курс с владельцем и подгруппой, скрыть его от неучастника", () =>
  rollbackTest(async (context) => {
    await seedUsers(context.db, context.now());
    const [owner, outsider] = await createRouterClient(authApi, { context }).users();
    const client = createRouterClient(coursesApi, { context: { ...context, user: owner } });
    const other = createRouterClient(coursesApi, { context: { ...context, user: outsider } });

    const course = await client.create({ name: "Алгоритмы", description: "Курс" });

    expect(course).toMatchObject({ name: "Алгоритмы", state: "draft", role: "owner" });
    expect(await client.list()).toEqual([course]);
    expect(await client.participants({ courseId: course.id })).toEqual([
      { userId: owner.id, role: "owner", groupId: null },
    ]);
    expect(await client.groups({ courseId: course.id })).toHaveLength(1);
    expect(await other.list()).toEqual([]);
    await expect(other.get({ courseId: course.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
  }));

it("студент в draft видит подготовку, перевод и исключение меняют только участие", () =>
  rollbackTest(async (context) => {
    await seedUsers(context.db, context.now());
    const [owner, student] = await createRouterClient(authApi, { context }).users();
    const client = createRouterClient(coursesApi, { context: { ...context, user: owner } });
    const learner = createRouterClient(coursesApi, { context: { ...context, user: student } });

    const course = await client.create({ name: "Курс", description: "Содержание" });
    const [group] = await client.groups({ courseId: course.id });
    const { enrollStudent } = await import("./public.server.ts");

    await enrollStudent(context, course.id, student.id, group.id);
    expect(await learner.get({ courseId: course.id })).toEqual({
      kind: "preparing",
      id: course.id,
      name: "Курс",
      role: "student",
    });
    await expect(learner.participants({ courseId: course.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await client.configure({
      courseId: course.id,
      name: "Курс",
      description: "Содержание",
      state: "open",
    });
    expect(await learner.get({ courseId: course.id })).toMatchObject({ kind: "content" });
    await expect(
      client.configure({ courseId: course.id, name: "Курс", description: "", state: "draft" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const second = await client.createGroup({ courseId: course.id, name: "Вечерняя" });

    await expect(
      client.deleteGroup({ courseId: course.id, groupId: group.id }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    await client.moveStudent({ courseId: course.id, userId: student.id, groupId: second.id });
    await client.deleteGroup({ courseId: course.id, groupId: group.id });
    await client.removeStudent({ courseId: course.id, userId: student.id });
    await expect(learner.get({ courseId: course.id })).rejects.toMatchObject({ code: "FORBIDDEN" });

    await enrollStudent(context, course.id, student.id, second.id);
    expect(await learner.get({ courseId: course.id })).toMatchObject({ kind: "content" });
  }));

it("только владелец управляет преподавателями; права изолированы курсом", () =>
  rollbackTest(async (context) => {
    await seedUsers(context.db, context.now());
    const [owner, teacher] = await createRouterClient(authApi, { context }).users();
    const client = createRouterClient(coursesApi, { context: { ...context, user: owner } });
    const other = createRouterClient(coursesApi, { context: { ...context, user: teacher } });
    const course = await client.create({ name: "Первый", description: "" });
    const privateCourse = await client.create({ name: "Второй", description: "" });

    await client.setTeacher({ courseId: course.id, userId: teacher.id, enabled: true });
    expect(await other.list()).toHaveLength(1);
    await other.configure({
      courseId: course.id,
      name: "Новое имя",
      description: "",
      state: "open",
    });
    await expect(
      other.setTeacher({ courseId: course.id, userId: owner.id, enabled: false }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(other.groups({ courseId: privateCourse.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });

    await client.setTeacher({ courseId: course.id, userId: teacher.id, enabled: false });
    await expect(other.get({ courseId: course.id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    const [group] = await client.groups({ courseId: course.id });

    await expect(
      client.deleteGroup({ courseId: course.id, groupId: group.id }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      client.createGroup({ courseId: course.id, name: group.name }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      client.setTeacher({ courseId: course.id, userId: owner.id, enabled: false }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  }));

it("конкурентное удаление подгрупп сохраняет последнюю; вступление согласовано с удалением", async () => {
  const { isolatedDatabase, clock } = await import("../../../tests/helpers/database");
  const { enrollStudent } = await import("./public.server.ts");
  const database = await isolatedDatabase("courses_races");

  try {
    const context = { db: database.db, now: clock().now };

    await seedUsers(context.db, context.now());
    const [owner, student] = await createRouterClient(authApi, { context }).users();
    const client = createRouterClient(coursesApi, { context: { ...context, user: owner } });
    const course = await client.create({ name: "Гонки", description: "" });
    const [first] = await client.groups({ courseId: course.id });
    const second = await client.createGroup({ courseId: course.id, name: "Вторая" });

    const results = await Promise.allSettled([
      client.deleteGroup({ courseId: course.id, groupId: first.id }),
      client.deleteGroup({ courseId: course.id, groupId: second.id }),
    ]);

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await client.groups({ courseId: course.id })).toHaveLength(1);

    const target = await client.createGroup({ courseId: course.id, name: "Целевая" });
    const race = await Promise.allSettled([
      client.deleteGroup({ courseId: course.id, groupId: target.id }),
      enrollStudent(context, course.id, student.id, target.id),
    ]);

    expect(race.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const remaining = await client.groups({ courseId: course.id });
    const members = await client.participants({ courseId: course.id });

    expect(
      members.every(
        (member) =>
          member.role !== "student" || remaining.some((group) => group.id === member.groupId),
      ),
    ).toBe(true);
  } finally {
    await database.close();
  }
});

it("конкурентное вступление уникально и согласовано с возвратом в draft", async () => {
  const { isolatedDatabase, clock } = await import("../../../tests/helpers/database");
  const { enrollStudent } = await import("./public.server.ts");
  const database = await isolatedDatabase("course_state");

  try {
    const context = { db: database.db, now: clock().now };

    await seedUsers(context.db, context.now());
    const [owner, student] = await createRouterClient(authApi, { context }).users();
    const client = createRouterClient(coursesApi, { context: { ...context, user: owner } });
    const course = await client.create({ name: "Состояния", description: "" });
    const [group] = await client.groups({ courseId: course.id });

    await client.configure({
      courseId: course.id,
      name: course.name,
      description: "",
      state: "open",
    });
    await Promise.allSettled([
      client.configure({ courseId: course.id, name: course.name, description: "", state: "draft" }),
      enrollStudent(context, course.id, student.id, group.id),
      enrollStudent(context, course.id, student.id, group.id),
    ]);

    expect(
      (await client.participants({ courseId: course.id })).filter(
        (member) => member.userId === student.id,
      ),
    ).toHaveLength(1);
    // Вступление в draft разрешено; повторный возврат из open при студенте запрещён.
    await client.configure({
      courseId: course.id,
      name: course.name,
      description: "",
      state: "open",
    });
    await expect(
      client.configure({ courseId: course.id, name: course.name, description: "", state: "draft" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  } finally {
    await database.close();
  }
});
