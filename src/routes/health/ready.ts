import { createFileRoute } from "@tanstack/react-router";
import { getDatabase } from "../../app/database.server.ts";

export const Route = createFileRoute("/health/ready")({
  server: {
    handlers: {
      GET: async () => {
        try {
          await getDatabase().pool.query("SELECT 1");

          return Response.json({ status: "ready" });
        } catch {
          return Response.json({ status: "unavailable" }, { status: 503 });
        }
      },
    },
  },
});
