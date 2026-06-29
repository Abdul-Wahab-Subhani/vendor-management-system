import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated, parsePagination, buildPaginationMeta } from "../utils/apiResponse";
import { UserService } from "../services/user.service";

export const UserController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req.query);
    const { items, total } = await UserService.list({
      page,
      limit,
      skip,
      search: req.query.search as string | undefined,
      role: req.query.role as never,
      status: req.query.status as never,
    });
    sendSuccess(res, items, "Accounts retrieved", 200, buildPaginationMeta(page, limit, total));
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const result = await UserService.createAccount(req.body, req.user!);
    sendCreated(res, result, `${result.role} account created. Login credentials emailed to ${result.email}.`);
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.updateStatus(req.params.id, req.body.status, req.user!);
    sendSuccess(res, user, "Account status updated");
  }),

  updateRole: asyncHandler(async (req: Request, res: Response) => {
    const user = await UserService.updateRole(req.params.id, req.body.role, req.user!);
    sendSuccess(res, user, "Account role updated");
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const result = await UserService.resetPassword(req.params.id, req.user!, req.body.newPassword);
    sendSuccess(res, { tempPassword: result.tempPassword }, "Password reset and emailed to the user");
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await UserService.deleteAccount(req.params.id, req.user!);
    sendSuccess(res, null, "Account deleted");
  }),

  loginHistory: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req.query);
    const { items, total } = await UserService.loginHistory(req.params.id, { page, limit, skip });
    sendSuccess(res, items, "Login history retrieved", 200, buildPaginationMeta(page, limit, total));
  }),
};
