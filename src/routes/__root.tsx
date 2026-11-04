import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { MantineProvider, Container, Text, Loader } from "@mantine/core";
import "@mantine/core/styles.css";

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
          <MantineProvider>
            <Container>
              <Outlet />
            </Container>
          </MantineProvider>
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  );
}
