import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const redisUrl = process.env.REDIS_URL;

if (!redisUrl) {
  console.warn('REDIS_URL is not defined in .env. Background jobs will not work.');
}

const connection = new IORedis(redisUrl || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// Create Queues
export const emailQueue = new Queue('emailQueue', { connection });
export const loyaltyQueue = new Queue('loyaltyQueue', { connection });

// Optional: Queue events for monitoring
export const emailQueueEvents = new QueueEvents('emailQueue', { connection });

emailQueueEvents.on('completed', ({ jobId }) => {
  console.log(`Email job ${jobId} has completed!`);
});

emailQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`Email job ${jobId} has failed with reason: ${failedReason}`);
});
