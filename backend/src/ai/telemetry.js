/**
 * ============================================================================
 * AI Telemetry & Request Logger
 * ============================================================================
 * Purpose: Provides structured telemetry logging for monitoring AI execution,
 *          cache hit rates, latency, timeouts, and rate limits without DB overhead.
 * ============================================================================
 */
import { logger } from '../utils/logger.js';

/**
 * Logs structured AI telemetry event
 * @param {Object} options
 * @param {string} options.event - Feature event name (e.g. 'dashboard_summary', 'receipt_insights', 'ocr_extraction')
 * @param {string} options.userId - User ID
 * @param {'success'|'cached'|'timeout'|'validation_failure'|'rate_limited'|'disabled'|'error'} options.status
 * @param {number} [options.durationMs] - Execution duration in milliseconds
 * @param {string} [options.details] - Additional contextual message
 */
export const logAiTelemetry = ({ event, userId, status, durationMs, details }) => {
  const durationStr = typeof durationMs === 'number' ? ` duration=${durationMs}ms` : '';
  const userStr = userId ? ` userId=${userId}` : '';
  const detailsStr = details ? ` details="${details}"` : '';

  const logMessage = `[AI_TELEMETRY] event=${event} status=${status}${durationStr}${userStr}${detailsStr}`;

  if (status === 'error' || status === 'validation_failure' || status === 'timeout') {
    logger.warn(logMessage);
  } else {
    logger.info(logMessage);
  }
};
