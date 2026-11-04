import { createFileRoute } from "@tanstack/react-router";
import { pool } from "../../app/database";

export const Route = createFileRoute("/health/ready")({
  server: {
    handlers: {
      GET: async () => {
        try {
          await pool.query("SELECT 1");

          return Response.json({ status: "ready" });
        } catch {
          return Response.json({ status: "unavailable" }, { status: 503 });
        }
      },
    },
  },
});
