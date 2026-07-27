import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateNaturalAnswer, answerCache, computeAnswerCacheKey } from '../../src/ai/answer/answer.service.js';
import { callGroqChatCompletion } from '../../src/ai/groqClient.js';
import { checkAiRateLimit } from '../../src/ai/rateLimiter.js';
import { SUPPORTED_INTENTS } from '../../src/ai/intent/supportedIntents.js';

vi.mock('../../src/ai/groqClient.js', () => ({
  callGroqChatCompletion: vi.fn(),
  TEXT_MODEL: 'llama-3.3-70b-versatile',
  isAiEnabled: vi.fn(() => true),
}));

vi.mock('../../src/ai/rateLimiter.js', () => ({
  checkAiRateLimit: vi.fn(() => ({ allowed: true })),
}));

describe('Ask Receiptly Answer Generator Service (Prompt 3)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    answerCache.clear();
  });

  it('should return deterministic response for unsupported question (0 Groq calls)', async () => {
    const res = await generateNaturalAnswer({
      userId: 'user-1',
      question: 'Who is Elon Musk?',
      queryResult: { supported: false },
    });

    expect(res.success).toBe(true);
    expect(res.answeredBy).toBe('fallback');
    expect(res.answer).toContain('answer questions about your receipts');
  });

  it('should return deterministic response for empty query result (0 Groq calls)', async () => {
    const res = await generateNaturalAnswer({
      userId: 'user-1',
      question: 'How much did I spend on Starbucks this month?',
      queryResult: {
        supported: true,
        intent: SUPPORTED_INTENTS.TOTAL_BY_MERCHANT,
        data: { totalSpent: 0, receiptCount: 0 },
      },
    });

    expect(res.success).toBe(true);
    expect(res.answeredBy).toBe('fallback');
    expect(res.answer).toContain("couldn't find any matching receipts");
  });

  it('should call Groq AI and format natural language answer', async () => {
    callGroqChatCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              answer: 'You spent ₹4,380 at Swiggy this month across 14 receipts.',
            }),
          },
        },
      ],
    });

    const res = await generateNaturalAnswer({
      userId: 'user-1',
      question: 'How much did I spend on Swiggy this month?',
      queryResult: {
        supported: true,
        intent: SUPPORTED_INTENTS.TOTAL_BY_MERCHANT,
        data: { totalSpent: 4380, receiptCount: 14, currency: 'INR' },
        metadata: { period: 'THIS_MONTH' },
      },
    });

    expect(res.success).toBe(true);
    expect(res.answeredBy).toBe('ai');
    expect(res.answer).toBe('You spent ₹4,380 at Swiggy this month across 14 receipts.');
  });

  it('should use versioned cache for repeated questions', async () => {
    callGroqChatCompletion.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              answer: 'You spent ₹4,380 at Swiggy this month.',
            }),
          },
        },
      ],
    });

    const queryResult = {
      supported: true,
      intent: SUPPORTED_INTENTS.TOTAL_BY_MERCHANT,
      data: { totalSpent: 4380, receiptCount: 14 },
    };

    // First call -> Groq API
    await generateNaturalAnswer({ userId: 'user-1', question: 'Swiggy spend', queryResult });

    // Second call -> Cache Hit
    const res2 = await generateNaturalAnswer({ userId: 'user-1', question: 'Swiggy spend', queryResult });

    expect(res2.success).toBe(true);
    expect(res2.cacheHit).toBe(true);
    expect(res2.answeredBy).toBe('ai');
    expect(callGroqChatCompletion).toHaveBeenCalledTimes(1);
  });

  it('should handle rate limiting gracefully with fallback answer', async () => {
    checkAiRateLimit.mockReturnValue({ allowed: false });

    const res = await generateNaturalAnswer({
      userId: 'user-1',
      question: 'Total spend',
      queryResult: {
        supported: true,
        intent: SUPPORTED_INTENTS.TOTAL_SPENDING,
        data: { totalSpent: 1000, receiptCount: 2 },
      },
    });

    expect(res.success).toBe(true);
    expect(res.answeredBy).toBe('fallback');
    expect(res.answer).toContain('Your total spend is ₹1000 across 2 receipts.');
  });
});
