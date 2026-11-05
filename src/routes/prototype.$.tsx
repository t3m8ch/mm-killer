import { createFileRoute } from "@tanstack/react-router";
import { prototypePageQuery } from "../app/navigation-prototype/page-query";
import { NavigationPrototype } from "../app/navigation-prototype/navigation-prototype";

export const Route = createFileRoute("/prototype/$")({
  validateSearch: (search: Record<string, unknown>) => ({
    variant: ["A", "B", "C"].includes(String(search.variant)) ? String(search.variant) : "A",
    role: search.role === "student" ? "student" : "teacher",
    status: typeof search.status === "string" ? search.status : "all",
  }),
  loaderDeps: ({ search }) => ({ status: search.status, role: search.role }),
  loader: async ({ params, deps, context }) => {
    const options = prototypePageQuery(params._splat ?? "", deps);
    const fromCache = context.queryClient.getQueryData(options.queryKey) !== undefined;
    const data = await context.queryClient.ensureQueryData({
      ...options,
      revalidateIfStale: true,
    });

    return { data, fromCache };
  },
  shouldReload: true,
  gcTime: 0,
  // При переходе сохранять каркас и старый экран до готовности данных.
  pendingMs: 20_000,
  component: NavigationPrototype,
});
