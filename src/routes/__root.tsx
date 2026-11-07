import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useMatches,
} from "@tanstack/react-router";
import {
  QueryClientProvider,
  useQuery,
  useMutation,
  type QueryClient,
} from "@tanstack/react-query";
import { Text, Loader } from "@mantine/core";
import type { ReactNode } from "react";
import { NavigationComposition, type RouteNavigation } from "../app/navigation";
import { rpc } from "../app/client";
import { Layout } from "../platform/public.ui.ts";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Root,
  pendingComponent: () => <Loader />,
  errorComponent: () => <Text role="alert">Не удалось загрузить страницу</Text>,
  notFoundComponent: () => <Text>Страница не найдена</Text>,
});
function Root() {
  const { queryClient } = Route.useRouteContext();

  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <HeadContent />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <Layout>
            <ApplicationNavigation>
              <Outlet />
            </ApplicationNavigation>
          </Layout>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}

const navigationRoutes: readonly RouteNavigation[] = [
  { routeId: "/", breadcrumbs: () => [{ label: "Мои курсы", href: "/" }] },
];

function ApplicationNavigation({ children }: { children: ReactNode }) {
  const isPublic = useMatches({
    select: (matches) => matches.some((match) => match.staticData.navigationMode === "public"),
  });
  const initialUser = useMatches({
    select: (matches) => matches.find((match) => match.routeId === "/")?.loaderData,
  });
  const { data: user } = useQuery({
    ...rpc.auth.me.queryOptions(),
    enabled: !isPublic,
    initialData: initialUser,
    retry: false,
  });
  const logout = useMutation({
    throwOnError: true,
    mutationFn: () => rpc.auth.logout.call(undefined),
    onSuccess: () => {
      window.location.href = "/login";
    },
  });

  return (
    <NavigationComposition
      routes={navigationRoutes}
      courses={[]}
      renderCourse={() => null}
      user={
        user
          ? {
              name: user.fullName,
              busy: logout.isPending,
              onLogout: () => logout.mutate(),
            }
          : undefined
      }
    >
      {children}
    </NavigationComposition>
  );
}
