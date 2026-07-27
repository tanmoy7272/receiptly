/**
 * ============================================================================
 * Ask Receiptly Analytics Handler
 * ============================================================================
 * Purpose: Handles TOP_CATEGORY, TOP_MERCHANT, CATEGORY_BREAKDOWN,
 *          MONTHLY_SPENDING, and YEARLY_SPENDING query intents.
 * ============================================================================
 */
import prisma from '../../../lib/prisma.js';
import { buildReceiptWhereClause } from '../buildWhereClause.js';
import { successResult } from '../resultFactory.js';
import { SUPPORTED_INTENTS } from '../../intent/supportedIntents.js';

/**
 * Handles TOP_CATEGORY and TOP_MERCHANT intents
 */
export const handleTopEntities = async ({ userId, intent, filters }) => {
  const where = buildReceiptWhereClause({ userId, filters });
  const isTopMerchant = intent === SUPPORTED_INTENTS.TOP_MERCHANT;

  const groupByField = isTopMerchant ? 'merchantNormalized' : 'category';

  const grouped = await prisma.receipt.groupBy({
    by: [groupByField],
    where,
    _sum: { amount: true },
    _count: { id: true },
    orderBy: {
      _sum: { amount: 'desc' },
    },
    take: 1,
  });

  if (grouped.length === 0) {
    return successResult(
      intent,
      {
        found: false,
        [isTopMerchant ? 'merchant' : 'category']: null,
        totalSpent: 0,
        receiptCount: 0,
      },
      { filters, period: filters.period }
    );
  }

  const top = grouped[0];
  const name = top[groupByField] || 'Other';
  const totalSpent = Math.round((Number(top._sum.amount) || 0) * 100) / 100;

  const RECEIPT_DTO_SELECT = {
    id: true,
    title: true,
    merchant: true,
    merchantNormalized: true,
    amount: true,
    currency: true,
    category: true,
    purchaseDate: true,
    invoiceNumber: true,
    notes: true,
    tags: true,
    hasWarranty: true,
    warrantyExpiryDate: true,
    warrantyMonths: true,
  };

  const topReceiptsRaw = await prisma.receipt.findMany({
    where: {
      ...where,
      [groupByField]: top[groupByField],
    },
    select: RECEIPT_DTO_SELECT,
    orderBy: { purchaseDate: 'desc' },
    take: 5,
  });

  const now = new Date();
  const sampleReceipts = topReceiptsRaw.map((r) => {
    const isExpired = r.warrantyExpiryDate ? new Date(r.warrantyExpiryDate) < now : false;
    const isActiveWarranty = Boolean(r.hasWarranty && !isExpired);
    return {
      ...r,
      amount: Number(r.amount) || 0,
      purchaseDate: r.purchaseDate ? new Date(r.purchaseDate).toISOString().split('T')[0] : null,
      warrantyExpiryDate: r.warrantyExpiryDate ? new Date(r.warrantyExpiryDate).toISOString().split('T')[0] : null,
      warrantyStatus: isActiveWarranty ? 'ACTIVE' : isExpired ? 'EXPIRED' : 'NONE',
    };
  });

  return successResult(
    intent,
    {
      found: true,
      [isTopMerchant ? 'merchant' : 'category']: name,
      totalSpent,
      receiptCount: top._count.id,
      receipts: sampleReceipts,
    },
    { filters, period: filters.period }
  );
};

/**
 * Handles CATEGORY_BREAKDOWN intent
 */
export const handleCategoryBreakdown = async ({ userId, intent, filters }) => {
  const where = buildReceiptWhereClause({ userId, filters });

  const grouped = await prisma.receipt.groupBy({
    by: ['category'],
    where,
    _sum: { amount: true },
    _count: { id: true },
    orderBy: {
      _sum: { amount: 'desc' },
    },
  });

  const breakdown = grouped.map((g) => ({
    category: g.category || 'Other',
    totalSpent: Math.round((Number(g._sum.amount) || 0) * 100) / 100,
    receiptCount: g._count.id,
  }));

  const totalSpent = breakdown.reduce((sum, b) => sum + b.totalSpent, 0);

  return successResult(
    intent,
    {
      totalSpent: Math.round(totalSpent * 100) / 100,
      categoryCount: breakdown.length,
      breakdown,
    },
    { filters, period: filters.period }
  );
};

/**
 * Handles MONTHLY_SPENDING and YEARLY_SPENDING intents
 */
export const handleTrendSpending = async ({ userId, intent, filters }) => {
  const where = buildReceiptWhereClause({ userId, filters });

  const receipts = await prisma.receipt.findMany({
    where,
    select: { amount: true, purchaseDate: true },
    orderBy: { purchaseDate: 'asc' },
  });

  const isMonthly = intent === SUPPORTED_INTENTS.MONTHLY_SPENDING;
  const groups = {};

  for (const r of receipts) {
    if (!r.purchaseDate) continue;
    const d = new Date(r.purchaseDate);
    const key = isMonthly
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      : `${d.getFullYear()}`;

    if (!groups[key]) {
      groups[key] = { key, totalSpent: 0, count: 0 };
    }
    groups[key].totalSpent += Number(r.amount) || 0;
    groups[key].count += 1;
  }

  const trend = Object.values(groups).map((g) => ({
    periodKey: g.key,
    totalSpent: Math.round(g.totalSpent * 100) / 100,
    receiptCount: g.count,
  }));

  return successResult(
    intent,
    {
      groupCount: trend.length,
      trend,
    },
    { filters, period: filters.period }
  );
};
