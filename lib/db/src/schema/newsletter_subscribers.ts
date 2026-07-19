import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const newsletterSubscribersTable = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  status: text("status").notNull().default("active"), // active | unsubscribed
  source: text("source").notNull().default("manual"), // manual | application | public
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).notNull().defaultNow(),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
});

export type NewsletterSubscriber = typeof newsletterSubscribersTable.$inferSelect;
