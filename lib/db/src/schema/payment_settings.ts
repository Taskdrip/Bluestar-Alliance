import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const paymentSettingsTable = pgTable("payment_settings", {
  id: serial("id").primaryKey(),
  bankName: text("bank_name").notNull(),
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number").notNull(),
  routingNumber: text("routing_number"),
  swiftCode: text("swift_code"),
  additionalInfo: text("additional_info"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PaymentSettings = typeof paymentSettingsTable.$inferSelect;
