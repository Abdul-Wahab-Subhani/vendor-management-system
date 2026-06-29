import { Prisma, QuotationStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { NotFoundError, BadRequestError, ForbiddenError } from "../utils/errors";
import { ActivityLogService, ActivityActions } from "./activityLog.service";
import { NotificationService } from "./notification.service";
import { EmailService } from "../services/email.service";
import { EmailTemplates } from "../emails/templates";
import { env } from "../config/env";
import {
  CreateQuotationRequestInput,
  SubmitQuotationInput,
} from "../validators/quotation.validators";

interface QuotationListParams {
  page: number;
  limit: number;
  skip: number;
  search?: string;
  status?: QuotationStatus;
  vendorId?: string;
  minAmount?: number;
  maxAmount?: number;
  fromDate?: Date;
  toDate?: Date;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export const QuotationService = {
  // ---------------- Quotation Requests ----------------

  async createRequest(input: CreateQuotationRequestInput, actor: { id: string; name: string }) {
    const vendors = await prisma.vendor.findMany({ where: { id: { in: input.vendorIds } } });
    if (vendors.length !== input.vendorIds.length) {
      throw new BadRequestError("One or more selected vendors do not exist");
    }

    const request = await prisma.quotationRequest.create({
      data: {
        title: input.title,
        description: input.description,
        dueDate: input.dueDate,
        status: input.status ?? "OPEN",
        createdById: actor.id,
        assignedVendors: {
          create: input.vendorIds.map((vendorId) => ({ vendorId })),
        },
      },
      include: { assignedVendors: { include: { vendor: true } } },
    });

    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.QUOTATION_REQUEST_CREATED,
      entityType: "QuotationRequest",
      entityId: request.id,
      description: `${actor.name} created quotation request "${request.title}" and assigned ${vendors.length} vendor(s)`,
    });

    // Notify each assigned vendor's user account(s), if any, and email the vendor
    for (const av of request.assignedVendors) {
      const vendorUsers = await prisma.user.findMany({ where: { vendorId: av.vendor.id, status: "ACTIVE" } });
      for (const vu of vendorUsers) {
        await NotificationService.create({
          userId: vu.id,
          title: "New quotation request",
          message: `You've been assigned: "${request.title}"`,
          type: "QUOTATION",
          link: `/quotations/requests/${request.id}`,
        });
      }

      await EmailService.send({
        to: av.vendor.email,
        ...EmailTemplates.newQuotationRequest(
          av.vendor.vendorName,
          request.title,
          request.dueDate ? request.dueDate.toLocaleDateString() : "Not specified",
          `${env.clientUrl}/quotations/requests/${request.id}`
        ),
        templateKey: "new_quotation_request",
      });
    }

    return request;
  },

  async listRequests(params: { page: number; limit: number; skip: number; status?: string; search?: string; vendorId?: string }) {
    const where: Prisma.QuotationRequestWhereInput = {
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.vendorId ? { assignedVendors: { some: { vendorId: params.vendorId } } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.quotationRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.limit,
        include: {
          createdBy: { select: { id: true, name: true } },
          assignedVendors: { include: { vendor: { select: { id: true, companyName: true } } } },
          _count: { select: { quotations: true } },
        },
      }),
      prisma.quotationRequest.count({ where }),
    ]);

    return { items, total };
  },

  async getRequestById(id: string, requestingVendorId?: string) {
    const request = await prisma.quotationRequest.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        assignedVendors: { include: { vendor: true } },
        quotations: { include: { vendor: true, attachments: true } },
      },
    });
    if (!request) throw new NotFoundError("Quotation request not found");

    if (requestingVendorId) {
      const isAssigned = request.assignedVendors.some((av) => av.vendorId === requestingVendorId);
      if (!isAssigned) throw new ForbiddenError("Your company was not assigned to this quotation request");
      // Vendors should only see their own submissions, not competitors' quotations/pricing
      request.quotations = request.quotations.filter((q) => q.vendorId === requestingVendorId);
    }

    return request;
  },

  async updateRequest(id: string, data: Record<string, unknown>, actor: { id: string; name: string }) {
    const request = await prisma.quotationRequest.findUnique({ where: { id } });
    if (!request) throw new NotFoundError("Quotation request not found");

    const updated = await prisma.quotationRequest.update({ where: { id }, data });

    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.QUOTATION_REQUEST_UPDATED,
      entityType: "QuotationRequest",
      entityId: id,
      description: `${actor.name} updated quotation request "${request.title}"`,
    });

    return updated;
  },

  async cancelRequest(id: string, actor: { id: string; name: string }) {
    const request = await prisma.quotationRequest.update({ where: { id }, data: { status: "CANCELLED" } });
    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.QUOTATION_REQUEST_CANCELLED,
      entityType: "QuotationRequest",
      entityId: id,
      description: `${actor.name} cancelled quotation request "${request.title}"`,
    });
    return request;
  },

  async assignVendors(requestId: string, vendorIds: string[], actor: { id: string; name: string }) {
    const request = await prisma.quotationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundError("Quotation request not found");

    await prisma.quotationRequestVendor.createMany({
      data: vendorIds.map((vendorId) => ({ quotationRequestId: requestId, vendorId })),
      skipDuplicates: true,
    });

    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.VENDOR_ASSIGNED,
      entityType: "QuotationRequest",
      entityId: requestId,
      description: `${actor.name} assigned ${vendorIds.length} additional vendor(s) to "${request.title}"`,
    });

    return this.getRequestById(requestId);
  },

  // ---------------- Quotations (vendor submissions) ----------------

  async submitQuotation(
    requestId: string,
    vendorId: string,
    input: SubmitQuotationInput,
    actor: { id: string; name: string }
  ) {
    const assignment = await prisma.quotationRequestVendor.findUnique({
      where: { quotationRequestId_vendorId: { quotationRequestId: requestId, vendorId } },
    });
    if (!assignment) throw new ForbiddenError("Your company was not assigned to this quotation request");

    const request = await prisma.quotationRequest.findUnique({ where: { id: requestId } });
    if (!request) throw new NotFoundError("Quotation request not found");
    if (request.status === "CLOSED" || request.status === "CANCELLED") {
      throw new BadRequestError("This quotation request is no longer accepting submissions");
    }

    const quotation = await prisma.$transaction(async (tx) => {
      const created = await tx.quotation.create({
        data: {
          quotationRequestId: requestId,
          vendorId,
          title: input.title,
          description: input.description,
          amount: input.amount,
          currency: input.currency,
          submissionDate: new Date(),
          status: "SUBMITTED",
        },
      });
      await tx.quotationRequestVendor.update({
        where: { id: assignment.id },
        data: { status: "SUBMITTED" },
      });
      return created;
    });

    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.QUOTATION_SUBMITTED,
      entityType: "Quotation",
      entityId: quotation.id,
      description: `${actor.name} submitted a quotation for "${request.title}"`,
    });

    // Notify the request's creator (and other admins) that a quotation came in
    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" } });
    for (const admin of admins) {
      await NotificationService.create({
        userId: admin.id,
        title: "Quotation submitted",
        message: `A new quotation was submitted for "${request.title}"`,
        type: "QUOTATION",
        link: `/quotations/requests/${requestId}`,
      });
      await EmailService.send({
        to: admin.email,
        ...EmailTemplates.quotationSubmitted(admin.name, actor.name, request.title, `${env.clientUrl}/quotations/requests/${requestId}`),
        templateKey: "quotation_submitted",
      });
    }

    return quotation;
  },

  async listQuotations(params: QuotationListParams) {
    const where: Prisma.QuotationWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.vendorId ? { vendorId: params.vendorId } : {}),
      ...(params.search ? { title: { contains: params.search, mode: "insensitive" } } : {}),
      ...(params.minAmount || params.maxAmount
        ? { amount: { gte: params.minAmount ?? undefined, lte: params.maxAmount ?? undefined } }
        : {}),
      ...(params.fromDate || params.toDate
        ? { submissionDate: { gte: params.fromDate ?? undefined, lte: params.toDate ?? undefined } }
        : {}),
    };

    const sortField = params.sortBy ?? "createdAt";
    const sortDirection = params.sortOrder ?? "desc";
    const orderBy: Prisma.QuotationOrderByWithRelationInput =
      sortField === "amount"
        ? { amount: sortDirection }
        : sortField === "submissionDate"
        ? { submissionDate: sortDirection }
        : sortField === "status"
        ? { status: sortDirection }
        : { createdAt: sortDirection };

    const [items, total] = await Promise.all([
      prisma.quotation.findMany({
        where,
        orderBy,
        skip: params.skip,
        take: params.limit,
        include: {
          vendor: { select: { id: true, companyName: true, vendorName: true, rating: true } },
          quotationRequest: { select: { id: true, title: true } },
        },
      }),
      prisma.quotation.count({ where }),
    ]);

    return { items, total };
  },

  async getQuotationById(id: string) {
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        vendor: true,
        quotationRequest: true,
        attachments: true,
        reviewedBy: { select: { id: true, name: true } },
      },
    });
    if (!quotation) throw new NotFoundError("Quotation not found");
    return quotation;
  },

  async updateQuotation(id: string, data: Record<string, unknown>, actor: { id: string; name: string }) {
    const quotation = await prisma.quotation.findUnique({ where: { id } });
    if (!quotation) throw new NotFoundError("Quotation not found");

    const updated = await prisma.quotation.update({ where: { id }, data });

    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.QUOTATION_UPDATED,
      entityType: "Quotation",
      entityId: id,
      description: `${actor.name} updated quotation "${quotation.title}"`,
    });

    return updated;
  },

  async updateStatus(
    id: string,
    status: QuotationStatus,
    internalNotes: string | undefined,
    actor: { id: string; name: string }
  ) {
    const quotation = await prisma.quotation.findUnique({ where: { id }, include: { vendor: true } });
    if (!quotation) throw new NotFoundError("Quotation not found");

    const updated = await prisma.quotation.update({
      where: { id },
      data: { status, internalNotes, reviewedById: actor.id, reviewedAt: new Date() },
    });

    const actionMap: Record<string, string> = {
      APPROVED: ActivityActions.QUOTATION_APPROVED,
      REJECTED: ActivityActions.QUOTATION_REJECTED,
      CANCELLED: ActivityActions.QUOTATION_CANCELLED,
    };

    await ActivityLogService.log({
      userId: actor.id,
      action: actionMap[status] ?? ActivityActions.QUOTATION_UPDATED,
      entityType: "Quotation",
      entityId: id,
      description: `${actor.name} set quotation "${quotation.title}" status to ${status}`,
    });

    const vendorUsers = await prisma.user.findMany({ where: { vendorId: quotation.vendorId, status: "ACTIVE" } });
    for (const vu of vendorUsers) {
      await NotificationService.create({
        userId: vu.id,
        title: `Quotation ${status.toLowerCase()}`,
        message: `Your quotation "${quotation.title}" status changed to ${status}`,
        type: status === "APPROVED" ? "SUCCESS" : status === "REJECTED" ? "WARNING" : "INFO",
        link: `/quotations/${id}`,
      });
    }

    if (status === "APPROVED") {
      await EmailService.send({
        to: quotation.vendor.email,
        ...EmailTemplates.quotationApproved(
          quotation.vendor.vendorName,
          quotation.title,
          `${quotation.currency} ${quotation.amount}`,
          `${env.clientUrl}/quotations/${id}`
        ),
        templateKey: "quotation_approved",
      });
    } else if (status === "REJECTED") {
      await EmailService.send({
        to: quotation.vendor.email,
        ...EmailTemplates.quotationRejected(quotation.vendor.vendorName, quotation.title, internalNotes, `${env.clientUrl}/quotations/${id}`),
        templateKey: "quotation_rejected",
      });
    }

    return updated;
  },

  async addAttachment(
    quotationId: string,
    file: { fileName: string; fileUrl: string; fileType: string; fileSize?: number },
    actor: { id: string; name: string }
  ) {
    const quotation = await prisma.quotation.findUnique({ where: { id: quotationId } });
    if (!quotation) throw new NotFoundError("Quotation not found");

    const attachment = await prisma.quotationAttachment.create({
      data: { quotationId, ...file },
    });

    await ActivityLogService.log({
      userId: actor.id,
      action: ActivityActions.QUOTATION_UPDATED,
      entityType: "Quotation",
      entityId: quotationId,
      description: `${actor.name} attached "${file.fileName}" to quotation "${quotation.title}"`,
    });

    return attachment;
  },

  async stats() {
    const [active, pending, approved, rejected, submitted] = await Promise.all([
      prisma.quotationRequest.count({ where: { status: "OPEN" } }),
      prisma.quotation.count({ where: { status: "PENDING" } }),
      prisma.quotation.count({ where: { status: "APPROVED" } }),
      prisma.quotation.count({ where: { status: "REJECTED" } }),
      prisma.quotation.count({ where: { status: "SUBMITTED" } }),
    ]);
    return { active, pending, approved, rejected, submitted };
  },
};
