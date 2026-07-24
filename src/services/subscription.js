import { TrackedSubscription } from '../models/TrackedSubscription.js';
import { getNextFulfillmentDate } from '../utils/dateUtils.js';
import { updateSubscriptionDate, swapSubscriptionProduct } from './recharge.js';
import { config } from '../config/index.js';
import { SUBSCRIPTION_AGE_THRESHOLD_HRS } from '../constants/index.js';
import { queueSubscriptionUpdate } from '../jobs/queue.js';

export async function addTrackedSubscription(subscriptionId, customerId) {
  return TrackedSubscription.updateOne(
    { subscription_id: subscriptionId },
    {
      $set: { customer_id: customerId },
      $setOnInsert: { created_at: new Date() },
    },
    { upsert: true }
  );
}

export async function removeTrackedSubscription(subscriptionId) {
  return TrackedSubscription.deleteOne({ subscription_id: subscriptionId });
}

export async function updateTrackedSubscriptionDate(subscriptionId) {
  return TrackedSubscription.updateOne(
    { subscription_id: subscriptionId },
    { $set: { created_at: new Date() } }
  );
}

export async function getTrackedSubscription(subscriptionId) {
  const subscription = await TrackedSubscription.findOne({
    subscription_id: subscriptionId,
  });

  if (!subscription) {
    return { exists: false, createdAt: null, isOlderThan2Hrs: false };
  }

  const createdAt = new Date(subscription.created_at);
  const ageInHrs = (Date.now() - createdAt) / (1000 * 60 * 60);
  const isOlderThan2Hrs = ageInHrs >= SUBSCRIPTION_AGE_THRESHOLD_HRS;

  return { exists: true, createdAt, isOlderThan2Hrs };
}

export async function applySeasonalUpdate(subscriptionId, productId) {
  const nextDate = getNextFulfillmentDate(
    config.fulfillmentDates,
    config.allowedProductsData,
    productId
  );

  if (nextDate.type === 'Reject') {
    console.log('Last order of season. Switched to default dates.');
    return { applied: false, reason: 'last_order' };
  }

  const newProduct = config.allowedProductsData[nextDate.index];

  await updateSubscriptionDate(subscriptionId, nextDate.date);
  await swapSubscriptionProduct(subscriptionId, newProduct);

  return { applied: true, nextDate, newProduct };
}

export async function applySeasonalUpdateWithQueue(subscriptionId, productId) {
  try {
    return await applySeasonalUpdate(subscriptionId, productId);
  } catch (error) {
    const nextDate = getNextFulfillmentDate(
      config.fulfillmentDates,
      config.allowedProductsData,
      productId
    );
    const newProduct = config.allowedProductsData[nextDate?.index];

    error.subscriptionId = subscriptionId;
    error.newDate = nextDate?.date;
    error.newProduct = newProduct;

    await queueSubscriptionUpdate({ subscription_id: subscriptionId, new_date: nextDate?.date, new_product: newProduct });
    throw error;
  }
}

export function isAllowedProduct(productId) {
  return config.allowedProductsData.some(
    (product) => product.variantId === productId
  );
}
