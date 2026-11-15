import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { Title, Stack, Button, Text, Container } from "@mantine/core";
import { authRpc } from "../platform/public.ui.ts";

export const Route = createFileRoute("/login")({
  staticData: { navigationMode: "public" },
  loader: ({ context }) => context.queryClient.ensureQueryData(authRpc.users.queryOptions()),
  component: Login,
});

function Login() {
  const { data: users } = useSuspenseQuery(authRpc.users.queryOptions());
  const login = useMutation({
    throwOnError: true,
    mutationFn: (input: { userId: bigint }) => authRpc.login.call(input),
    onSuccess: () => {
      window.location.href = "/";
    },
  });

  return (
    <Container py="xl">
      <Stack>
        <Title>Вход в MergeMinds</Title>
        <Text>Выберите пользователя из seed</Text>
        {users.map((user) => (
          <Button
            key={String(user.id)}
            disabled={login.isPending}
            onClick={() => login.mutate({ userId: user.id })}
          >
            {user.fullName}
          </Button>
        ))}
      </Stack>
    </Container>
  );
}
