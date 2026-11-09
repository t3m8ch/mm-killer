import { createFileRoute, Link } from "@tanstack/react-router";
import { Stack, Text, Title } from "@mantine/core";

export const Route = createFileRoute("/_authenticated/courses/sql")({
  component: Course,
});

function Course() {
  return (
    <Stack>
      <Title>Основы SQL</Title>
      <Text>Демо-курс для проверки переходов через Link.</Text>
      <Link to="/">Все курсы</Link>
      <Link to="/courses/javascript">Другой курс</Link>
    </Stack>
  );
}
