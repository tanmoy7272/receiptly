/**
 * ============================================================================
 * AI Duplicate Receipt Detection Service
 * ============================================================================
 * Purpose: Analyzes incoming receipt metadata against existing user receipts in
 *          PostgreSQL to detect duplicate uploads (deterministic first, AI second).
 * ============================================================================
 */
import prisma from '../lib/prisma.js';
import { normalizeMerchantName } from '../utils/merchantNormalizer.util.js';
import { groq, isAiEnabled, TEXT_MODEL } from '../ai/groqClient.js';
import { BoundedTtlCache } from '../ai/cache.js';
import { checkAiRateLimit } from '../ai/rateLimiter.js';
import { logAiTelemetry } from '../ai/telemetry.js';
import { DUPLICATE_DETECTION_RULES } from '../prompts/duplicateReceipt.prompt.js';
import { aiDuplicateResultSchema } from '../validators/duplicateReceipt.validator.js';

const duplicateCache = new BoundedTtlCache({ maxEntries: 100, ttlMs: 5 * 60 * 1000 });

const formatCandidate = (c) => ({
  id: c.id,
  title: c.title,
  merchant: c.merchant,
  amount: c.amount,
  purchaseDate: c.purchaseDate,
  category: c.category,
  invoiceNumber: c.invoiceNumber,
});

/**
 * Checks if an incoming receipt is a duplicate of an existing user receipt.
 * @param {string} userId - Authenticated user ID (data isolation)
 * @param {Object} data - Receipt metadata payload
 * @returns {Promise<Object>} Duplicate check result envelope
 */
export const checkDuplicateReceipt = async (userId, data) => {
  const startTime = Date.now();
  const merchantNormalized = normalizeMerchantName(data.merchant);
  const OR_conditions = [];

  // Condition A: Match exact invoice number (case-insensitive)
  if (data.invoiceNumber && String(data.invoiceNumber).trim()) {
    OR_conditions.push({
      invoiceNumber: {
        equals: String(data.invoiceNumber).trim(),
        mode: 'insensitive',
      },
    });
  }

  // Condition B: Match amount (+-1%) and date window (+-3 days if purchaseDate exists)
  if (data.amount && !isNaN(Number(data.amount))) {
    const amountCond = {
      amount: {
        gte: Number(data.amount) * 0.99,
        lte: Number(data.amount) * 1.01,
      },
    };

    if (data.purchaseDate && !isNaN(new Date(data.purchaseDate).getTime())) {
      const pDate = new Date(data.purchaseDate);
      const startWindow = new Date(pDate.getTime() - 3 * 24 * 60 * 60 * 1000);
      const endWindow = new Date(pDate.getTime() + 3 * 24 * 60 * 60 * 1000);
      amountCond.purchaseDate = {
        gte: startWindow,
        lte: endWindow,
      };
    }

    OR_conditions.push(amountCond);
  }

  if (OR_conditions.length === 0) {
    return {
      isDuplicate: false,
      confidence: 'low',
      reason: 'none',
      candidate: null,
    };
  }

  // Step 1: Query user candidates in PostgreSQL (limited to take: 5)
  const candidates = await prisma.receipt.findMany({
    where: {
      userId,
      OR: OR_conditions,
    },
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  // Zero candidates guard -> Instant false
  if (candidates.length === 0) {
    return {
      isDuplicate: false,
      confidence: 'low',
      reason: 'none',
      candidate: null,
    };
  }

  // Step 2: High Confidence Exact Invoice Match Guard
  if (data.invoiceNumber && String(data.invoiceNumber).trim()) {
    const rawInv = String(data.invoiceNumber).trim().toLowerCase();
    const invCandidate = candidates.find(
      (c) => c.invoiceNumber && c.invoiceNumber.trim().toLowerCase() === rawInv
    );
    if (invCandidate) {
      return {
        isDuplicate: true,
        confidence: 'high',
        reason: 'invoice_match',
        candidate: formatCandidate(invCandidate),
      };
    }
  }

  // Step 3: Exact Merchant + Amount + Same Day Single Candidate Guard
  const merchantCandidate = candidates.find(
    (c) =>
      c.merchantNormalized === merchantNormalized ||
      c.merchant.toLowerCase() === data.merchant.trim().toLowerCase()
  );

  if (merchantCandidate && candidates.length === 1) {
    return {
      isDuplicate: true,
      confidence: 'high',
      reason: 'metadata_match',
      candidate: formatCandidate(merchantCandidate),
    };
  }

  // Step 4: Ambiguous Match Resolution via Cache or AI
  const cacheKey = `${userId}:${merchantNormalized}:${Number(data.amount)}:${startOfDay.toISOString().slice(0, 10)}:${data.invoiceNumber || ''}`;
  const cached = duplicateCache.get(cacheKey);
  if (cached) {
    logAiTelemetry({ event: 'duplicate_check', status: 'cached', durationMs: Date.now() - startTime, userId });
    return cached;
  }

  // AI Evaluation if enabled and quota permits
  if (isAiEnabled() && checkAiRateLimit(userId).allowed) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const targetCandidate = merchantCandidate || candidates[0];

      const userPrompt = JSON.stringify({
        uploadedReceipt: {
          title: data.title || '',
          merchant: data.merchant,
          merchantNormalized,
          amount: Number(data.amount),
          purchaseDate: data.purchaseDate,
          category: data.category || '',
          invoiceNumber: data.invoiceNumber || null,
        },
        existingCandidate: {
          title: targetCandidate.title,
          merchant: targetCandidate.merchant,
          merchantNormalized: targetCandidate.merchantNormalized,
          amount: targetCandidate.amount,
          purchaseDate: targetCandidate.purchaseDate,
          category: targetCandidate.category,
          invoiceNumber: targetCandidate.invoiceNumber,
        },
      });

      const response = await groq.chat.completions.create(
        {
          model: TEXT_MODEL,
          messages: [
            { role: 'system', content: DUPLICATE_DETECTION_RULES },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
          max_tokens: 150,
        },
        { signal: controller.signal }
      );

      clearTimeout(timeoutId);

      const rawJson = JSON.parse(response.choices[0]?.message?.content || '{}');
      const validated = aiDuplicateResultSchema.parse(rawJson);

      const result = {
        isDuplicate: validated.duplicate,
        confidence: validated.confidence,
        reason: validated.duplicate ? 'ai_similarity' : 'none',
        candidate: validated.duplicate ? formatCandidate(targetCandidate) : null,
      };

      duplicateCache.set(cacheKey, result);
      logAiTelemetry({ event: 'duplicate_check', status: 'success', decision: 'ai', durationMs: Date.now() - startTime, userId });
      return result;
    } catch (err) {
      logAiTelemetry({ event: 'duplicate_check', status: 'error', decision: 'fallback', durationMs: Date.now() - startTime, userId, details: err.message });
    }
  }

  // Step 5: Fallback to metadata match
  if (merchantCandidate) {
    return {
      isDuplicate: true,
      confidence: 'medium',
      reason: 'metadata_match',
      candidate: formatCandidate(merchantCandidate),
    };
  }

  return {
    isDuplicate: false,
    confidence: 'low',
    reason: 'none',
    candidate: null,
  };
};
