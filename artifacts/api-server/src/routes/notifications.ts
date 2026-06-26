import { Router } from "express";
import { db, notificationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

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

router.get("/", async (req, res) => {
  const { email, role } = req.query as { email?: string; role?: string };

  let notifications = await db
    .select()
    .from(notificationsTable)
    .orderBy(notificationsTable.createdAt);

  if (email) {
    notifications = notifications.filter(n => n.recipientEmail === email);
  }
  if (role) {
    notifications = notifications.filter(n => n.recipientRole === role);
  }

  res.json(notifications.map(serializeNotification));
});

router.patch("/read-all", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ error: "email is required" });
    return;
  }

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.recipientEmail, email));

  for (const n of notifications) {
    if (!n.isRead) {
      await db
        .update(notificationsTable)
        .set({ isRead: true })
        .where(eq(notificationsTable.id, n.id));
    }
  }

  res.json({ success: true });
});

router.patch("/:id/read", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [updated] = await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }

  res.json(serializeNotification(updated));
});

export default router;
