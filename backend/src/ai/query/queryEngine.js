/**
 * ============================================================================
 * Ask Receiptly Query Engine
 * ============================================================================
 * Purpose: Executes classified intent queries deterministically against PostgreSQL
 *          using modular handler functions, DTO formatting, and Zod envelope validation.
 * Pipeline: Intent Dispatcher -> Handler Execution -> Result Factory -> Schema Validation
 * ============================================================================
 */
import { SUPPORTED_INTENTS } from '../intent/supportedIntents.js';
import { failureResult, unsupportedResult } from './resultFactory.js';
import { queryEnvelopeSchema } from './resultSchemas.js';
import { handleTotalSpending, handlePurchaseCount, handleAverageSpend, handleMinMaxPurchase } from './handlers/aggregation.handler.js';
import { handleRecentPurchases, handleSearchInvoice, handleSearchReceipts } from './handlers/search.handler.js';
import { handleWarrantyQueries } from './handlers/warranty.handler.js';
import { handleTopEntities, handleCategoryBreakdown, handleTrendSpending } from './handlers/analytics.handler.js';
import { logger } from '../../utils/logger.js';

// Handler dispatch table mapping intent enums to dedicated handler functions
const HANDLER_MAP = {
  [SUPPORTED_INTENTS.TOTAL_SPENDING]: handleTotalSpending,
  [SUPPORTED_INTENTS.TOTAL_BY_CATEGORY]: handleTotalSpending,
  [SUPPORTED_INTENTS.TOTAL_BY_MERCHANT]: handleTotalSpending,

  [SUPPORTED_INTENTS.PURCHASE_COUNT]: handlePurchaseCount,
  [SUPPORTED_INTENTS.AVERAGE_SPENDING]: handleAverageSpend,

  [SUPPORTED_INTENTS.BIGGEST_PURCHASE]: handleMinMaxPurchase,
  [SUPPORTED_INTENTS.SMALLEST_PURCHASE]: handleMinMaxPurchase,

  [SUPPORTED_INTENTS.RECENT_PURCHASES]: handleRecentPurchases,
  [SUPPORTED_INTENTS.SEARCH_INVOICE]: handleSearchInvoice,
  [SUPPORTED_INTENTS.SEARCH_RECEIPTS]: handleSearchReceipts,

  [SUPPORTED_INTENTS.ACTIVE_WARRANTIES]: handleWarrantyQueries,
  [SUPPORTED_INTENTS.EXPIRING_WARRANTIES]: handleWarrantyQueries,

  [SUPPORTED_INTENTS.TOP_CATEGORY]: handleTopEntities,
  [SUPPORTED_INTENTS.TOP_MERCHANT]: handleTopEntities,
  [SUPPORTED_INTENTS.CATEGORY_BREAKDOWN]: handleCategoryBreakdown,

  [SUPPORTED_INTENTS.MONTHLY_SPENDING]: handleTrendSpending,
  [SUPPORTED_INTENTS.YEARLY_SPENDING]: handleTrendSpending,
};

/**
 * Executes a classified intent query deterministically against PostgreSQL
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.intent - Classified SUPPORTED_INTENTS enum
 * @param {Object} [params.filters] - Extracted intent query filters
 * @returns {Promise<Object>} Validated result envelope
 */
export const executeIntent = async ({ userId, intent, filters = {} }) => {
  if (!userId) {
    return queryEnvelopeSchema.parse(failureResult(intent || 'UNKNOWN', 'unauthorized_user_id'));
  }

  // Handle UNKNOWN or unsupported intents
  if (!intent || intent === SUPPORTED_INTENTS.UNKNOWN || !HANDLER_MAP[intent]) {
    return queryEnvelopeSchema.parse(
      unsupportedResult('unsupported_receipt_question', ['TOTAL_SPENDING', 'SEARCH_RECEIPTS', 'RECENT_PURCHASES'])
    );
  }

  try {
    const handler = HANDLER_MAP[intent];
    const rawResult = await handler({ userId, intent, filters });
    return queryEnvelopeSchema.parse(rawResult);
  } catch (error) {
    logger.error(`Query execution failed for intent ${intent}:`, error.message);
    return queryEnvelopeSchema.parse(failureResult(intent, 'query_failed', error.message));
  }
};
