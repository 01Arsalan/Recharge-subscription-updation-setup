import { Queue } from 'bullmq';
import { QUEUE_NAMES, JOB_OPTIONS } from '../constants/index.js';
import { createRedisConnection } from '../config/redis.js';

const connection = createRedisConnection();

const updateQueue = new Queue(QUEUE_NAMES.SUBSCRIPTION_UPDATE, { connection });

export async function queueSubscriptionUpdate(data) {
  await updateQueue.add('update', data, {
    attempts: JOB_OPTIONS.ATTEMPTS,
    removeOnComplete: true,
    removeOnFail: false,
    backoff: {
      type: 'exponential',
      delay: JOB_OPTIONS.BACKOFF_DELAY_MS,
    },
  });
}
