import { ORPCError } from "@orpc/client";
import { createFileRoute, Link, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { rpc } from "../app/client.ts";
import { AppLayout } from "../platform/ui.ts";
import { useNavigation } from "../app/navigation.ts";
import { loadNavigationCourse } from "../app/navigation-test-data.ts";

export const Route = createFileRoute("/_authenticated")({
  loader: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(rpc.auth.me.queryOptions());
    } catch (error) {
      if (error instanceof ORPCError && error.code === "UNAUTHORIZED") {
        throw redirect({ to: "/login" });
      }

      throw error;
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { data: user } = useSuspenseQuery(rpc.auth.me.queryOptions());
  const { breadcrumbs, courses, hideNavigation } = useNavigation();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const logout = useMutation({
    mutationFn: () => rpc.auth.logout.call(undefined),
    throwOnError: true,
    onSuccess: () => {
      window.location.href = "/login";
    },
  });

  return (
    <AppLayout
      breadcrumbs={breadcrumbs}
      courses={courses}
      hideNavigation={hideNavigation}
      linkComponent={Link}
      loadCourse={loadNavigationCourse}
      logout={() => logout.mutate(undefined)}
      logoutPending={logout.isPending}
      pathname={pathname}
      user={user}
    >
      <Outlet />
    </AppLayout>
  );
}
