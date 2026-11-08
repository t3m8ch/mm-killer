import { useMatches, useRouterState, type AnyRouteMatch } from "@tanstack/react-router";
import { useQueries, type UseQueryOptions } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { AppLayout } from "../platform/public.ui.ts";
import type { Breadcrumb } from "../platform/public.shared.ts";

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    navigationMode?: "normal" | "diff" | "public";
  }
}

/**
 * Настройки навигации для одного маршрута: как получить из его данных крошки
 * для хедера и ID курса, ветку которого нужно раскрыть в сайдбаре.
 *
 * Сборка приложения создаёт такие записи в navigationRoutes (src/routes/__root.tsx)
 * и передаёт их в NavigationComposition. Он сопоставляет routeId с активными
 * маршрутами из useMatches и вызывает breadcrumbs и, если задана, courseId.
 * Если задана query, он подписывается на тот же запрос, который загрузил loader:
 * функции получают актуальные данные из кэша, а до их появления — loaderData.
 * Без query функции получают loaderData напрямую. AppLayout получает готовые
 * крошки через props; ID курса передаётся в renderSidebar для сборки панели.
 *
 * При подключении предметных маршрутов сборка связывает их с чистыми функциями
 * крошек из публичных интерфейсов модулей. Эти функции работают с переданными
 * данными, не загружают их и не рисуют UI. Пример записей для курсов, заданий
 * и попыток находится в tests/fixtures/navigation/fixture.tsx.
 */
export interface RouteNavigation {
  routeId: string;
  breadcrumbs: (data: unknown) => readonly Breadcrumb[];
  query?: (loaderData: unknown) => Pick<UseQueryOptions, "queryKey" | "queryFn" | "staleTime">;
  courseId?: (data: unknown) => string;
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
    select: (state) => ({ path: state.location.pathname, pending: state.isLoading }),
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
