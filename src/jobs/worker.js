import { Worker } from 'bullmq';
import { FailedJob } from '../models/FailedJob.js';
import { connectMongo } from '../config/mongo.js';
import { createRedisConnection } from '../config/redis.js';
import { updateSubscriptionDate, swapSubscriptionProduct } from '../services/recharge.js';
import { QUEUE_NAMES } from '../constants/index.js';

connectMongo();

const connection = createRedisConnection();

const worker = new Worker(
  QUEUE_NAMES.SUBSCRIPTION_UPDATE,
  async (job) => {
    const { subscription_id, new_date, new_product } = job.data;

    console.log(`🔧 Processing subscription update for ${subscription_id}`);

    console.log('📅 Updating next charge date...');
    await updateSubscriptionDate(subscription_id, new_date);

    console.log('🔄 Swapping product...');
    await swapSubscriptionProduct(subscription_id, new_product);

    console.log('✅ Subscription update complete.');
  },
  { connection }
);

worker.on('failed', async (job, err) => {
  console.error(
    `❌ Job ${job.id} failed (Attempt ${job.attemptsMade} of ${job.opts.attempts}):`,
    err.message
  );

  if (job.attemptsMade >= job.opts.attempts) {
    try {
      await FailedJob.create({
        jobId: job.id,
        subscription_id: job.data.subscription_id,
        new_date: job.data.new_date,
        new_product: job.data.new_product,
        error: err.message,
        stack: err.stack,
      });
      console.log('📄 Final failure logged to MongoDB');
    } catch (mongoErr) {
      console.error('⚠️ MongoDB logging failed:', mongoErr.message);
    }
  }
});

console.log('👷 Worker started and listening for jobs.');
