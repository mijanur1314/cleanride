import { Queue } from 'bullmq';
import { env } from '../utils/env';

// Define the interface for email jobs to ensure type safety
export interface EmailJobData {
  to: string;
  subject: string;
  html: string;
}

const redisUrl = env.REDIS_URL;

// Initialize the queue only if REDIS_URL is present
export const emailQueue = redisUrl 
  ? new Queue('emailQueue', {
      connection: {
        url: redisUrl,
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000, // wait 5s before first retry
        },
        removeOnComplete: true,
        removeOnFail: false,
      }
    })
  : null;
