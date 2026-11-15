import { createFileRoute, redirect } from "@tanstack/react-router";
import { ORPCError } from "@orpc/client";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { Title, Stack, Button, Text } from "@mantine/core";
import { authRpc } from "../platform/public.ui.ts";

import { CourseList, coursesRpc } from "../modules/courses/public.ui.ts";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    try {
      await context.queryClient.ensureQueryData(authRpc.me.queryOptions());
      await context.queryClient.ensureQueryData(coursesRpc.list.queryOptions());
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
  const { data: user } = useSuspenseQuery(authRpc.me.queryOptions());
  const logout = useMutation({
    throwOnError: true,
    mutationFn: () => authRpc.logout.call(undefined),
    onSuccess: () => {
      window.location.href = "/login";
    },
  });
  const logoutAll = useMutation({
    throwOnError: true,
    mutationFn: () => authRpc.logoutAll.call(undefined),
    onSuccess: () => {
      window.location.href = "/login";
    },
  });

  return (
    <Stack>
      <Title>MergeMinds</Title>
      <CourseList />
      <Text>{user.fullName}</Text>
      <Text>{user.email}</Text>
      <Button disabled={logout.isPending} onClick={() => logout.mutate(undefined)}>
        Выйти
      </Button>
      <Button disabled={logoutAll.isPending} onClick={() => logoutAll.mutate(undefined)}>
        Выйти со всех устройств
      </Button>
    </Stack>
  );
}
