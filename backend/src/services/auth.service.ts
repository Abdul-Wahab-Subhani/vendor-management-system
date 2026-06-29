import { prisma } from "../config/prisma";
import { hashPassword, comparePassword, generateSecureToken, hashToken } from "../utils/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken, expiryToDate } from "../utils/jwt";
import { env } from "../config/env";
import { BadRequestError, UnauthorizedError, ConflictError, NotFoundError } from "../utils/errors";
import { ActivityLogService, ActivityActions } from "./activityLog.service";
import { EmailService } from "./email.service";
import { EmailTemplates } from "../emails/templates";
import { RegisterInput, LoginInput } from "../validators/auth.validators";

interface LoginContext {
  ipAddress?: string;
  userAgent?: string;
}

function buildVerifyUrl(token: string) {
  return `${env.clientUrl}/verify-email?token=${token}`;
}
function buildResetUrl(token: string) {
  return `${env.clientUrl}/reset-password?token=${token}`;
}

export const AuthService = {
  /** Public self-registration always creates a VENDOR-role account pending email verification. */
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError("An account with this email already exists");

    const passwordHash = await hashPassword(input.password);
    const emailVerifyToken = generateSecureToken();

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: "VENDOR",
        emailVerifyToken: hashToken(emailVerifyToken),
        emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await EmailService.send({
      to: user.email,
      ...EmailTemplates.emailVerification(user.name, buildVerifyUrl(emailVerifyToken)),
      templateKey: "email_verification",
    });

    await ActivityLogService.log({
      userId: user.id,
      action: ActivityActions.ACCOUNT_CREATED,
      entityType: "User",
      entityId: user.id,
      description: `${user.name} self-registered an account`,
    });

    return { id: user.id, email: user.email, name: user.name };
  },

  async login(input: LoginInput, ctx: LoginContext) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user || !(await comparePassword(input.password, user.passwordHash))) {
      if (user) {
        await prisma.loginHistory.create({
          data: { userId: user.id, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, success: false },
        });
        await ActivityLogService.log({
          userId: user.id,
          action: ActivityActions.USER_LOGIN_FAILED,
          entityType: "User",
          entityId: user.id,
          description: "Failed login attempt (incorrect password)",
          ipAddress: ctx.ipAddress,
        });
      }
      throw new UnauthorizedError("Invalid email or password");
    }

    if (user.status !== "ACTIVE") {
      throw new UnauthorizedError(`Account is ${user.status.toLowerCase()}. Contact an administrator.`);
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role);

    await prisma.$transaction([
      prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
      prisma.loginHistory.create({
        data: { userId: user.id, ipAddress: ctx.ipAddress, userAgent: ctx.userAgent, success: true },
      }),
    ]);

    await ActivityLogService.log({
      userId: user.id,
      action: ActivityActions.USER_LOGIN,
      entityType: "User",
      entityId: user.id,
      description: `${user.name} logged in`,
      ipAddress: ctx.ipAddress,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        vendorId: user.vendorId,
        avatarUrl: user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
      },
      ...tokens,
    };
  },

  async issueTokenPair(userId: string, email: string, role: "SUPER_ADMIN" | "ADMIN" | "VENDOR") {
    const accessToken = signAccessToken({ sub: userId, email, role });

    const rawRefreshToken = generateSecureToken();
    const tokenRecord = await prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(rawRefreshToken),
        expiresAt: expiryToDate(env.jwt.refreshExpiresIn),
      },
    });

    const refreshToken = signRefreshToken({ sub: userId, tokenId: tokenRecord.id });
    return { accessToken, refreshToken, rawRefreshToken };
  },

  async refresh(refreshToken: string) {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const tokenRecord = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });
    if (!tokenRecord || tokenRecord.revokedAt || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token has been revoked or expired");
    }

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== "ACTIVE") throw new UnauthorizedError("Account is not active");

    // Rotate: revoke old, issue new
    await prisma.refreshToken.update({ where: { id: tokenRecord.id }, data: { revokedAt: new Date() } });
    const tokens = await this.issueTokenPair(user.id, user.email, user.role);

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user };
  },

  async logout(refreshTokenId: string | undefined) {
    if (!refreshTokenId) return;
    await prisma.refreshToken
      .update({ where: { id: refreshTokenId }, data: { revokedAt: new Date() } })
      .catch(() => undefined);
  },

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    // Always respond success-shaped (handled in controller) to avoid leaking which emails exist
    if (!user) return;

    const rawToken = generateSecureToken();
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashToken(rawToken),
        resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    await EmailService.send({
      to: user.email,
      ...EmailTemplates.passwordResetRequest(user.name, buildResetUrl(rawToken)),
      templateKey: "password_reset_request",
    });

    await ActivityLogService.log({
      userId: user.id,
      action: ActivityActions.PASSWORD_RESET_REQUESTED,
      entityType: "User",
      entityId: user.id,
      description: "Password reset requested",
    });
  },

  async resetPassword(rawToken: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { resetToken: hashToken(rawToken), resetTokenExpires: { gt: new Date() } },
    });
    if (!user) throw new BadRequestError("Reset link is invalid or has expired");

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetTokenExpires: null },
    });

    // Revoke all existing sessions for safety
    await prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    await EmailService.send({ to: user.email, ...EmailTemplates.passwordChanged(user.name) });

    await ActivityLogService.log({
      userId: user.id,
      action: ActivityActions.PASSWORD_RESET,
      entityType: "User",
      entityId: user.id,
      description: "Password was reset",
    });
  },

  async verifyEmail(rawToken: string) {
    const user = await prisma.user.findFirst({
      where: { emailVerifyToken: hashToken(rawToken), emailVerifyExpires: { gt: new Date() } },
    });
    if (!user) throw new BadRequestError("Verification link is invalid or has expired");

    await prisma.user.update({
      where: { id: user.id },
      data: { isEmailVerified: true, emailVerifyToken: null, emailVerifyExpires: null },
    });

    await EmailService.send({ to: user.email, ...EmailTemplates.welcome(user.name) });

    await ActivityLogService.log({
      userId: user.id,
      action: ActivityActions.EMAIL_VERIFIED,
      entityType: "User",
      entityId: user.id,
      description: "Email address verified",
    });
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError("User not found");

    const matches = await comparePassword(currentPassword, user.passwordHash);
    if (!matches) throw new BadRequestError("Current password is incorrect");

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    await EmailService.send({ to: user.email, ...EmailTemplates.passwordChanged(user.name) });
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        avatarUrl: true,
        isEmailVerified: true,
        vendorId: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundError("User not found");
    return user;
  },
};
