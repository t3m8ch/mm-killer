import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Title, Stack, Text } from "@mantine/core";
import { demoCourses } from "../app/demo-courses";
import { rpc } from "../app/client";

export const Route = createFileRoute("/_authenticated/")({ component: Home });

function Home() {
  const { data: user } = useSuspenseQuery(rpc.auth.me.queryOptions());

  return (
    <Stack>
      <Title>Мои курсы</Title>
      {demoCourses.map((course) => (
        <Link key={course.id} to={course.href}>
          {course.emoji} {course.label}
        </Link>
      ))}
      <Text>{user.fullName}</Text>
      <Text>{user.email}</Text>
    </Stack>
  );
}
