import { createServerOnlyFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { createRouterClient } from "@orpc/server";
import { authContext } from "./auth-context";
import { api } from "./api";

export const serverClient = createServerOnlyFn(() =>
  createRouterClient(api, {
    context: async () => {
      const headers = new Headers();
      const context = await authContext(getRequest(), headers);

      return {
        ...context,
        setSessionCookie: (value: string) => {
          context.setSessionCookie?.(value);
          setResponseHeader("set-cookie", headers.get("set-cookie")!);
        },
      };
    },
  }),
);
