import rateLimit from 'express-rate-limit';

const createLimiter = (maxRequests, windowMinutes, message) => {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Exclude health check endpoints from rate limits
      const path = req.path || req.originalUrl || '';
      return path.includes('/health');
    },
    handler: (req, res) => {
      return res.status(429).json({
        success: false,
        message: message || 'Too many requests. Please try again later.',
        errors: [{ message: message || 'Rate limit exceeded.' }],
      });
    },
  });
};

export const authRateLimiter = createLimiter(
  10,
  15,
  'Too many sign-in attempts. Please wait 15 minutes before trying again.'
);

export const aiRateLimiter = createLimiter(
  10,
  15,
  "You've reached the AI extraction limit. Please wait 15 minutes or enter details manually."
);

export const generalRateLimiter = createLimiter(
  100,
  15,
  'Too many requests. Please wait a few minutes before trying again.'
);

export const otpRateLimiter = createLimiter(
  5,
  15,
  'Too many verification attempts. Please wait 15 minutes before trying again.'
);
