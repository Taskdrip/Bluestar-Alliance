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

export default router;
