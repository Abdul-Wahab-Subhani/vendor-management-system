import { prisma } from "../config/prisma";
import { NotFoundError, BadRequestError } from "../utils/errors";

interface ComparisonRow {
  quotationId: string;
  vendorId: string;
  vendorName: string;
  companyName: string;
  vendorRating: number;
  title: string;
  amount: number;
  currency: string;
  submissionDate: Date | null;
  status: string;
  isLowestPrice: boolean;
  isBestValue: boolean;
  valueScore: number;
}

/**
 * Value score blends price competitiveness with vendor rating so the
 * "best value" pick isn't simply the cheapest bid — it rewards quality too.
 * Lower price -> higher price-score; higher rating -> higher rating-score.
 * Weighted 60% price / 40% rating, normalized against the comparison set.
 */
function computeValueScores(rows: { amount: number; vendorRating: number }[]): number[] {
  const amounts = rows.map((r) => r.amount);
  const minAmount = Math.min(...amounts);
  const maxAmount = Math.max(...amounts);
  const ratingMax = 5;

  return rows.map((r) => {
    const priceScore = maxAmount === minAmount ? 1 : 1 - (r.amount - minAmount) / (maxAmount - minAmount);
    const ratingScore = (r.vendorRating || 0) / ratingMax;
    return Number((priceScore * 0.6 + ratingScore * 0.4).toFixed(4));
  });
}

export const ComparisonService = {
  async compareRequest(quotationRequestId: string) {
    const request = await prisma.quotationRequest.findUnique({
      where: { id: quotationRequestId },
      include: {
        quotations: {
          where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "APPROVED", "REJECTED"] } },
          include: { vendor: true },
        },
      },
    });
    if (!request) throw new NotFoundError("Quotation request not found");
    if (request.quotations.length === 0) {
      throw new BadRequestError("No submitted quotations available yet for comparison");
    }

    const base = request.quotations.map((q) => ({
      quotationId: q.id,
      vendorId: q.vendorId,
      vendorName: q.vendor.vendorName,
      companyName: q.vendor.companyName,
      vendorRating: q.vendor.rating ?? 0,
      title: q.title,
      amount: Number(q.amount),
      currency: q.currency,
      submissionDate: q.submissionDate,
      status: q.status,
    }));

    const minAmount = Math.min(...base.map((b) => b.amount));
    const valueScores = computeValueScores(base);
    const maxValueScore = Math.max(...valueScores);

    const rows: ComparisonRow[] = base.map((b, i) => ({
      ...b,
      isLowestPrice: b.amount === minAmount,
      isBestValue: valueScores[i] === maxValueScore,
      valueScore: valueScores[i],
    }));

    const lowest = rows.find((r) => r.isLowestPrice)!;
    const bestValue = rows.find((r) => r.isBestValue)!;

    const avgAmount = base.reduce((sum, b) => sum + b.amount, 0) / base.length;
    const maxAmount = Math.max(...base.map((b) => b.amount));
    const potentialSavings = maxAmount - minAmount;

    const recommendation =
      lowest.quotationId === bestValue.quotationId
        ? `${bestValue.companyName} offers both the lowest price (${bestValue.currency} ${bestValue.amount.toLocaleString()}) and the best overall value, factoring in their ${bestValue.vendorRating.toFixed(1)}/5 vendor rating. Recommended for approval.`
        : `${bestValue.companyName} offers the best overall value (rating ${bestValue.vendorRating.toFixed(1)}/5 at ${bestValue.currency} ${bestValue.amount.toLocaleString()}), while ${lowest.companyName} has the lowest raw price at ${lowest.currency} ${lowest.amount.toLocaleString()}. Consider quality and reliability trade-offs before deciding.`;

    return {
      requestId: request.id,
      requestTitle: request.title,
      rows: rows.sort((a, b) => a.amount - b.amount),
      summary: {
        vendorCount: rows.length,
        lowestPrice: { vendor: lowest.companyName, amount: lowest.amount, currency: lowest.currency },
        bestValue: { vendor: bestValue.companyName, amount: bestValue.amount, currency: bestValue.currency },
        averageAmount: Math.round(avgAmount * 100) / 100,
        potentialSavings: Math.round(potentialSavings * 100) / 100,
      },
      recommendation,
    };
  },
};
