import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated, parsePagination, buildPaginationMeta } from "../utils/apiResponse";
import { EmailService } from "../services/email.service";
import { EmailTemplateService } from "../services/emailTemplate.service";
import { prisma } from "../config/prisma";
import { BadRequestError } from "../utils/errors";
import { ActivityLogService, ActivityActions } from "../services/activityLog.service";

async function resolveRecipients(recipientType: string, vendorIds?: string[]): Promise<string[]> {
  switch (recipientType) {
    case "SINGLE_VENDOR":
    case "MULTIPLE_VENDORS": {
      if (!vendorIds?.length) throw new BadRequestError("vendorIds is required for this recipient type");
      const vendors = await prisma.vendor.findMany({ where: { id: { in: vendorIds } } });
      return vendors.map((v) => v.email);
    }
    case "ALL_VENDORS": {
      const vendors = await prisma.vendor.findMany({ where: { status: "ACTIVE" } });
      return vendors.map((v) => v.email);
    }
    case "ALL_ADMINS": {
      const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" } });
      return admins.map((a) => a.email);
    }
    default:
      throw new BadRequestError("Unknown recipient type");
  }
}

export const EmailController = {
  send: asyncHandler(async (req: Request, res: Response) => {
    const { recipientType, vendorIds, subject, bodyHtml, scheduledFor } = req.body;
    const recipients = await resolveRecipients(recipientType, vendorIds);

    if (recipients.length === 0) throw new BadRequestError("No recipients matched this selection");

    const results = await Promise.all(
      recipients.map((to) =>
        EmailService.send({ to, subject, html: bodyHtml, sentById: req.user!.id, scheduledFor, templateKey: "broadcast" })
      )
    );

    await ActivityLogService.log({
      userId: req.user!.id,
      action: ActivityActions.EMAIL_SENT,
      entityType: "EmailLog",
      description: `${req.user!.name} sent "${subject}" to ${recipients.length} recipient(s) (${recipientType})`,
    });

    sendCreated(res, { recipientCount: recipients.length, results: results.length }, "Email(s) queued successfully");
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req.query);
    const { items, total } = await EmailService.history({ page, limit, skip, status: req.query.status as never });
    sendSuccess(res, items, "Email history retrieved", 200, buildPaginationMeta(page, limit, total));
  }),

  // ---- Template manager ----
  listTemplates: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await EmailTemplateService.list());
  }),

  createTemplate: asyncHandler(async (req: Request, res: Response) => {
    sendCreated(res, await EmailTemplateService.create(req.body), "Template created");
  }),

  updateTemplate: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await EmailTemplateService.update(req.params.key, req.body), "Template updated");
  }),

  deleteTemplate: asyncHandler(async (req: Request, res: Response) => {
    await EmailTemplateService.delete(req.params.key);
    sendSuccess(res, null, "Template deleted");
  }),

  previewTemplate: asyncHandler(async (req: Request, res: Response) => {
    sendSuccess(res, await EmailTemplateService.preview(req.params.key, req.body.variables ?? {}));
  }),
};
