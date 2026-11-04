import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button, Stack, Text, TextInput, Title } from "@mantine/core";
import { useState, useSyncExternalStore } from "react";
import { rpc } from "../app/client";
export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(rpc.example.list.queryOptions()),
  component: Example,
});
const subscribe = () => () => {};
function Example() {
  const { data } = useSuspenseQuery(rpc.example.list.queryOptions());
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const create = useMutation(
    rpc.example.create.mutationOptions({
      onSuccess: async () => {
        setText("");
        await queryClient.invalidateQueries({ queryKey: rpc.example.list.key() });
      },
    }),
  );
  return (
    <Stack>
      <Title>MergeMinds</Title>
      <Text>Сквозной пример</Text>
      <TextInput
        label="Текст записи"
        disabled={!ready}
        value={text}
        onChange={(event) => setText(event.currentTarget.value)}
        maxLength={200}
      />
      <Button
        loading={create.isPending}
        disabled={!text.trim()}
        onClick={() => create.mutate({ text })}
      >
        Добавить запись
      </Button>
      {create.isError && <Text role="alert">Не удалось сохранить запись</Text>}
      {data.map((entry) => (
        <Text key={entry.id}>{entry.text}</Text>
      ))}
    </Stack>
  );
}
