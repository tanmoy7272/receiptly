/**
 * ============================================================================
 * Ask Receiptly Warranty Handler
 * ============================================================================
 * Purpose: Handles ACTIVE_WARRANTIES and EXPIRING_WARRANTIES query intents.
 * ============================================================================
 */
import prisma from '../../../lib/prisma.js';
import { buildReceiptWhereClause } from '../buildWhereClause.js';
import { successResult } from '../resultFactory.js';
import { SUPPORTED_INTENTS } from '../../intent/supportedIntents.js';

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
  const now = new Date();
  const isExpired = r.warrantyExpiryDate ? new Date(r.warrantyExpiryDate) < now : false;
  const isActiveWarranty = Boolean(r.hasWarranty && !isExpired);

  return {
    ...r,
    amount: Number(r.amount) || 0,
    purchaseDate: r.purchaseDate ? new Date(r.purchaseDate).toISOString().split('T')[0] : null,
    warrantyExpiryDate: r.warrantyExpiryDate ? new Date(r.warrantyExpiryDate).toISOString().split('T')[0] : null,
    warrantyStatus: isActiveWarranty ? 'ACTIVE' : isExpired ? 'EXPIRED' : 'NONE',
  };
};

/**
 * Handles ACTIVE_WARRANTIES and EXPIRING_WARRANTIES intents
 */
export const handleWarrantyQueries = async ({ userId, intent, filters }) => {
  const where = buildReceiptWhereClause({ userId, filters });
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const warrantyConditions = intent === SUPPORTED_INTENTS.EXPIRING_WARRANTIES
    ? [{ hasWarranty: true, warrantyExpiryDate: { gte: now, lte: thirtyDaysFromNow } }]
    : [{ hasWarranty: true, OR: [{ warrantyExpiryDate: { gte: now } }, { warrantyExpiryDate: null }] }];

  if (where.OR) {
    const existingOr = where.OR;
    delete where.OR;
    where.AND = [
      { OR: existingOr },
      { OR: warrantyConditions },
    ];
  } else {
    where.AND = warrantyConditions;
  }

  const rawReceipts = await prisma.receipt.findMany({
    where,
    select: RECEIPT_DTO_SELECT,
    orderBy: { warrantyExpiryDate: 'asc' },
    take: 15,
  });

  const receipts = rawReceipts.map(formatReceiptDto);

  return successResult(
    intent,
    {
      count: receipts.length,
      receipts,
    },
    { filters, period: filters.period }
  );
};
