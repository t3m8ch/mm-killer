import { createFileRoute, Link } from "@tanstack/react-router";
import { Stack, Text, Title } from "@mantine/core";

export const Route = createFileRoute("/_authenticated/courses/javascript")({
  component: Course,
});

function Course() {
  return (
    <Stack>
      <Title>JavaScript</Title>
      <Text>Демо-курс для проверки переходов через Link.</Text>
      <Link to="/">Все курсы</Link>
      <Link to="/courses/sql">Другой курс</Link>
    </Stack>
  );
}
