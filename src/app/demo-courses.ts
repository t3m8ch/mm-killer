import type { NavigationCourse } from "../platform/public.shared.ts";

// Временные курсы только для ручной проверки ссылок в тестовой ветке.
export const demoCourses: readonly NavigationCourse[] = [
  { id: "javascript", label: "JavaScript", emoji: "🟨", href: "/courses/javascript" },
  { id: "sql", label: "Основы SQL", emoji: "🐘", href: "/courses/sql" },
];
