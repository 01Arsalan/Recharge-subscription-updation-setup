import axios from'axios';
import { TrackedSubscription } from './schema.js';
import dotenv from 'dotenv';

dotenv.config();

const RECHARGE_API_TOKEN = process.env.RECHARGE_API_TOKEN;
const RECHARGE_BASE_URL = process.env.RECHARGE_BASE_URL;
const ngrokUrl = 'https://2d6d-2405-201-5503-e1c6-8015-3c8b-af15-11f4.ngrok-free.app/webhook'; // update when restarting ngrok

const headers = {
  'X-Recharge-Version': '2021-11',
  'X-Recharge-Access-Token': RECHARGE_API_TOKEN,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

export async function updateNextChargeDate(subscriptionId, newDate, newProduct) {
    try {
      // 1. 🔍 Get queued charges for the subscription
      const queuedCharges = await axios.get(
        `${RECHARGE_BASE_URL}/charges?subscription_id=${subscriptionId}&status=queued`,
        {
          headers: {
            "X-Recharge-Version": "2021-11",
            "X-Recharge-Access-Token": RECHARGE_API_TOKEN
          }
        }
      );
  
      const charge = queuedCharges.data.charges?.[0];
  
      if (charge) {
        console.log("🔍 Queued charge found:", charge.id);
  
        // 2. ⏭ Skip the charge
        await axios.post(
          `${RECHARGE_BASE_URL}/charges/${charge.id}/skip`,
          {
            purchase_item_id: charge.line_items[0].purchase_item_id
          },
          {
            headers: {
              "X-Recharge-Version": "2021-11",
              "X-Recharge-Access-Token": RECHARGE_API_TOKEN
            }
          }
        );        
  
        console.log("⏭ Skipped existing queued charge:", charge.id);
      } else {
        console.log("ℹ️ No queued charge found, skipping skip step.");
      }
  
      // 3. 🗓 Update next charge date
      const updateResponse = await axios.put(
        `${RECHARGE_BASE_URL}/subscriptions/${subscriptionId}`,
        {
          next_charge_scheduled_at: newDate // e.g. "2025-05-15"
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Recharge-Version": "2021-11",
            "X-Recharge-Access-Token": RECHARGE_API_TOKEN
          }
        }
      );
  
      console.log("✅ Shipment date updated:", updateResponse.data);
      return updateResponse.data;
  
    } catch (err) {
      err.subscriptionId = subscriptionId;
      err.newDate = newDate;
      err.newProduct = newProduct;
    
      console.error("❌ Failed to update shipment date:", err.response?.data || err.message);
      throw err;
    }
  }
  

  export async function swapProductInSubscription(subscriptionId, newDate, newProduct) {
    console.log("New Product Data:",newProduct)
    try {
      const res = await axios.put(
        `https://api.rechargeapps.com/subscriptions/${subscriptionId}`,
        {
          shopify_variant_id: newProduct.variantId, 
          product_title: newProduct.productTitle
        },
        {
          headers: {
            "Content-Type": "application/json",
            "X-Recharge-Version": "2021-11",
            "X-Recharge-Access-Token": RECHARGE_API_TOKEN
          }
        }
      );
      console.log("✅ Product swapped:", res.data);
      return res.data;
    } catch (err) {
      err.subscriptionId = subscriptionId;
      err.newDate = newDate;
      err.newProduct = newProduct;
    
      console.error("❌ Failed to swap product:", err.response?.data || err.message);
      throw err;
    }    
  }
  
  
  
  export async function getNextFulfillmentDate(fulfillmentDates) {
    const today = new Date();
    
    for (let i = 0; i < fulfillmentDates.length; i++) {
      let period = fulfillmentDates[i];
      let fulfillmentDate = new Date(period.date);
  
      if (fulfillmentDate > today) {
        period = fulfillmentDates[i+1];
        fulfillmentDate = new Date(period.date);
        return {
          index: i+1, 
          label: period.label,
          date: fulfillmentDate.toISOString().split("T")[0] 
        };
      }
    }
  
    
    return {
      index: -1, 
      label: "No date found",
      date: "No change"
    };
  }
  

export async function addSubscription(subscriptionId, customerId) {
 return await TrackedSubscription.updateOne(
    { subscription_id: subscriptionId },
    {
      $set: { customer_id: customerId },
      $setOnInsert: { created_at: new Date() }
    },
    { upsert: true }
  );
}

export async function updateSubscriptionCreatedAt(subscriptionId) {
  return await TrackedSubscription.updateOne(
    { subscription_id: subscriptionId },
    {
      $set: { created_at: new Date() }
    }
  );
}


export async function removeSubscription(subscriptionId) {
    return await TrackedSubscription.deleteOne({ subscription_id: subscriptionId });
}

export async function checkTrackedSubscription(subscriptionId) {
  try {
    // Find subscription by subscription_id
    const subscription = await TrackedSubscription.findOne({ subscription_id: subscriptionId });

    if (subscription) {
      const createdAt = new Date(subscription.created_at); // Ensure it's a Date object
      const now = new Date();
      const ageInMs = now - createdAt;
      const ageInHrs = ageInMs / (1000 * 60 * 60); // Convert ms to hrs
      const isOlderThan2Hrs = ageInHrs >= 2;


      console.log(`✅ Subscription with ID ${subscriptionId} exists. Created ${ageInHrs.toFixed(2)} hrs ago. || isOlderThan2Hrs: ${isOlderThan2Hrs}`);

      return {
        exists: true,
        createdAt,
        isOlderThan2Hrs
      };
    } else {
      console.log(`❌ No subscription found with ID ${subscriptionId}.`);
      return {
        exists: false,
        createdAt: null,
        isOlderThan2Hrs: false
      };
    }
  } catch (error) {
    console.error("❌ Error checking subscription existence:", error);
    throw error;
  }
}
  





async function deleteExistingWebhooks() {
  try {
    const { data } = await axios.get(`${RECHARGE_BASE_URL}/webhooks`, { headers });

    const subsCreatedWebhooks = data.webhooks.filter(
      (webhook) => webhook.topic === 'subscription/created'
    );

    for (const webhook of subsCreatedWebhooks) {
      await axios.delete(`${RECHARGE_BASE_URL}/webhooks/${webhook.id}`, { headers });
      console.log(`🗑️ Deleted webhook ID ${webhook.id}`);
    }

    if (subsCreatedWebhooks.length === 0) {
      console.log('ℹ️ No subscription/created webhooks to delete.');
    }
  } catch (err) {
    console.error('❌ Error deleting webhooks:', err.response?.data || err.message);
  }
}


async function createWebhook() {
  try {
    const { data } = await axios.post(
      `${RECHARGE_BASE_URL}/webhooks`,
      {
        address: ngrokUrl,
        topic: 'subscription/created'
      },
      { headers }
    );

    console.log('✅ Webhook created:', data.webhook);
  } catch (err) {
    console.error('❌ Error creating webhook:', err.response?.data || err.message);
  }
}


(async () => {
  // await deleteExistingWebhooks();
  // await createWebhook();
})();
