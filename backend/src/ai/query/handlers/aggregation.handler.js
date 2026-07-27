/**
 * ============================================================================
 * Ask Receiptly Aggregation Handler
 * ============================================================================
 * Purpose: Computes mathematical aggregations (total spent, count, average,
 *          biggest/smallest purchase) for query engine intents.
 * ============================================================================
 */
import prisma from '../../../lib/prisma.js';
import { buildReceiptWhereClause } from '../buildWhereClause.js';
import { successResult } from '../resultFactory.js';
import { SUPPORTED_INTENTS } from '../../intent/supportedIntents.js';

// DTO select fields helper to avoid full row scans
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

const formatReceiptDto = (r) => {
  if (!r) return null;
  const now = new Date();
  const isExpired = r.warrantyExpiryDate ? new Date(r.warrantyExpiryDate) < now : false;
  const isActiveWarranty = Boolean(r.hasWarranty && !isExpired);

  return {
    id: r.id,
    title: r.title,
    merchant: r.merchant,
    amount: Number(r.amount) || 0,
    currency: r.currency || 'INR',
    category: r.category,
    purchaseDate: r.purchaseDate ? new Date(r.purchaseDate).toISOString().split('T')[0] : null,
    invoiceNumber: r.invoiceNumber || null,
    notes: r.notes || null,
    tags: r.tags || [],
    hasWarranty: Boolean(r.hasWarranty),
    warrantyExpiryDate: r.warrantyExpiryDate ? new Date(r.warrantyExpiryDate).toISOString().split('T')[0] : null,
    warrantyMonths: r.warrantyMonths || null,
    warrantyStatus: isActiveWarranty ? 'ACTIVE' : isExpired ? 'EXPIRED' : 'NONE',
  };
};

/**
 * Handles TOTAL_SPENDING, TOTAL_BY_CATEGORY, and TOTAL_BY_MERCHANT intents
 */
export const handleTotalSpending = async ({ userId, intent, filters }) => {
  const where = buildReceiptWhereClause({ userId, filters });

  // Select all parameters to support any user questions about receipts
  const receipts = await prisma.receipt.findMany({
    where,
    select: RECEIPT_DTO_SELECT,
    orderBy: { purchaseDate: 'desc' },
  });

  const receiptCount = receipts.length;
  if (receiptCount === 0) {
    return successResult(intent, { totalSpent: 0, receiptCount: 0, currency: 'INR', receipts: [] }, { filters, period: filters.period });
  }

  const currencies = Array.from(new Set(receipts.map((r) => r.currency || 'INR')));
  const mixedCurrency = currencies.length > 1;

  const totalSpent = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const sampleReceipts = receipts.slice(0, 10).map(formatReceiptDto);

  const data = {
    totalSpent: Math.round(totalSpent * 100) / 100,
    receiptCount,
    currency: mixedCurrency ? 'MIXED' : currencies[0] || 'INR',
    receipts: sampleReceipts,
    ...(mixedCurrency ? { mixedCurrency: true, currencies } : {}),
    ...(filters.merchant ? { merchant: filters.merchant } : {}),
    ...(filters.category ? { category: filters.category } : {}),
  };

  return successResult(intent, data, { filters, period: filters.period });
};

/**
 * Handles PURCHASE_COUNT intent
 */
export const handlePurchaseCount = async ({ userId, intent, filters }) => {
  const where = buildReceiptWhereClause({ userId, filters });
  const count = await prisma.receipt.count({ where });

  return successResult(intent, { count }, { filters, period: filters.period });
};

/**
 * Handles AVERAGE_SPENDING intent
 */
export const handleAverageSpend = async ({ userId, intent, filters }) => {
  const where = buildReceiptWhereClause({ userId, filters });
  const receipts = await prisma.receipt.findMany({
    where,
    select: { amount: true, currency: true },
  });

  const count = receipts.length;
  if (count === 0) {
    return successResult(intent, { averageSpend: 0, receiptCount: 0, currency: 'INR' }, { filters, period: filters.period });
  }

  const totalSpent = receipts.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const averageSpend = Math.round((totalSpent / count) * 100) / 100;
  const currencies = Array.from(new Set(receipts.map((r) => r.currency || 'INR')));

  return successResult(
    intent,
    {
      averageSpend,
      receiptCount: count,
      currency: currencies.length > 1 ? 'MIXED' : currencies[0] || 'INR',
    },
    { filters, period: filters.period }
  );
};

/**
 * Handles BIGGEST_PURCHASE and SMALLEST_PURCHASE intents
 */
export const handleMinMaxPurchase = async ({ userId, intent, filters }) => {
  const where = buildReceiptWhereClause({ userId, filters });
  const isMax = intent === SUPPORTED_INTENTS.BIGGEST_PURCHASE;

  const receipt = await prisma.receipt.findFirst({
    where,
    select: RECEIPT_DTO_SELECT,
    orderBy: { amount: isMax ? 'desc' : 'asc' },
  });

  return successResult(
    intent,
    {
      found: Boolean(receipt),
      receipt: formatReceiptDto(receipt),
    },
    { filters, period: filters.period }
  );
};
