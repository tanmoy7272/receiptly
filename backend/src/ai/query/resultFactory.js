/**
 * ============================================================================
 * Ask Receiptly Result Factory
 * ============================================================================
 * Purpose: Standardizes response envelopes across all query engine execution results.
 * ============================================================================
 */

/**
 * Creates a successful query result envelope with AI-ready metadata
 * @param {string} intent 
 * @param {Object} data 
 * @param {Object} [metadata] 
 * @returns {Object}
 */
export const successResult = (intent, data, metadata = {}) => ({
  success: true,
  supported: true,
  intent,
  data,
  metadata: {
    intent,
    period: metadata.period || 'ALL_TIME',
    filters: metadata.filters || {},
    timestamp: new Date().toISOString(),
  },
});

/**
 * Creates a failed query result envelope
 * @param {string} intent 
 * @param {string} reason 
 * @param {Object} [details] 
 * @returns {Object}
 */
export const failureResult = (intent, reason = 'query_failed', details = null) => ({
  success: false,
  supported: true,
  intent,
  reason,
  ...(details ? { details } : {}),
});

/**
 * Creates an unsupported intent result envelope
 * @param {string} [reason] 
 * @param {string[]} [suggestions] 
 * @returns {Object}
 */
export const unsupportedResult = (
  reason = 'unsupported_receipt_question',
  suggestions = ['TOTAL_SPENDING', 'SEARCH_RECEIPTS', 'RECENT_PURCHASES']
) => ({
  success: true,
  supported: false,
  reason,
  suggestions,
});
