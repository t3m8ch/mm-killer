import { useMounted } from "@mantine/hooks";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { ORPCError } from "@orpc/client";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { Title, Stack, Button, Text } from "@mantine/core";
import { rpc } from "../app/client";

export const Route = createFileRoute("/")({
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
  component: Home,
});

function Home() {
  const ready = useMounted();
  const { data: user } = useSuspenseQuery(rpc.auth.me.queryOptions());
  const logout = useMutation({
    mutationFn: () => rpc.auth.logout.call(undefined),
    onSuccess: () => {
      window.location.href = "/login";
    },
  });
  const logoutAll = useMutation({
    mutationFn: () => rpc.auth.logoutAll.call(undefined),
    onSuccess: () => {
      window.location.href = "/login";
    },
  });

  return (
    <Stack>
      <Title>MergeMinds</Title>
      <Text>{user.fullName}</Text>
      <Text>{user.email}</Text>
      <Button disabled={!ready || logout.isPending} onClick={() => logout.mutate(undefined)}>
        Выйти
      </Button>
      <Button disabled={!ready || logoutAll.isPending} onClick={() => logoutAll.mutate(undefined)}>
        Выйти со всех устройств
      </Button>
      {(logout.isError || logoutAll.isError) && <Text role="alert">Не удалось выйти</Text>}
    </Stack>
  );
}
