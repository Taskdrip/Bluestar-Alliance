import { Router } from "express";
import { db, jobsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { ListJobsQueryParams, GetJobParams } from "@workspace/api-zod";

const router = Router();

router.get("/", async (req, res) => {
  const parsed = ListJobsQueryParams.safeParse(req.query);
  const params = parsed.success ? parsed.data : {};

  let jobs = await db.select().from(jobsTable).orderBy(jobsTable.createdAt);

  if (params.category) {
    jobs = jobs.filter(j => j.category.toLowerCase() === (params.category as string).toLowerCase());
  }
  if (params.location) {
    jobs = jobs.filter(j => j.location.toLowerCase().includes((params.location as string).toLowerCase()));
  }
  if (params.urgent !== undefined) {
    jobs = jobs.filter(j => j.isUrgent === params.urgent);
  }

  res.json(jobs.map(j => ({
    id: j.id,
    title: j.title,
    location: j.location,
    category: j.category,
    experienceLevel: j.experienceLevel,
    description: j.description,
    salaryRange: j.salaryRange ?? null,
    isUrgent: j.isUrgent,
    createdAt: j.createdAt.toISOString(),
  })));
});

router.get("/:id", async (req, res) => {
  const parsed = GetJobParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, parsed.data.id));
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json({
    id: job.id,
    title: job.title,
    location: job.location,
    category: job.category,
    experienceLevel: job.experienceLevel,
    description: job.description,
    salaryRange: job.salaryRange ?? null,
    isUrgent: job.isUrgent,
    createdAt: job.createdAt.toISOString(),
  });
});

export default router;
