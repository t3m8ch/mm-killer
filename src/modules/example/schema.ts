import { pgTable, integer, text, timestamp } from "drizzle-orm/pg-core";
export const entries = pgTable("example_entries", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  text: text().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});
