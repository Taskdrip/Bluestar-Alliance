import { Router } from "express";
import { db, messagesTable, notificationsTable, applicationsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "../lib/auth";

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
    await db.insert(notificationsTable).values({
      recipientEmail: application.email,
      recipientRole: "candidate",
      message: `New message from Bluestar Alliance HR regarding your application for ${application.position}`,
      type: "message",
      relatedId: applicationId,
      isRead: false,
    });
  } else {
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
