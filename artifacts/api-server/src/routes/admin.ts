import { Router } from "express";
import { db, applicationsTable, jobsTable, paymentSettingsTable, addonOrdersTable, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/auth";
import { ListApplicationsQueryParams, UpdateApplicationStatusParams, UpdateApplicationStatusBody } from "@workspace/api-zod";

const router = Router();

function requireAdmin(req: any, res: any): { userId: number; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload || payload.role !== "admin") {
    res.status(401).json({ error: "Admin access required" });
    return null;
  }
  return payload;
}

function serializeApp(a: any) {
  return {
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    phone: a.phone,
    country: a.country,
    position: a.position,
    yearsOfExperience: a.yearsOfExperience,
    coverLetter: a.coverLetter ?? null,
    cvFileName: a.cvFileName ?? null,
    status: a.status,
    submittedAt: a.submittedAt.toISOString(),
  };
}

function serializeJob(j: any) {
  return {
    id: j.id,
    title: j.title,
    location: j.location,
    category: j.category,
    experienceLevel: j.experienceLevel,
    description: j.description,
    salaryRange: j.salaryRange ?? null,
    isUrgent: j.isUrgent,
    createdAt: j.createdAt.toISOString(),
  };
}

function serializePaymentSettings(p: any) {
  return {
    id: p.id,
    bankName: p.bankName,
    accountName: p.accountName,
    accountNumber: p.accountNumber,
    routingNumber: p.routingNumber ?? null,
    swiftCode: p.swiftCode ?? null,
    additionalInfo: p.additionalInfo ?? null,
    updatedAt: p.updatedAt.toISOString(),
  };
}

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

// ─── Applications ────────────────────────────────────────────────────────────

router.get("/applications", async (req, res) => {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  const parsed = ListApplicationsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let apps = await db.select().from(applicationsTable).orderBy(applicationsTable.submittedAt);

  if (params.role) {
    apps = apps.filter(a => a.position.toLowerCase().includes((params.role as string).toLowerCase()));
  }
  if (params.status) {
    apps = apps.filter(a => a.status === params.status);
  }

  res.json(apps.map(serializeApp));
});

router.patch("/applications/:id/status", async (req, res) => {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  const paramsParsed = UpdateApplicationStatusParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const bodyParsed = UpdateApplicationStatusBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const [updated] = await db
    .update(applicationsTable)
    .set({ status: bodyParsed.data.status })
    .where(eq(applicationsTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  await db.insert(notificationsTable).values({
    recipientEmail: updated.email,
    recipientRole: "candidate",
    message: `Your application for ${updated.position} has been ${bodyParsed.data.status}.`,
    type: "status_update",
    relatedId: updated.id,
    isRead: false,
  }).catch(() => {});

  res.json(serializeApp(updated));
});

// ─── Jobs CRUD ───────────────────────────────────────────────────────────────

router.post("/jobs", async (req, res) => {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  const { title, location, category, experienceLevel, description, salaryRange, isUrgent } = req.body;
  if (!title || !location || !category || !experienceLevel || !description) {
    res.status(400).json({ error: "title, location, category, experienceLevel, and description are required" });
    return;
  }

  const [job] = await db.insert(jobsTable).values({
    title: title.trim(),
    location: location.trim(),
    category: category.trim(),
    experienceLevel: experienceLevel.trim(),
    description: description.trim(),
    salaryRange: salaryRange?.trim() || null,
    isUrgent: !!isUrgent,
  }).returning();

  res.status(201).json(serializeJob(job));
});

router.patch("/jobs/:id", async (req, res) => {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { title, location, category, experienceLevel, description, salaryRange, isUrgent } = req.body;

  const updates: any = {};
  if (title !== undefined) updates.title = title.trim();
  if (location !== undefined) updates.location = location.trim();
  if (category !== undefined) updates.category = category.trim();
  if (experienceLevel !== undefined) updates.experienceLevel = experienceLevel.trim();
  if (description !== undefined) updates.description = description.trim();
  if (salaryRange !== undefined) updates.salaryRange = salaryRange?.trim() || null;
  if (isUrgent !== undefined) updates.isUrgent = !!isUrgent;

  const [updated] = await db
    .update(jobsTable)
    .set(updates)
    .where(eq(jobsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(serializeJob(updated));
});

router.delete("/jobs/:id", async (req, res) => {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [deleted] = await db
    .delete(jobsTable)
    .where(eq(jobsTable.id, id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json({ success: true });
});

// ─── Payment Settings ─────────────────────────────────────────────────────────

router.get("/payment-settings", async (req, res) => {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  const settings = await db.select().from(paymentSettingsTable).limit(1);
  if (settings.length === 0) {
    res.status(404).json({ error: "Payment settings not configured" });
    return;
  }

  res.json(serializePaymentSettings(settings[0]));
});

router.put("/payment-settings", async (req, res) => {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  const { bankName, accountName, accountNumber, routingNumber, swiftCode, additionalInfo } = req.body;
  if (!bankName || !accountName || !accountNumber) {
    res.status(400).json({ error: "bankName, accountName, and accountNumber are required" });
    return;
  }

  const existing = await db.select().from(paymentSettingsTable).limit(1);

  let result;
  if (existing.length === 0) {
    const [created] = await db.insert(paymentSettingsTable).values({
      bankName: bankName.trim(),
      accountName: accountName.trim(),
      accountNumber: accountNumber.trim(),
      routingNumber: routingNumber?.trim() || null,
      swiftCode: swiftCode?.trim() || null,
      additionalInfo: additionalInfo?.trim() || null,
    }).returning();
    result = created;
  } else {
    const [updated] = await db
      .update(paymentSettingsTable)
      .set({
        bankName: bankName.trim(),
        accountName: accountName.trim(),
        accountNumber: accountNumber.trim(),
        routingNumber: routingNumber?.trim() || null,
        swiftCode: swiftCode?.trim() || null,
        additionalInfo: additionalInfo?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(paymentSettingsTable.id, existing[0].id))
      .returning();
    result = updated;
  }

  res.json(serializePaymentSettings(result));
});

// ─── Addon Orders ─────────────────────────────────────────────────────────────

router.get("/addon-orders", async (req, res) => {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  const orders = await db
    .select()
    .from(addonOrdersTable)
    .orderBy(addonOrdersTable.createdAt);

  res.json(orders.map(serializeOrder));
});

router.patch("/addon-orders/:id/status", async (req, res) => {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const { status } = req.body;
  if (!status) {
    res.status(400).json({ error: "status is required" });
    return;
  }

  const [updated] = await db
    .update(addonOrdersTable)
    .set({ status })
    .where(eq(addonOrdersTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Order not found" });
    return;
  }

  await db.insert(notificationsTable).values({
    recipientEmail: updated.applicantEmail,
    recipientRole: "candidate",
    message: `Your add-on order has been ${status}. ${status === "paid" ? "Your documents will be processed within 15 business days." : ""}`,
    type: "payment",
    relatedId: updated.applicationId,
    isRead: false,
  }).catch(() => {});

  res.json(serializeOrder(updated));
});

export default router;
