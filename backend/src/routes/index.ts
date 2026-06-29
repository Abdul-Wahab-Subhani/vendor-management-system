import { Router } from "express";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";
import vendorRoutes from "./vendor.routes";
import quotationRoutes from "./quotation.routes";
import comparisonRoutes from "./comparison.routes";
import dashboardRoutes from "./dashboard.routes";
import notificationRoutes from "./notification.routes";
import emailRoutes from "./email.routes";
import activityLogRoutes from "./activityLog.routes";

const router = Router();

function statusResponse(message: string) {
	return {
		success: true,
		message,
		timestamp: new Date().toISOString(),
	};
}

router.use("/auth", authRoutes);
router.use("/accounts", userRoutes);
router.use("/vendors", vendorRoutes);
router.use("/quotations", quotationRoutes);
router.use("/comparison", comparisonRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/notifications", notificationRoutes);
router.use("/emails", emailRoutes);
router.use("/activity-logs", activityLogRoutes);


router.get("/", (_req, res) => res.json(statusResponse("API is running")));

router.get("/health", (_req, res) => res.json(statusResponse("API is healthy")));

// Render / uptime monitors can ping this lightweight endpoint to keep the service active.
router.get("/awake", (_req, res) => res.json(statusResponse("API is awake")));

export default router;
