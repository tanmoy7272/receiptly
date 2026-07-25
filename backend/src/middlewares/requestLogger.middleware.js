import crypto from 'crypto';

export const requestLogger = (req, res, next) => {
  req.id = crypto.randomBytes(4).toString('hex');
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    const logLine = `[${timestamp}] [ReqId: ${req.id}] ${req.method} ${req.originalUrl || req.url} ${statusCode} - ${duration}ms`;

    if (statusCode >= 500) {
      console.error(`[ERROR] ${logLine}`);
    } else if (statusCode >= 400) {
      console.warn(`[WARN] ${logLine}`);
    } else {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`[INFO] ${logLine}`);
      }
    }
  });

  next();
};
