import { Queue } from 'bullmq';
import { env } from '../utils/env';

export interface WebhookJobData {
  event: string;
  payload: any;
  signature: string;
}

const redisUrl = env.REDIS_URL;

export const webhookQueue = redisUrl 
  ? new Queue('webhookQueue', {
      connection: {
        url: redisUrl,
      },
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    })
  : null;
