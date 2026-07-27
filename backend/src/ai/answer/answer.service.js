/**
 * ============================================================================
 * Ask Receiptly Natural Answer Generator Service
 * ============================================================================
 * Purpose: Formats pre-computed backend query results into conversational English
 *          using Groq AI, versioned TTL caching, rate limiting, and fallbacks.
 * ============================================================================
 */
import crypto from 'crypto';
import { groq, TEXT_MODEL, isAiEnabled } from '../groqClient.js';
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

  // 3. Guard check for global AI feature flag & API key setup
  if (!isAiEnabled()) {
    return getDisabledAnswer();
  }

  // 4. Rate limiting check
  const rateLimit = checkAiRateLimit(userId);
  if (!rateLimit.allowed) {
    logAiTelemetry({
      event: 'ask_receiptly_answer',
      status: 'rate_limited',
      userId,
      durationMs: Date.now() - startTime,
    });
    return getRateLimitedAnswer();
  }

  // 5. Versioned TTL Cache Lookup
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

  // 6. Invoke Groq API with 8-second timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const userPrompt = buildAnswerPrompt({ question, intent, result: queryResult, metadata });

    const completion = await groq.chat.completions.create(
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

    // Fallback to clear, structured natural description
    const fallbackMessage = generateDeterministicDataAnswer(intent, data, metadata);
    return {
      success: true,
      answer: fallbackMessage,
      answeredBy: 'fallback',
    };
  }
};

/**
 * Generates clean deterministic data statement when Groq API times out or errors out
 */
const generateDeterministicDataAnswer = (intent, data, metadata) => {
  const currency = data.currency === 'MIXED' ? '' : `${data.currency || 'INR'} `;
  const period = metadata.period || 'ALL_TIME';

  if (data.totalSpent !== undefined) {
    return `Your total spend for ${intent.toLowerCase().replace(/_/g, ' ')} is ${currency}${data.totalSpent} across ${data.receiptCount || 0} receipts.`;
  }

  if (data.averageSpend !== undefined) {
    return `Your average spend per receipt is ${currency}${data.averageSpend} across ${data.receiptCount || 0} receipts.`;
  }

  if (data.count !== undefined) {
    return `Found ${data.count} matching receipts in your vault.`;
  }

  return 'Receiptly found your requested information in the vault.';
};
