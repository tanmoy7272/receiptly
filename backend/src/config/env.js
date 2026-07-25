import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  databaseUrl: process.env.DATABASE_URL,
  groqModel: process.env.GROQ_MODEL || process.env.GROQ_TEXT_MODEL || 'llama-3.3-70b-versatile',
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  groqApiKey: process.env.GROQ_API_KEY,
  // SMTP (Brevo) — Email Verification & Password Reset
  smtpHost: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  brevoApiKey: process.env.BREVO_API_KEY || process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM || 'Receiptly <noreply@receiptly.app>',
  cookieSameSite: process.env.COOKIE_SAME_SITE || (process.env.NODE_ENV === 'production' ? 'none' : 'lax'),
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

  const parsed = rawUrls
    .split(',')
    .map((url) => url.trim().replace(/\/$/, ''))
    .filter(Boolean);

  const originsSet = new Set([...defaultOrigins, ...parsed]);
  parsed.forEach((url) => originsSet.add(`${url}/`));

  return Array.from(originsSet);
};
