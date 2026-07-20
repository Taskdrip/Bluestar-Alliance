import { Router } from "express";
import { db, addonOrdersTable, notificationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/auth";

const router = Router();

// GET /api/addon-orders/mine — returns all orders for the authenticated user's email
router.get("/mine", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) { res.status(401).json({ error: "Invalid token" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user) { res.status(401).json({ error: "User not found" }); return; }
  const orders = await db.select().from(addonOrdersTable)
    .where(eq(addonOrdersTable.applicantEmail, user.email))
    .orderBy(addonOrdersTable.createdAt);
  res.json(orders.map(serializeOrder));
});

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
