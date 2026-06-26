import { Router } from "express";
import { db, testimonialsTable } from "@workspace/db";

const router = Router();

router.get("/", async (_req, res) => {
  const testimonials = await db.select().from(testimonialsTable);
  res.json(testimonials.map(t => ({
    id: t.id,
    name: t.name,
    role: t.role,
    country: t.country,
    quote: t.quote,
    avatarUrl: t.avatarUrl,
  })));
});

export default router;
