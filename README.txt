STEPS:

1. create a api token in recharge dashboard, giving rqiuired permissions.

2. Registering a web-hook, using this curl command. Later to be done on first run of server.
curl -X POST https://api.rechargeapps.com/webhooks \
  -H "Content-Type: application/json" \
  -H "X-Recharge-Version: 2021-11" \
  -H "X-Recharge-Access-Token: sk_2x2_ad34e22178af85a24879a41cd7c4b53d5068d0c091f48912a3f310e81cd1f22a" \
  -d "{\"address\": \"https://715a-2405-201-5503-e1c6-4462-72e7-eafb-e9dd.ngrok-free.app/webhook/charge-created\", \"topic\": \"charge/created\", \"api_version\": \"2021-11\"}"

  response: 
  {
    "webhook":{
      "id":3852630,
      "address":"https://2d6d-2405-201-5503-e1c6-8015-3c8b-af15-11f4.ngrok-free.app/webhook",
      "included_objects":[],
      "topic":"subscription/created",
      "version":"2021-01"
    }
  } 

  To delete a previous hook:
  curl -X DELETE 'https://api.rechargeapps.com/webhooks/id3852630' \ 
 -H 'X-Recharge-Access-Token: sk_2x2_ad34e22178af85a24879a41cd7c4b53d5068d0c091f48912a3f310e81cd1f22a'


 
  ----- used ngrok for testing on local network.  command: ngrok http http://localhost:8080   

3. write end-points to receive requests and data.

4. set up controllers. 

6. Helper functions.

7. DB related logic --- Connect DB

8. Local testing
      • start Local mongo-db : brew services start mongodb-community  
      • start mongo shell for CRUD Operation Validation : mongosh
      • start Local Node Server:        🚀 Server listening on port 8080
                                        ✅ MongoDB connected
      • Send Curl requests with dummy data : 
          - adding new subscription: 
curl -X POST http://localhost:8080/webhook/subscription-created \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "id": "sub_123456789",
      "customer_id": "cus_987654321",
      "shopify_product_id": "10125111427383",
      "product_title": "Spring Subscription Box"
    }
  }'


          - Subscription Cancellation:  
curl -X POST http://localhost:8080/webhook/subscription-cancelled \
  -H "Content-Type: application/json" \
  -d '{
    "subscription": {
      "id": "sub_123456789"
    }
  }'


          - Update subscription date and swap product:  Note: Comment-out Rechage Api calling logic.
curl -X POST https://c231-2405-201-5503-e1c6-f919-cae-1a98-721c.ngrok-free.app/webhook/order-fulfilled \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_id": "sub_123456789",
    "product_title": "Spring Subscription Box",
    "shopify_product_id": "10125111427383",
    "customer_id": "cus_987654321",
    "fulfillment_date": "2025-03-15"
  }'


      • Finish Local Testing :
          - close Node Server
          - close Curl Shell
          - close DB : brew services stop mongodb-community




      • Start Testing
          • start Local mongo-db : brew services start mongodb-community    
          • start Local Node Server:    🚀 Server listening on port 8080
                                        ✅ MongoDB connected
          
          • Start ngrok : ngrok http http://localhost:8080

          • register hooks : 
            curl -i -H 'X-Recharge-Version: 2021-11' \
            -H 'X-Recharge-Access-Token: https://82c5-2405-201-5503-e1c6-f919-cae-1a98-721c.ngrok-free.app' \
            -H 'Content-Type: application/json' \
            -H 'Accept: application/json' \
            -X POST 'https://api.rechargeapps.com/webhooks' \
            --data '{
              "address": "https://c231-2405-201-5503-e1c6-f919-cae-1a98-721c.ngrok-free.app/webhook/subscription-updated",
              "topic": "subscription/updated"
            }'
          
          • hit the end-point : Updates next_charge_scheduled_at and does product swap.





          WP: 
            • figuring out what hook to target for updates.
            • causing updating might cause loops -- using redis 15sec data-holder to prevernt that.
            • rate limit check

























           Flow:

Subscription Created (Recharge)
        |
        ↓
Webhook Triggered → POST /webhook
        |
        ↓
Check if subscription is a Gift Product (by product_id or tag etc.)
        |
        ↓
✅ If YES:
    |
    └──  save the subscription id and user email on DB
    |
    └── Check if the product_id received is from next season.
        |
        └──✅ If YES: 🔍 Check if Subscription has Queued Charges
        |                ├── ✅ If YES:
        |                |        ├── Skip Queued Charge
        |                |        └── Then Update next_charge_scheduled_at to Next Fulfillment Date
        |                |        └── Then swap/update Product to next-season's product
        |                |
        |                └── ❌ If NO: 
        |                         └── Just Update next_charge_scheduled_at to Next Fulfillment Date
        |                         └── Then swap/update Product to next-season's product
        |                         
        └── ❌ If NO: Do Nothing                    

🛑 If NOT a Gift Product → ❌ Exit / Do Nothing





📦 Fulfillment completed (Recharge order/fulfillment webhook)
     ↓
📌 Map fulfillment to Recharge subscription ID
     ↓
🔎 Check DB: is this subscription’s is present?
    |
    ├── ✅ If YES:
    |       └──  🔍 Check if Subscription has Queued Charges
    |                 ├── ✅ If YES:
    |                 |        ├── Skip Queued Charge
    |                 |        └── Then Update next_charge_scheduled_at to Next Fulfillment Date
    |                 |        └── Then swap/update Product to next-season's product
    |                 |
    |                 └── ❌ If NO: 
    |                          └── Just Update next_charge_scheduled_at to Next Fulfillment Date
    |                          └── Then swap/update Product to next-season's product
    |
    └── ❌ If NO:
           └── return
     



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
     


 Pending : 
  if all 4 fulfillments are done detach hooks
  and end all the subscriptions for saved id's?




