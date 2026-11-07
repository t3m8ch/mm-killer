import { createFileRoute } from "@tanstack/react-router";
import { loadTestTask, numericId, TestPage } from "../../../../app/navigation-test-routes.tsx";

export const Route = createFileRoute("/_authenticated/courses/$courseId/tasks/$taskId")({
  loader: ({ context, params }) =>
    loadTestTask(context.queryClient, numericId(params.courseId), numericId(params.taskId)),
  component: () => <TestPage title="Задание, сдача и история попыток" />,
});
