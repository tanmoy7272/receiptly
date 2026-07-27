/**
 * ============================================================================
 * Ask Receiptly Intent Registry
 * ============================================================================
 * Purpose: Defines contracts for each intent including description, required filters,
 *          and optional filters for downstream query execution engines.
 * ============================================================================
 */
import { SUPPORTED_INTENTS } from './supportedIntents.js';

export const INTENT_REGISTRY = Object.freeze({
  [SUPPORTED_INTENTS.TOTAL_SPENDING]: {
    description: 'Calculates total spending sum across receipts',
    requiredFilters: [],
    optionalFilters: ['period'],
  },
  [SUPPORTED_INTENTS.TOTAL_BY_CATEGORY]: {
    description: 'Calculates total spending sum filtered by category',
    requiredFilters: ['category'],
    optionalFilters: ['period'],
  },
  [SUPPORTED_INTENTS.TOTAL_BY_MERCHANT]: {
    description: 'Calculates total spending sum filtered by merchant',
    requiredFilters: ['merchant'],
    optionalFilters: ['period'],
  },
  [SUPPORTED_INTENTS.PURCHASE_COUNT]: {
    description: 'Counts total number of receipts',
    requiredFilters: [],
    optionalFilters: ['category', 'merchant', 'period'],
  },
  [SUPPORTED_INTENTS.TOP_CATEGORY]: {
    description: 'Identifies category with highest total expenditure',
    requiredFilters: [],
    optionalFilters: ['period'],
  },
  [SUPPORTED_INTENTS.TOP_MERCHANT]: {
    description: 'Identifies merchant with highest total expenditure',
    requiredFilters: [],
    optionalFilters: ['period'],
  },
  [SUPPORTED_INTENTS.BIGGEST_PURCHASE]: {
    description: 'Finds single receipt with maximum dollar amount',
    requiredFilters: [],
    optionalFilters: ['category', 'merchant', 'period'],
  },
  [SUPPORTED_INTENTS.SMALLEST_PURCHASE]: {
    description: 'Finds single receipt with minimum dollar amount',
    requiredFilters: [],
    optionalFilters: ['category', 'merchant', 'period'],
  },
  [SUPPORTED_INTENTS.AVERAGE_SPENDING]: {
    description: 'Calculates average spend per receipt',
    requiredFilters: [],
    optionalFilters: ['category', 'merchant', 'period'],
  },
  [SUPPORTED_INTENTS.RECENT_PURCHASES]: {
    description: 'Lists most recent receipts ordered by date',
    requiredFilters: [],
    optionalFilters: ['category', 'merchant', 'limit'],
  },
  [SUPPORTED_INTENTS.SEARCH_RECEIPTS]: {
    description: 'Searches receipts matching title or keywords',
    requiredFilters: ['query'],
    optionalFilters: ['period'],
  },
  [SUPPORTED_INTENTS.SEARCH_INVOICE]: {
    description: 'Searches receipt by invoice or reference number',
    requiredFilters: ['invoiceNumber'],
    optionalFilters: [],
  },
  [SUPPORTED_INTENTS.ACTIVE_WARRANTIES]: {
    description: 'Lists receipts with active non-expired warranties',
    requiredFilters: [],
    optionalFilters: ['category'],
  },
  [SUPPORTED_INTENTS.EXPIRING_WARRANTIES]: {
    description: 'Lists receipts with warranties expiring soon',
    requiredFilters: [],
    optionalFilters: ['period'],
  },
  [SUPPORTED_INTENTS.CATEGORY_BREAKDOWN]: {
    description: 'Generates expenditure distribution by category',
    requiredFilters: [],
    optionalFilters: ['period'],
  },
  [SUPPORTED_INTENTS.MONTHLY_SPENDING]: {
    description: 'Aggregates spending totals month by month',
    requiredFilters: [],
    optionalFilters: ['year'],
  },
  [SUPPORTED_INTENTS.YEARLY_SPENDING]: {
    description: 'Aggregates spending totals year by year',
    requiredFilters: [],
    optionalFilters: [],
  },
  [SUPPORTED_INTENTS.UNKNOWN]: {
    description: 'Receipt-related question that is currently unsupported by Receiptly',
    requiredFilters: [],
    optionalFilters: [],
  },
});
