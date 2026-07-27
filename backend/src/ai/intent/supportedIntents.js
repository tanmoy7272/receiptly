/**
 * ============================================================================
 * Ask Receiptly Supported Intent Definitions
 * ============================================================================
 * Purpose: Single source of truth for all supported receipt intents.
 * ============================================================================
 */

export const SUPPORTED_INTENTS = Object.freeze({
  TOTAL_SPENDING: 'TOTAL_SPENDING',
  TOTAL_BY_CATEGORY: 'TOTAL_BY_CATEGORY',
  TOTAL_BY_MERCHANT: 'TOTAL_BY_MERCHANT',
  PURCHASE_COUNT: 'PURCHASE_COUNT',
  TOP_CATEGORY: 'TOP_CATEGORY',
  TOP_MERCHANT: 'TOP_MERCHANT',
  BIGGEST_PURCHASE: 'BIGGEST_PURCHASE',
  SMALLEST_PURCHASE: 'SMALLEST_PURCHASE',
  AVERAGE_SPENDING: 'AVERAGE_SPENDING',
  RECENT_PURCHASES: 'RECENT_PURCHASES',
  SEARCH_RECEIPTS: 'SEARCH_RECEIPTS',
  SEARCH_INVOICE: 'SEARCH_INVOICE',
  ACTIVE_WARRANTIES: 'ACTIVE_WARRANTIES',
  EXPIRING_WARRANTIES: 'EXPIRING_WARRANTIES',
  CATEGORY_BREAKDOWN: 'CATEGORY_BREAKDOWN',
  MONTHLY_SPENDING: 'MONTHLY_SPENDING',
  YEARLY_SPENDING: 'YEARLY_SPENDING',
  UNKNOWN: 'UNKNOWN',
});

export const PERIOD_ENUMS = Object.freeze({
  TODAY: 'TODAY',
  THIS_WEEK: 'THIS_WEEK',
  THIS_MONTH: 'THIS_MONTH',
  LAST_MONTH: 'LAST_MONTH',
  THIS_YEAR: 'THIS_YEAR',
  LAST_YEAR: 'LAST_YEAR',
  ALL_TIME: 'ALL_TIME',
});

export const CONFIDENCE_ENUMS = Object.freeze({
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
});
