import { Router } from "express";
import { QuotationController } from "../controllers/quotation.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { upload } from "../middleware/upload.middleware";
import {
  createQuotationRequestSchema,
  updateQuotationRequestSchema,
  assignVendorsSchema,
  submitQuotationSchema,
  updateQuotationStatusSchema,
} from "../validators/quotation.validators";

const router = Router();

router.use(requireAuth);

// Quotation requests (created by admins, fulfilled by vendors)
router.post(
  "/requests",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validate(createQuotationRequestSchema),
  QuotationController.createRequest
);
router.get("/requests", QuotationController.listRequests);
router.get("/requests/:id", QuotationController.getRequestById);
router.put(
  "/requests/:id",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validate(updateQuotationRequestSchema),
  QuotationController.updateRequest
);
router.post("/requests/:id/cancel", requireRole("SUPER_ADMIN", "ADMIN"), QuotationController.cancelRequest);
router.post(
  "/requests/:id/assign-vendors",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validate(assignVendorsSchema),
  QuotationController.assignVendors
);
router.post(
  "/requests/:id/submit",
  requireRole("VENDOR"),
  validate(submitQuotationSchema),
  QuotationController.submitQuotation
);

// Individual quotations
router.get("/", QuotationController.listQuotations);
router.get("/stats", requireRole("SUPER_ADMIN", "ADMIN"), QuotationController.stats);
router.get("/:id", QuotationController.getQuotationById);
router.put("/:id", requireRole("SUPER_ADMIN", "ADMIN"), QuotationController.updateQuotation);
router.patch(
  "/:id/status",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validate(updateQuotationStatusSchema),
  QuotationController.updateStatus
);
router.post("/:id/attachments", upload.single("file"), QuotationController.uploadAttachment);

export default router;
