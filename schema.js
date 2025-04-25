import mongoose from 'mongoose';

const trackedSubscriptionSchema = new mongoose.Schema({
  subscription_id: { type: String, required: true, unique: true },
  customer_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const failedJobSchema = new mongoose.Schema({
  jobId: String,
  subscription_id: String,
  new_date: String,
  new_product: {
    variantId: String,
    productTitle: String
  },
  error: String,
  stack: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});


export const TrackedSubscription = mongoose.model('TrackedSubscription', trackedSubscriptionSchema);
export const FailedJob = mongoose.model('FailedJob', failedJobSchema);
