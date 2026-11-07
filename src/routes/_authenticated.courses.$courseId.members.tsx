import { createFileRoute } from "@tanstack/react-router";
import { loadTestSection, numericId, TestPage } from "../app/navigation-test-routes.tsx";

export const Route = createFileRoute("/_authenticated/courses/$courseId/members")({
  loader: ({ context, params }) =>
    loadTestSection(context.queryClient, numericId(params.courseId), "members"),
  component: () => <TestPage title="Участники, подгруппы и приглашения" />,
});
