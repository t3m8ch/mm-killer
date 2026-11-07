import { createFileRoute } from "@tanstack/react-router";
import {
  loadTestAttempt,
  numericId,
  TestPage,
} from "../../../../../app/navigation-test-routes.tsx";

export const Route = createFileRoute("/_authenticated/courses/$courseId/attempts/$attemptId")({
  staticData: { hideNavigation: true },
  loader: ({ context, params }) =>
    loadTestAttempt(context.queryClient, numericId(params.courseId), numericId(params.attemptId)),
  component: () => <TestPage title="Diff и проверка" diff />,
});
