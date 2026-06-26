import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/auth";

const router = Router();

function serializeNotification(n: any) {
  return {
    id: n.id,
    recipientEmail: n.recipientEmail,
    recipientRole: n.recipientRole,
    message: n.message,
    type: n.type,
    relatedId: n.relatedId ?? null,
    isRead: n.isRead,
    createdAt: n.createdAt.toISOString(),
  };
}

/** Extract and verify the Bearer token from Authorization header. */
function getTokenPayload(req: any) {
  const authHeader = req.headers.authorization as string | undefined;
  if (!authHeader?.startsWith("Bearer ")) return null;
  return verifyToken(authHeader.slice(7));
}

router.get("/", async (req, res) => {
  const payload = getTokenPayload(req);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Admins see all notifications filtered by role=admin; users see their own.
  let notifications;
  if (payload.role === "admin") {
    notifications = await db
      .select()
      .from(notificationsTable)
      .orderBy(notificationsTable.createdAt);
    notifications = notifications.filter((n) => n.recipientRole === "admin");
  } else {
    // Fetch user email from DB to avoid trusting client-supplied value
    const { usersTable } = await import("@workspace/db");
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    notifications = await db
      .select()
      .from(notificationsTable)
      .orderBy(notificationsTable.createdAt);
    notifications = notifications.filter(
      (n) => n.recipientEmail === user.email && n.recipientRole === "user"
    );
  }

  res.json(notifications.map(serializeNotification));
});

router.patch("/read-all", async (req, res) => {
  const payload = getTokenPayload(req);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let emailToMark: string;
  if (payload.role === "admin") {
    emailToMark = "admin";
  } else {
    const { usersTable } = await import("@workspace/db");
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId));
    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    emailToMark = user.email;
  }

  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.recipientEmail, emailToMark));

  res.json({ success: true });
});

router.patch("/:id/read", async (req, res) => {
  const payload = getTokenPayload(req);
  if (!payload) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  // Verify the notification belongs to this user before marking read
  const [existing] = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.id, id));

  if (!existing) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  if (payload.role !== "admin") {
    const { usersTable } = await import("@workspace/db");
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId));
    if (!user || existing.recipientEmail !== user.email) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
  }

  const [updated] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id))
    .returning();

  res.json(serializeNotification(updated));
});

export default router;
