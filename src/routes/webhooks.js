import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import {
  addTrackedSubscription,
  removeTrackedSubscription,
  getTrackedSubscription,
  updateTrackedSubscriptionDate,
  applySeasonalUpdate,
  applySeasonalUpdateWithQueue,
  isAllowedProduct,
} from '../services/subscription.js';
import { fetchSubscriptionIdFromCharge } from '../services/recharge.js';
import { HTTP_STATUS } from '../constants/index.js';

const router = Router();

router.post(
  '/subscription-created',
  asyncHandler(async (req, res) => {
    const subscription = req.body.subscription;

    console.log('📦 Subscription Created Webhook Received:', subscription?.id);

    if (!subscription?.external_variant_id?.ecommerce) {
      console.warn('No subscription data or product ID found.');
      return res.sendStatus(HTTP_STATUS.BAD_REQUEST);
    }

    const productId = subscription.external_variant_id.ecommerce.toString();
    const subscriptionId = subscription.id?.toString();
    const customerId = subscription.customer_id?.toString();

    if (!isAllowedProduct(productId)) {
      console.log('No matching product ID. Ignoring Subscription.');
      return res.sendStatus(HTTP_STATUS.UNAUTHORIZED);
    }

    await addTrackedSubscription(subscriptionId, customerId);
    await applySeasonalUpdateWithQueue(subscriptionId, productId);

    res.sendStatus(HTTP_STATUS.OK);
  })
);

router.post(
  '/charge-created',
  asyncHandler(async (req, res) => {
    const chargeData = req.body.charge;

    console.log('📦 Charge Created Webhook Received');

    const subscriptionId =
      chargeData?.line_items?.[0]?.subscription_id ??
      (await fetchSubscriptionIdFromCharge(chargeData?.id));

    if (!subscriptionId) {
      console.warn('❗ No subscription ID found in charge-created webhook.');
      return res.sendStatus(HTTP_STATUS.BAD_REQUEST);
    }

    const tracked = await getTrackedSubscription(subscriptionId);

    if (!tracked.exists) {
      console.log('⚠️ Subscription not tracked. Ignoring.');
      return res.sendStatus(HTTP_STATUS.OK);
    }

    if (!tracked.isOlderThan2Hrs) {
      console.log('⚠️ New Subscription not eligible for changes. Ignoring.');
      return res.sendStatus(HTTP_STATUS.OK);
    }

    if (chargeData.status !== 'QUEUED') {
      return res.sendStatus(HTTP_STATUS.MOVED_PERMANENTLY);
    }

    console.log('Subscription Queued. Processing...');

    const { applied, reason } = await applySeasonalUpdateWithQueue(subscriptionId);

    if (!applied && reason === 'last_order') {
      console.log('🎉 Final order fulfilled. Subscription ended.');
      return res.sendStatus(HTTP_STATUS.OK);
    }

    await updateTrackedSubscriptionDate(subscriptionId);
    console.log('✅ All Subscription changes updated.');

    res.sendStatus(HTTP_STATUS.OK);
  })
);

router.post(
  '/subscription-cancelled',
  asyncHandler(async (req, res) => {
    const { subscription } = req.body;

    if (!subscription?.id) {
      console.warn('❗ No subscription data in cancelled webhook.');
      return res.sendStatus(HTTP_STATUS.BAD_REQUEST);
    }

    await removeTrackedSubscription(subscription.id);
    console.log('🔕 Subscription Cancelled:', subscription.id);

    res.sendStatus(HTTP_STATUS.OK);
  })
);

export default router;
