import { createFileRoute } from "@tanstack/react-router";
import { Container, Stack, Text, Title } from "@mantine/core";

export const Route = createFileRoute("/invites/$token")({
  component: InvitePage,
});

function InvitePage() {
  return (
    <Container py="xl">
      <Stack>
        <Title>Приглашение</Title>
        <Text>Обработку приглашения подключит соответствующий модуль.</Text>
      </Stack>
    </Container>
  );
}
