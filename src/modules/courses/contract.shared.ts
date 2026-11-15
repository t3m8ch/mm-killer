import { oc } from "@orpc/contract";
import { z } from "zod";

const id = z.bigint().positive();
const name = z.string().trim().min(1).max(200);
const courseId = z.object({ courseId: id });
const state = z.enum(["draft", "open"]);
const role = z.enum(["owner", "teacher", "student"]);

const course = z.object({ id, name, description: z.string(), state, role });
const group = z.object({ id, courseId: id, name });
const membership = z.discriminatedUnion("role", [
  z.object({ userId: id, role: z.literal("owner"), groupId: z.null() }),
  z.object({ userId: id, role: z.literal("teacher"), groupId: z.null() }),
  z.object({ userId: id, role: z.literal("student"), groupId: id }),
]);
const procedure = oc.errors({ UNAUTHORIZED: {}, FORBIDDEN: {}, NOT_FOUND: {}, CONFLICT: {} });
const ok = z.object({ ok: z.literal(true) });

export const coursesContract = {
  list: procedure.output(z.array(course)),
  create: procedure.input(z.object({ name, description: z.string().max(10000) })).output(course),
  get: procedure
    .input(courseId)
    .output(
      z.discriminatedUnion("kind", [
        z.object({ kind: z.literal("preparing"), id, name, role: z.literal("student") }),
        z.object({ kind: z.literal("content"), course }),
      ]),
    ),
  configure: procedure
    .input(courseId.extend({ name, description: z.string().max(10000), state }))
    .output(ok),
  participants: procedure.input(courseId).output(z.array(membership)),
  setTeacher: procedure.input(courseId.extend({ userId: id, enabled: z.boolean() })).output(ok),
  removeStudent: procedure.input(courseId.extend({ userId: id })).output(ok),
  moveStudent: procedure.input(courseId.extend({ userId: id, groupId: id })).output(ok),
  groups: procedure.input(courseId).output(z.array(group)),
  createGroup: procedure.input(courseId.extend({ name })).output(group),
  renameGroup: procedure.input(courseId.extend({ groupId: id, name })).output(ok),
  deleteGroup: procedure.input(courseId.extend({ groupId: id })).output(ok),
};
