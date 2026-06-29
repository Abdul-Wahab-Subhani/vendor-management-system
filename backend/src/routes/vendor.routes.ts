import { Router } from "express";
import { VendorController } from "../controllers/vendor.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { upload } from "../middleware/upload.middleware";
import {
  createVendorSchema,
  updateVendorSchema,
  addVendorNoteSchema,
} from "../validators/vendor.validators";
import { z } from "zod";

const router = Router();

router.use(requireAuth);

router.get("/", VendorController.list);
router.get("/stats", requireRole("SUPER_ADMIN", "ADMIN"), VendorController.stats);
router.get("/:id", VendorController.getById);
router.get("/:id/activity", requireRole("SUPER_ADMIN", "ADMIN"), VendorController.activityHistory);

router.post("/", requireRole("SUPER_ADMIN", "ADMIN"), validate(createVendorSchema), VendorController.create);
router.put("/:id", requireRole("SUPER_ADMIN", "ADMIN"), validate(updateVendorSchema), VendorController.update);
router.patch(
  "/:id/status",
  requireRole("SUPER_ADMIN", "ADMIN"),
  validate(z.object({ status: z.enum(["ACTIVE", "INACTIVE", "PENDING", "BLACKLISTED"]) })),
  VendorController.updateStatus
);
router.delete("/:id", requireRole("SUPER_ADMIN", "ADMIN"), VendorController.delete);

router.post("/:id/notes", requireRole("SUPER_ADMIN", "ADMIN"), validate(addVendorNoteSchema), VendorController.addNote);
router.post(
  "/:id/documents",
  requireRole("SUPER_ADMIN", "ADMIN"),
  upload.single("file"),
  VendorController.uploadDocument
);

export default router;
