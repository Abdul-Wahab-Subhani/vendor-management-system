import { prisma } from "../config/prisma";

function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const DashboardService = {
  async overview() {
    const [
      totalVendors,
      activeVendors,
      activeQuotationRequests,
      pendingQuotations,
      approvedQuotations,
      rejectedQuotations,
      submittedQuotations,
      totalQuotationRequests,
    ] = await Promise.all([
      prisma.vendor.count(),
      prisma.vendor.count({ where: { status: "ACTIVE" } }),
      prisma.quotationRequest.count({ where: { status: "OPEN" } }),
      prisma.quotation.count({ where: { status: "PENDING" } }),
      prisma.quotation.count({ where: { status: "APPROVED" } }),
      prisma.quotation.count({ where: { status: "REJECTED" } }),
      prisma.quotation.count({ where: { status: "SUBMITTED" } }),
      prisma.quotationRequest.count(),
    ]);

    const approvedAmountAgg = await prisma.quotation.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    });

    return {
      totalVendors,
      activeVendors,
      activeQuotationRequests,
      totalQuotationRequests,
      pendingQuotations,
      approvedQuotations,
      rejectedQuotations,
      submittedQuotations,
      totalApprovedValue: Number(approvedAmountAgg._sum.amount ?? 0),
    };
  },

  async monthlyAnalytics(monthsBack = 6) {
    const since = monthsAgo(monthsBack - 1);

    const [quotations, vendors] = await Promise.all([
      prisma.quotation.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true, amount: true, status: true },
      }),
      prisma.vendor.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    const buckets: Record<string, { month: string; quotations: number; vendors: number; totalValue: number; approved: number }> = {};
    for (let i = 0; i < monthsBack; i++) {
      const d = monthsAgo(monthsBack - 1 - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      buckets[key] = {
        month: d.toLocaleString("en-US", { month: "short", year: "2-digit" }),
        quotations: 0,
        vendors: 0,
        totalValue: 0,
        approved: 0,
      };
    }

    quotations.forEach((q) => {
      const key = `${q.createdAt.getFullYear()}-${String(q.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (buckets[key]) {
        buckets[key].quotations += 1;
        buckets[key].totalValue += Number(q.amount);
        if (q.status === "APPROVED") buckets[key].approved += 1;
      }
    });

    vendors.forEach((v) => {
      const key = `${v.createdAt.getFullYear()}-${String(v.createdAt.getMonth() + 1).padStart(2, "0")}`;
      if (buckets[key]) buckets[key].vendors += 1;
    });

    return Object.values(buckets);
  },

  async statusBreakdown() {
    const grouped = await prisma.quotation.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    return grouped.map((g) => ({ status: g.status, count: g._count._all }));
  },

  async vendorCategoryBreakdown() {
    const grouped = await prisma.vendor.groupBy({
      by: ["category"],
      _count: { _all: true },
    });
    return grouped.map((g) => ({ category: g.category ?? "Uncategorized", count: g._count._all }));
  },

  async topVendorsByValue(limit = 5) {
    const grouped = await prisma.quotation.groupBy({
      by: ["vendorId"],
      where: { status: "APPROVED" },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: "desc" } },
      take: limit,
    });

    const vendors = await prisma.vendor.findMany({
      where: { id: { in: grouped.map((g) => g.vendorId) } },
      select: { id: true, companyName: true, rating: true },
    });
    const vendorMap = new Map(vendors.map((v) => [v.id, v]));

    return grouped.map((g) => ({
      vendor: vendorMap.get(g.vendorId)?.companyName ?? "Unknown",
      rating: vendorMap.get(g.vendorId)?.rating ?? 0,
      totalValue: Number(g._sum.amount ?? 0),
      approvedCount: g._count._all,
    }));
  },

  async recentActivity(limit = 10) {
    return prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { user: { select: { id: true, name: true, role: true } } },
    });
  },
};
