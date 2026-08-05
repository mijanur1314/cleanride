import { Queue } from 'bullmq';
import { env } from '../utils/env';

const redisUrl = env.REDIS_URL;

export const payoutQueue = new Queue('payoutQueue', {
  connection: {
    url: redisUrl || 'redis://localhost:6379'
  }
});
