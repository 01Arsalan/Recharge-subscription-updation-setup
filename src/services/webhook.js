import { listWebhooks, deleteWebhook, createWebhook } from './recharge.js';
import { WEBHOOK_TOPICS } from '../constants/index.js';

export async function deleteExistingWebhooks(topic = WEBHOOK_TOPICS.SUBSCRIPTION_CREATED) {
  try {
    const webhooks = await listWebhooks();
    const matching = webhooks.filter((w) => w.topic === topic);

    for (const webhook of matching) {
      await deleteWebhook(webhook.id);
      console.log(`🗑️ Deleted webhook ID ${webhook.id} (topic: ${webhook.topic})`);
    }

    if (matching.length === 0) {
      console.log(`ℹ️ No webhooks found for topic: ${topic}`);
    }
  } catch (err) {
    console.error('❌ Error deleting webhooks:', err.response?.data || err.message);
  }
}

export async function registerWebhook(address, topic) {
  try {
    const webhook = await createWebhook(address, topic);
    console.log(`✅ Webhook created: ${webhook.id} (topic: ${topic})`);
    return webhook;
  } catch (err) {
    console.error('❌ Error creating webhook:', err.response?.data || err.message);
  }
}
