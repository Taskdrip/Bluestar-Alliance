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

export default router;
