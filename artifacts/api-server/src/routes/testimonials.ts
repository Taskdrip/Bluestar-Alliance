import { Router } from "express";
import { db, testimonialsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/auth";

const router = Router();

function requireAdmin(req: any, res: any): boolean {
  const token = (req.headers.authorization ?? "").replace("Bearer ", "");
  if (!token) { res.status(401).json({ error: "Unauthorized" }); return false; }
  const payload = verifyToken(token);
  if (!payload || payload.role !== "admin") { res.status(401).json({ error: "Unauthorized" }); return false; }
  return true;
}

router.get("/", async (_req, res) => {
  const testimonials = await db.select().from(testimonialsTable);
  res.json(testimonials.map(t => ({
    id: t.id, name: t.name, role: t.role, country: t.country, quote: t.quote, avatarUrl: t.avatarUrl,
  })));
});

router.post("/", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const { name, role, country, quote, avatarUrl } = req.body;
  const [t] = await db.insert(testimonialsTable).values({ name, role, country, quote, avatarUrl }).returning();
  res.status(201).json(t);
});

router.patch("/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = Number(req.params.id);
  const { name, role, country, quote, avatarUrl } = req.body;
  const [t] = await db.update(testimonialsTable)
    .set({ name, role, country, quote, avatarUrl })
    .where(eq(testimonialsTable.id, id))
    .returning();
  if (!t) { res.status(404).json({ error: "Not found" }); return; }
  res.json(t);
});

router.delete("/:id", async (req, res) => {
  if (!requireAdmin(req, res)) return;
  const id = Number(req.params.id);
  const [deleted] = await db.delete(testimonialsTable).where(eq(testimonialsTable.id, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ success: true });
});

export default router;
