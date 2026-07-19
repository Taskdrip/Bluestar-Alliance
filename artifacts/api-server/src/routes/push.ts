import { Router } from "express";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../lib/auth";

const router = Router();

function getPayload(req: any) {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
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

export default router;
