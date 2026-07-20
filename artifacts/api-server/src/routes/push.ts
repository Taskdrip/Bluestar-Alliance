import { Router } from "express";
import { db, pushSubscriptionsTable, applicationsTable, addonOrdersTable, notificationsTable, usersTable } from "@workspace/db";
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
/**
 * POST /api/push/blast
 * Admin: broadcast a message to a segment of users.
 * Always creates in-app notifications. Also sends web push if VAPID is configured.
 * Body: { title, body, url?, segment }
 * segment: "all_registered" | "all" | "applicants" | "paid_addons" | "free_applicants" | "approved" | "unapproved"
 */
router.post("/blast", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const { title, body, url, segment } = req.body;
  const validSegments = ["all_registered", "all", "applicants", "paid_addons", "free_applicants", "approved", "unapproved"];

  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "title is required" }); return;
  }
  if (!body || typeof body !== "string") {
    res.status(400).json({ error: "body is required" }); return;
  }
  if (!segment || !validSegments.includes(segment)) {
    res.status(400).json({ error: `segment must be one of: ${validSegments.join(", ")}` }); return;
  }

  try {
    // ── Step 1: Determine target email list ──────────────────────────────
    let targetEmails: string[] = [];

    if (segment === "all_registered" || segment === "all") {
      // All regular users (role = "user")
      const users = await db.select({ email: usersTable.email }).from(usersTable)
        .where(eq(usersTable.role, "user"));
      targetEmails = users.map(u => u.email);

    } else if (segment === "applicants") {
      const rows = await db.selectDistinct({ email: applicationsTable.email }).from(applicationsTable);
      targetEmails = rows.map(r => r.email);

    } else if (segment === "paid_addons") {
      const rows = await db.selectDistinct({ email: addonOrdersTable.applicantEmail }).from(addonOrdersTable);
      targetEmails = rows.map(r => r.email);

    } else if (segment === "free_applicants") {
      const applicants = await db.selectDistinct({ email: applicationsTable.email }).from(applicationsTable);
      const ordered = await db.selectDistinct({ email: addonOrdersTable.applicantEmail }).from(addonOrdersTable);
      const orderedSet = new Set(ordered.map(o => o.email));
      targetEmails = applicants.map(a => a.email).filter(e => !orderedSet.has(e));

    } else if (segment === "approved") {
      const rows = await db.selectDistinct({ email: applicationsTable.email }).from(applicationsTable)
        .where(eq(applicationsTable.status, "approved"));
      targetEmails = rows.map(r => r.email);

    } else if (segment === "unapproved") {
      const all = await db.selectDistinct({ email: applicationsTable.email }).from(applicationsTable);
      const approved = await db.selectDistinct({ email: applicationsTable.email }).from(applicationsTable)
        .where(eq(applicationsTable.status, "approved"));
      const approvedSet = new Set(approved.map(a => a.email));
      targetEmails = all.map(a => a.email).filter(e => !approvedSet.has(e));
    }

    if (targetEmails.length === 0) {
      res.json({ inAppSent: 0, pushSent: 0, pushFailed: 0, total: 0, message: "No users matched the selected segment." });
      return;
    }

    const targetSet = new Set(targetEmails);

    // ── Step 2: Create in-app notifications for ALL matched users ────────
    await Promise.allSettled(
      targetEmails.map((email) =>
        db.insert(notificationsTable).values({
          recipientEmail: email,
          recipientRole: "candidate",
          message: `${title}: ${body}`,
          type: "broadcast",
          relatedId: null,
          isRead: false,
        })
      )
    );

    // ── Step 3: Send web push if VAPID configured (non-fatal) ────────────
    let pushSent = 0;
    let pushFailed = 0;

    if (getVapidConfigured()) {
      webpush.setVapidDetails(
        `mailto:${process.env.VAPID_EMAIL}`,
        process.env.VAPID_PUBLIC_KEY!,
        process.env.VAPID_PRIVATE_KEY!
      );

      const allSubs = await db.select().from(pushSubscriptionsTable);
      const matchedSubs = allSubs.filter(s => targetSet.has(s.userEmail));

      const pushPayload = JSON.stringify({ title, body, url: url || "/dashboard", tag: "broadcast" });
      const staleEndpoints: string[] = [];

      await Promise.allSettled(
        matchedSubs.map(async (sub) => {
          try {
            await webpush.sendNotification(
              { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
              pushPayload
            );
            pushSent++;
          } catch (err: any) {
            if (err?.statusCode === 410 || err?.statusCode === 404) staleEndpoints.push(sub.endpoint);
            pushFailed++;
          }
        })
      );

      for (const ep of staleEndpoints) {
        await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, ep)).catch(() => {});
      }
    }

    res.json({
      inAppSent: targetEmails.length,
      pushSent,
      pushFailed,
      total: targetEmails.length,
      pushEnabled: getVapidConfigured(),
    });
  } catch (err: any) {
    console.error("Blast error:", err);
    res.status(500).json({ error: "Failed to send broadcast", detail: err?.message });
  }
});

export default router;
