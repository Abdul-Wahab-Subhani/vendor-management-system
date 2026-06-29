import { Router } from "express";
import { EmailController } from "../controllers/email.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { sendEmailSchema, createTemplateSchema, updateTemplateSchema } from "../validators/email.validators";

const router = Router();

router.use(requireAuth, requireRole("SUPER_ADMIN", "ADMIN"));

router.post("/send", validate(sendEmailSchema), EmailController.send);
router.get("/history", EmailController.history);

router.get("/templates", EmailController.listTemplates);
router.post("/templates", validate(createTemplateSchema), EmailController.createTemplate);
router.put("/templates/:key", validate(updateTemplateSchema), EmailController.updateTemplate);
router.delete("/templates/:key", EmailController.deleteTemplate);
router.post("/templates/:key/preview", EmailController.previewTemplate);

export default router;
