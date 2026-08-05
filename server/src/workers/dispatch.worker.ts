import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';
import { findBestPartner } from '../services/dispatch.service';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const redisUrl = process.env.REDIS_URL;
const connection = new IORedis(redisUrl || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const dispatchWorker = new Worker(
  'dispatchQueue',
  async (job) => {
    if (job.name === 'assignPartner') {
      const { bookingId } = job.data;
      console.log(`[Dispatch Worker] Attempting to auto-assign booking ${bookingId}`);
      try {
        const assigned = await findBestPartner(bookingId);
        if (assigned) {
          console.log(`[Dispatch Worker] Successfully assigned booking ${bookingId} to Partner ${assigned.partnerId}`);
        } else {
          console.log(`[Dispatch Worker] No available partner found for booking ${bookingId}`);
        }
      } catch (error) {
        console.error(`[Dispatch Worker] Error assigning partner for ${bookingId}:`, error);
        throw error;
      }
    }
  },
  { connection }
);

dispatchWorker.on('completed', (job) => {
  console.log(`[Dispatch Worker] Job ${job.id} completed!`);
});

dispatchWorker.on('failed', (job, err) => {
  console.error(`[Dispatch Worker] Job ${job?.id} failed with error ${err.message}`);
});
