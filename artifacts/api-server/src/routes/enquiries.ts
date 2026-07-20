import { Router } from "express";
import { db, enquiriesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { verifyToken } from "../lib/auth";

const router = Router();

function requireAdmin(req: any, res: any): boolean {
  const token = (req.headers.authorization ?? "").replace("Bearer ", "");
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return false; }
  const payload = verifyToken(token);
  if (!payload || (payload.role !== "admin" && payload.role !== "superadmin")) {
    res.status(401).json({ error: "Admin access required" }); return false;
  }
  return true;
}

function serialize(e: any) {
  return {
    id: e.id,
    fullName: e.fullName,
    email: e.email,
    phone: e.phone ?? null,
    enquiryType: e.enquiryType,
    subject: e.subject,
    message: e.message,
    isRead: e.isRead,
    createdAt: e.createdAt.toISOString(),
  };
}

/** POST /api/enquiries — public, from the contact form */
router.post("/", async (req, res) => {
  const { fullName, email, phone, enquiryType, subject, message } = req.body;
  if (!fullName?.trim() || !email?.trim() || !enquiryType?.trim() || !subject?.trim() || !message?.trim()) {
    res.status(400).json({ error: "fullName, email, enquiryType, subject, and message are required" });
    return;
  }
  try {
    const [enquiry] = await db.insert(enquiriesTable).values({
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      enquiryType: enquiryType.trim(),
      subject: subject.trim(),
      message: message.trim(),
    }).returning();
    res.status(201).json({ id: enquiry.id });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

/** GET /api/enquiries — admin only, all enquiries newest first */
router.get("/", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  try {
    const enquiries = await db.select().from(enquiriesTable).orderBy(desc(enquiriesTable.createdAt));
    res.json(enquiries.map(serialize));
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

/** PATCH /api/enquiries/:id/read — admin only, mark as read */
router.patch("/:id/read", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    const [updated] = await db
      .update(enquiriesTable)
      .set({ isRead: true })
      .where(eq(enquiriesTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Enquiry not found" }); return; }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

/** DELETE /api/enquiries/:id — admin only */
router.delete("/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }
  try {
    await db.delete(enquiriesTable).where(eq(enquiriesTable.id, id));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
