import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../constants/index.js';
import { createRedisConnection } from '../config/redis.js';

const connection = createRedisConnection();

const myQueue = new Queue(QUEUE_NAMES.SUBSCRIPTION_UPDATE, { connection });

await myQueue.waitUntilReady();
await myQueue.drain();
await myQueue.clean(0, 0, 'completed');
await myQueue.clean(0, 0, 'failed');

console.log('All jobs cleared.');
await connection.quit();
