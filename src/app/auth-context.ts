import { resolveUser, type Context } from "../platform";
import { db } from "./database";

export async function authContext(request: Request, headers: Headers): Promise<Context> {
  const now = () => new Date();
  const sessionToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("session="))
    ?.slice(8);
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
