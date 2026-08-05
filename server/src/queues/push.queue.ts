import { Queue } from 'bullmq';
import { env } from '../utils/env';
import webpush from 'web-push';

export interface PushJobData {
  subscription: webpush.PushSubscription;
  payload: string;
}

const redisUrl = env.REDIS_URL;

export const pushQueue = redisUrl 
  ? new Queue('pushQueue', {
      connection: {
        url: redisUrl,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    })
  : null;
