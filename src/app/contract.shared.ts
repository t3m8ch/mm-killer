import { authContract } from "../platform/public.shared.ts";
import { coursesContract } from "../modules/courses/public.shared.ts";
// plop:imports

export const contract = {
  auth: authContract,
  courses: coursesContract,
  // plop:contracts
};
