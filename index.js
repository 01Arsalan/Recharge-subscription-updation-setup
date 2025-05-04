import express from 'express';
import bodyParser from 'body-parser';
import { getNextFulfillmentDate, updateNextChargeDate, swapProductInSubscription, addSubscription, removeSubscription, updateSubscriptionCreatedAt, checkTrackedSubscription } from './helpers.js';
import { connectMongo } from './config/mongo-connection.js';
import { queueSubscriptionUpdate } from './queue.js';

connectMongo();

let allowedProductsData = [];
let fulfillmentDates = [];

try {
  allowedProductsData = JSON.parse(process.env.ALLOWED_PRODUCTS_DATA || '[]');
  fulfillmentDates = JSON.parse(process.env.FULFILLMENT_DATES || '[]');
} catch (err) {
  console.error("❌ Failed to parse allowedProductsData or fulfillmentDates from .env", err);
}

if (!Array.isArray(allowedProductsData) || allowedProductsData.length === 0) {
  console.warn("⚠️ ALLOWED_PRODUCTS_DATA is empty or not properly set.");
}
if (!Array.isArray(fulfillmentDates) || fulfillmentDates.length === 0) {
  console.warn("⚠️ FULFILLMENT_DATES is empty or not properly set.");
}


const app = express();
app.use(bodyParser.json());

app.post("/webhook/subscription-created", express.json(), async (req, res) => {
  try {
    const subscription = req.body.subscription;

    console.log("📦 Subscription Created Webhook Received:", subscription);

    if (!subscription || !subscription.external_variant_id.ecommerce) {
      console.warn("No subscription data or product ID found.");
      return res.sendStatus(400);
    }

    const productId = subscription.external_variant_id.ecommerce.toString();
    const subscriptionId = subscription.id?.toString();
    const customerId = subscription.customer_id?.toString();

    let wrongProduct = true;

    allowedProductsData.forEach(product=>{
      if(product.variantId == productId){
        // save subscription id,customer_id on DB
        addSubscription(subscriptionId,customerId)
        wrongProduct = false
      }
    })
    if(wrongProduct) {
      console.log("No matching product ID. Ignoring Subscription.");
      res.sendStatus(401);
    }else{
      const nextDate = await getNextFulfillmentDate(fulfillmentDates);
      console.log("Next Date:",nextDate);

      if (nextDate.label == "No date found") {
        console.log("Last order of Season.");
        return res.sendStatus(200);
      }

      await updateNextChargeDate(subscriptionId, nextDate.date , allowedProductsData[nextDate.index] );
      await swapProductInSubscription(subscriptionId, nextDate.date , allowedProductsData[nextDate.index] )
      
      res.sendStatus(200);
    }

  } catch (error) {
    console.error("Error processing webhook:", error);
    res.sendStatus(500);
  }
});



app.post("/webhook/charge-created-", express.json(), async (req, res) => {
  try {
    const chargeData = req.body.charge;

    console.log("📦 Charge Created Webhook Received:", chargeData);
    // Webhook version 2021-01
    // const subscriptionId = chargeData.line_items[0].subscription_id;
    // Webhook version 2021-11
    const subscriptionId = chargeData.line_items[0].purchase_item_id;

    if (!subscriptionId) {
      console.warn("❗ No subscription ID found in charge-created webhook.");
      return res.sendStatus(400);
    }

    const trackedSubscription = await checkTrackedSubscription(subscriptionId) // checks if the id exists in the DB

    if (!trackedSubscription.exists) {
      console.log("⚠️ Subscription not tracked. Ignoring.");
      return res.sendStatus(200);
    }else if(!trackedSubscription.isOlderThan2Hrs){
      console.log("⚠️ New Subscription not elegible for changes. Ignoring.");
      return res.sendStatus(200);
    }else if (chargeData.status == "queued") {
      console.log("Subscription Queued. Processing.... ");
      const nextDate = getNextFulfillmentDate(fulfillmentDates);

      if (nextDate.label == "No date found") {
        console.log("🎉 Final order fulfilled. Subscription ended.");
        return res.sendStatus(200);
      }


      await updateNextChargeDate(subscriptionId, nextDate.date , allowedProductsData[nextDate.index] );
      await swapProductInSubscription(subscriptionId, nextDate.date , allowedProductsData[nextDate.index] )
      
  
      console.log("Next date Updated :", nextDate.date)
      console.log("Product swapped with :", allowedProductsData[nextDate.index] )
  
      console.log("✅ Fulfillment processed and subscription updated. Updating DB");

      await updateSubscriptionCreatedAt(subscriptionId);

      console.log("✅ All Subscription changes updated.");
      
      res.sendStatus(200);
    }else{
      res.sendStatus(301);
    }
  } catch (error) {
      let subscription_id = error.subscriptionId;
      let new_date = error.newDate;
      let new_product = error.newProduct;
      await queueSubscriptionUpdate({ subscription_id, new_date, new_product });

      console.error("❌ Error handling fulfillment webhook:", error);
      res.sendStatus(500);
  }
});



app.post("/webhook/subscription-cancelled", express.json(), async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.id) {
      console.warn("❗ No subscription data in cancelled webhook.");
      return res.sendStatus(400);
    }

    //Remove this subscription from DB.
    removeSubscription(subscription.id)
    console.log("🔕 Subscription Cancelled:", subscription.id);
    res.sendStatus(200);
  } catch (error) {
    console.error("❌ Error handling subscription cancelled webhook:", error);
    res.sendStatus(500);
  }
});




const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});






