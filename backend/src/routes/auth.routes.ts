import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { authRateLimiter } from "../middleware/rateLimit.middleware";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  changePasswordSchema,
} from "../validators/auth.validators";

const router = Router();

router.post("/register", authRateLimiter, validate(registerSchema), AuthController.register);
router.post("/login", authRateLimiter, validate(loginSchema), AuthController.login);
router.post("/refresh", AuthController.refresh);
router.post("/logout", AuthController.logout);
router.post("/forgot-password", authRateLimiter, validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post("/reset-password", authRateLimiter, validate(resetPasswordSchema), AuthController.resetPassword);
router.post("/verify-email", validate(verifyEmailSchema), AuthController.verifyEmail);
router.post("/change-password", requireAuth, validate(changePasswordSchema), AuthController.changePassword);
router.get("/me", requireAuth, AuthController.me);

export default router;
