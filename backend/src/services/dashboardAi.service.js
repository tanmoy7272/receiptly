/**
 * ============================================================================
 * Dashboard AI Spending Insights Service
 * ============================================================================
 * Purpose: Summarizes pre-calculated dashboard analytics using Groq LLM.
 * Guiding Principle: AI summarizes. Backend computes. User reads.
 * ============================================================================
 */
import { groq, TEXT_MODEL, isAiEnabled, callGroqChatCompletion } from '../ai/groqClient.js';
import { BoundedTtlCache } from '../ai/cache.js';
import { logAiTelemetry } from '../ai/telemetry.js';
import { checkAiRateLimit } from '../ai/rateLimiter.js';
import { getDashboardData } from './dashboard.service.js';
import { dashboardAiSummarySchema } from '../validators/dashboardAi.validator.js';
import { buildDashboardSummaryPrompt } from '../prompts/dashboardSummary.prompt.js';
import { logger } from '../utils/logger.js';

const TIMEOUT_MS = 10000; // 10 seconds

// Standardized bounded TTL cache: 5 minutes TTL, max 500 entries
const summaryCache = new BoundedTtlCache(5 * 60 * 1000, 500);

/**
 * Calculates monthly trend comparing latest month vs previous month with a 5% threshold
 * @param {Array} monthlySpending 
 * @returns {"up" | "down" | "stable"}
 */
const calculateMonthlyTrend = (monthlySpending = []) => {
  if (!Array.isArray(monthlySpending) || monthlySpending.length < 2) {
    return 'stable';
  }

  const prevAmount = Number(monthlySpending[monthlySpending.length - 2]?.totalAmount) || 0;
  const currAmount = Number(monthlySpending[monthlySpending.length - 1]?.totalAmount) || 0;

  if (prevAmount === 0) {
    return currAmount > 0 ? 'up' : 'stable';
  }

  const pctChange = ((currAmount - prevAmount) / prevAmount) * 100;

  if (pctChange > 5) return 'up';
  if (pctChange < -5) return 'down';
  return 'stable';
};

/**
 * Generates or retrieves cached AI spending insights summary
 * @param {string} userId 
 * @returns {Promise<{ enabled: boolean, summary: string[] }>}
 */
export const getDashboardAiSummary = async (userId) => {
  if (!userId) {
    return { enabled: false, summary: [] };
  }

  // 1. Check in-memory cache
  const cachedSummary = summaryCache.get(userId);
  if (cachedSummary) {
    logAiTelemetry({ event: 'dashboard_summary', userId, status: 'cached' });
    return { enabled: true, summary: cachedSummary };
  }

  // 2. Return disabled gracefully if AI features are disabled globally
  if (!isAiEnabled()) {
    logAiTelemetry({ event: 'dashboard_summary', userId, status: 'disabled' });
    return { enabled: false, summary: [] };
  }

  // 3. Per-user rate limit check (max 20 requests per minute)
  const rateLimit = checkAiRateLimit(userId, 20, 60000);
  if (!rateLimit.allowed) {
    logAiTelemetry({ event: 'dashboard_summary', userId, status: 'rate_limited' });
    return { enabled: false, summary: [] };
  }

  const startTime = Date.now();

  try {
    // 4. Fetch pre-calculated dashboard statistics (single DB trip)
    const dashboardData = await getDashboardData(userId);
    const overview = dashboardData?.overview || {};
    const totalReceipts = overview.totalReceipts || 0;

    // 0-receipt edge case: Return disabled without querying Groq
    if (totalReceipts === 0) {
      logAiTelemetry({ event: 'dashboard_summary', userId, status: 'disabled', details: 'Zero receipts' });
      return { enabled: false, summary: [] };
    }

    const categoryBreakdown = dashboardData?.categoryBreakdown || [];
    const monthlySpending = dashboardData?.monthlySpending || [];

    const totalSpent = Number(overview.totalSpent) || 0;
    const topCategories = categoryBreakdown
      .slice(0, 3)
      .map((c) => c.category)
      .filter(Boolean);
    const monthlyTrend = calculateMonthlyTrend(monthlySpending);
    const activeWarranties = Number(dashboardData?.activeWarranties) || 0;

    const prevAmount = Number(monthlySpending[monthlySpending.length - 2]?.totalAmount) || 0;
    const currAmount = Number(monthlySpending[monthlySpending.length - 1]?.totalAmount) || 0;
    const momPctChange = prevAmount > 0 ? Math.round(((currAmount - prevAmount) / prevAmount) * 100) : null;

    const topCategoryName = categoryBreakdown[0]?.category || null;
    const topCategoryAmount = Number(categoryBreakdown[0]?.totalAmount) || 0;
    const topCategoryPct = totalSpent > 0 ? Math.round((topCategoryAmount / totalSpent) * 100) : 0;

    // 5. Sanity check input analytics payload before sending to AI
    if (totalSpent < 0 || totalReceipts < 0) {
      logger.warn(`Invalid dashboard stats for user ${userId}`);
      return { enabled: false, summary: [] };
    }

    const analyticsPayload = {
      totalSpent,
      receiptCount: totalReceipts,
      monthlyTrend,
      momPctChange: momPctChange !== null ? `${momPctChange > 0 ? '+' : ''}${momPctChange}%` : 'N/A',
      topCategories,
      topCategoryShare: topCategoryName ? `${topCategoryName} (${topCategoryPct}% of spend)` : null,
      activeWarranties,
    };

    // 6. Build system and user prompt messages
    const prompt = buildDashboardSummaryPrompt(analyticsPayload);

    // 7. Execute Groq LLM completion with AbortController 10s timeout
    try {
      const completion = await callGroqChatCompletion(
        {
          messages: [prompt.system, prompt.user],
          model: TEXT_MODEL,
          temperature: 0.2,
          max_tokens: 150,
          response_format: { type: 'json_object' },
        },
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const responseContent = completion.choices[0]?.message?.content?.trim() || '';
      const cleanJsonText = responseContent.replace(/```json|```/g, '').replace(/```/g, '').trim();

      const parsedJson = JSON.parse(cleanJsonText);
      const validated = dashboardAiSummarySchema.parse(parsedJson);

      if (Array.isArray(validated.summary) && validated.summary.length > 0) {
        summaryCache.set(userId, validated.summary);
        logAiTelemetry({
          event: 'dashboard_summary',
          userId,
          status: 'success',
          durationMs: Date.now() - startTime,
        });

        return { enabled: true, summary: validated.summary };
      }

      logAiTelemetry({ event: 'dashboard_summary', userId, status: 'disabled', details: 'Empty summary generated' });
      return { enabled: false, summary: [] };
    } catch (apiError) {
      clearTimeout(timeoutId);
      const isTimeout = apiError.name === 'AbortError' || controller.signal.aborted;
      const status = isTimeout ? 'timeout' : 'error';
      logAiTelemetry({
        event: 'dashboard_summary',
        userId,
        status,
        durationMs: Date.now() - startTime,
        details: apiError.message,
      });

      return { enabled: false, summary: [] };
    }
  } catch (err) {
    logAiTelemetry({ event: 'dashboard_summary', userId, status: 'error', details: err.message });
    return { enabled: false, summary: [] };
  }
};
