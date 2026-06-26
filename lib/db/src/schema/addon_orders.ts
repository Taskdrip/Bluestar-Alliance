import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { applicationsTable } from "./applications";

export const addonOrdersTable = pgTable("addon_orders", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id),
  applicantEmail: text("applicant_email").notNull(),
  applicantName: text("applicant_name").notNull(),
  visaSponsorship: boolean("visa_sponsorship").notNull().default(false),
  flightTicket: boolean("flight_ticket").notNull().default(false),
  workPermit: boolean("work_permit").notNull().default(false),
  totalAmount: integer("total_amount").notNull(),
  paymentMethod: text("payment_method").notNull().default("bank_transfer"),
  status: text("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type AddonOrder = typeof addonOrdersTable.$inferSelect;
