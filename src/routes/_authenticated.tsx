import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { ORPCError } from "@orpc/client";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { NavigationComposition, type RouteNavigation } from "../app/navigation";
import { rpc } from "../app/client";
import { demoCourses } from "../app/demo-courses";
import { Sidebar } from "../platform/public.ui.ts";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    try {
      await context.queryClient.query({ ...rpc.auth.me.queryOptions(), retry: false });
    } catch (error) {
      if (error instanceof ORPCError && error.code === "UNAUTHORIZED") {
        throw redirect({ to: "/login" });
      }

      throw error;
    }
  },
  component: AuthenticatedLayout,
});

const navigationRoutes: readonly RouteNavigation[] = [
  { routeId: "/_authenticated", breadcrumbs: () => [{ label: "Мои курсы", href: "/" }] },
  ...demoCourses.map((course) => ({
    routeId: `/_authenticated${course.href}`,
    breadcrumbs: () => [{ label: course.label, href: course.href }],
    courseId: () => course.id,
  })),
];

function AuthenticatedLayout() {
  const { data: user } = useSuspenseQuery(rpc.auth.me.queryOptions());
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
      renderSidebar={(sidebarProps) => (
        <Sidebar
          {...sidebarProps}
          courses={demoCourses}
          renderCourseBranch={(_course, heading) => heading}
          user={{
            name: user.fullName,
            busy: logout.isPending,
            onLogout: () => logout.mutate(),
          }}
        />
      )}
    >
      <Outlet />
    </NavigationComposition>
  );
}
