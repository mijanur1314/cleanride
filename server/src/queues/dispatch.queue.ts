import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const redisUrl = process.env.REDIS_URL;
const connection = new IORedis(redisUrl || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const dispatchQueue = new Queue('dispatchQueue', { connection });
