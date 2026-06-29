import { prisma } from "../config/prisma";
import { hashPassword, generateSecureToken } from "../utils/password";
import { BadRequestError, ConflictError, NotFoundError } from "../utils/errors";
import { ActivityLogService, ActivityActions } from "./activityLog.service";
import { EmailService } from "./email.service";
import { EmailTemplates } from "../emails/templates";
import { env } from "../config/env";
import { CreateAccountInput } from "../validators/user.validators";
import { Role, AccountStatus, Prisma } from "@prisma/client";

function randomTempPassword(): string {
  // e.g. "Tq8f-Kd92-Lp3x" — readable, meets complexity rules
  return `${generateSecureToken(2).toUpperCase()}-${generateSecureToken(2)}-Vx9!`;
}

export const UserService = {
  async list(params: {
    page: number;
    limit: number;
    skip: number;
    search?: string;
    role?: Role;
    status?: AccountStatus;
  }) {
    const where: Prisma.UserWhereInput = {
      ...(params.role ? { role: params.role } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.search
        ? {
            OR: [
              { name: { contains: params.search, mode: "insensitive" } },
              { email: { contains: params.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          isEmailVerified: true,
          lastLoginAt: true,
          createdAt: true,
          vendor: { select: { id: true, companyName: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { items, total };
  },

  async createAccount(input: CreateAccountInput, createdBy: { id: string; name: string }) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictError("An account with this email already exists");

    if (input.role === "VENDOR" && !input.vendorId) {
      throw new BadRequestError("vendorId is required when creating a vendor account");
    }

    if (input.vendorId) {
      const vendor = await prisma.vendor.findUnique({ where: { id: input.vendorId } });
      if (!vendor) throw new NotFoundError("Linked vendor record not found");
    }

    const tempPassword = randomTempPassword();
    const passwordHash = await hashPassword(tempPassword);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        role: input.role,
        vendorId: input.vendorId,
        isEmailVerified: true, // admin-created accounts are pre-verified
        status: "ACTIVE",
      },
    });

    const loginUrl = `${env.clientUrl}/login`;
    const template =
      input.role === "ADMIN"
        ? EmailTemplates.adminAccountCreated(user.name, user.email, tempPassword, loginUrl)
        : EmailTemplates.vendorAccountCreated(user.name, user.email, tempPassword, loginUrl);

    await EmailService.send({ to: user.email, ...template, templateKey: `${input.role.toLowerCase()}_account_created` });

    await ActivityLogService.log({
      userId: createdBy.id,
      action: ActivityActions.ACCOUNT_CREATED,
      entityType: "User",
      entityId: user.id,
      description: `${createdBy.name} created a ${input.role} account for ${user.name} (${user.email})`,
    });

    return { id: user.id, email: user.email, name: user.name, role: user.role, tempPassword };
  },

  async updateStatus(targetUserId: string, status: AccountStatus, actor: { id: string; name: string }) {
    const user = await prisma.user.update({ where: { id: targetUserId }, data: { status } });

    if (status !== "ACTIVE") {
      await prisma.refreshToken.updateMany({
        where: { userId: targetUserId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.ACCOUNT_STATUS_CHANGED,
      entityType: "User",
      entityId: targetUserId,
      description: `${actor.name} set ${user.name}'s account status to ${status}`,
    });

    return user;
  },

  async updateRole(targetUserId: string, role: Role, actor: { id: string; name: string }) {
    const user = await prisma.user.update({ where: { id: targetUserId }, data: { role } });
    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.ACCOUNT_UPDATED,
      entityType: "User",
      entityId: targetUserId,
      description: `${actor.name} changed ${user.name}'s role to ${role}`,
    });
    return user;
  },

  async resetPassword(targetUserId: string, actor: { id: string; name: string }, explicitPassword?: string) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundError("User not found");

    const newPassword = explicitPassword ?? randomTempPassword();
    const passwordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({ where: { id: targetUserId }, data: { passwordHash } }),
      prisma.refreshToken.updateMany({ where: { userId: targetUserId, revokedAt: null }, data: { revokedAt: new Date() } }),
    ]);

    await EmailService.send({
      to: user.email,
      ...EmailTemplates.passwordChanged(user.name),
    });

    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.PASSWORD_RESET,
      entityType: "User",
      entityId: targetUserId,
      description: `${actor.name} reset the password for ${user.name}`,
    });

    return { tempPassword: newPassword };
  },

  async deleteAccount(targetUserId: string, actor: { id: string; name: string }) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) throw new NotFoundError("User not found");

    await prisma.user.delete({ where: { id: targetUserId } });

    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.ACCOUNT_DELETED,
      entityType: "User",
      entityId: targetUserId,
      description: `${actor.name} deleted account for ${user.name} (${user.email})`,
    });
  },

  async loginHistory(targetUserId: string, params: { page: number; limit: number; skip: number }) {
    const [items, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where: { userId: targetUserId },
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.limit,
      }),
      prisma.loginHistory.count({ where: { userId: targetUserId } }),
    ]);
    return { items, total };
  },
};
