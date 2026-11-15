import {
  pgTable,
  bigint,
  text,
  unique,
  primaryKey,
  check,
  foreignKey,
  uniqueIndex,
} from "drizzle-orm/pg-core";
// DDL-выражения ограничений не выполняют запросов и не пишут чужие таблицы.
// oxlint-disable-next-line project/module-boundaries
import { sql } from "drizzle-orm";

import { users } from "../../platform/public.server.ts";

export const courses = pgTable(
  "courses",
  {
    id: bigint({ mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    description: text().notNull(),
    state: text({ enum: ["draft", "open"] })
      .notNull()
      .default("draft"),
  },
  (t) => [check("course_state", sql`${t.state} in ('draft', 'open')`)],
);
export const groups = pgTable(
  "course_groups",
  {
    id: bigint({ mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),
    courseId: bigint("course_id", { mode: "bigint" })
      .notNull()
      .references(() => courses.id),
    name: text().notNull(),
  },
  (t) => [unique().on(t.courseId, t.name), unique().on(t.courseId, t.id)],
);
export const memberships = pgTable(
  "course_memberships",
  {
    courseId: bigint("course_id", { mode: "bigint" })
      .notNull()
      .references(() => courses.id),
    userId: bigint("user_id", { mode: "bigint" })
      .notNull()
      .references(() => users.id),
    role: text({ enum: ["owner", "teacher", "student"] }).notNull(),
    groupId: bigint("group_id", { mode: "bigint" }),
  },
  (t) => [
    primaryKey({ columns: [t.courseId, t.userId] }),
    uniqueIndex("course_single_owner")
      .on(t.courseId)
      .where(sql`${t.role} = 'owner'`),
    foreignKey({ columns: [t.courseId, t.groupId], foreignColumns: [groups.courseId, groups.id] }),
    check(
      "membership_role_group",
      sql`(${t.role} = 'student' and ${t.groupId} is not null) or (${t.role} in ('owner', 'teacher') and ${t.groupId} is null)`,
    ),
  ],
);
