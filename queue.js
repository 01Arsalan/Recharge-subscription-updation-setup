import { Queue } from 'bullmq';
import { connection } from './config/redis-connection.js';

const updateQueue = new Queue('subscription-update', {
  connection
});

export async function queueSubscriptionUpdate(data) {
  await updateQueue.add('update', data, {
    jobId: data.subscription_id.toString(), // check this, it might cause some relevent request to not register as a job upon failure if a job with same id has failed and already in queue.
    attempts: 5, 
    removeOnComplete: true,
    removeOnFail: false,        
    backoff: {
      type: 'exponential',
      delay: 10000 
    }
  });
}
