import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  createAccountSchema,
  updateAccountStatusSchema,
  updateAccountRoleSchema,
  adminResetPasswordSchema,
} from "../validators/user.validators";

const router = Router();

router.use(requireAuth, requireRole("SUPER_ADMIN"));

router.get("/", UserController.list);
router.post("/", validate(createAccountSchema), UserController.create);
router.patch("/:id/status", validate(updateAccountStatusSchema), UserController.updateStatus);
router.patch("/:id/role", validate(updateAccountRoleSchema), UserController.updateRole);
router.post("/:id/reset-password", validate(adminResetPasswordSchema), UserController.resetPassword);
router.delete("/:id", UserController.delete);
router.get("/:id/login-history", UserController.loginHistory);

export default router;
