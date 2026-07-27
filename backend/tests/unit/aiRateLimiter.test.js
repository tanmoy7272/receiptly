import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkAiRateLimit, resetAiRateLimits } from '../../src/ai/rateLimiter.js';

describe('AI Rate Limiter', () => {
  beforeEach(() => {
    resetAiRateLimits();
  });

  it('should allow requests up to maximum threshold', () => {
    const userId = 'user-123';
    for (let i = 0; i < 5; i++) {
      const res = checkAiRateLimit(userId, 5, 60000);
      expect(res.allowed).toBe(true);
    }
  });

  it('should block requests exceeding maximum threshold', () => {
    const userId = 'user-456';
    for (let i = 0; i < 3; i++) {
      checkAiRateLimit(userId, 3, 60000);
    }

    const blockedRes = checkAiRateLimit(userId, 3, 60000);
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.retryAfterMs).toBeGreaterThan(0);
  });

  it('should reset limits after rate window expires', () => {
    vi.useFakeTimers();
    const userId = 'user-789';

    for (let i = 0; i < 2; i++) {
      checkAiRateLimit(userId, 2, 60000);
    }

    expect(checkAiRateLimit(userId, 2, 60000).allowed).toBe(false);

    // Advance time past 60 seconds
    vi.advanceTimersByTime(60001);

    expect(checkAiRateLimit(userId, 2, 60000).allowed).toBe(true);
    vi.useRealTimers();
  });
});
