import { createFileRoute } from "@tanstack/react-router";
import { CoursePage, coursesRpc } from "../modules/courses/public.ui.ts";

export const Route = createFileRoute("/courses/$courseId")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      coursesRpc.get.queryOptions({ input: { courseId: BigInt(params.courseId) } }),
    );

    if (data.kind === "content" && data.course.role !== "student") {
      await Promise.all([
        context.queryClient.ensureQueryData(
          coursesRpc.participants.queryOptions({ input: { courseId: BigInt(params.courseId) } }),
        ),
        context.queryClient.ensureQueryData(
          coursesRpc.groups.queryOptions({ input: { courseId: BigInt(params.courseId) } }),
        ),
      ]);
    }
  },
  component: Page,
});

function Page() {
  const { courseId } = Route.useParams();

  return <CoursePage courseId={BigInt(courseId)} />;
}
