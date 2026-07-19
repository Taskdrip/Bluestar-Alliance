import { Router } from "express";
import { db } from "@workspace/db";
import { announcementPopupTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/auth";

const router = Router();

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requireAdmin(req: any, res: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload || (payload.role !== "admin" && payload.role !== "superadmin")) {
    res.status(401).json({ error: "Admin access required" });
    return null;
  }
  return payload;
}

function serialize(row: any) {
  return {
    id: row.id,
    imageUrl: row.imageUrl ?? null,
    title: row.title,
    body: row.body,
    isActive: row.isActive,
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
  };
}

/** GET /api/announcement-popup — public, returns active popup or 404 */
router.get("/", async (_req, res) => {
  try {
    const rows = await db.select().from(announcementPopupTable).limit(1);
    if (!rows.length || !rows[0].isActive) {
      res.status(404).json({ error: "No active popup" });
      return;
    }
    res.json(serialize(rows[0]));
  } catch {
    res.status(503).json({ error: "Database unavailable" });
  }
});

/** PUT /api/announcement-popup/admin — admin only, upsert popup */
router.put("/admin", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  const { imageUrl, title, body, isActive } = req.body;

  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({ error: "title is required" });
    return;
  }
  if (typeof body !== "string") {
    res.status(400).json({ error: "body is required" });
    return;
  }

  try {
    const existing = await db.select().from(announcementPopupTable).limit(1);

    if (existing.length > 0) {
      const [updated] = await db
        .update(announcementPopupTable)
        .set({
          imageUrl: imageUrl ?? null,
          title: title.trim(),
          body: body.trim(),
          isActive: typeof isActive === "boolean" ? isActive : true,
          updatedAt: new Date(),
        })
        .where(eq(announcementPopupTable.id, existing[0].id))
        .returning();
      res.json(serialize(updated));
    } else {
      const [created] = await db
        .insert(announcementPopupTable)
        .values({
          imageUrl: imageUrl ?? null,
          title: title.trim(),
          body: body.trim(),
          isActive: typeof isActive === "boolean" ? isActive : true,
        })
        .returning();
      res.json(serialize(created));
    }
  } catch {
    res.status(503).json({ error: "Database unavailable" });
  }
});

/** GET /api/announcement-popup/admin — admin only, get current popup (including inactive) */
router.get("/admin", async (req, res) => {
  const auth = await requireAdmin(req, res);
  if (!auth) return;

  try {
    const rows = await db.select().from(announcementPopupTable).limit(1);
    if (!rows.length) {
      res.status(404).json({ error: "Not configured" });
      return;
    }
    res.json(serialize(rows[0]));
  } catch {
    res.status(503).json({ error: "Database unavailable" });
  }
});

export default router;
