import { Router } from "express";
import {
  db, applicationsTable, jobsTable, paymentSettingsTable,
  addonOrdersTable, notificationsTable, usersTable
} from "@workspace/db";
import { eq, inArray } from "drizzle-orm";
import { verifyToken, hashPassword } from "../lib/auth";
import { ListApplicationsQueryParams, UpdateApplicationStatusParams, UpdateApplicationStatusBody } from "@workspace/api-zod";

const router = Router();

// ─── Auth helpers ────────────────────────────────────────────────────────────

async function requireAdmin(req: any, res: any): Promise<{ userId: number; role: string; user: any } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload || (payload.role !== "admin" && payload.role !== "superadmin")) {
    res.status(401).json({ error: "Admin access required" });
    return null;
  }
  // Load full user to check isDisabled
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user || user.isDisabled) {
    res.status(403).json({ error: "Account disabled" });
    return null;
  }
  return { userId: payload.userId, role: payload.role, user };
}

async function requireSuperAdmin(req: any, res: any): Promise<{ userId: number; role: string; user: any } | null> {
  const auth = await requireAdmin(req, res);
  if (!auth) return null;
  if (auth.role !== "superadmin") {
    res.status(403).json({ error: "Super admin access required" });
    return null;
  }
  return auth;
}

// ─── Serializers ────────────────────────────────────────────────────────────

function serializeApp(a: any) {
  return {
    id: a.id, fullName: a.fullName, email: a.email, phone: a.phone,
    country: a.country, position: a.position,
    yearsOfExperience: a.yearsOfExperience,
    coverLetter: a.coverLetter ?? null, cvFileName: a.cvFileName ?? null,
    status: a.status, submittedAt: a.submittedAt.toISOString(),
  };
}

function serializeJob(j: any) {
  return {
    id: j.id, title: j.title, location: j.location, category: j.category,
    experienceLevel: j.experienceLevel, description: j.description,
    salaryRange: j.salaryRange ?? null, isUrgent: j.isUrgent,
    createdAt: j.createdAt.toISOString(),
  };
}

function serializePaymentSettings(p: any) {
  return {
    id: p.id, bankName: p.bankName, accountName: p.accountName,
    accountNumber: p.accountNumber, routingNumber: p.routingNumber ?? null,
    swiftCode: p.swiftCode ?? null, additionalInfo: p.additionalInfo ?? null,
    updatedAt: p.updatedAt.toISOString(),
  };
}

function serializeOrder(o: any) {
  return {
    id: o.id, applicationId: o.applicationId, applicantEmail: o.applicantEmail,
    applicantName: o.applicantName, visaSponsorship: o.visaSponsorship,
    flightTicket: o.flightTicket, workPermit: o.workPermit,
    totalAmount: o.totalAmount, paymentMethod: o.paymentMethod,
    status: o.status, notes: o.notes ?? null, createdAt: o.createdAt.toISOString(),
  };
}

function serializeAdmin(u: any) {
  return {
    id: u.id, email: u.email, fullName: u.fullName, role: u.role,
    permissions: u.permissions ? JSON.parse(u.permissions) : null,
    isDisabled: u.isDisabled, createdAt: u.createdAt.toISOString(),
  };
}

function serializeUser(u: any, applications: any[]) {
  return {
    id: u.id, email: u.email, fullName: u.fullName, role: u.role,
    isDisabled: u.isDisabled, createdAt: u.createdAt.toISOString(),
    applications: applications.map(serializeApp),
  };
}

// ─── Applications ────────────────────────────────────────────────────────────

router.get("/applications", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const parsed = ListApplicationsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let apps = await db.select().from(applicationsTable).orderBy(applicationsTable.submittedAt);
  if (params.role) apps = apps.filter(a => a.position.toLowerCase().includes((params.role as string).toLowerCase()));
  if (params.status) apps = apps.filter(a => a.status === params.status);

  res.json(apps.map(serializeApp));
});

router.patch("/applications/:id/status", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const paramsParsed = UpdateApplicationStatusParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) { res.status(400).json({ error: "Invalid ID" }); return; }
  const bodyParsed = UpdateApplicationStatusBody.safeParse(req.body);
  if (!bodyParsed.success) { res.status(400).json({ error: "Invalid status" }); return; }

  const [updated] = await db
    .update(applicationsTable)
    .set({ status: bodyParsed.data.status })
    .where(eq(applicationsTable.id, paramsParsed.data.id))
    .returning();
  if (!updated) { res.status(404).json({ error: "Application not found" }); return; }

  await db.insert(notificationsTable).values({
    recipientEmail: updated.email, recipientRole: "candidate",
    message: `Your application for ${updated.position} has been ${updated.status}.`,
    type: "status", relatedId: updated.id, isRead: false,
  }).catch(() => {});

  res.json(serializeApp(updated));
});

// ─── Jobs ────────────────────────────────────────────────────────────────────

router.get("/jobs", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const jobs = await db.select().from(jobsTable).orderBy(jobsTable.createdAt);
  res.json(jobs.map(serializeJob));
});

router.post("/jobs", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const { title, location, category, experienceLevel, description, salaryRange, isUrgent } = req.body;
  if (!title || !location || !category || !experienceLevel || !description) {
    res.status(400).json({ error: "Required fields missing" }); return;
  }
  const [job] = await db.insert(jobsTable).values({ title, location, category, experienceLevel, description, salaryRange: salaryRange || null, isUrgent: !!isUrgent }).returning();
  res.status(201).json(serializeJob(job));
});

router.patch("/jobs/:id", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { title, location, category, experienceLevel, description, salaryRange, isUrgent } = req.body;
  const [job] = await db.update(jobsTable).set({ title, location, category, experienceLevel, description, salaryRange: salaryRange || null, isUrgent: !!isUrgent }).where(eq(jobsTable.id, id)).returning();
  if (!job) { res.status(404).json({ error: "Job not found" }); return; }
  res.json(serializeJob(job));
});

router.delete("/jobs/:id", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  await db.delete(jobsTable).where(eq(jobsTable.id, id));
  res.json({ success: true });
});

// ─── Payment Settings ─────────────────────────────────────────────────────────

router.get("/payment-settings", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const [settings] = await db.select().from(paymentSettingsTable);
  res.json(settings ? serializePaymentSettings(settings) : null);
});

router.put("/payment-settings", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const { bankName, accountName, accountNumber, routingNumber, swiftCode, additionalInfo } = req.body;
  const existing = await db.select().from(paymentSettingsTable);
  let result;
  if (existing.length > 0) {
    [result] = await db.update(paymentSettingsTable).set({ bankName, accountName, accountNumber, routingNumber: routingNumber || null, swiftCode: swiftCode || null, additionalInfo: additionalInfo || null }).where(eq(paymentSettingsTable.id, existing[0].id)).returning();
  } else {
    [result] = await db.insert(paymentSettingsTable).values({ bankName, accountName, accountNumber, routingNumber: routingNumber || null, swiftCode: swiftCode || null, additionalInfo: additionalInfo || null }).returning();
  }
  res.json(serializePaymentSettings(result));
});

// ─── Add-on Orders ────────────────────────────────────────────────────────────

router.get("/addon-orders", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const orders = await db.select().from(addonOrdersTable).orderBy(addonOrdersTable.createdAt);
  res.json(orders.map(serializeOrder));
});

router.patch("/addon-orders/:id/status", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  const { status } = req.body;
  if (!status) { res.status(400).json({ error: "status is required" }); return; }

  const [updated] = await db.update(addonOrdersTable).set({ status }).where(eq(addonOrdersTable.id, id)).returning();
  if (!updated) { res.status(404).json({ error: "Order not found" }); return; }

  await db.insert(notificationsTable).values({
    recipientEmail: updated.applicantEmail, recipientRole: "candidate",
    message: `Your add-on order has been ${status}. ${status === "paid" ? "Your documents will be processed within 15 business days." : ""}`,
    type: "payment", relatedId: updated.applicationId, isRead: false,
  }).catch(() => {});

  res.json(serializeOrder(updated));
});

// ─── User Management ──────────────────────────────────────────────────────────

/** GET /api/admin/users — all users with their applications */
router.get("/users", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const users = await db.select().from(usersTable).orderBy(usersTable.createdAt);
  const apps = await db.select().from(applicationsTable).orderBy(applicationsTable.submittedAt);

  const result = users.map(u => {
    const userApps = apps.filter(a => a.email === u.email);
    return serializeUser(u, userApps);
  });

  res.json(result);
});

/** DELETE /api/admin/users/:id — delete user + their applications */
router.delete("/users/:id", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (target.role === "superadmin") { res.status(403).json({ error: "Cannot delete super admin" }); return; }
  if (target.id === auth.userId) { res.status(400).json({ error: "Cannot delete your own account" }); return; }

  // Delete their applications + notifications first
  const userApps = await db.select({ id: applicationsTable.id }).from(applicationsTable).where(eq(applicationsTable.email, target.email));
  if (userApps.length > 0) {
    await db.delete(applicationsTable).where(eq(applicationsTable.email, target.email));
  }
  await db.delete(notificationsTable).where(eq(notificationsTable.recipientEmail, target.email)).catch(() => {});
  await db.delete(usersTable).where(eq(usersTable.id, id));

  res.json({ success: true });
});

/** POST /api/admin/users/:id/reset-password */
router.post("/users/:id/reset-password", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const { newPassword } = req.body;
  if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters" }); return;
  }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (target.role === "superadmin" && auth.role !== "superadmin") {
    res.status(403).json({ error: "Only super admin can reset super admin password" }); return;
  }

  const passwordHash = hashPassword(newPassword.trim());
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, id));

  res.json({ success: true });
});

// ─── Admin Team Management (super admin only) ─────────────────────────────────

/** GET /api/admin/team — list all admins */
router.get("/team", async (req, res) => {
  const auth = await requireSuperAdmin(req, res);
  if (!auth) return;

  const admins = await db.select().from(usersTable)
    .orderBy(usersTable.createdAt);

  const adminUsers = admins.filter(u => u.role === "admin" || u.role === "superadmin");
  res.json(adminUsers.map(serializeAdmin));
});

/** POST /api/admin/team — create a new admin */
router.post("/team", async (req, res) => {
  const auth = await requireSuperAdmin(req, res);
  if (!auth) return;

  const { fullName, email, password, permissions } = req.body;
  if (!fullName || !email || !password || typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "fullName, email, and password (min 8 chars) are required" }); return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    // Promote existing user to admin
    const permsJson = permissions && permissions.length > 0 ? JSON.stringify(permissions) : null;
    const [updated] = await db.update(usersTable)
      .set({ role: "admin", permissions: permsJson, isDisabled: false })
      .where(eq(usersTable.email, email))
      .returning();
    res.json(serializeAdmin(updated));
    return;
  }

  const passwordHash = hashPassword(password);
  const permsJson = permissions && permissions.length > 0 ? JSON.stringify(permissions) : null;
  const [newAdmin] = await db.insert(usersTable).values({
    fullName, email, passwordHash, role: "admin",
    permissions: permsJson, isDisabled: false,
  }).returning();

  res.status(201).json(serializeAdmin(newAdmin));
});

/** PATCH /api/admin/team/:id — update admin permissions / disabled status */
router.patch("/team/:id", async (req, res) => {
  const auth = await requireSuperAdmin(req, res);
  if (!auth) return;

  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) { res.status(404).json({ error: "Admin not found" }); return; }
  if (target.role === "superadmin") { res.status(400).json({ error: "Cannot modify super admin permissions" }); return; }

  const { permissions, isDisabled } = req.body;
  const permsJson = permissions && permissions.length > 0 ? JSON.stringify(permissions) : null;

  const [updated] = await db.update(usersTable)
    .set({
      permissions: permsJson,
      isDisabled: typeof isDisabled === "boolean" ? isDisabled : target.isDisabled,
    })
    .where(eq(usersTable.id, id))
    .returning();

  res.json(serializeAdmin(updated));
});

/** DELETE /api/admin/team/:id — demote admin back to regular user */
router.delete("/team/:id", async (req, res) => {
  const auth = await requireSuperAdmin(req, res);
  if (!auth) return;

  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id));
  if (!target) { res.status(404).json({ error: "Admin not found" }); return; }
  if (target.role === "superadmin") { res.status(403).json({ error: "Cannot demote super admin" }); return; }
  if (target.id === auth.userId) { res.status(400).json({ error: "Cannot demote yourself" }); return; }

  await db.update(usersTable)
    .set({ role: "user", permissions: null, isDisabled: false })
    .where(eq(usersTable.id, id));

  res.json({ success: true });
});

export default router;
