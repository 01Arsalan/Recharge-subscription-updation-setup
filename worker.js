import { Worker } from 'bullmq';
import { connection } from './config/redis-connection.js';
import axios from 'axios';
import { FailedJob } from './schema.js'; 
import dotenv from 'dotenv';
import { connectMongo } from './config/mongo-connection.js';


connectMongo();
dotenv.config();

const RECHARGE_API_TOKEN = process.env.RECHARGE_API_TOKEN;
const RECHARGE_BASE_URL = process.env.RECHARGE_BASE_URL;

const worker = new Worker(
  'subscription-update',
  async (job) => {
    const { subscription_id, new_date, new_product } = job.data;

    console.log('🔧 Processing subscription update for', subscription_id);

    // Step 1: Skip existing charge (if any)
    const charges = await axios.get(
      `${RECHARGE_BASE_URL}/charges?subscription_id=${subscription_id}&status=queued`,
      { headers: headers() }
    );
    const charge = charges.data.charges?.[0];

    if (charge) {
      console.log('⏭ Skipping charge:', charge.id);
      await axios.post(
        `${RECHARGE_BASE_URL}/charges/${charge.id}/skip`,
        { purchase_item_id: charge.line_items[0].purchase_item_id },
        { headers: headers() }
      );
    }

    // Step 2: Update charge date
    console.log('📅 Updating next charge date...');
    await axios.put(
      `${RECHARGE_BASE_URL}/subscriptions/${subscription_id}`,
      { next_charge_scheduled_at: new_date },
      { headers: headers(true) }
    );

    // Step 3: Swap product
    console.log('🔄 Swapping product...');
    await axios.put(
      `${RECHARGE_BASE_URL}/subscriptions/${subscription_id}`,
      {
        shopify_variant_id: new_product.variantId,
        product_title: new_product.productTitle
      },
      { headers: headers(true) }
    );

    console.log('✅ Subscription update complete.');
  },
  { connection }
);

function headers(json = false) {
  return {
    ...(json && { 'Content-Type': 'application/json' }),
    'X-Recharge-Version': '2021-11',
    'X-Recharge-Access-Token': RECHARGE_API_TOKEN
  };
}

worker.on('failed', async (job, err) => {
    console.error(`❌ Job ${job.id} failed (Attempt ${job.attemptsMade} of ${job.opts.attempts}):`, err.message);
  
    if (job.attemptsMade >= job.opts.attempts) {
      try {
        await FailedJob.create({
          jobId: job.id,
          subscription_id: job.data.subscription_id,
          new_date: job.data.new_date,
          new_product: job.data.new_product,
          error: err.message,
          stack: err.stack
        });
  
        console.log('📄 Final failure logged to MongoDB');
      } catch (mongoErr) {
        console.error('⚠️ MongoDB logging failed:', mongoErr.message);
      }
    }
  });
