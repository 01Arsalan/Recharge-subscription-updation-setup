import mongoose from 'mongoose';
import dotenv from 'dotenv';
import {  TrackedSubscription, FailedJob} from './schema.js'; // adjust path if needed
import { connectMongo } from './config/mongo-connection.js'; // your DB connection setup

dotenv.config();

const seedDatabase = async () => {
  await connectMongo();

  try {
    // Clear old test data
    // await TrackedSubscription.deleteMany({});
    // await FailedJob.deleteMany({});

    // Add TrackedSubscription entries
    await TrackedSubscription.insertMany([
      {
        subscription_id: 'sub_123',
        customer_id: 'cus_abc',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days old
      },
      {
        subscription_id: 'sub_456',
        customer_id: 'cus_xyz'
      }
    ]);

    // Add FailedJob entries
    await FailedJob.insertMany([
      {
        jobId: 'job_001',
        subscription_id: 'sub_123',
        new_date: '2025-04-24',
        new_product: {
          variantId: 'var_001',
          productTitle: 'New Super Shake'
        },
        error: 'Subscription not found',
        stack: 'Error: Subscription not found\n    at updateSub.js:12:15'
      },
      {
        jobId: 'job_002',
        subscription_id: 'sub_456',
        new_date: '2025-04-25',
        new_product: {
          variantId: 'var_002',
          productTitle: 'Protein Bar Deluxe'
        },
        error: 'Network request failed',
        stack: 'Error: Network request failed\n    at retry.js:22:8'
      }
    ]);

    console.log('✅ Sample documents inserted successfully');
  } catch (err) {
    console.error('❌ Error seeding test data:', err);
  } finally {
    await mongoose.disconnect();
  }
};

seedDatabase();
