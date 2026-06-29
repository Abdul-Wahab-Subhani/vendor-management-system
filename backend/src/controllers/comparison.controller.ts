import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/apiResponse";
import { ComparisonService } from "../services/comparison.service";
import { generatePdfReport } from "../services/pdf.service";
import { ActivityLogService, ActivityActions } from "../services/activityLog.service";

export const ComparisonController = {
  compare: asyncHandler(async (req: Request, res: Response) => {
    const result = await ComparisonService.compareRequest(req.params.requestId);
    sendSuccess(res, result);
  }),

  exportPdf: asyncHandler(async (req: Request, res: Response) => {
    const comparison = await ComparisonService.compareRequest(req.params.requestId);

    const pdfBuffer = await generatePdfReport({
      title: `Quotation Comparison — ${comparison.requestTitle}`,
      subtitle: `${comparison.summary.vendorCount} vendor(s) compared`,
      summary: [
        { label: "Lowest Price", value: `${comparison.summary.lowestPrice.currency} ${comparison.summary.lowestPrice.amount.toLocaleString()}` },
        { label: "Best Value", value: comparison.summary.bestValue.vendor },
        { label: "Average Quote", value: `${comparison.summary.lowestPrice.currency} ${comparison.summary.averageAmount.toLocaleString()}` },
        { label: "Potential Savings", value: `${comparison.summary.lowestPrice.currency} ${comparison.summary.potentialSavings.toLocaleString()}` },
      ],
      columns: [
        { header: "Vendor", key: "vendor", width: 150 },
        { header: "Amount", key: "amount", width: 100, align: "right" },
        { header: "Rating", key: "rating", width: 60, align: "center" },
        { header: "Submitted", key: "submitted", width: 90 },
        { header: "Status", key: "status", width: 80 },
        { header: "Tag", key: "tag", width: 80 },
      ],
      rows: comparison.rows.map((r) => ({
        vendor: r.companyName,
        amount: `${r.currency} ${r.amount.toLocaleString()}`,
        rating: r.vendorRating.toFixed(1),
        submitted: r.submissionDate ? new Date(r.submissionDate).toLocaleDateString() : "—",
        status: r.status,
        tag: r.isBestValue ? "Best Value" : r.isLowestPrice ? "Lowest Price" : "",
      })),
      recommendation: comparison.recommendation,
      includeSignature: true,
    });

    await ActivityLogService.log({
      userId: req.user!.id,
      action: ActivityActions.PDF_EXPORTED,
      entityType: "QuotationRequest",
      entityId: req.params.requestId,
      description: `${req.user!.name} exported a comparison PDF for "${comparison.requestTitle}"`,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="comparison-${req.params.requestId}.pdf"`);
    res.send(pdfBuffer);
  }),
};
