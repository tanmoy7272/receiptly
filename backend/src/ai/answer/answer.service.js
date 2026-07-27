/**
 * ============================================================================
 * Ask Receiptly Natural Answer Generator Service
 * ============================================================================
 * Purpose: Formats pre-computed backend query results into conversational English
 *          using Groq AI, versioned TTL caching, rate limiting, and fallbacks.
 * ============================================================================
 */
import crypto from 'crypto';
import { callGroqChatCompletion, TEXT_MODEL, isAiEnabled } from '../groqClient.js';
import { BoundedTtlCache } from '../cache.js';
import { checkAiRateLimit } from '../rateLimiter.js';
import { logAiTelemetry } from '../telemetry.js';
import { SYSTEM_PROMPT, PROMPT_VERSION, buildAnswerPrompt } from './answer.prompt.js';
import { askReceiptlyAnswerSchema } from './answer.validator.js';
import {
  getUnsupportedAnswer,
  getEmptyResultAnswer,
  getDisabledAnswer,
  getRateLimitedAnswer,
} from './fallbackAnswers.js';
import { logger } from '../../utils/logger.js';

// Centralized 5-minute TTL cache instance for answer formatting
export const answerCache = new BoundedTtlCache(5 * 60 * 1000, 500);

/**
 * Computes deterministic hash key for answer caching
 */
export const computeAnswerCacheKey = (question, intent, data) => {
  const normQ = (question || '').trim().toLowerCase();
  const normData = JSON.stringify(data || {});
  return crypto
    .createHash('sha256')
    .update(`${normQ}:${intent}:${normData}:${PROMPT_VERSION}`)
    .digest('hex');
};

/**
 * Generates natural language answer from pre-computed query engine result
 * @param {Object} params
 * @param {string} params.userId - Authenticated user ID
 * @param {string} params.question - Raw user question
 * @param {Object} params.queryResult - Output payload from executeIntent
 * @returns {Promise<Object>} { success: true, answer: string, answeredBy: 'ai'|'fallback' }
 */
export const generateNaturalAnswer = async ({ userId, question, queryResult }) => {
  const startTime = Date.now();

  // 1. Guard check for unsupported questions
  if (!queryResult || queryResult.supported === false) {
    return getUnsupportedAnswer();
  }

  const intent = queryResult.intent || 'UNKNOWN';
  const data = queryResult.data || {};
  const metadata = queryResult.metadata || {};

  // 2. Guard check for empty database query results (0 receipts / $0 spend / invoice not found)
  const isCountZero = data.receiptCount === 0 || data.count === 0 || data.groupCount === 0;
  const isNotFound = data.found === false;
  if (isCountZero || isNotFound) {
    return getEmptyResultAnswer(intent, metadata.filters || {});
  }

  // 3. Versioned TTL Cache Lookup
  const cacheKey = computeAnswerCacheKey(question, intent, data);
  const cachedAnswer = answerCache.get(cacheKey);
  if (cachedAnswer) {
    logAiTelemetry({
      event: 'ask_receiptly_answer',
      status: 'cache_hit',
      userId,
      durationMs: Date.now() - startTime,
      details: `intent=${intent}`,
    });
    return {
      success: true,
      answer: cachedAnswer,
      answeredBy: 'ai',
      cacheHit: true,
    };
  }

  // 4. Try Groq AI formatting if enabled and rate limit allows
  const rateLimit = checkAiRateLimit(userId);
  if (isAiEnabled() && rateLimit.allowed) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const userPrompt = buildAnswerPrompt({ question, intent, result: queryResult, metadata });

      const completion = await callGroqChatCompletion(
        {
          model: TEXT_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 200,
          response_format: { type: 'json_object' },
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const rawText = completion.choices?.[0]?.message?.content?.trim() || '';
      const parsedJson = JSON.parse(rawText);
      const validated = askReceiptlyAnswerSchema.parse(parsedJson);

      // Cache successful AI responses
      answerCache.set(cacheKey, validated.answer);

      logAiTelemetry({
        event: 'ask_receiptly_answer',
        status: 'success',
        userId,
        durationMs: Date.now() - startTime,
        details: `intent=${intent}`,
      });

      return {
        success: true,
        answer: validated.answer,
        answeredBy: 'ai',
      };
    } catch (error) {
      clearTimeout(timeoutId);
      logger.warn(`Ask Receiptly AI answer generation failed for user ${userId}:`, error.message);

      logAiTelemetry({
        event: 'ask_receiptly_answer',
        status: 'error',
        userId,
        durationMs: Date.now() - startTime,
        details: error.message,
      });
    }
  }

  // 5. Universal Fallback Response Generator (always returns detailed natural answer from database records)
  const fallbackMessage = generateDeterministicDataAnswer(intent, data, metadata);
  return {
    success: true,
    answer: fallbackMessage,
    answeredBy: 'fallback',
  };
};

/**
 * Generates clean universal data statement from database query results
 */
const generateDeterministicDataAnswer = (intent, data, metadata) => {
  const currencySymbol = (c) => (c === 'INR' || !c ? '₹' : `${c} `);
  const currency = currencySymbol(data?.currency);

  // 1. If single receipt object present (e.g. biggest/smallest purchase or invoice match)
  if (data?.receipt) {
    const r = data.receipt;
    const cSym = currencySymbol(r.currency);
    const dateStr = r.purchaseDate ? ` on ${r.purchaseDate}` : '';
    const merchantStr = r.merchant ? ` at ${r.merchant}` : '';
    const invoiceStr = r.invoiceNumber ? ` (Invoice: ${r.invoiceNumber})` : '';
    return `Found receipt "${r.title || r.merchant || 'Purchase'}": ${cSym}${r.amount}${merchantStr}${dateStr}${invoiceStr}.`;
  }

  // 2. If list of receipts present (warranties, search, recent purchases, total with sample receipts)
  if (Array.isArray(data?.receipts) && data.receipts.length > 0) {
    const isWarranty = intent?.includes('WARRANTY') || intent?.includes('WARRANTIES');
    if (isWarranty) {
      const items = data.receipts
        .slice(0, 4)
        .map((r) => `${r.title || r.merchant}${r.warrantyExpiryDate ? ` (expires ${r.warrantyExpiryDate})` : ''}`)
        .join(', ');
      const extra = data.receipts.length > 4 ? ` and ${data.receipts.length - 4} more` : '';
      return `Found ${data.count || data.receipts.length} active warranties: ${items}${extra}.`;
    }

    const items = data.receipts
      .slice(0, 4)
      .map((r) => `"${r.title || r.merchant}" (${currencySymbol(r.currency)}${r.amount})`)
      .join(', ');
    const extra = data.receipts.length > 4 ? ` and ${data.receipts.length - 4} more` : '';
    const totalSpentStr = data.totalSpent ? ` for a total spend of ${currency}${data.totalSpent}` : '';
    return `Found ${data.receiptCount || data.count || data.receipts.length} receipts${totalSpentStr}: ${items}${extra}.`;
  }

  // 3. Top merchant / Top category
  if (data?.merchant && data?.totalSpent !== undefined) {
    return `Your top merchant is ${data.merchant} with a total spend of ${currency}${data.totalSpent} across ${data.receiptCount || 0} receipts.`;
  }
  if (data?.category && data?.totalSpent !== undefined) {
    return `Your top spending category is ${data.category} with a total spend of ${currency}${data.totalSpent} across ${data.receiptCount || 0} receipts.`;
  }

  // 4. Category breakdown
  if (Array.isArray(data?.breakdown) && data.breakdown.length > 0) {
    const list = data.breakdown
      .slice(0, 5)
      .map((b) => `${b.category}: ${currency}${b.totalSpent}`)
      .join(', ');
    return `Category spending breakdown: ${list}. Total spending: ${currency}${data.totalSpent || 0}.`;
  }

  // 5. Total spending
  if (data?.totalSpent !== undefined) {
    const filterInfo = metadata?.filters?.merchant ? ` for ${metadata.filters.merchant}` : metadata?.filters?.category ? ` for ${metadata.filters.category}` : '';
    return `Your total spend${filterInfo} is ${currency}${data.totalSpent} across ${data.receiptCount || 0} receipts.`;
  }

  // 6. Average spending
  if (data?.averageSpend !== undefined) {
    return `Your average spend per receipt is ${currency}${data.averageSpend} across ${data.receiptCount || 0} receipts.`;
  }

  // 7. Purchase count
  if (data?.count !== undefined) {
    return `You have a total of ${data.count} matching receipts.`;
  }

  return 'Found matching receipt records.';
};
