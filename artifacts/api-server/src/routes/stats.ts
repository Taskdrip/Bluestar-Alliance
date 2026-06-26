import { Router } from "express";
import { db, applicationsTable, jobsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/summary", async (_req, res) => {
  const [apps, jobs] = await Promise.all([
    db.select().from(applicationsTable),
    db.select().from(jobsTable),
  ]);

  const totalApplications = apps.length;
  const totalJobs = jobs.length;
  const urgentJobs = jobs.filter(j => j.isUrgent).length;
  const pendingApplications = apps.filter(a => a.status === "pending").length;
  const approvedApplications = apps.filter(a => a.status === "approved").length;

  res.json({ totalApplications, totalJobs, urgentJobs, pendingApplications, approvedApplications });
});

router.get("/applications-by-role", async (_req, res) => {
  const apps = await db.select().from(applicationsTable);

  const counts: Record<string, number> = {};
  for (const app of apps) {
    counts[app.position] = (counts[app.position] ?? 0) + 1;
  }

  const result = Object.entries(counts)
    .map(([position, count]) => ({ position, count }))
    .sort((a, b) => b.count - a.count);

  res.json(result);
});

export default router;
