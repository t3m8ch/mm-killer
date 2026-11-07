import { useMounted } from "@mantine/hooks";
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation } from "@tanstack/react-query";
import { Title, Stack, Button, Text, Container } from "@mantine/core";
import { rpc } from "../app/client";

export const Route = createFileRoute("/login")({
  staticData: { navigationMode: "public" },
  loader: ({ context }) => context.queryClient.ensureQueryData(rpc.auth.users.queryOptions()),
  component: Login,
});

function Login() {
  const ready = useMounted();

  const { data: users } = useSuspenseQuery(rpc.auth.users.queryOptions());
  const login = useMutation({
    throwOnError: true,
    mutationFn: (input: { userId: bigint }) => rpc.auth.login.call(input),
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
            disabled={!ready || login.isPending}
            onClick={() => login.mutate({ userId: user.id })}
          >
            {user.fullName}
          </Button>
        ))}
      </Stack>
    </Container>
  );
}
