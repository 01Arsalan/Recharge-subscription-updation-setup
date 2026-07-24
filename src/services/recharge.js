import axios from 'axios';
import { config } from '../config/index.js';
import { RECHARGE_API_VERSION } from '../constants/index.js';

function buildHeaders(extra = {}) {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Recharge-Version': RECHARGE_API_VERSION,
    'X-Recharge-Access-Token': config.recharge.apiToken,
    ...extra,
  };
}

export async function updateSubscriptionDate(subscriptionId, newDate) {
  const { data } = await axios.put(
    `${config.recharge.baseUrl}/subscriptions/${subscriptionId}`,
    { next_charge_scheduled_at: newDate },
    { headers: buildHeaders() }
  );
  return data;
}

export async function swapSubscriptionProduct(subscriptionId, newProduct) {
  const { data } = await axios.put(
    `${config.recharge.baseUrl}/subscriptions/${subscriptionId}`,
    {
      shopify_variant_id: newProduct.variantId,
      product_title: newProduct.productTitle,
      external_variant_id: { ecommerce: newProduct.variantId },
    },
    { headers: buildHeaders() }
  );
  return data;
}

export async function fetchCharge(chargeId) {
  const { data } = await axios.get(
    `${config.recharge.baseUrl}/charges/${chargeId}`,
    { headers: buildHeaders() }
  );
  return data;
}

export async function fetchSubscriptionIdFromCharge(chargeId) {
  try {
    const response = await fetchCharge(chargeId);
    return response?.charge?.line_items?.[0]?.purchase_item_id ?? null;
  } catch (error) {
    console.error('❌ Failed to fetch subscription_id from charge:', error.response?.data || error.message);
    return null;
  }
}

export async function listWebhooks() {
  const { data } = await axios.get(
    `${config.recharge.baseUrl}/webhooks`,
    { headers: buildHeaders() }
  );
  return data.webhooks || [];
}

export async function deleteWebhook(webhookId) {
  await axios.delete(
    `${config.recharge.baseUrl}/webhooks/${webhookId}`,
    { headers: buildHeaders() }
  );
}

export async function createWebhook(address, topic) {
  const { data } = await axios.post(
    `${config.recharge.baseUrl}/webhooks`,
    { address, topic },
    { headers: buildHeaders() }
  );
  return data.webhook;
}
