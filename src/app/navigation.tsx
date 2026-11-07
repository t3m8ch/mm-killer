import { useMatches, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQueries, type UseQueryOptions } from "@tanstack/react-query";
import { AppLayout, type AppLayoutProps } from "../platform/public.ui.ts";
import type { Breadcrumb } from "../platform/public.shared.ts";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    navigationMode?: "normal" | "diff" | "public";
  }
}

/** Реестр сборки: модули возвращают чистые описания, UI не знает об их данных. */
export interface RouteNavigation {
  routeId: string;
  breadcrumbs: (data: unknown) => readonly Breadcrumb[];
  query?: (loaderData: unknown) => Pick<UseQueryOptions, "queryKey" | "queryFn" | "staleTime">;
  courseId?: (data: unknown) => string;
}

export function NavigationComposition({
  routes,
  children,
  ...props
}: Omit<
  AppLayoutProps,
  "breadcrumbs" | "path" | "mode" | "pending" | "currentCourseId" | "onNavigate"
> & {
  routes: readonly RouteNavigation[];
}) {
  const matches = useMatches();
  const navigate = useNavigate();
  const { path, pending } = useRouterState({
    select: (state) => ({ path: state.location.pathname, pending: state.isLoading }),
  });
  const active = matches.flatMap((match) => {
    const source = routes.find((route) => route.routeId === match.routeId);

    return source ? [{ source, loaderData: match.loaderData }] : [];
  });

  const queries = useQueries({
    queries: active.map(
      ({ source, loaderData }) =>
        source.query?.(loaderData) ?? { queryKey: ["navigation", source.routeId], enabled: false },
    ),
  });
  const data = active.map((entry, index) => ({
    source: entry.source,
    data: queries[index]?.data ?? entry.loaderData,
  }));

  const breadcrumbs = data.flatMap((entry) => entry.source.breadcrumbs(entry.data));
  const currentCourseId = data
    .map((entry) => entry.source.courseId?.(entry.data))
    .findLast((id) => id !== undefined);
  const mode =
    matches
      .map((match) => match.staticData.navigationMode)
      .findLast((value) => value !== undefined) ?? "normal";

  if (mode === "public") {
    return children;
  }

  return (
    <AppLayout
      {...props}
      onNavigate={(href) => {
        void navigate({ to: href });
      }}
      path={path}
      breadcrumbs={breadcrumbs}
      currentCourseId={currentCourseId}
      mode={mode}
      pending={pending}
    >
      {children}
    </AppLayout>
  );
}
