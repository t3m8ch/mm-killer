// THROWAWAY: моковый запрос страницы с настоящим кэшем TanStack Query.
import { queryOptions } from "@tanstack/react-query";

export const prototypeStaleTime = 30_000;

export function prototypePageQuery(splat: string, search: { role: string; status: string }) {
  const path = `/${splat}`.replace(/\/$/, "") || "/";
  const status = path.endsWith("/attempts") ? search.status : "all";

  return queryOptions({
    queryKey: ["navigation-prototype", "page", path, search.role, status],
    queryFn: async () => {
      const diff = /\/attempts\/\d+$/.test(path);
      const delayMs = Math.round((diff ? 1400 : 700) + Math.random() * (diff ? 1200 : 900));

      await new Promise((resolve) => setTimeout(resolve, delayMs));

      return { path, delayMs, loadedAt: Date.now() };
    },
    staleTime: prototypeStaleTime,
    gcTime: 5 * 60_000,
  });
}
