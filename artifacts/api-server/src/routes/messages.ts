import { Router } from "express";
import { db, messagesTable, notificationsTable, applicationsTable, pushSubscriptionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/auth";
import webpush from "web-push";

const router = Router();

function serializeMessage(m: any) {
  return {
    id: m.id,
    applicationId: m.applicationId,
    senderRole: m.senderRole,
    senderName: m.senderName,
    content: m.content,
    isRead: m.isRead,
    createdAt: m.createdAt.toISOString(),
  };
}

router.get("/:applicationId", async (req, res) => {
  const applicationId = Number(req.params.applicationId);
  if (isNaN(applicationId)) {
    res.status(400).json({ error: "Invalid application ID" });
    return;
  }

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.applicationId, applicationId))
    .orderBy(messagesTable.createdAt);

  res.json(msgs.map(serializeMessage));
});

router.post("/:applicationId", async (req, res) => {
  const applicationId = Number(req.params.applicationId);
  if (isNaN(applicationId)) {
    res.status(400).json({ error: "Invalid application ID" });
    return;
  }

  const { senderRole, senderName, content, email } = req.body;
  if (!senderRole || !senderName || !content?.trim()) {
    res.status(400).json({ error: "senderRole, senderName, and content are required" });
    return;
  }

  const [application] = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.id, applicationId));

  if (!application) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  const [message] = await db.insert(messagesTable).values({
    applicationId,
    senderRole,
    senderName,
    content: content.trim(),
    isRead: false,
  }).returning();

  if (senderRole === "admin") {
    // 1. Store in-app notification for the applicant
    await db.insert(notificationsTable).values({
      recipientEmail: application.email,
      recipientRole: "candidate",
      message: `New message from Bluestar Alliance HR regarding your application for ${application.position}`,
      type: "message",
      relatedId: applicationId,
      isRead: false,
    });

    // 2. Send web push notification to ALL of the applicant's subscribed devices
    if (
      process.env.VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY &&
      process.env.VAPID_EMAIL
    ) {
      try {
        webpush.setVapidDetails(
          `mailto:${process.env.VAPID_EMAIL}`,
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
        const subs = await db
          .select()
          .from(pushSubscriptionsTable)
          .where(eq(pushSubscriptionsTable.userEmail, application.email));

        const pushPayload = JSON.stringify({
          title: "New Message — Bluestar Alliance",
          body: content.trim().slice(0, 120),
          url: "/apply",
          tag: `message-${applicationId}`,
        });

        await Promise.allSettled(
          subs.map((sub) =>
            webpush
              .sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                pushPayload
              )
              .catch(async (err: any) => {
                // Remove expired / revoked subscriptions automatically
                if (err?.statusCode === 410 || err?.statusCode === 404) {
                  await db
                    .delete(pushSubscriptionsTable)
                    .where(eq(pushSubscriptionsTable.endpoint, sub.endpoint))
                    .catch(() => {});
                }
              })
          )
        );
      } catch (_) {
        // Push failure is non-fatal — in-app notification still delivered
      }
    }
  } else {
    // Applicant messaged admin — notify admin in-app
    await db.insert(notificationsTable).values({
      recipientEmail: "admin",
      recipientRole: "admin",
      message: `${senderName} sent a message regarding their ${application.position} application`,
      type: "message",
      relatedId: applicationId,
      isRead: false,
    });
  }

  res.status(201).json(serializeMessage(message));
});

export default router;
