import { Router } from "express";
import nodemailer from "nodemailer";
import { verifyToken } from "../lib/auth";
import { db, newsletterSubscribersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

function getPayload(req: any) {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

function buildTransport() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

function getListmonkConfig() {
  const url = process.env.LISTMONK_URL;
  const username = process.env.LISTMONK_USERNAME;
  const password = process.env.LISTMONK_PASSWORD;
  if (!url || !username || !password) return null;
  return { url, username, password, listId: Number(process.env.LISTMONK_LIST_ID ?? 1) };
}

/** GET /api/newsletter/config-status */
router.get("/config-status", (req, res) => {
  const payload = getPayload(req);
  if (!payload || payload.role !== "admin") { res.status(401).json({ error: "Unauthorized" }); return; }
  const listmonk = getListmonkConfig();
  const smtp = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  res.json({ listmonk: !!listmonk, smtp, mode: listmonk ? "listmonk" : smtp ? "smtp" : "none" });
});

/** GET /api/newsletter/subscribers */
router.get("/subscribers", async (req, res) => {
  const payload = getPayload(req);
  if (!payload || payload.role !== "admin") { res.status(401).json({ error: "Unauthorized" }); return; }
  const rows = await db.select().from(newsletterSubscribersTable).orderBy(newsletterSubscribersTable.subscribedAt);
  res.json(rows);
});

/** POST /api/newsletter/subscribers  (admin adds one manually) */
router.post("/subscribers", async (req, res) => {
  const payload = getPayload(req);
  if (!payload || payload.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const { email, fullName } = req.body as { email: string; fullName?: string };
  if (!email) { res.status(400).json({ error: "email is required" }); return; }

  const [row] = await db
    .insert(newsletterSubscribersTable)
    .values({ email, fullName: fullName ?? null, source: "manual" })
    .onConflictDoUpdate({ target: newsletterSubscribersTable.email, set: { status: "active", unsubscribedAt: null } })
    .returning();
  res.status(201).json(row);
});

/** POST /api/newsletter/subscribe  (public — from the site footer / apply form) */
router.post("/subscribe", async (req, res) => {
  const { email, fullName, source } = req.body as { email: string; fullName?: string; source?: string };
  if (!email) { res.status(400).json({ error: "email is required" }); return; }

  const [row] = await db
    .insert(newsletterSubscribersTable)
    .values({ email, fullName: fullName ?? null, source: source ?? "public" })
    .onConflictDoUpdate({ target: newsletterSubscribersTable.email, set: { status: "active", unsubscribedAt: null } })
    .returning();
  res.status(201).json(row);
});

/** DELETE /api/newsletter/subscribers/:id */
router.delete("/subscribers/:id", async (req, res) => {
  const payload = getPayload(req);
  if (!payload || payload.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }
  const id = Number(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }
  await db.delete(newsletterSubscribersTable).where(eq(newsletterSubscribersTable.id, id));
  res.json({ success: true });
});

/** POST /api/newsletter/send */
router.post("/send", async (req, res) => {
  const payload = getPayload(req);
  if (!payload || payload.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

  const { subject, body, isHtml } = req.body as { subject: string; body: string; isHtml?: boolean };
  if (!subject || !body) { res.status(400).json({ error: "subject and body are required" }); return; }

  // Try Listmonk first
  const lmk = getListmonkConfig();
  if (lmk) {
    const creds = Buffer.from(`${lmk.username}:${lmk.password}`).toString("base64");

    // Create campaign
    const campaignRes = await fetch(`${lmk.url}/api/campaigns`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${creds}` },
      body: JSON.stringify({
        name: subject,
        subject,
        lists: [lmk.listId],
        type: "regular",
        content_type: isHtml ? "html" : "plain",
        body,
        send_at: null,
      }),
    });

    if (!campaignRes.ok) {
      const err = await campaignRes.text();
      res.status(502).json({ error: `Listmonk error: ${err}` });
      return;
    }

    const { data: campaign } = await campaignRes.json();

    // Start campaign
    await fetch(`${lmk.url}/api/campaigns/${campaign.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Basic ${creds}` },
      body: JSON.stringify({ status: "running" }),
    });

    res.json({ success: true, mode: "listmonk", campaignId: campaign.id });
    return;
  }

  // Fallback: nodemailer BCC to all active subscribers
  const transport = buildTransport();
  if (!transport) {
    res.status(503).json({ error: "No delivery method configured. Set SMTP or Listmonk credentials." });
    return;
  }

  const subscribers = await db
    .select()
    .from(newsletterSubscribersTable)
    .where(eq(newsletterSubscribersTable.status, "active"));

  if (subscribers.length === 0) {
    res.json({ success: true, sent: 0, mode: "smtp" });
    return;
  }

  const from = `"${process.env.SMTP_FROM_NAME ?? "Bluestar Alliance"}" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`;
  const bcc = subscribers.map((s) => s.email).join(", ");

  await transport.sendMail({
    from,
    to: from,
    bcc,
    subject,
    ...(isHtml ? { html: body } : { text: body }),
  });

  res.json({ success: true, sent: subscribers.length, mode: "smtp" });
});

export default router;
