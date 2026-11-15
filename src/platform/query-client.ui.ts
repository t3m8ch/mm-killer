import { QueryClient, hashKey } from "@tanstack/react-query";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: (key) =>
          hashKey(
            JSON.parse(
              JSON.stringify(key, (_key, value: unknown) =>
                typeof value === "bigint" ? { $bigint: value.toString() } : value,
              ),
            ),
          ),
      },
    },
  });
}
