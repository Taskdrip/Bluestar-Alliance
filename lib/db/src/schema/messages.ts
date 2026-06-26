import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { applicationsTable } from "./applications";

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id),
  senderRole: text("sender_role").notNull(),
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Message = typeof messagesTable.$inferSelect;
