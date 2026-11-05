import { getCookie, setCookie } from "@tanstack/react-start/server";
import { resolveUser, type Context } from "../platform";
import { db } from "./database";

export async function createRequestContext(request: Request): Promise<Context> {
  const now = () => new Date();
  const sessionToken = getCookie("session");
  const user = await resolveUser(db, sessionToken, now());

  return {
    db,
    now,
    user,
    sessionToken,
    setSessionCookie: (token, maxAge) => {
      setCookie("session", token, {
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        maxAge,
        secure: process.env.NODE_ENV === "production" || new URL(request.url).protocol === "https:",
      });
    },
  };
}
