import { createFileRoute } from "@tanstack/react-router";
import { CoursesPrototype } from "../app/courses-prototype";

// Throwaway: три компоновки участников, общий список курсов и форма, issue #5.
export const Route = createFileRoute("/prototype/courses")({
  validateSearch: (search: Record<string, unknown>) => ({
    variant: ["A", "B", "C"].includes(String(search.variant)) ? String(search.variant) : "A",
    course: Number(search.course) || 0,
    view:
      typeof search.view === "string" &&
      ["list", "create", "home", "members", "settings"].includes(search.view)
        ? search.view
        : "list",
  }),
  component: PrototypeRoute,
});

function PrototypeRoute() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();

  if (!import.meta.env.DEV) {
    return <p>Прототип доступен только в режиме разработки.</p>;
  }

  return (
    <CoursesPrototype
      search={search}
      navigate={(next) => void navigate({ search: { ...search, ...next } })}
    />
  );
}
