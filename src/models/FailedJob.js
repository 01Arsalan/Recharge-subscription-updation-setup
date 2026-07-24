import mongoose from 'mongoose';

const failedJobSchema = new mongoose.Schema({
  jobId: String,
  subscription_id: String,
  new_date: String,
  new_product: {
    variantId: String,
    productTitle: String,
  },
  error: String,
  stack: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export const FailedJob = mongoose.model('FailedJob', failedJobSchema);
