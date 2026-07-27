/**
 * ============================================================================
 * Ask Receiptly Frontend Service
 * ============================================================================
 * Purpose: Provides client API call wrapper to POST /api/v1/ask endpoint
 *          supporting request cancellation via AbortSignal.
 * ============================================================================
 */
import { apiClient } from './apiClient';

export const askReceiptlyService = {
  /**
   * Submits a natural language question to Ask Receiptly API
   * @param {string} question 
   * @param {Object} [options] - Optional signal for request cancellation
   * @returns {Promise<Object>} API response payload
   */
  askQuestion: async (question, options = {}) => {
    return apiClient('/ask', {
      method: 'POST',
      body: JSON.stringify({ question }),
      signal: options.signal,
    });
  },
};
