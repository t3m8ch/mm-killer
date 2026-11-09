import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { ColorSchemeScript, Loader, mantineHtmlProps, Text } from "@mantine/core";
import { Layout } from "../platform/public.ui.ts";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  ssr: false,
  shellComponent: Shell,
  component: Root,
  pendingComponent: () => <Loader />,
  errorComponent: () => <Text role="alert">Не удалось загрузить страницу</Text>,
  notFoundComponent: () => <Text>Страница не найдена</Text>,
});

function Root() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
    </QueryClientProvider>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" {...mantineHtmlProps}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <ColorSchemeScript defaultColorScheme="light" />
        <HeadContent />
      </head>
      <body>
        <Layout>{children}</Layout>
        <Scripts />
      </body>
    </html>
  );
}
