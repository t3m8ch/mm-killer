import { createFileRoute } from "@tanstack/react-router";
import { NavigationPrototype } from "../app/navigation-prototype/navigation-prototype";

export const Route = createFileRoute("/prototype/$")({
  validateSearch: (search: Record<string, unknown>) => ({
    variant: ["A", "B", "C"].includes(String(search.variant)) ? String(search.variant) : "A",
    role: search.role === "student" ? "student" : "teacher",
    status: typeof search.status === "string" ? search.status : "all",
  }),
  component: NavigationPrototype,
});
