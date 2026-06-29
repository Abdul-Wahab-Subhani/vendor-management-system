import { Router } from "express";
import { ComparisonController } from "../controllers/comparison.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.use(requireAuth, requireRole("SUPER_ADMIN", "ADMIN"));

router.get("/:requestId", ComparisonController.compare);
router.get("/:requestId/export-pdf", ComparisonController.exportPdf);

export default router;
