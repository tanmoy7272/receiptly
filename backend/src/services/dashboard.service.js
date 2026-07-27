import prisma from '../lib/prisma.js';

export const getDashboardData = async (userId) => {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // 1. Overall Aggregations
  const [totalReceipts, totalSpentAgg, averageSpendAgg, thisMonthAgg, recentReceipts, categoriesGrouped, activeWarrantiesCount] =
    await Promise.all([
      // Total count
      prisma.receipt.count({ where: { userId } }),

      // Total spent
      prisma.receipt.aggregate({
        _sum: { amount: true },
        where: { userId },
      }),

      // Average spend
      prisma.receipt.aggregate({
        _avg: { amount: true },
        where: { userId },
      }),

      // Current month spend & count
      prisma.receipt.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: {
          userId,
          purchaseDate: { gte: startOfCurrentMonth },
        },
      }),

      // Recent 5 receipts ordered by createdAt desc
      prisma.receipt.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),

      // Category breakdown grouped & aggregated
      prisma.receipt.groupBy({
        by: ['category'],
        _sum: { amount: true },
        _count: { id: true },
        where: { userId },
      }),

      // Active warranties count
      prisma.receipt.count({
        where: {
          userId,
          hasWarranty: true,
          warrantyExpiryDate: { gte: now },
        },
      }),
    ]);

  const totalSpent = totalSpentAgg._sum.amount || 0;
  const averageSpend = averageSpendAgg._avg.amount || 0;
  const thisMonthSpent = thisMonthAgg._sum.amount || 0;
  const thisMonthReceipts = thisMonthAgg._count.id || 0;

  // Format Category Breakdown sorted descending by totalAmount
  const categoryBreakdown = categoriesGrouped
    .map((item) => ({
      category: item.category,
      totalAmount: item._sum.amount || 0,
      receiptCount: item._count.id || 0,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // 2. Rolling 6 Months Calculation
  const rollingMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    const startDate = new Date(d.getFullYear(), d.getMonth(), 1);
    const endDate = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    rollingMonths.push({ monthKey, startDate, endDate });
  }

  const earliestDate = rollingMonths[0].startDate;
  const latestDate = rollingMonths[rollingMonths.length - 1].endDate;

  // Fetch all receipts in rolling 6 month range for monthly aggregation
  const monthRangeReceipts = await prisma.receipt.findMany({
    where: {
      userId,
      purchaseDate: {
        gte: earliestDate,
        lte: latestDate,
      },
    },
    select: {
      amount: true,
      purchaseDate: true,
    },
  });

  const monthlySpendingMap = {};
  rollingMonths.forEach(({ monthKey }) => {
    monthlySpendingMap[monthKey] = { month: monthKey, totalAmount: 0, receiptCount: 0 };
  });

  monthRangeReceipts.forEach((r) => {
    const d = new Date(r.purchaseDate);
    const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    if (monthlySpendingMap[key]) {
      monthlySpendingMap[key].totalAmount += r.amount;
      monthlySpendingMap[key].receiptCount += 1;
    }
  });

  const monthlySpending = rollingMonths.map(({ monthKey }) => monthlySpendingMap[monthKey]);

  return {
    generatedAt: new Date().toISOString(),
    overview: {
      totalReceipts,
      totalSpent: Number(totalSpent.toFixed(2)),
      averageSpend: Number(averageSpend.toFixed(2)),
      thisMonthSpent: Number(thisMonthSpent.toFixed(2)),
      thisMonthReceipts,
    },
    recentReceipts,
    categoryBreakdown,
    monthlySpending,
    activeWarranties: activeWarrantiesCount,
  };
};
