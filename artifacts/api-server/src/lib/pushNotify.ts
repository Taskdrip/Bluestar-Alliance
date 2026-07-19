import webpush from "web-push";
import { db, pushSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

let vapidInitialized = false;

function ensureVapid() {
  if (vapidInitialized) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:admin@bluestaralliance.com";
  if (!pub || !priv) return false;
  webpush.setVapidDetails(subject, pub, priv);
  vapidInitialized = true;
  return true;
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export async function sendPushToEmail(email: string, payload: PushPayload) {
  if (!ensureVapid()) return;
  const subs = await db
    .select()
    .from(pushSubscriptionsTable)
    .where(eq(pushSubscriptionsTable.userEmail, email));

  const stale: number[] = [];
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) stale.push(sub.id);
      }
    })
  );

  for (const id of stale) {
    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, id));
  }
}

export async function sendPushToAll(payload: PushPayload) {
  if (!ensureVapid()) return;
  const subs = await db.select().from(pushSubscriptionsTable);
  const stale: number[] = [];
  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload)
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) stale.push(sub.id);
      }
    })
  );
  for (const id of stale) {
    await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.id, id));
  }
}
