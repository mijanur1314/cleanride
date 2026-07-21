import { env } from './utils/env';
import http from 'http';
import app from './app';
import { logger } from './utils/logger';
import { initSocket } from './socket';
import prisma from './utils/prisma';
import redisClient from './utils/redis';

const PORT = env.PORT || 5000;
const frontendUrl = env.FRONTEND_URL || 'http://localhost:3000';

const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server, frontendUrl);

server.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});

// Graceful Shutdown Handlers
const shutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await prisma.$disconnect();
      logger.info('Database connection closed.');
      if (redisClient) {
        await redisClient.quit();
        logger.info('Redis connection closed.');
      }
      process.exit(0);
    } catch (err) {
      logger.error('Error during database disconnection:', err);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if graceful fails
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
