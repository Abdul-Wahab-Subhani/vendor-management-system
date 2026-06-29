import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated } from "../utils/apiResponse";
import { AuthService } from "../services/auth.service";
import { env } from "../config/env";

const REFRESH_COOKIE = "refreshToken";
const ACCESS_COOKIE = "accessToken";

function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const cookieOpts = {
    httpOnly: true,
    secure: env.isProduction,
    sameSite: "lax" as const,
  };
  res.cookie(ACCESS_COOKIE, accessToken, { ...cookieOpts, maxAge: 15 * 60 * 1000 });
  res.cookie(REFRESH_COOKIE, refreshToken, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.register(req.body);
    sendCreated(res, result, "Account created. Please check your email to verify your address.");
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await AuthService.login(req.body, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { user: result.user, accessToken: result.accessToken }, "Logged in successfully");
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const token = req.cookies?.[REFRESH_COOKIE] ?? req.body.refreshToken;
    const result = await AuthService.refresh(token);
    setAuthCookies(res, result.accessToken, result.refreshToken);
    sendSuccess(res, { accessToken: result.accessToken }, "Token refreshed");
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    res.clearCookie(ACCESS_COOKIE);
    res.clearCookie(REFRESH_COOKIE);
    sendSuccess(res, null, "Logged out successfully");
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await AuthService.forgotPassword(req.body.email);
    sendSuccess(res, null, "If an account exists for this email, a reset link has been sent.");
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await AuthService.resetPassword(req.body.token, req.body.password);
    sendSuccess(res, null, "Password has been reset. You can now log in.");
  }),

  verifyEmail: asyncHandler(async (req: Request, res: Response) => {
    await AuthService.verifyEmail(req.body.token);
    sendSuccess(res, null, "Email verified successfully");
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    await AuthService.changePassword(req.user!.id, req.body.currentPassword, req.body.newPassword);
    sendSuccess(res, null, "Password changed successfully");
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const profile = await AuthService.getProfile(req.user!.id);
    sendSuccess(res, profile);
  }),
};
