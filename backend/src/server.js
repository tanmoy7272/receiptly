/**
 * ============================================================================
 * HTTP Server Entrypoint
 * ============================================================================
 * Purpose: Initializes Express HTTP server, binds port listener, and handles
 *          graceful process lifecycle errors.
 * Flow: server.js -> app.js (Middleware & Routing) -> Express Listen
 * ============================================================================
 */
import app from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${config.nodeEnv} mode on port ${PORT}`);
  logger.info(`Health check available at http://localhost:${PORT}/api/v1/health`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    logger.warn(`Port ${PORT} busy, exiting process so nodemon restarts cleanly.`);
    process.exit(0);
  }
});
