import { Router } from "express";
import { db, addonOrdersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function serializeOrder(o: any) {
  return {
    id: o.id,
    applicationId: o.applicationId,
    applicantEmail: o.applicantEmail,
    applicantName: o.applicantName,
    visaSponsorship: o.visaSponsorship,
    flightTicket: o.flightTicket,
    workPermit: o.workPermit,
    totalAmount: o.totalAmount,
    paymentMethod: o.paymentMethod,
    status: o.status,
    notes: o.notes ?? null,
    createdAt: o.createdAt.toISOString(),
  };
}

router.post("/", async (req, res) => {
  const { applicationId, applicantEmail, applicantName, visaSponsorship, flightTicket, workPermit, totalAmount, paymentMethod, notes } = req.body;

  if (!applicationId || !applicantEmail || !applicantName) {
    res.status(400).json({ error: "applicationId, applicantEmail, and applicantName are required" });
    return;
  }

  const [order] = await db.insert(addonOrdersTable).values({
    applicationId: Number(applicationId),
    applicantEmail,
    applicantName,
    visaSponsorship: !!visaSponsorship,
    flightTicket: !!flightTicket,
    workPermit: !!workPermit,
    totalAmount: Number(totalAmount) || 0,
    paymentMethod: paymentMethod || "bank_transfer",
    status: "pending",
    notes: notes || null,
  }).returning();

  await db.insert(notificationsTable).values({
    recipientEmail: "admin",
    recipientRole: "admin",
    message: `New add-on order from ${applicantName} — ${[visaSponsorship && "Visa Sponsorship", flightTicket && "Flight Ticket", workPermit && "Work Permit"].filter(Boolean).join(", ")}`,
    type: "payment",
    relatedId: order.applicationId,
    isRead: false,
  });

  res.status(201).json(serializeOrder(order));
});

export default router;
