import { pgTable, text, serial, timestamp, boolean, varchar } from "drizzle-orm/pg-core";

export const directMessagesTable = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email", { length: 255 }).notNull(),
  senderRole: text("sender_role").notNull(), // "admin" | "user"
  senderName: text("sender_name").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type DirectMessage = typeof directMessagesTable.$inferSelect;
