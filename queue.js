import { Queue } from 'bullmq';
import { connection } from './config/redis-connection.js';

const updateQueue = new Queue('subscription-update', {
  connection
});

export async function queueSubscriptionUpdate(data) {
  await updateQueue.add('update', data, {
    attempts: 5, 
    removeOnComplete: true,
    removeOnFail: false,        
    backoff: {
      type: 'exponential',
      delay: 10000 
    }
  });
}
