import { createFileRoute, Link } from "@tanstack/react-router";
import { loadTestSection, numericId, TestPage } from "../app/navigation-test-routes.tsx";

export const Route = createFileRoute("/_authenticated/courses/$courseId/attempts/")({
  validateSearch: (search: Record<string, unknown>) => ({
    status: typeof search.status === "string" ? search.status : "all",
  }),
  loaderDeps: ({ search }) => ({ status: search.status }),
  loader: ({ context, params }) =>
    loadTestSection(context.queryClient, numericId(params.courseId), "attempts"),
  component: AttemptsPage,
});

function AttemptsPage() {
  const { courseId } = Route.useParams();

  return (
    <>
      <TestPage title="Попытки" />
      <Link to="/courses/$courseId/attempts/$attemptId" params={{ courseId, attemptId: "1" }}>
        Открыть тестовую попытку
      </Link>
    </>
  );
}
