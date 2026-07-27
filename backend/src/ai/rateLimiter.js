/**
 * ============================================================================
 * Lightweight In-Memory AI Rate Limiter
 * ============================================================================
 * Purpose: Protects upstream AI providers (Groq) from aggressive endpoint spam
 *          by limiting per-user AI invocations within a rolling time window.
 * ============================================================================
 */

const userRequestsMap = new Map(); // userId -> { count, windowStart }

/**
 * Checks whether a user has exceeded their AI request quota
 * @param {string} userId 
 * @param {number} maxRequests - Max allowed requests within window (default 20)
 * @param {number} windowMs - Time window in milliseconds (default 60,000ms = 1 min)
 * @returns {{ allowed: boolean, retryAfterMs?: number }}
 */
export const checkAiRateLimit = (userId, maxRequests = 300, windowMs = 60000) => {
  if (!userId) {
    return { allowed: true };
  }

  const now = Date.now();
  const userRecord = userRequestsMap.get(userId);

  if (!userRecord || now - userRecord.windowStart >= windowMs) {
    userRequestsMap.set(userId, {
      count: 1,
      windowStart: now,
    });
    return { allowed: true };
  }

  if (userRecord.count >= maxRequests) {
    const retryAfterMs = windowMs - (now - userRecord.windowStart);
    return {
      allowed: false,
      retryAfterMs: Math.max(0, retryAfterMs),
    };
  }

  userRecord.count += 1;
  return { allowed: true };
};

/**
 * Clears rate limit state (useful for unit testing)
 */
export const resetAiRateLimits = () => {
  userRequestsMap.clear();
};
