import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';

// Initialize Redis client only if REDIS_URL is provided
const redisUrl = process.env.REDIS_URL;
let redisClient: Redis | null = null;

if (redisUrl) {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 1, // Fail fast if redis is down
    retryStrategy(times) {
      if (times > 3) {
        return null; // Stop retrying
      }
      return Math.min(times * 100, 3000);
    }
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });
  
  redisClient.on('connect', () => {
    console.log('Connected to Redis Cache');
  });
} else {
  console.log('No REDIS_URL provided. Running without caching layer.');
}

/**
 * Middleware to cache GET requests
 * @param duration Duration in seconds
 */
export const cacheRoute = (duration: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    
    // If Redis is not configured or down, bypass cache
    if (!redisClient || redisClient.status !== 'ready') {
      return next();
    }

    const key = `__express__${req.originalUrl || req.url}`;

    try {
      const cachedBody = await redisClient.get(key);
      if (cachedBody) {
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(JSON.parse(cachedBody));
      } else {
        // Override res.json to cache the response before sending
        const originalJson = res.json.bind(res);
        res.json = (body: unknown) => {
          redisClient?.set(key, JSON.stringify(body), 'EX', duration).catch(console.error);
          return originalJson(body);
        };
        next();
      }
    } catch (err) {
      console.error('Redis cache middleware error:', err);
      next(); // Continue normally if redis fails
    }
  };
};

export default redisClient;
