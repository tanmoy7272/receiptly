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

  // 1. Multi-merchant and single merchant filter with normalization
  const merchantList = Array.isArray(filters.merchants)
    ? filters.merchants
    : typeof filters.merchant === 'string'
      ? filters.merchant.split(/,|\band\b/i).map((m) => m.trim()).filter(Boolean)
      : [];

  if (merchantList.length > 0) {
    where.OR = merchantList.flatMap((m) => {
      const norm = normalizeMerchantName(m);
      return [
        { merchantNormalized: { contains: norm, mode: 'insensitive' } },
        { merchant: { contains: m, mode: 'insensitive' } },
      ];
    });
  }

  // 2. Multi-category and single category filter
  const categoryList = Array.isArray(filters.categories)
    ? filters.categories
    : typeof filters.category === 'string'
      ? filters.category.split(/,|\band\b/i).map((c) => c.trim()).filter(Boolean)
      : [];

  if (categoryList.length > 1) {
    const catConditions = categoryList.map((c) => ({ category: { equals: c, mode: 'insensitive' } }));
    if (where.OR) {
      const existingOr = where.OR;
      delete where.OR;
      where.AND = [{ OR: existingOr }, { OR: catConditions }];
    } else {
      where.OR = catConditions;
    }
  } else if (categoryList.length === 1) {
    where.category = { equals: categoryList[0], mode: 'insensitive' };
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

  // 6. Min Amount and Max Amount range filter (e.g. "above 5000", "under 1000", "more than 500")
  const minAmt = filters.minAmount !== undefined && filters.minAmount !== null ? Number(filters.minAmount) : NaN;
  const maxAmt = filters.maxAmount !== undefined && filters.maxAmount !== null ? Number(filters.maxAmount) : NaN;

  if (!isNaN(minAmt) || !isNaN(maxAmt)) {
    where.amount = {};
    if (!isNaN(minAmt)) where.amount.gte = minAmt;
    if (!isNaN(maxAmt)) where.amount.lte = maxAmt;
  }

  return where;
};
