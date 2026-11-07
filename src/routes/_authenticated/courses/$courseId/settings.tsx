import { createFileRoute } from "@tanstack/react-router";
import { loadTestSection, numericId, TestPage } from "../../../../app/navigation-test-routes.tsx";

export const Route = createFileRoute("/_authenticated/courses/$courseId/settings")({
  loader: ({ context, params }) =>
    loadTestSection(context.queryClient, numericId(params.courseId), "settings"),
  component: () => <TestPage title="Настройки курса и заданий" />,
});
