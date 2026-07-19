import { Router } from "express";
import nodemailer from "nodemailer";
import { verifyToken } from "../lib/auth";
import { db, notificationsTable } from "@workspace/db";

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

/** GET /api/email/config-status */
router.get("/config-status", (req, res) => {
  const payload = getPayload(req);
  if (!payload || payload.role !== "admin") {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const configured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
  res.json({ configured, from: process.env.SMTP_FROM ?? process.env.SMTP_USER ?? "" });
});

/** POST /api/email/send */
router.post("/send", async (req, res) => {
  const payload = getPayload(req);
  if (!payload || payload.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { to, subject, body, isHtml, recipientName } = req.body as {
    to: string;
    subject: string;
    body: string;
    isHtml?: boolean;
    recipientName?: string;
  };

  if (!to || !subject || !body) {
    res.status(400).json({ error: "to, subject, and body are required" });
    return;
  }

  const transport = buildTransport();
  if (!transport) {
    res.status(503).json({ error: "SMTP not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASS env vars." });
    return;
  }

  const from = `"${process.env.SMTP_FROM_NAME ?? "Bluestar Alliance"}" <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`;

  await transport.sendMail({
    from,
    to,
    subject,
    ...(isHtml ? { html: body } : { text: body }),
  });

  // Create in-app notification for the recipient
  await db.insert(notificationsTable).values({
    recipientEmail: to,
    recipientRole: "candidate",
    message: `You have a new message from Bluestar Alliance: ${subject}`,
    type: "email",
    isRead: false,
  });

  res.json({ success: true });
});

export default router;
