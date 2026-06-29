import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRole("SUPER_ADMIN", "ADMIN"));

router.get("/overview", DashboardController.overview);
router.get("/monthly-analytics", DashboardController.monthlyAnalytics);
router.get("/status-breakdown", DashboardController.statusBreakdown);
router.get("/vendor-category-breakdown", DashboardController.vendorCategoryBreakdown);
router.get("/top-vendors", DashboardController.topVendors);
router.get("/recent-activity", DashboardController.recentActivity);

export default router;
