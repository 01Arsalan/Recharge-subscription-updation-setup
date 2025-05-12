STEPS:

1. create a api token in recharge dashboard, giving rqiuired permissions.

2. Registering a web-hook, using this curl command. Later to be done on first run of server.




//create, delete, find hooks


# 1. subscription created
curl -i \
  -H 'X-Recharge-Version: 2021-11' \
  -H 'X-Recharge-Access-Token: sk_2x2_ad34e22178af85a24879a41cd7c4b53d5068d0c091f48912a3f310e81cd1f22a' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -X POST 'https://api.rechargeapps.com/webhooks' \
  --data '{
    "address": "https://numi-subscription-custom.onrender.com/webhook/subscription-created",
    "topic": "subscription/created",
    "version": "2021-11"  # This won't change the webhook version, it'll be ignored
  }'


# 2. charge created — corrected topic
curl -i \
  -H 'X-Recharge-Version: 2021-11' \
  -H 'X-Recharge-Access-Token: sk_2x2_ad34e22178af85a24879a41cd7c4b53d5068d0c091f48912a3f310e81cd1f22a' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -X POST 'https://api.rechargeapps.com/webhooks' \
  --data '{
    "address": "https://numi-subscription-custom.onrender.com/webhook/charge-created",
    "topic": "charge/created",
    "version": "2021-11"
  }'


# 3. subscription cancelled — corrected topic
curl -i \
  -H 'X-Recharge-Version: 2021-11' \
  -H 'X-Recharge-Access-Token: sk_2x2_ad34e22178af85a24879a41cd7c4b53d5068d0c091f48912a3f310e81cd1f22a' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -X POST 'https://api.rechargeapps.com/webhooks' \
  --data '{
    "address": "https://numi-subscription-custom.onrender.com/webhook/subscription-cancelled",
    "topic": "subscription/cancelled",
    "version": "2021-11"
  }'



{
  "webhook":{
    "id":3892589,
    "address":"https://numi-subscription-custom.onrender.com/webhook/subscription-created",
    "included_objects":[],
    "topic":"subscription/created",
    "version":"2021-01"
  }
}

{
  "webhook":{
    "id":3892590,
    "address":"https://numi-subscription-custom.onrender.com/webhook/charge-created",
    "included_objects":[],
    "topic":"charge/created",
    "version":"2021-01"
  }
}

{
  "webhook":{
    "id":3892591,
    "address":"https://numi-subscription-custom.onrender.com/webhook/subscription-cancelled",
    "included_objects":[],
    "topic":"subscription/cancelled",
    "version":"2021-01"
  }
}


curl -i \
  -H 'X-Recharge-Version: 2021-01' \
  -H 'X-Recharge-Access-Token: sk_2x2_ad34e22178af85a24879a41cd7c4b53d5068d0c091f48912a3f310e81cd1f22a' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -X DELETE 'https://api.rechargeapps.com/webhooks/3892643'



curl -X GET "https://api.rechargeapps.com/webhooks" \
  -H "X-Recharge-Access-Token: sk_2x2_ad34e22178af85a24879a41cd7c4b53d5068d0c091f48912a3f310e81cd1f22a" \
  -H "Accept: application/json"














Flow:


Case 1:

Subscription Created (Recharge)
        |
       ↓
Webhook Triggered → subscription/created
        |
       ↓
Check if subscription is a Gift Product (by product_id)
        |		└── Add subscription data to DB
       ↓
✅ If YES:
    |
    └──  Find the next fulfilment date and next product in line for 1st recuring order
       	 |             └──  ❌ If Data not found: Do nothing.
 |	
 	 └──✅ If Data is found:
               	└── Then Update “next_charge_scheduled_at” to change next order date.  
      		└── Then swap/update Product to next-season's product

🛑 If NOT a Gift Product → ❌ Exit / Do Nothing





Case 2:

Charge Created (Recharge next recurring order)
        |
       ↓
Webhook Triggered → charge/created
        |
       ↓
Check if subscription is being tracked (exists in DB, ignores other subscriptions)
        |		        |			       ↓
✅ If YES:
        |
        └──  Find the next fulfilment date and next product in line for 1st recuring order
       	 |             └──  ❌ If Data not found: Do nothing.
 |	
 	 └──✅ If Data is found:
               	└── Then Update “next_charge_scheduled_at” to change next order date.  
      		└── Then swap/update Product to next-season's product



📦 Subscription Cancelled (Recharge Cancellation webhook)
     ↓
📌 Map fulfillment to Recharge subscription ID
     ↓
🔎 Check DB: is this subscription’s id present?
    |
    ├── ✅ If YES:
    |       └──  remove the id.
    |
    └── ❌ If NO:
           └── return
     







//Testing subscription end-points

curl -X POST https://numi-subscription-custom.onrender.com/webhook/subscription-created \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "id": "625854857",
      "customer_id": "cus_987654321",
      "shopify_product_id": "50458477166903",
      "product_title": "Spring Subscription Box"
    }
  }'


  curl -X POST https://numi-subscription-custom.onrender.com/webhook/subscription-updated \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "id": "625854857",
      "customer_id": "cus_987654321",
      "shopify_product_id": "50458477166903",
      "product_title": "Spring Subscription Box"
    }
  }'


  curl -X POST https://numi-subscription-custom.onrender.com/webhook/subscription-cancelled \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "id": "625854857",
      "customer_id": "cus_987654321",
      "shopify_product_id": "50458477166903",
      "product_title": "Spring Subscription Box"
    }
  }'


  //Testing Worker:

  curl -X POST https://numi-subscription-custom.onrender.com/webhook/subscription-updated \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "id": "625854857000",
      "customer_id": "cus_987654321",
      "shopify_product_id": "50458477166903",
      "product_title": "Spring Subscription Box"
    }
  }'



