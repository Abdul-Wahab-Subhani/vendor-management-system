import { Router } from "express";
import { ActivityLogController } from "../controllers/activityLog.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRole("SUPER_ADMIN", "ADMIN"));

router.get("/", ActivityLogController.list);

export default router;
