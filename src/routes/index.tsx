import { createFileRoute, redirect } from "@tanstack/react-router";
import { ORPCError } from "@orpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Title, Stack, Text } from "@mantine/core";
import { rpc } from "../app/client";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    try {
      return await context.queryClient.ensureQueryData(rpc.auth.me.queryOptions());
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
  const { data: user } = useSuspenseQuery(rpc.auth.me.queryOptions());

  return (
    <Stack>
      <Title>Мои курсы</Title>
      <Text c="dimmed">У вас пока нет курсов</Text>
      <Text>{user.fullName}</Text>
      <Text>{user.email}</Text>
    </Stack>
  );
}
