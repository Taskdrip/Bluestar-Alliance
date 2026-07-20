import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import jobsRouter from "./jobs";
import applicationsRouter from "./applications";
import testimonialsRouter from "./testimonials";
import adminRouter from "./admin";
import statsRouter from "./stats";
import messagesRouter from "./messages";
import notificationsRouter from "./notifications";
import addonOrdersRouter from "./addon-orders";
import pushRouter from "./push";
import emailRouter from "./email";
import newsletterRouter from "./newsletter";
import uploadRouter from "./upload";
import announcementRouter from "./announcement";
import directMessagesRouter from "./direct-messages";
import { db, paymentSettingsTable } from "@workspace/db";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/jobs", jobsRouter);
router.use("/applications", applicationsRouter);
router.use("/testimonials", testimonialsRouter);
router.use("/admin", adminRouter);
router.use("/stats", statsRouter);
router.use("/messages", messagesRouter);
router.use("/notifications", notificationsRouter);
router.use("/addon-orders", addonOrdersRouter);
router.use("/push", pushRouter);
router.use("/email", emailRouter);
router.use("/newsletter", newsletterRouter);
router.use("/upload", uploadRouter);
router.use("/announcement-popup", announcementRouter);
router.use("/direct-messages", directMessagesRouter);

// Public read-only payment settings (applicants need bank details after addon selection)
router.get("/payment-settings", async (_req, res) => {
  try {
    const [settings] = await db.select().from(paymentSettingsTable);
    if (!settings) { res.status(404).json({ error: "Not configured" }); return; }
    res.json({
      bankName: settings.bankName,
      accountName: settings.accountName,
      accountNumber: settings.accountNumber,
      routingNumber: settings.routingNumber ?? null,
      swiftCode: settings.swiftCode ?? null,
      additionalInfo: settings.additionalInfo ?? null,
    });
  } catch {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
