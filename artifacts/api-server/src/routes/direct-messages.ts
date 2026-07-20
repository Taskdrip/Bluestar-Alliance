import { Router } from "express";
import { db, directMessagesTable, notificationsTable, usersTable, pushSubscriptionsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../lib/auth";
import webpush from "web-push";

const router = Router();

function getPayload(req: any) {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith("Bearer ")) return null;
  return verifyToken(auth.slice(7));
}

async function getUserEmail(userId: number): Promise<string | null> {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  return user?.email ?? null;
}

function isAdmin(role: string) {
  return role === "admin" || role === "superadmin";
}

function serialize(m: any) {
  return {
    id: m.id,
    userEmail: m.userEmail,
    senderRole: m.senderRole,
    senderName: m.senderName,
    content: m.content,
    isRead: m.isRead,
    createdAt: m.createdAt.toISOString(),
  };
}

async function tryPush(userEmail: string, payload: object) {
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_EMAIL) return;
  try {
    webpush.setVapidDetails(
      `mailto:${process.env.VAPID_EMAIL}`,
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );
    const subs = await db.select().from(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.userEmail, userEmail));
    await Promise.allSettled(
      subs.map((sub) =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload)
          )
          .catch(async (err: any) => {
            if (err?.statusCode === 410 || err?.statusCode === 404) {
              await db.delete(pushSubscriptionsTable).where(eq(pushSubscriptionsTable.endpoint, sub.endpoint)).catch(() => {});
            }
          })
      )
    );
  } catch (_) { /* push failure is non-fatal */ }
}

/**
 * GET /api/direct-messages
 * User: get my own DM thread with admin
 * Admin: get list of users who have DMs, plus count
 */
router.get("/", async (req, res) => {
  const payload = getPayload(req);
  if (!payload) { res.status(401).json({ error: "Unauthorized" }); return; }

  if (isAdmin(payload.role)) {
    // Return distinct user emails with last message preview, enriched with
    // the registered user's fullName where available.
    const [all, registeredUsers] = await Promise.all([
      db.select().from(directMessagesTable).orderBy(directMessagesTable.createdAt),
      db.select().from(usersTable),
    ]);

    // Build a fast lookup: lowercase email → registered user row
    const profileMap: Record<string, typeof registeredUsers[0]> = {};
    for (const u of registeredUsers) {
      profileMap[u.email.toLowerCase()] = u;
    }

    const byEmail: Record<string, any[]> = {};
    for (const m of all) {
      if (!byEmail[m.userEmail]) byEmail[m.userEmail] = [];
      byEmail[m.userEmail].push(m);
    }

    const threads = Object.entries(byEmail).map(([email, msgs]) => {
      const userMsg = msgs.find(m => m.senderRole === "user");
      const profile = profileMap[email.toLowerCase()];
      return {
        userEmail: email,
        // Prefer the registered user's name; fall back to the name they typed
        userName: profile?.fullName ?? userMsg?.senderName ?? email,
        isRegistered: !!profile,
        lastMessage: serialize(msgs[msgs.length - 1]),
        unread: msgs.filter(m => m.senderRole === "user" && !m.isRead).length,
        total: msgs.length,
      };
    });
    res.json(threads);
    return;
  }

  // Regular user: get their own messages
  const email = await getUserEmail(payload.userId);
  if (!email) { res.status(401).json({ error: "User not found" }); return; }

  const msgs = await db
    .select()
    .from(directMessagesTable)
    .where(eq(directMessagesTable.userEmail, email))
    .orderBy(directMessagesTable.createdAt);

  // Mark admin messages as read when user explicitly views them (not when polling for unread count)
  if (req.query.markRead !== "false") {
    await db
      .update(directMessagesTable)
      .set({ isRead: true })
      .where(and(eq(directMessagesTable.userEmail, email), eq(directMessagesTable.senderRole, "admin")))
      .catch(() => {});
  }

  res.json(msgs.map(serialize));
});

/**
 * POST /api/direct-messages/broadcast
 * Admin only: send a message to ALL registered non-admin users at once
 */
router.post("/broadcast", async (req, res) => {
  const payload = getPayload(req);
  if (!payload) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!isAdmin(payload.role)) { res.status(403).json({ error: "Admin access required" }); return; }

  const { content, senderName } = req.body;
  if (!content?.trim()) { res.status(400).json({ error: "content is required" }); return; }

  const actualSenderName = senderName || "Bluestar HR Team";

  // Get all non-admin users
  const allUsers = await db.select({ email: usersTable.email }).from(usersTable)
    .where(eq(usersTable.isDisabled, false));
  const recipients = allUsers.filter(u => u.email !== "admin");

  let sent = 0;
  let failed = 0;

  await Promise.allSettled(
    recipients.map(async (user) => {
      try {
        await db.insert(directMessagesTable).values({
          userEmail: user.email,
          senderRole: "admin",
          senderName: actualSenderName,
          content: content.trim(),
          isRead: false,
        });

        await db.insert(notificationsTable).values({
          recipientEmail: user.email,
          recipientRole: "candidate",
          message: `Announcement from Bluestar Alliance: ${content.trim().slice(0, 100)}`,
          type: "message",
          relatedId: null,
          isRead: false,
        }).catch(() => {});

        await tryPush(user.email, {
          title: "Announcement — Bluestar Alliance",
          body: content.trim().slice(0, 120),
          url: "/dashboard",
          tag: `broadcast-${Date.now()}`,
        });

        sent++;
      } catch {
        failed++;
      }
    })
  );

  res.status(201).json({ sent, failed, total: recipients.length });
});

/**
 * POST /api/direct-messages/guest — public, no auth required
 * Allows unauthenticated visitors to send a chat message via the widget
 */
router.post("/guest", async (req, res) => {
  const { name, email, content } = req.body;
  if (!name?.trim() || !email?.trim() || !content?.trim()) {
    res.status(400).json({ error: "name, email, and content are required" }); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "Invalid email" }); return;
  }
  try {
    const [message] = await db.insert(directMessagesTable).values({
      userEmail: email.trim().toLowerCase(),
      senderRole: "user",
      senderName: name.trim(),
      content: content.trim(),
      isRead: false,
    }).returning();

    // Notify admin in-app
    await db.insert(notificationsTable).values({
      recipientEmail: "admin",
      recipientRole: "admin",
      message: `${name.trim()} (${email.trim()}) sent a message via the chat widget`,
      type: "message",
      relatedId: null,
      isRead: false,
    }).catch(() => {});

    res.status(201).json(serialize(message));
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/direct-messages/guest/:email — public, no auth required
 * Returns the DM thread for a guest visitor by email so they can see replies
 */
router.get("/guest/:email", async (req, res) => {
  const userEmail = decodeURIComponent(req.params.email).toLowerCase();
  try {
    const msgs = await db
      .select()
      .from(directMessagesTable)
      .where(eq(directMessagesTable.userEmail, userEmail))
      .orderBy(directMessagesTable.createdAt);

    // Mark admin replies as read when the guest explicitly views them (not when polling for unread count)
    if (req.query.markRead !== "false") {
      await db
        .update(directMessagesTable)
        .set({ isRead: true })
        .where(and(eq(directMessagesTable.userEmail, userEmail), eq(directMessagesTable.senderRole, "admin")))
        .catch(() => {});
    }

    res.json(msgs.map(serialize));
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/direct-messages/:email
 * Admin only: get full DM thread for a specific user
 */
router.get("/:email", async (req, res) => {
  const payload = getPayload(req);
  if (!payload) { res.status(401).json({ error: "Unauthorized" }); return; }
  if (!isAdmin(payload.role)) { res.status(403).json({ error: "Admin access required" }); return; }

  const userEmail = decodeURIComponent(req.params.email);
  const msgs = await db
    .select()
    .from(directMessagesTable)
    .where(eq(directMessagesTable.userEmail, userEmail))
    .orderBy(directMessagesTable.createdAt);

  // Mark user messages as read when admin views
  await db
    .update(directMessagesTable)
    .set({ isRead: true })
    .where(and(eq(directMessagesTable.userEmail, userEmail), eq(directMessagesTable.senderRole, "user")))
    .catch(() => {});

  res.json(msgs.map(serialize));
});

/**
 * POST /api/direct-messages/:email
 * Admin: send message to user
 * User: reply (email must match their own)
 */
router.post("/:email", async (req, res) => {
  const payload = getPayload(req);
  if (!payload) { res.status(401).json({ error: "Unauthorized" }); return; }

  const userEmail = decodeURIComponent(req.params.email);
  const { content, senderName } = req.body;
  if (!content?.trim()) { res.status(400).json({ error: "content is required" }); return; }

  let actualSenderRole: string;
  let actualSenderName: string;

  if (isAdmin(payload.role)) {
    actualSenderRole = "admin";
    actualSenderName = senderName || "Bluestar HR Team";
  } else {
    // User can only post to their own thread
    const myEmail = await getUserEmail(payload.userId);
    if (!myEmail || myEmail !== userEmail) {
      res.status(403).json({ error: "Forbidden" }); return;
    }
    actualSenderRole = "user";
    actualSenderName = senderName || "Applicant";
  }

  const [message] = await db.insert(directMessagesTable).values({
    userEmail,
    senderRole: actualSenderRole,
    senderName: actualSenderName,
    content: content.trim(),
    isRead: false,
  }).returning();

  if (actualSenderRole === "admin") {
    // Notify the user in-app
    await db.insert(notificationsTable).values({
      recipientEmail: userEmail,
      recipientRole: "candidate",
      message: `New message from Bluestar Alliance HR: ${content.trim().slice(0, 100)}`,
      type: "message",
      relatedId: null,
      isRead: false,
    }).catch(() => {});

    // Try push notification (non-fatal)
    await tryPush(userEmail, {
      title: "New Message — Bluestar Alliance",
      body: content.trim().slice(0, 120),
      url: "/dashboard",
      tag: `dm-${userEmail}`,
    });
  } else {
    // User replied — notify admin
    await db.insert(notificationsTable).values({
      recipientEmail: "admin",
      recipientRole: "admin",
      message: `${actualSenderName} (${userEmail}) replied to your message`,
      type: "message",
      relatedId: null,
      isRead: false,
    }).catch(() => {});
  }

  res.status(201).json(serialize(message));
});

export default router;
