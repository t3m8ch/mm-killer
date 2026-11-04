import { oc } from "@orpc/contract";
import { z } from "zod";

const user = z.object({
  id: z.bigint(),
  fullName: z.string(),
  email: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
const authenticated = oc.errors({ UNAUTHORIZED: {} });

export const authContract = {
  users: oc.output(z.array(user)),
  login: oc
    .input(z.object({ userId: z.bigint().positive() }))
    .output(user)
    .errors({ NOT_FOUND: {} }),
  me: authenticated.output(user),
  logout: authenticated.output(z.object({ ok: z.literal(true) })),
  logoutAll: authenticated.output(z.object({ ok: z.literal(true) })),
};
