import { Router } from "express";
import { db, applicationsTable } from "@workspace/db";
import { SubmitApplicationBody } from "@workspace/api-zod";

const router = Router();

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
