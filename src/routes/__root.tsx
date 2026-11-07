import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { Text, Loader } from "@mantine/core";
import { ApplicationNavigation } from "../app/application-navigation";
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
