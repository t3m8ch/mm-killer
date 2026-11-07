import { createFileRoute } from "@tanstack/react-router";
import { loadTestCourse, numericId, TestCoursePage } from "../app/navigation-test-routes.tsx";

export const Route = createFileRoute("/_authenticated/courses/$courseId/")({
  loader: ({ context, params }) => loadTestCourse(context.queryClient, numericId(params.courseId)),
  component: () => <TestCoursePage courseId={numericId(Route.useParams().courseId)} />,
});
