/**
 * ============================================================================
 * Ask Receiptly Search Handler
 * ============================================================================
 * Purpose: Handles receipt searches, invoice lookups, and recent purchases
 *          using clean DTO formatting and default pagination (take: 10).
 * ============================================================================
 */
import prisma from '../../../lib/prisma.js';
import { buildReceiptWhereClause } from '../buildWhereClause.js';
import { successResult } from '../resultFactory.js';

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
  hasWarranty: true,
  warrantyExpiryDate: true,
  notes: true,
  tags: true,
};

const formatReceiptDto = (r) => {
  if (!r) return null;
  return {
    ...r,
    amount: Number(r.amount) || 0,
    purchaseDate: r.purchaseDate ? new Date(r.purchaseDate).toISOString().split('T')[0] : null,
    warrantyExpiryDate: r.warrantyExpiryDate ? new Date(r.warrantyExpiryDate).toISOString().split('T')[0] : null,
  };
};

/**
 * Handles RECENT_PURCHASES intent (default limit take: 10)
 */
export const handleRecentPurchases = async ({ userId, intent, filters }) => {
  const where = buildReceiptWhereClause({ userId, filters });
  const limit = Math.min(Number(filters.limit) || 10, 20);

  const rawReceipts = await prisma.receipt.findMany({
    where,
    select: RECEIPT_DTO_SELECT,
    orderBy: { purchaseDate: 'desc' },
    take: limit,
  });

  const receipts = rawReceipts.map(formatReceiptDto);

  return successResult(
    intent,
    {
      count: receipts.length,
      receiptCount: receipts.length,
      receipts,
    },
    { filters, period: filters.period }
  );
};

/**
 * Handles SEARCH_INVOICE intent
 */
export const handleSearchInvoice = async ({ userId, intent, filters }) => {
  const where = buildReceiptWhereClause({ userId, filters });

  const rawReceipt = await prisma.receipt.findFirst({
    where,
    select: RECEIPT_DTO_SELECT,
    orderBy: { createdAt: 'desc' },
  });

  const receipt = formatReceiptDto(rawReceipt);

  return successResult(
    intent,
    {
      invoiceNumber: filters.invoiceNumber || null,
      found: Boolean(receipt),
      receipt,
    },
    { filters, period: filters.period }
  );
};

/**
 * Handles SEARCH_RECEIPTS intent (default limit take: 10)
 */
export const handleSearchReceipts = async ({ userId, intent, filters }) => {
  const where = buildReceiptWhereClause({ userId, filters });
  const limit = Math.min(Number(filters.limit) || 10, 20);

  const rawReceipts = await prisma.receipt.findMany({
    where,
    select: RECEIPT_DTO_SELECT,
    orderBy: { purchaseDate: 'desc' },
    take: limit,
  });

  const receipts = rawReceipts.map(formatReceiptDto);

  return successResult(
    intent,
    {
      count: receipts.length,
      receiptCount: receipts.length,
      receipts,
    },
    { filters, period: filters.period }
  );
};
