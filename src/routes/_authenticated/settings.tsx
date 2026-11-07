import { createFileRoute } from "@tanstack/react-router";
import { Stack, Text, Title } from "@mantine/core";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <Stack className="app-page">
      <Title>Личные настройки</Title>
      <Text>SSH-ключи, письма и ICS будут подключены соответствующими модулями.</Text>
    </Stack>
  );
}
