import { useMatches } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { AppLayoutProps } from "../platform/public.ui.ts";
import { NavigationComposition, type RouteNavigation } from "./navigation";
import { rpc } from "./client";

const routes: readonly RouteNavigation[] = [
  { routeId: "/", breadcrumbs: () => [{ label: "Мои курсы", href: "/" }] },
];

export function ApplicationNavigation({ children }: { children: AppLayoutProps["children"] }) {
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
    mutationFn: (all: boolean) =>
      all ? rpc.auth.logoutAll.call(undefined) : rpc.auth.logout.call(undefined),
    onSuccess: () => {
      window.location.href = "/login";
    },
  });

  return (
    <NavigationComposition
      routes={routes}
      courses={[]}
      renderCourse={() => null}
      user={
        user
          ? {
              name: user.fullName,
              busy: logout.isPending,
              onLogout: () => logout.mutate(false),
              onLogoutAll: () => logout.mutate(true),
            }
          : undefined
      }
    >
      {children}
    </NavigationComposition>
  );
}
