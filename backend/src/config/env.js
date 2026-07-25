import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
};

export const validateEnv = () => {
  const requiredVars = ['DATABASE_URL', 'JWT_SECRET'];
  const missing = requiredVars.filter((v) => !process.env[v]);

  if (missing.length > 0) {
    console.error(`[FATAL] Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
};

export const getClientOrigins = () => {
  const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const rawUrls = process.env.CLIENT_URL || process.env.CLIENT_URLS || '';

  if (!rawUrls) return defaultOrigins;

  const parsed = rawUrls.split(',').map((url) => url.trim()).filter(Boolean);
  return parsed.length > 0 ? Array.from(new Set([...defaultOrigins, ...parsed])) : defaultOrigins;
};
