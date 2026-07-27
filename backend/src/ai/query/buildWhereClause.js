/**
 * ============================================================================
 * Ask Receiptly Reusable Where Clause Builder
 * ============================================================================
 * Purpose: Centralizes Prisma where clause construction combining userId,
 *          normalized merchant names, category, invoice number, and date filters.
 * ============================================================================
 */
import { getDateRangeForPeriod } from './dateFilters.js';
import { normalizeMerchantName } from '../../utils/merchantNormalizer.util.js';

/**
 * Builds a reusable Prisma `where` clause for receipt queries
 * @param {Object} params
 * @param {string} params.userId - Required user ID
 * @param {Object} [params.filters] - Extracted intent filters
 * @returns {Object} Prisma where clause object
 */
export const buildReceiptWhereClause = ({ userId, filters = {} }) => {
  if (!userId) {
    throw new Error('userId is required for building receipt where clause');
  }

  const where = {
    userId,
  };

  // 1. Merchant filter with normalization
  if (filters.merchant && typeof filters.merchant === 'string') {
    const merchantNormalized = normalizeMerchantName(filters.merchant);
    where.OR = [
      { merchantNormalized: { contains: merchantNormalized, mode: 'insensitive' } },
      { merchant: { contains: filters.merchant, mode: 'insensitive' } },
    ];
  }

  // 2. Category filter
  if (filters.category && typeof filters.category === 'string') {
    where.category = { equals: filters.category, mode: 'insensitive' };
  }

  // 3. Invoice Number filter
  if (filters.invoiceNumber && typeof filters.invoiceNumber === 'string') {
    where.invoiceNumber = { equals: filters.invoiceNumber, mode: 'insensitive' };
  }

  // 4. Item / Keyword Search Query filter
  if (filters.query && typeof filters.query === 'string') {
    const q = filters.query.trim();
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { merchant: { contains: q, mode: 'insensitive' } },
        { merchantNormalized: { contains: q, mode: 'insensitive' } },
        { notes: { contains: q, mode: 'insensitive' } },
        { tags: { has: q.toLowerCase() } },
      ];
    }
  }

  // 5. Period date range filter
  if (filters.period) {
    const { startDate, endDate } = getDateRangeForPeriod(filters.period);
    if (startDate || endDate) {
      where.purchaseDate = {};
      if (startDate) where.purchaseDate.gte = startDate;
      if (endDate) where.purchaseDate.lte = endDate;
    }
  }

  return where;
};
