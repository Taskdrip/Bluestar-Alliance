import { Router } from "express";
import { db, applicationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { SubmitApplicationBody } from "@workspace/api-zod";
import { verifyToken } from "../lib/auth";

const router = Router();

// GET /api/applications/mine — returns all applications matching the authenticated user's email
router.get("/mine", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const applications = await db
    .select()
    .from(applicationsTable)
    .where(eq(applicationsTable.email, user.email))
    .orderBy(applicationsTable.submittedAt);

  res.json(
    applications.map((a) => ({
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
    }))
  );
});

router.post("/", async (req, res) => {
  const parsed = SubmitApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", details: parsed.error.issues });
    return;
  }

  const data = parsed.data;
  const [application] = await db.insert(applicationsTable).values({
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    country: data.country,
    position: data.position,
    yearsOfExperience: data.yearsOfExperience,
    coverLetter: data.coverLetter ?? null,
    cvFileName: data.cvFileName ?? null,
    status: "pending",
  }).returning();

  res.status(201).json({
    id: application.id,
    fullName: application.fullName,
    email: application.email,
    phone: application.phone,
    country: application.country,
    position: application.position,
    yearsOfExperience: application.yearsOfExperience,
    coverLetter: application.coverLetter ?? null,
    cvFileName: application.cvFileName ?? null,
    status: application.status,
    submittedAt: application.submittedAt.toISOString(),
  });
});

export default router;
