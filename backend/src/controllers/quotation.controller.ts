import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess, sendCreated, parsePagination, buildPaginationMeta } from "../utils/apiResponse";
import { QuotationService } from "../services/quotation.service";
import { UploadService } from "../services/upload.service";
import { BadRequestError } from "../utils/errors";

export const QuotationController = {
  // ---- Requests ----
  createRequest: asyncHandler(async (req: Request, res: Response) => {
    const request = await QuotationService.createRequest(req.body, req.user!);
    sendCreated(res, request, "Quotation request created and vendors notified");
  }),

  listRequests: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req.query);
    const vendorScope = req.user!.role === "VENDOR" ? req.user!.vendorId ?? "__none__" : undefined;
    const { items, total } = await QuotationService.listRequests({
      page,
      limit,
      skip,
      status: req.query.status as string | undefined,
      search: req.query.search as string | undefined,
      vendorId: vendorScope,
    });
    sendSuccess(res, items, "Quotation requests retrieved", 200, buildPaginationMeta(page, limit, total));
  }),

  getRequestById: asyncHandler(async (req: Request, res: Response) => {
    const vendorScope = req.user!.role === "VENDOR" ? req.user!.vendorId ?? "__none__" : undefined;
    const request = await QuotationService.getRequestById(req.params.id, vendorScope);
    sendSuccess(res, request);
  }),

  updateRequest: asyncHandler(async (req: Request, res: Response) => {
    const request = await QuotationService.updateRequest(req.params.id, req.body, req.user!);
    sendSuccess(res, request, "Quotation request updated");
  }),

  cancelRequest: asyncHandler(async (req: Request, res: Response) => {
    const request = await QuotationService.cancelRequest(req.params.id, req.user!);
    sendSuccess(res, request, "Quotation request cancelled");
  }),

  assignVendors: asyncHandler(async (req: Request, res: Response) => {
    const request = await QuotationService.assignVendors(req.params.id, req.body.vendorIds, req.user!);
    sendSuccess(res, request, "Vendors assigned");
  }),

  // ---- Quotations (vendor submissions) ----
  submitQuotation: asyncHandler(async (req: Request, res: Response) => {
    const vendorId = req.user!.vendorId;
    if (!vendorId) throw new BadRequestError("Only vendor accounts linked to a vendor profile can submit quotations");
    const quotation = await QuotationService.submitQuotation(req.params.id, vendorId, req.body, req.user!);
    sendCreated(res, quotation, "Quotation submitted successfully");
  }),

  listQuotations: asyncHandler(async (req: Request, res: Response) => {
    const { page, limit, skip } = parsePagination(req.query);
    // Vendors only ever see their own quotations
    const vendorId = req.user!.role === "VENDOR" ? req.user!.vendorId ?? "__none__" : (req.query.vendorId as string | undefined);

    const { items, total } = await QuotationService.listQuotations({
      page,
      limit,
      skip,
      search: req.query.search as string | undefined,
      status: req.query.status as never,
      vendorId,
      minAmount: req.query.minAmount ? Number(req.query.minAmount) : undefined,
      maxAmount: req.query.maxAmount ? Number(req.query.maxAmount) : undefined,
      fromDate: req.query.fromDate ? new Date(req.query.fromDate as string) : undefined,
      toDate: req.query.toDate ? new Date(req.query.toDate as string) : undefined,
      sortBy: req.query.sortBy as string | undefined,
      sortOrder: req.query.sortOrder as "asc" | "desc" | undefined,
    });
    sendSuccess(res, items, "Quotations retrieved", 200, buildPaginationMeta(page, limit, total));
  }),

  getQuotationById: asyncHandler(async (req: Request, res: Response) => {
    const quotation = await QuotationService.getQuotationById(req.params.id);
    sendSuccess(res, quotation);
  }),

  updateQuotation: asyncHandler(async (req: Request, res: Response) => {
    const quotation = await QuotationService.updateQuotation(req.params.id, req.body, req.user!);
    sendSuccess(res, quotation, "Quotation updated");
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const quotation = await QuotationService.updateStatus(
      req.params.id,
      req.body.status,
      req.body.internalNotes,
      req.user!
    );
    sendSuccess(res, quotation, `Quotation marked as ${req.body.status}`);
  }),

  uploadAttachment: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) throw new BadRequestError("No file uploaded");
    const uploaded = await UploadService.upload(req.file, "quotation-attachments");
    const attachment = await QuotationService.addAttachment(
      req.params.id,
      { fileName: uploaded.fileName, fileUrl: uploaded.url, fileType: uploaded.fileType, fileSize: uploaded.fileSize },
      req.user!
    );
    sendCreated(res, attachment, "Attachment uploaded successfully");
  }),

  stats: asyncHandler(async (_req: Request, res: Response) => {
    const stats = await QuotationService.stats();
    sendSuccess(res, stats);
  }),
};
