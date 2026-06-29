import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { DashboardService } from "../services/dashboard.service";

export const DashboardController = {
  overview: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await DashboardService.overview());
  }),

  monthlyAnalytics: asyncHandler(async (req: Request, res: Response) => {
    const months = req.query.months ? Number(req.query.months) : 6;
    sendSuccess(res, await DashboardService.monthlyAnalytics(months));
  }),

  statusBreakdown: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await DashboardService.statusBreakdown());
  }),

  vendorCategoryBreakdown: asyncHandler(async (_req: Request, res: Response) => {
    sendSuccess(res, await DashboardService.vendorCategoryBreakdown());
  }),

  topVendors: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 5;
    sendSuccess(res, await DashboardService.topVendorsByValue(limit));
  }),

  recentActivity: asyncHandler(async (req: Request, res: Response) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    sendSuccess(res, await DashboardService.recentActivity(limit));
  }),
};
