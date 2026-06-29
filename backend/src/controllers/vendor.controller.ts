import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated, parsePagination, buildPaginationMeta } from "../utils/apiResponse";
import { VendorService } from "../services/vendor.service";
import { UploadService } from "../services/upload.service";
import { BadRequestError } from "../utils/errors";

export const VendorController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req.query);
    const { items, total } = await VendorService.list({
      page,
      limit,
      skip,
      search: req.query.search as string | undefined,
      status: req.query.status as never,
      category: req.query.category as string | undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
    });
    sendSuccess(res, items, "Vendors retrieved", 200, buildPaginationMeta(page, limit, total));
  }),

  stats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await VendorService.stats();
    sendSuccess(res, stats);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const vendor = await VendorService.getById(req.params.id);
    sendSuccess(res, vendor);
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const vendor = await VendorService.create(req.body, req.user!);
    sendCreated(res, vendor, "Vendor created successfully");
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const vendor = await VendorService.update(req.params.id, req.body, req.user!);
    sendSuccess(res, vendor, "Vendor updated successfully");
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const vendor = await VendorService.updateStatus(req.params.id, req.body.status, req.user!);
    sendSuccess(res, vendor, "Vendor status updated");
  }),

  delete: asyncHandler(async (req: Request, res: Response) => {
    await VendorService.delete(req.params.id, req.user!);
    sendSuccess(res, null, "Vendor deleted successfully");
  }),

  addNote: asyncHandler(async (req: Request, res: Response) => {
    const note = await VendorService.addNote(req.params.id, req.body.content, req.user!);
    sendCreated(res, note, "Note added");
  }),

  uploadDocument: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new BadRequestError("No file uploaded");
    const uploaded = await UploadService.upload(req.file, "vendor-documents");
    const document = await VendorService.addDocument(
      req.params.id,
      { fileName: uploaded.fileName, fileUrl: uploaded.url, fileType: uploaded.fileType, fileSize: uploaded.fileSize },
      req.user!
    );
    sendCreated(res, document, "Document uploaded successfully");
  }),

  activityHistory: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req.query);
    const { items, total } = await VendorService.activityHistory(req.params.id, { page, limit, skip });
    sendSuccess(res, items, "Vendor activity retrieved", 200, buildPaginationMeta(page, limit, total));
  }),
};
