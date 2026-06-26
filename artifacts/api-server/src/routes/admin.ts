import { Router } from "express";
import { db, applicationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { verifyToken } from "../lib/auth";
import { ListApplicationsQueryParams, UpdateApplicationStatusParams, UpdateApplicationStatusBody } from "@workspace/api-zod";

const router = Router();

function requireAdmin(req: any, res: any): { userId: number; role: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  const payload = verifyToken(authHeader.slice(7));
  if (!payload || payload.role !== "admin") {
    res.status(401).json({ error: "Admin access required" });
    return null;
  }
  return payload;
}

router.get("/applications", async (req, res) => {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  const parsed = ListApplicationsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let apps = await db.select().from(applicationsTable).orderBy(applicationsTable.submittedAt);

  if (params.role) {
    apps = apps.filter(a => a.position.toLowerCase().includes((params.role as string).toLowerCase()));
  }
  if (params.status) {
    apps = apps.filter(a => a.status === params.status);
  }

  res.json(apps.map(a => ({
    id: a.id,
    fullName: a.fullName,
    email: a.email,
    phone: a.phone,
    country: a.country,
    position: a.position,
    yearsOfExperience: a.yearsOfExperience,
    coverLetter: a.coverLetter ?? null,
    cvFileName: a.cvFileName ?? null,
    status: a.status,
    submittedAt: a.submittedAt.toISOString(),
  })));
});

router.patch("/applications/:id/status", async (req, res) => {
  const auth = requireAdmin(req, res);
  if (!auth) return;

  const paramsParsed = UpdateApplicationStatusParams.safeParse({ id: Number(req.params.id) });
  if (!paramsParsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const bodyParsed = UpdateApplicationStatusBody.safeParse(req.body);
  if (!bodyParsed.success) {
    res.status(400).json({ error: "Invalid status" });
    return;
  }

  const [updated] = await db
    .update(applicationsTable)
    .set({ status: bodyParsed.data.status })
    .where(eq(applicationsTable.id, paramsParsed.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Application not found" });
    return;
  }

  res.json({
    id: updated.id,
    fullName: updated.fullName,
    email: updated.email,
    phone: updated.phone,
    country: updated.country,
    position: updated.position,
    yearsOfExperience: updated.yearsOfExperience,
    coverLetter: updated.coverLetter ?? null,
    cvFileName: updated.cvFileName ?? null,
    status: updated.status,
    submittedAt: updated.submittedAt.toISOString(),
  });
});

export default router;
