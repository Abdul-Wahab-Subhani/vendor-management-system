import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, parsePagination, buildPaginationMeta } from "../utils/apiResponse";
import { NotificationService } from "../services/notification.service";

export const NotificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req.query);
    const { items, total, unreadCount } = await NotificationService.listForUser(req.user!.id, {
      page,
      limit,
      skip,
      unreadOnly: req.query.unreadOnly === "true",
    });
    sendSuccess(res, { items, unreadCount }, "Notifications retrieved", 200, buildPaginationMeta(page, limit, total));
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    await NotificationService.markRead(req.user!.id, req.params.id);
    sendSuccess(res, null, "Notification marked as read");
  }),

  markAllRead: asyncHandler(async (req: Request, res: Response) => {
    await NotificationService.markAllRead(req.user!.id);
    sendSuccess(res, null, "All notifications marked as read");
  }),
};
