import { implement, ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { authed, transaction, users } from "../../platform/public.server.ts";
import type { Context } from "../../platform/public.server.ts";
import { coursesContract } from "./contract.shared.ts";
import { courses, groups, memberships } from "./schema.server.ts";

export async function memberOf(context: Context, courseId: bigint) {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  const [course] = await context.db
    .select({ id: courses.id })
    .from(courses)
    .where(eq(courses.id, courseId));

  if (!course) {
    throw new ORPCError("NOT_FOUND");
  }

  const [member] = await context.db
    .select()
    .from(memberships)
    .where(and(eq(memberships.courseId, courseId), eq(memberships.userId, context.user.id)));

  if (!member) {
    throw new ORPCError("FORBIDDEN");
  }

  return member;
}

export async function inCourse(context: Context, courseId: bigint) {
  const member = await memberOf(context, courseId);
  const [course] = await context.db.select().from(courses).where(eq(courses.id, courseId));

  if (!course) {
    throw new ORPCError("NOT_FOUND");
  }

  if (member.role === "student" && course.state === "draft") {
    throw new ORPCError("FORBIDDEN");
  }

  return { ...course, role: member.role };
}

async function manage(context: Context, courseId: bigint, ownerOnly = false) {
  // Все операции, меняющие межстрочные инварианты, сериализуются строкой курса.
  await context.db.select().from(courses).where(eq(courses.id, courseId)).for("update");
  const member = await memberOf(context, courseId);

  if (member.role === "student" || (ownerOnly && member.role !== "owner")) {
    throw new ORPCError("FORBIDDEN");
  }
}

export async function enrollStudent(
  context: Context,
  courseId: bigint,
  userId: bigint,
  groupId: bigint,
) {
  await context.db.transaction(async (db) => {
    await enrollStudentInTransaction({ ...context, db }, courseId, userId, groupId);
  });
}

async function enrollStudentInTransaction(
  context: Context,
  courseId: bigint,
  userId: bigint,
  groupId: bigint,
) {
  const [course] = await context.db
    .select()
    .from(courses)
    .where(eq(courses.id, courseId))
    .for("update");

  if (!course) {
    throw new ORPCError("NOT_FOUND");
  }

  const [group] = await context.db
    .select()
    .from(groups)
    .where(and(eq(groups.id, groupId), eq(groups.courseId, courseId)));

  if (!group) {
    throw new ORPCError("NOT_FOUND");
  }

  await context.db
    .insert(memberships)
    .values({ courseId, userId, groupId, role: "student" })
    .onConflictDoNothing();
}

const os = implement(coursesContract).$context<Context>();
const ok = () => ({ ok: true as const });

export function createCoursesApi(
  afterGroupRemoved: (
    context: Context,
    courseId: bigint,
    groupId: bigint,
  ) => Promise<void> = async () => {},
) {
  return {
    list: os.list.use(authed).handler(async ({ context }) =>
      context.db
        .select({
          id: courses.id,
          name: courses.name,
          description: courses.description,
          state: courses.state,
          role: memberships.role,
        })
        .from(courses)
        .innerJoin(
          memberships,
          and(eq(memberships.courseId, courses.id), eq(memberships.userId, context.user.id)),
        )
        .orderBy(courses.id)
        .then((rows) =>
          rows.map((row) =>
            row.role === "student" && row.state === "draft" ? { ...row, description: "" } : row,
          ),
        ),
    ),
    create: os.create
      .use(authed)
      .use(transaction)
      .handler(async ({ context, input }) => {
        const [course] = await context.db.insert(courses).values(input).returning();

        await context.db
          .insert(memberships)
          .values({ courseId: course.id, userId: context.user.id, role: "owner" });
        await context.db.insert(groups).values({ courseId: course.id, name: "Основная" });

        return { ...course, role: "owner" as const };
      }),
    get: os.get.use(authed).handler(async ({ context, input }) => {
      const member = await memberOf(context, input.courseId);
      const [course] = await context.db
        .select()
        .from(courses)
        .where(eq(courses.id, input.courseId));

      if (member.role === "student" && course.state === "draft") {
        return {
          kind: "preparing" as const,
          id: course.id,
          name: course.name,
          role: "student" as const,
        };
      }

      return { kind: "content" as const, course: { ...course, role: member.role } };
    }),
    configure: os.configure
      .use(authed)
      .use(transaction)
      .handler(async ({ context, input }) => {
        await manage(context, input.courseId);
        const students = await context.db
          .select()
          .from(memberships)
          .where(and(eq(memberships.courseId, input.courseId), eq(memberships.role, "student")))
          .limit(1);

        const [current] = await context.db
          .select()
          .from(courses)
          .where(eq(courses.id, input.courseId));

        if (current.state === "open" && input.state === "draft" && students.length) {
          throw new ORPCError("CONFLICT");
        }

        await context.db
          .update(courses)
          .set({ name: input.name, description: input.description, state: input.state })
          .where(eq(courses.id, input.courseId));

        return ok();
      }),
    participants: os.participants.use(authed).handler(async ({ context, input }) => {
      await manageRead(context, input.courseId);
      const rows = await context.db
        .select()
        .from(memberships)
        .where(eq(memberships.courseId, input.courseId))
        .orderBy(memberships.userId);

      return rows.map((row) =>
        row.role === "student"
          ? { userId: row.userId, role: row.role, groupId: row.groupId! }
          : { userId: row.userId, role: row.role, groupId: null },
      );
    }),
    setTeacher: os.setTeacher
      .use(authed)
      .use(transaction)
      .handler(async ({ context, input }) => {
        await manage(context, input.courseId, true);
        const [user] = await context.db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.id, input.userId));

        if (!user) {
          throw new ORPCError("NOT_FOUND");
        }

        const where = and(
          eq(memberships.courseId, input.courseId),
          eq(memberships.userId, input.userId),
        );
        const [existing] = await context.db.select().from(memberships).where(where);

        if (existing && existing.role !== "teacher") {
          throw new ORPCError("CONFLICT");
        }

        if (input.enabled) {
          await context.db
            .insert(memberships)
            .values({ courseId: input.courseId, userId: input.userId, role: "teacher" })
            .onConflictDoNothing();
        } else {
          await context.db.delete(memberships).where(where);
        }

        return ok();
      }),
    removeStudent: os.removeStudent
      .use(authed)
      .use(transaction)
      .handler(async ({ context, input }) => {
        await manage(context, input.courseId);
        await context.db
          .delete(memberships)
          .where(
            and(
              eq(memberships.courseId, input.courseId),
              eq(memberships.userId, input.userId),
              eq(memberships.role, "student"),
            ),
          );

        return ok();
      }),
    moveStudent: os.moveStudent
      .use(authed)
      .use(transaction)
      .handler(async ({ context, input }) => {
        await manage(context, input.courseId);
        const [group] = await context.db
          .select()
          .from(groups)
          .where(and(eq(groups.id, input.groupId), eq(groups.courseId, input.courseId)));

        if (!group) {
          throw new ORPCError("NOT_FOUND");
        }

        const changed = await context.db
          .update(memberships)
          .set({ groupId: input.groupId })
          .where(
            and(
              eq(memberships.courseId, input.courseId),
              eq(memberships.userId, input.userId),
              eq(memberships.role, "student"),
            ),
          )
          .returning();

        if (!changed.length) {
          throw new ORPCError("NOT_FOUND");
        }

        return ok();
      }),
    groups: os.groups.use(authed).handler(async ({ context, input }) => {
      await manageRead(context, input.courseId);

      return context.db
        .select()
        .from(groups)
        .where(eq(groups.courseId, input.courseId))
        .orderBy(groups.id);
    }),
    createGroup: os.createGroup
      .use(authed)
      .use(transaction)
      .handler(async ({ context, input }) => {
        await manage(context, input.courseId);
        const [group] = await context.db
          .insert(groups)
          .values(input)
          .onConflictDoNothing()
          .returning();

        if (!group) {
          throw new ORPCError("CONFLICT");
        }

        return group;
      }),
    renameGroup: os.renameGroup
      .use(authed)
      .use(transaction)
      .handler(async ({ context, input }) => {
        await manage(context, input.courseId);
        const duplicate = await context.db
          .select()
          .from(groups)
          .where(and(eq(groups.courseId, input.courseId), eq(groups.name, input.name)));

        if (duplicate.some((group) => group.id !== input.groupId)) {
          throw new ORPCError("CONFLICT");
        }

        const changed = await context.db
          .update(groups)
          .set({ name: input.name })
          .where(and(eq(groups.courseId, input.courseId), eq(groups.id, input.groupId)))
          .returning();

        if (!changed.length) {
          throw new ORPCError("NOT_FOUND");
        }

        return ok();
      }),
    deleteGroup: os.deleteGroup
      .use(authed)
      .use(transaction)
      .handler(async ({ context, input }) => {
        await manage(context, input.courseId);
        const all = await context.db
          .select()
          .from(groups)
          .where(eq(groups.courseId, input.courseId));

        if (!all.some((group) => group.id === input.groupId)) {
          throw new ORPCError("NOT_FOUND");
        }

        const students = await context.db
          .select()
          .from(memberships)
          .where(
            and(eq(memberships.courseId, input.courseId), eq(memberships.groupId, input.groupId)),
          )
          .limit(1);

        if (all.length === 1 || students.length) {
          throw new ORPCError("CONFLICT");
        }

        await context.db.delete(groups).where(eq(groups.id, input.groupId));
        await afterGroupRemoved(context, input.courseId, input.groupId);

        return ok();
      }),
  };
}

export const coursesApi = createCoursesApi();

async function manageRead(context: Context, courseId: bigint) {
  const member = await memberOf(context, courseId);

  if (member.role === "student") {
    throw new ORPCError("FORBIDDEN");
  }
}
