import { getCookie } from "@tanstack/react-start/server";
import { resolveUser, type Context } from "../platform";
import { db } from "./database";

export async function authContext(request: Request, headers: Headers): Promise<Context> {
  const now = () => new Date();
  const sessionToken = getCookie("session");
  const user = await resolveUser(db, sessionToken, now());

  return {
    db,
    now,
    user,
    sessionToken,
    setSessionCookie: (cookie) => {
      headers.append(
        "set-cookie",
        cookie +
          (process.env.NODE_ENV === "production" || new URL(request.url).protocol === "https:"
            ? "; Secure"
            : ""),
      );
    },
  };
}
