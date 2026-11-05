import { createFileRoute } from "@tanstack/react-router";
import { NavigationPrototype } from "../app/navigation-prototype/navigation-prototype";

export const Route = createFileRoute("/prototype/$")({
  validateSearch: (search: Record<string, unknown>) => ({
    variant: ["A", "B", "C"].includes(String(search.variant)) ? String(search.variant) : "A",
    role: search.role === "student" ? "student" : "teacher",
    status: typeof search.status === "string" ? search.status : "all",
  }),
  // Задержка данных, а не CSS-анимация: быстрые переходы обрабатывает роутер.
  loaderDeps: ({ search }) => ({ status: search.status, role: search.role }),
  loader: async ({ params }) => {
    const diff = /\/attempts\/\d+$/.test(params._splat ?? "");
    const delayMs = Math.round((diff ? 1400 : 700) + Math.random() * (diff ? 1200 : 900));

    await new Promise((resolve) => setTimeout(resolve, delayMs));

    return { delayMs };
  },
  shouldReload: true,
  gcTime: 0,
  // При переходе сохранять каркас и старый экран до готовности данных.
  pendingMs: 20_000,
  component: NavigationPrototype,
});
