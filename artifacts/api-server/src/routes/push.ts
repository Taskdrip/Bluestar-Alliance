import { Router } from "express";
import { db, pushSubscriptionsTable, applicationsTable, addonOrdersTable } from "@workspace/db";
import { eq, and, inArray, notInArray, ne } from "drizzle-orm";
import { verifyToken } from "../lib/auth";
import webpush from "web-push";

const router = Router();

function getPayload(req: any) {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

async function requireAdmin(req: any, res: any) {
  const payload = getPayload(req);
  if (!payload || (payload.role !== "admin" && payload.role !== "superadmin")) {
    res.status(401).json({ error: "Admin access required" });
    return null;
  }
  return payload;
}

function getVapidConfigured() {
  return !!(
    process.env.VAPID_PUBLIC_KEY &&
    process.env.VAPID_PRIVATE_KEY &&
    process.env.VAPID_EMAIL
  );
}

/** GET /api/push/vapid-public-key */
router.get("/vapid-public-key", (_req, res) => {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) {
    res.status(503).json({ error: "Push notifications not configured" });
    return;
  }
  res.json({ publicKey: key });
});

/** POST /api/push/subscribe */
router.post("/subscribe", async (req, res) => {
  const payload = getPayload(req);
  if (!payload) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { endpoint, keys, email } = req.body;
  if (!endpoint || !keys?.p256dh || !keys?.auth || !email) {
    res.status(400).json({ error: "endpoint, keys (p256dh + auth), and email are required" });
    return;
  }

  // Upsert
  const existing = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.endpoint, endpoint));

  if (existing.length === 0) {
    await db.insert(pushSubscriptionsTable).values({
      userEmail: email,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    });
  }

  res.json({ success: true });
});

/** POST /api/push/unsubscribe */
router.post("/unsubscribe", async (req, res) => {
  const payload = getPayload(req);
  if (!payload) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { endpoint } = req.body;
  if (!endpoint) { res.status(400).json({ error: "endpoint is required" }); return; }

  await db
    .delete(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.endpoint, endpoint));

  res.json({ success: true });
});

/**
 * POST /api/push/blast — admin only, send push notification to a segment
 * Body: { title, body, url?, segment }
 * segment: "all" | "paid_addons" | "free_applicants" | "approved" | "unapproved"
 */
router.post("/blast", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  if (!getVapidConfigured()) {
    res.status(503).json({ error: "Push notifications not configured. Set VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_EMAIL." });
    return;
  }

  const { title, body, url, segment } = req.body;
  const validSegments = ["all", "paid_addons", "free_applicants", "approved", "unapproved"];

  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "title is required" });
    return;
  }
  if (!body || typeof body !== "string") {
    res.status(400).json({ error: "body is required" });
    return;
  }
  if (!segment || !validSegments.includes(segment)) {
    res.status(400).json({ error: `segment must be one of: ${validSegments.join(", ")}` });
    return;
  }

  try {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );

    // Gather all subscriptions
    let allSubs = await db.select().from(pushSubscriptionsTable);

    if (segment !== "all") {
      // Build a set of qualifying emails based on segment
      let targetEmails: string[] = [];

      if (segment === "paid_addons") {
        // Users who have placed addon orders
        const orders = await db.selectDistinct({ email: addonOrdersTable.applicantEmail }).from(addonOrdersTable);
        targetEmails = orders.map(o => o.email);

      } else if (segment === "free_applicants") {
        // Users who have applications but NO addon orders
        const applicants = await db.selectDistinct({ email: applicationsTable.email }).from(applicationsTable);
        const orderedEmails = await db.selectDistinct({ email: addonOrdersTable.applicantEmail }).from(addonOrdersTable);
        const orderedSet = new Set(orderedEmails.map(o => o.email));
        targetEmails = applicants.map(a => a.email).filter(e => !orderedSet.has(e));

      } else if (segment === "approved") {
        // Users with at least one approved application
        const approved = await db
          .selectDistinct({ email: applicationsTable.email })
          .from(applicationsTable)
          .where(eq(applicationsTable.status, "approved"));
        targetEmails = approved.map(a => a.email);

      } else if (segment === "unapproved") {
        // Users with applications but none approved
        const allApplicants = await db.selectDistinct({ email: applicationsTable.email }).from(applicationsTable);
        const approvedApplicants = await db
          .selectDistinct({ email: applicationsTable.email })
          .from(applicationsTable)
          .where(eq(applicationsTable.status, "approved"));
        const approvedSet = new Set(approvedApplicants.map(a => a.email));
        targetEmails = allApplicants.map(a => a.email).filter(e => !approvedSet.has(e));
      }

      const targetSet = new Set(targetEmails);
      allSubs = allSubs.filter(s => targetSet.has(s.userEmail));
    }

    if (allSubs.length === 0) {
      res.json({ sent: 0, failed: 0, message: "No subscribers matched the selected segment." });
      return;
    }

    const payload = JSON.stringify({
      title,
      body,
      url: url || "/",
    });

    let sent = 0;
    let failed = 0;
    const staleEndpoints: string[] = [];

    await Promise.allSettled(
      allSubs.map(async (sub) => {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload
          );
          sent++;
        } catch (err: any) {
          // 410 Gone = subscription expired, clean it up
          if (err?.statusCode === 410 || err?.statusCode === 404) {
            staleEndpoints.push(sub.endpoint);
          }
          failed++;
        }
      })
    );

    // Clean up stale subscriptions
    if (staleEndpoints.length > 0) {
      for (const ep of staleEndpoints) {
        await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, ep)).catch(() => {});
      }
    }

    res.json({ sent, failed, total: allSubs.length });
  } catch (err: any) {
    console.error("Push blast error:", err);
    res.status(500).json({ error: "Failed to send notifications", detail: err?.message });
  }
});

export default router;
