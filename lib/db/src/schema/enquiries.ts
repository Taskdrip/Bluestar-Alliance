import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const enquiriesTable = pgTable("enquiries", {
  id:          serial("id").primaryKey(),
  fullName:    text("full_name").notNull(),
  email:       text("email").notNull(),
  phone:       text("phone"),
  enquiryType: text("enquiry_type").notNull(),
  subject:     text("subject").notNull(),
  message:     text("message").notNull(),
  isRead:      boolean("is_read").notNull().default(false),
  createdAt:   timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Enquiry = typeof enquiriesTable.$inferSelect;
