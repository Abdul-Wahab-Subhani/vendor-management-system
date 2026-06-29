import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

interface LogActivityInput {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
}

export const ActivityLogService = {
  async log(input: LogActivityInput) {
    return prisma.activityLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        description: input.description,
        metadata: input.metadata,
        ipAddress: input.ipAddress ?? null,
      },
    });
  },

  async list(params: { page: number; limit: number; skip: number; userId?: string; entityType?: string }) {
    const where = {
      ...(params.userId ? { userId: params.userId } : {}),
      ...(params.entityType ? { entityType: params.entityType } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.limit,
        include: { user: { select: { id: true, name: true, email: true, role: true } } },
      }),
      prisma.activityLog.count({ where }),
    ]);

    return { items, total };
  },
};

/** Common, well-known action names — keeps logs consistent across the codebase. */
export const ActivityActions = {
  USER_LOGIN: "USER_LOGIN",
  USER_LOGOUT: "USER_LOGOUT",
  USER_LOGIN_FAILED: "USER_LOGIN_FAILED",
  PASSWORD_RESET_REQUESTED: "PASSWORD_RESET_REQUESTED",
  PASSWORD_RESET: "PASSWORD_RESET",
  EMAIL_VERIFIED: "EMAIL_VERIFIED",
  ACCOUNT_CREATED: "ACCOUNT_CREATED",
  ACCOUNT_UPDATED: "ACCOUNT_UPDATED",
  ACCOUNT_STATUS_CHANGED: "ACCOUNT_STATUS_CHANGED",
  ACCOUNT_DELETED: "ACCOUNT_DELETED",
  VENDOR_CREATED: "VENDOR_CREATED",
  VENDOR_UPDATED: "VENDOR_UPDATED",
  VENDOR_DELETED: "VENDOR_DELETED",
  VENDOR_STATUS_CHANGED: "VENDOR_STATUS_CHANGED",
  VENDOR_NOTE_ADDED: "VENDOR_NOTE_ADDED",
  VENDOR_DOCUMENT_UPLOADED: "VENDOR_DOCUMENT_UPLOADED",
  QUOTATION_REQUEST_CREATED: "QUOTATION_REQUEST_CREATED",
  QUOTATION_REQUEST_UPDATED: "QUOTATION_REQUEST_UPDATED",
  QUOTATION_REQUEST_CANCELLED: "QUOTATION_REQUEST_CANCELLED",
  VENDOR_ASSIGNED: "VENDOR_ASSIGNED",
  QUOTATION_SUBMITTED: "QUOTATION_SUBMITTED",
  QUOTATION_UPDATED: "QUOTATION_UPDATED",
  QUOTATION_APPROVED: "QUOTATION_APPROVED",
  QUOTATION_REJECTED: "QUOTATION_REJECTED",
  QUOTATION_CANCELLED: "QUOTATION_CANCELLED",
  EMAIL_SENT: "EMAIL_SENT",
  PDF_EXPORTED: "PDF_EXPORTED",
} as const;
