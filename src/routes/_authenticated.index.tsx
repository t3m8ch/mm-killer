import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Title, Stack, Text } from "@mantine/core";
import { authRpc } from "../platform/public.ui.ts";

export const Route = createFileRoute("/_authenticated/")({ component: Home });

function Home() {
  const { data: user } = useSuspenseQuery(authRpc.me.queryOptions());

  return (
    <Stack>
      <Title>Мои курсы</Title>
      <Text c="dimmed">У вас пока нет курсов</Text>
      <Text>{user.fullName}</Text>
      <Text>{user.email}</Text>
    </Stack>
  );
}
