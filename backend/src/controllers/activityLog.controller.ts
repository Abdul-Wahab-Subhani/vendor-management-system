import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, parsePagination, buildPaginationMeta } from "../utils/apiResponse";
import { ActivityLogService } from "../services/activityLog.service";

export const ActivityLogController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req.query);
    const { items, total } = await ActivityLogService.list({
      page,
      limit,
      skip,
      userId: req.query.userId as string | undefined,
      entityType: req.query.entityType as string | undefined,
    });
    sendSuccess(res, items, "Activity logs retrieved", 200, buildPaginationMeta(page, limit, total));
  }),
};
