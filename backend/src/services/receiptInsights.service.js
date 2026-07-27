/**
 * ============================================================================
 * Receipt AI Insights Service
 * ============================================================================
 * Purpose: Generates contextual factual observations for a single receipt using Groq LLM.
 * Pipeline: Ownership check -> Metadata guard -> Cache lookup -> Groq -> Validation -> Return
 * ============================================================================
 */
import prisma from '../lib/prisma.js';
import { groq, TEXT_MODEL, isAiEnabled, callGroqChatCompletion } from '../ai/groqClient.js';
import { BoundedTtlCache } from '../ai/cache.js';
import { logAiTelemetry } from '../ai/telemetry.js';
import { checkAiRateLimit } from '../ai/rateLimiter.js';
import { receiptInsightsSchema } from '../validators/receiptInsights.validator.js';
import { buildReceiptInsightsPrompt } from '../prompts/receiptInsights.prompt.js';
import { logger } from '../utils/logger.js';

// Cache configuration constants
const CACHE_VERSION = 'v3';
const TIMEOUT_MS = 10000; // 10 seconds

// Standardized bounded TTL cache: 5 minutes TTL, max 500 entries
const insightsCache = new BoundedTtlCache(5 * 60 * 1000, 500);

/**
 * Checks if a receipt has at least 2 meaningful non-default metadata fields
 * @param {Object} receipt 
 * @returns {boolean}
 */
const hasSufficientMetadata = (receipt) => {
  if (!receipt) return false;

  let count = 0;
  if (receipt.title && receipt.title !== 'Receipt Document' && receipt.title !== 'Receipt') count++;
  if (receipt.merchant && receipt.merchant !== 'Store Vendor' && receipt.merchant !== 'Unknown Vendor') count++;
  if (receipt.category && receipt.category !== 'Other') count++;
  if (Number(receipt.amount) > 0) count++;
  if (receipt.purchaseDate) count++;
  if (receipt.invoiceNumber) count++;
  if (receipt.hasWarranty || receipt.warrantyExpiryDate) count++;
  if (receipt.notes) count++;

  return count >= 2;
};

/**
 * Generates or retrieves cached single-receipt AI insights
 * @param {string} receiptId 
 * @param {string} userId 
 * @returns {Promise<{ enabled: boolean, insights: string[] }>}
 */
export const getReceiptInsights = async (receiptId, userId) => {
  if (!receiptId || !userId) {
    return { enabled: false, insights: [] };
  }

  const startTime = Date.now();

  try {
    // 1. Ownership check & load receipt (single query)
    const receipt = await prisma.receipt.findFirst({
      where: {
        id: receiptId,
        userId,
      },
    });

    if (!receipt) {
      logAiTelemetry({ event: 'receipt_insights', userId, status: 'disabled', details: 'Receipt not found or unowned' });
      return { enabled: false, insights: [] };
    }

    // 2. Metadata guard check: requires at least 2 meaningful fields
    if (!hasSufficientMetadata(receipt)) {
      logAiTelemetry({ event: 'receipt_insights', userId, status: 'disabled', details: 'Insufficient metadata' });
      return { enabled: false, insights: [] };
    }

    // 3. Cache lookup with receiptId + updatedAt + version key
    const updatedAtTime = receipt.updatedAt ? new Date(receipt.updatedAt).getTime() : 0;
    const cacheKey = `${receipt.id}:${updatedAtTime}:${CACHE_VERSION}`;

    const cachedInsights = insightsCache.get(cacheKey);
    if (cachedInsights) {
      logAiTelemetry({ event: 'receipt_insights', userId, status: 'cached' });
      return { enabled: true, insights: cachedInsights };
    }

    // 4. Return disabled gracefully if AI features are disabled globally
    if (!isAiEnabled()) {
      logAiTelemetry({ event: 'receipt_insights', userId, status: 'disabled' });
      return { enabled: false, insights: [] };
    }

    // 5. Per-user rate limit check (max 20 requests per minute)
    const rateLimit = checkAiRateLimit(userId, 20, 60000);
    if (!rateLimit.allowed) {
      logAiTelemetry({ event: 'receipt_insights', userId, status: 'rate_limited' });
      return { enabled: false, insights: [] };
    }

    // 6. Construct lightweight metadata payload with derived contextual signals
    const hasWarranty = Boolean(receipt.hasWarranty || receipt.warrantyExpiryDate);
    const amount = Number(receipt.amount) || 0;
    const isDigitalOrSubscriptionCandidate = Boolean(
      (receipt.merchant && /google|apple|netflix|spotify|aws|microsoft|adobe|openai|swiggy|zomato|amazon/i.test(receipt.merchant)) ||
      (receipt.title && /subscription|cloud|storage|membership|pro|ultra|premium|plan|monthly|annual/i.test(receipt.title)) ||
      (receipt.category && /shopping|software|subscriptions|entertainment|services/i.test(receipt.category))
    );

    const metadataPayload = {
      title: receipt.title,
      merchant: receipt.merchant,
      category: receipt.category,
      amount,
      currency: receipt.currency || 'INR',
      purchaseDate: receipt.purchaseDate ? new Date(receipt.purchaseDate).toISOString().split('T')[0] : null,
      invoiceNumber: receipt.invoiceNumber || null,
      hasWarranty,
      warrantyMonths: receipt.warrantyMonths || null,
      warrantyExpiryDate: receipt.warrantyExpiryDate ? new Date(receipt.warrantyExpiryDate).toISOString().split('T')[0] : null,
      isDigitalOrSubscriptionCandidate,
      isHighValue: amount >= 5000,
      notes: receipt.notes || null,
    };

    // 7. Build structured system and user prompts
    const prompt = buildReceiptInsightsPrompt(metadataPayload);

    // 8. Invoke Groq with AbortController 10s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const completion = await callGroqChatCompletion(
        {
          messages: [prompt.system, prompt.user],
          model: TEXT_MODEL,
          temperature: 0.2,
          max_tokens: 120,
          response_format: { type: 'json_object' },
        },
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      const responseContent = completion.choices[0]?.message?.content?.trim() || '';
      const cleanJsonText = responseContent.replace(/```json|```/g, '').replace(/```/g, '').trim();

      const parsedJson = JSON.parse(cleanJsonText);
      const validated = receiptInsightsSchema.parse(parsedJson);

      if (Array.isArray(validated.insights) && validated.insights.length > 0) {
        insightsCache.set(cacheKey, validated.insights);
        logAiTelemetry({
          event: 'receipt_insights',
          userId,
          status: 'success',
          durationMs: Date.now() - startTime,
        });

        return { enabled: true, insights: validated.insights };
      }

      logAiTelemetry({ event: 'receipt_insights', userId, status: 'disabled', details: 'Empty insights generated' });
      return { enabled: false, insights: [] };
    } catch (apiError) {
      clearTimeout(timeoutId);
      const isTimeout = apiError.name === 'AbortError' || controller.signal.aborted;
      const status = isTimeout ? 'timeout' : 'error';
      logAiTelemetry({
        event: 'receipt_insights',
        userId,
        status,
        durationMs: Date.now() - startTime,
        details: apiError.message,
      });

      return { enabled: false, insights: [] };
    }
  } catch (err) {
    logAiTelemetry({ event: 'receipt_insights', userId, status: 'error', details: err.message });
    return { enabled: false, insights: [] };
  }
};
