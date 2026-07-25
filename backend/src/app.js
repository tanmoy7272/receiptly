/**
 * ============================================================================
 * Express Application Configuration & Middleware Pipeline
 * ============================================================================
 * Purpose: Assembles Express application pipeline including security headers,
 *          CORS whitelist, compression, body parsing, rate limiters, and routes.
 * Middleware Order: Security -> Compression -> Logging -> CORS -> Parsers -> Limits -> Routes -> 404 -> Errors
 * ============================================================================
 */
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';

import { validateEnv, getClientOrigins } from './config/env.js';
import { requestLogger } from './middlewares/requestLogger.middleware.js';
import { generalRateLimiter, authRateLimiter, aiRateLimiter, otpRateLimiter } from './middlewares/rateLimit.middleware.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import { errorHandler } from './middlewares/error.middleware.js';
import routes from './routes/index.js';

// Validate required environment variables on boot
validateEnv();

const app = express();

// Trust proxy for reverse proxies (Render, Railway, Nginx)
app.set('trust proxy', 1);

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "blob:", "https://res.cloudinary.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        connectSrc: [
          "'self'",
          "http://localhost:5000",
          "http://localhost:5173",
          "https://res.cloudinary.com",
          ...getClientOrigins(),
        ],
      },
    },
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Compression Middleware (Skipping pre-compressed images & PDFs)
app.use(
  compression({
    filter: (req, res) => {
      const contentType = res.getHeader('Content-Type') || '';
      if (
        contentType.includes('image/') ||
        contentType.includes('application/pdf') ||
        contentType.includes('zip')
      ) {
        return false;
      }
      return compression.filter(req, res);
    },
  })
);

// Request Logger
app.use(requestLogger);

// CORS Configuration
const allowedOrigins = getClientOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS policy violation: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// Body Parsers & Cookie Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Rate Limiters
app.use('/api/v1/auth/login', authRateLimiter);
app.use('/api/v1/auth/register', authRateLimiter);
app.use('/api/v1/auth/verify-email', otpRateLimiter);
app.use('/api/v1/auth/forgot-password', otpRateLimiter);
app.use('/api/v1/auth/reset-password', otpRateLimiter);
app.use('/api/v1/auth/resend-otp', otpRateLimiter);
app.use('/api/v1/receipts/:id/extract', aiRateLimiter);
app.use('/api/v1', generalRateLimiter);

// API Routes
app.use('/api/v1', routes);

// 404 Handler & Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
