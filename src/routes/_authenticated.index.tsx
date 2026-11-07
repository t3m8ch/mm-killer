import { useMounted } from "@mantine/hooks";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { Title, Stack, Button, Text } from "@mantine/core";
import { rpc } from "../app/client.ts";

export const Route = createFileRoute("/_authenticated/")({
  component: Home,
});

function Home() {
  const ready = useMounted();
  const { data: user } = useSuspenseQuery(rpc.auth.me.queryOptions());
  const logoutAll = useMutation({
    throwOnError: true,
    mutationFn: () => rpc.auth.logoutAll.call(undefined),
    onSuccess: () => {
      window.location.href = "/login";
    },
  });

  return (
    <Stack className="app-page">
      <Title>Мои курсы</Title>
      <Text>Курсы появятся здесь после реализации соответствующего модуля.</Text>
      <Text c="dimmed">{user.email}</Text>
      <Button disabled={!ready || logoutAll.isPending} onClick={() => logoutAll.mutate(undefined)}>
        Выйти со всех устройств
      </Button>
    </Stack>
  );
}
