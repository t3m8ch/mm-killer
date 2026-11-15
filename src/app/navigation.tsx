import {
  useMatches,
  useRouterState,
  type AnyRoute,
  type AnyRouteMatch,
} from "@tanstack/react-router";
import { useQueries, type UseQueryOptions } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AppLayout } from "../platform/public.ui.ts";
import type { Breadcrumb } from "../platform/public.shared.ts";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    navigationMode?: "normal" | "diff" | "public";
  }
}

/** Запись реестра с типами, скрытыми только внутри сборки навигации. */
interface RouteNavigation {
  routeId: string;
  breadcrumbs: (data: unknown) => readonly Breadcrumb[];
  query?: (loaderData: unknown) => Pick<UseQueryOptions, "queryKey" | "queryFn" | "staleTime">;
  courseId?: (data: unknown) => string;
}

/** Данные callbacks и Query выводятся из loader конкретного маршрута. */
export function routeNavigation<TRoute extends AnyRoute>(
  route: TRoute,
  options: {
    breadcrumbs: (data: NoInfer<TRoute["types"]["loaderData"]>) => readonly Breadcrumb[];
    query?: (data: NoInfer<TRoute["types"]["loaderData"]>) => Pick<
      UseQueryOptions<NoInfer<TRoute["types"]["loaderData"]>>,
      "queryKey" | "queryFn"
    > & {
      staleTime?: number;
    };
    courseId?: (data: NoInfer<TRoute["types"]["loaderData"]>) => string;
  },
): RouteNavigation {
  type Data = TRoute["types"]["loaderData"];
  const { breadcrumbs, query, courseId } = options;

  return {
    // Router назначает ID при сборке дерева, после создания записей реестра.
    get routeId() {
      return route.id;
    },
    breadcrumbs: (data) => breadcrumbs(data as Data),
    query: query ? (data) => query(data as Data) : undefined,
    courseId: courseId ? (data) => courseId(data as Data) : undefined,
  };
}

export function NavigationComposition({
  routes,
  children,
  renderSidebar,
}: {
  children: ReactNode;
  routes: readonly RouteNavigation[];
  renderSidebar: (options: {
    path: string;
    currentCourseId?: string;
    drawer: boolean;
  }) => ReactNode;
}) {
  const matches = useMatches();
  const { path, pending } = useRouterState({
    select: (state) => ({
      path: state.matches.at(-1)?.pathname ?? state.location.pathname,
      pending: state.isLoading,
    }),
  });

  const navigationRoutesWithData = useNavigationRouteData(matches, routes);
  const { breadcrumbs, currentCourseId, mode } = buildNavigationState(
    navigationRoutesWithData,
    matches,
  );

  if (mode === "public") {
    return children;
  }

  return (
    <AppLayout
      path={path}
      breadcrumbs={breadcrumbs}
      mode={mode}
      pending={pending}
      renderSidebar={({ drawer }) => renderSidebar({ path, currentCourseId, drawer })}
    >
      {children}
    </AppLayout>
  );
}

type NavigationMatch = Pick<AnyRouteMatch, "routeId" | "loaderData" | "staticData">;

interface NavigationRouteData {
  source: RouteNavigation;
  data: unknown;
}

function useNavigationRouteData(
  matches: readonly NavigationMatch[],
  routes: readonly RouteNavigation[],
): NavigationRouteData[] {
  const activeNavigationRoutes = matches.flatMap((match) => {
    const source = routes.find((route) => route.routeId === match.routeId);

    return source ? [{ source, loaderData: match.loaderData }] : [];
  });

  const routeQueries = activeNavigationRoutes.flatMap(({ source, loaderData }) => {
    if (!source.query) {
      return [];
    }

    return [{ routeId: source.routeId, options: source.query(loaderData) }];
  });
  const queryResults = useQueries({
    queries: routeQueries.map(({ options }) => options),
  });
  const queryDataByRouteId = new Map(
    routeQueries.map(({ routeId }, index) => [routeId, queryResults[index]?.data]),
  );

  return activeNavigationRoutes.map(({ source, loaderData }) => ({
    source,
    data: queryDataByRouteId.get(source.routeId) ?? loaderData,
  }));
}

function buildNavigationState(
  navigationRoutesWithData: readonly NavigationRouteData[],
  matches: readonly NavigationMatch[],
) {
  const breadcrumbs = navigationRoutesWithData.flatMap((entry) =>
    entry.source.breadcrumbs(entry.data),
  );
  const currentCourseId = navigationRoutesWithData
    .map((entry) => entry.source.courseId?.(entry.data))
    .findLast((id) => id !== undefined);
  const mode =
    matches
      .map((match) => match.staticData.navigationMode)
      .findLast((value) => value !== undefined) ?? "normal";

  return { breadcrumbs, currentCourseId, mode };
}
