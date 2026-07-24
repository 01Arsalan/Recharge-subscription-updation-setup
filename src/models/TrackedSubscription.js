import mongoose from 'mongoose';

const trackedSubscriptionSchema = new mongoose.Schema({
  subscription_id: { type: String, required: true, unique: true },
  customer_id: { type: String, required: true },
  created_at: { type: Date, default: Date.now },
});

export const TrackedSubscription = mongoose.model('TrackedSubscription', trackedSubscriptionSchema);
