import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";

export const announcementPopupTable = pgTable("announcement_popup", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url"),
  title: text("title").notNull().default("Important Notice"),
  body: text("body").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AnnouncementPopup = typeof announcementPopupTable.$inferSelect;
