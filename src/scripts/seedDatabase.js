import mongoose from 'mongoose';
import { connectMongo } from '../config/mongo.js';
import { TrackedSubscription } from '../models/TrackedSubscription.js';
import { FailedJob } from '../models/FailedJob.js';

async function seedDatabase() {
  await connectMongo();

  try {
    await TrackedSubscription.insertMany([
      {
        subscription_id: 'sub_123',
        customer_id: 'cus_abc',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        subscription_id: 'sub_456',
        customer_id: 'cus_xyz',
      },
    ]);

    await FailedJob.insertMany([
      {
        jobId: 'job_001',
        subscription_id: 'sub_123',
        new_date: '2025-04-24',
        new_product: { variantId: 'var_001', productTitle: 'New Super Shake' },
        error: 'Subscription not found',
        stack: 'Error: Subscription not found\n    at updateSub.js:12:15',
      },
      {
        jobId: 'job_002',
        subscription_id: 'sub_456',
        new_date: '2025-04-25',
        new_product: { variantId: 'var_002', productTitle: 'Protein Bar Deluxe' },
        error: 'Network request failed',
        stack: 'Error: Network request failed\n    at retry.js:22:8',
      },
    ]);

    console.log('✅ Sample documents inserted successfully');
  } catch (err) {
    console.error('❌ Error seeding test data:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seedDatabase();
