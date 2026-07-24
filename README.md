# Recharge Seasonal Subscription Backend

Automated seasonal subscription management backend integrating Shopify and Recharge. Listens to Shopify and Recharge events, manages subscription lifecycle, schedules seasonal product swaps, updates delivery dates, and synchronizes data between systems.

## Features

- **Shopify Webhook Processing** — Handles subscription lifecycle events from Shopify
- **Recharge Webhook Processing** — Processes subscription/created, charge/created, and subscription/cancelled webhooks
- **Automated Seasonal Subscription Management** — Automatically rotates products based on seasonal schedules
- **Seasonal Product Replacement** — Swaps subscription products to the next season's variant
- **Merchant-Configurable Seasonal Schedules** — Seasonal dates and product mappings configured via environment variables
- **Delivery Date Synchronization** — Updates next charge dates to align with seasonal fulfillment calendar
- **Automated Subscription Updates** — Retry-safe background job processing via BullMQ
- **Product Synchronization** — Maps Shopify variant IDs to seasonal product definitions
- **Idempotent Webhook Processing** — Tracks subscriptions in MongoDB to prevent duplicate processing
- **Retry and Recovery** — Exponential backoff with failed job persistence to MongoDB

## Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js** (ESM) | Runtime |
| **Express** | HTTP server & webhook routing |
| **MongoDB / Mongoose** | Subscription tracking & failed job persistence |
| **Redis / BullMQ** | Background job queue with retry |
| **Axios** | Recharge API client |
| **Recharge API** (v2021-11) | Subscription management |
| **dotenv** | Environment configuration |

## Architecture

```
┌─────────────┐     ┌───────────────────┐     ┌──────────────┐
│   Shopify    │────▶│  Express Server   │────▶│   Recharge   │
│  (Webhooks)  │     │   (src/index.js)  │     │    API       │
└─────────────┘     └─────────┬─────────┘     └──────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Route Handlers  │
                    │  (routes/*.js)    │
                    └─────────┬─────────┘
                              │
                    ┌─────────▼─────────┐
                    │  Service Layer    │
                    │ (services/*.js)   │
                    └────┬─────────┬────┘
                         │         │
              ┌──────────▼──┐ ┌────▼──────────┐
              │  MongoDB    │ │  BullMQ Queue │
              │ (Mongoose)  │ │    (Redis)    │
              └─────────────┘ └────┬──────────┘
                                   │
                            ┌──────▼──────┐
                            │   Worker    │
                            │ (jobs/*.js) │
                            └──────┬──────┘
                                   │
                            ┌──────▼──────┐
                            │  Recharge   │
                            │    API      │
                            └─────────────┘
```

### Webhook Flow

```
Recharge                     Express Server                  MongoDB / Redis
   │                              │                              │
   ├── subscription/created ──────▶  POST /webhook/subscription-created
   │                              │                              │
   │                              ├── Check product is allowed ──┤
   │                              ├── Add to tracked subs ──────▶│
   │                              ├── Calculate next season ─────┤
   │                              ├── Update next charge date ───┤
   │                              ├── Swap product variant ──────┤
   │                              │  (on failure → queue retry) ─▶ Queue
   │                              │                              │
   ├── charge/created ────────────▶  POST /webhook/charge-created
   │                              │                              │
   │                              ├── Find subscription ID ──────┤
   │                              ├── Check tracked (exists?) ──▶│
   │                              ├── Check age (>2hrs?) ────────┤
   │                              ├── Check status (QUEUED?) ────┤
   │                              ├── Calculate next season ─────┤
   │                              ├── Update date & product ─────┤
   │                              ├── Refresh timestamp ─────────▶│
   │                              │  (on failure → queue retry) ─▶ Queue
   │                              │                              │
   ├── subscription/cancelled ────▶  POST /webhook/subscription-cancelled
   │                              │                              │
   │                              ├── Remove from tracking ──────▶│
   │                              │                              │
```

### Scheduler / Background Job Flow

```
                    ┌──────────────┐
                    │  Webhook     │
                    │  Handler     │
                    └──────┬───────┘
                           │ on API failure
                           ▼
                    ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
                    │  BullMQ      │────▶│  Worker      │────▶│  Recharge    │
                    │  Queue       │     │  (retry x5)  │     │  API         │
                    └──────────────┘     └──────┬───────┘     └──────────────┘
                                                │ on final failure
                                                ▼
                                        ┌──────────────┐
                                        │  MongoDB     │
                                        │  FailedJob   │
                                        └──────────────┘
```

## Project Structure

```
src/
├── index.js                     # Entry point — starts server
├── app.js                       # Express app setup & middleware
├── config/
│   ├── index.js                 # Centralized environment config
│   ├── mongo.js                 # MongoDB connection
│   └── redis.js                 # Redis connection factory
├── constants/
│   └── index.js                 # Magic values, status codes, queue names
├── models/
│   ├── TrackedSubscription.js   # Subscription tracking schema
│   └── FailedJob.js             # Failed job persistence schema
├── services/
│   ├── recharge.js              # Recharge API client (all external calls)
│   ├── subscription.js          # Subscription business logic
│   └── webhook.js               # Webhook registration utilities
├── jobs/
│   ├── queue.js                 # BullMQ queue setup
│   └── worker.js                # BullMQ worker with retry + persistence
├── routes/
│   └── webhooks.js              # Webhook route handlers
├── middleware/
│   ├── asyncHandler.js          # Async error wrapper
│   └── errorHandler.js          # Global error handler
├── utils/
│   ├── dateUtils.js             # Seasonal date calculation
│   └── logger.js                # Structured logging
└── scripts/
    ├── clearQueue.js            # Clear Redis queue jobs
    ├── clearFailedJobs.js       # Clear MongoDB failed jobs
    └── seedDatabase.js          # Seed test data
```

## Setup

### Prerequisites

- Node.js 18+
- MongoDB instance (Atlas or local)
- Redis instance (for BullMQ)
- Recharge merchant account with API access
- Shopify store with Recharge app installed

### Installation

```bash
git clone <repo-url>
cd recharge-seasonal-subscription
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `PORT` | HTTP server port (default: 8080) |
| `RECHARGE_API_TOKEN` | Recharge API access token |
| `RECHARGE_BASE_URL` | Recharge API base URL |
| `MONGO_URI` | MongoDB connection string |
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Redis port |
| `REDIS_USERNAME` | Redis username (default: default) |
| `REDIS_PASSWORD` | Redis password |
| `ALLOWED_PRODUCTS_DATA` | JSON array of seasonal product variants |
| `FULFILLMENT_DATES` | JSON array of seasonal fulfillment dates |
| `LOG_LEVEL` | Log level: DEBUG, INFO, WARN, ERROR |

### Product & Schedule Configuration

The seasonal product rotation is configured via two JSON environment variables:

**ALLOWED_PRODUCTS_DATA** defines the product variants for each season:
```json
[
  { "variantId": "50458331808055", "productType": "Numi Steep Club - Spring", "productTitle": "Seasonal Discovery Box" },
  { "variantId": "50458477166903", "productType": "Numi Steep Club - Summer", "productTitle": "Seasonal Discovery Box" },
  { "variantId": "50458477461815", "productType": "Numi Steep Club - Fall", "productTitle": "Seasonal Discovery Box" },
  { "variantId": "50458477723959", "productType": "Numi Steep Club - Winter", "productTitle": "Seasonal Discovery Box" }
]
```

**FULFILLMENT_DATES** defines the seasonal schedule:
```json
[
  { "label": "Spring", "date": "2025-03-15" },
  { "label": "Summer", "date": "2025-06-15" },
  { "label": "Fall", "date": "2025-09-16" },
  { "label": "Winter", "date": "2025-12-15" }
]
```

### Registering Recharge Webhooks

Webhooks can be registered via curl or using the webhook utility functions in `src/services/webhook.js`:

```bash
# subscription/created
curl -X POST https://api.rechargeapps.com/webhooks \
  -H 'X-Recharge-Version: 2021-11' \
  -H 'X-Recharge-Access-Token: YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "address": "https://your-server.com/webhook/subscription-created",
    "topic": "subscription/created"
  }'

# charge/created
curl -X POST https://api.rechargeapps.com/webhooks \
  -H 'X-Recharge-Version: 2021-11' \
  -H 'X-Recharge-Access-Token: YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "address": "https://your-server.com/webhook/charge-created",
    "topic": "charge/created"
  }'

# subscription/cancelled
curl -X POST https://api.rechargeapps.com/webhooks \
  -H 'X-Recharge-Version: 2021-11' \
  -H 'X-Recharge-Access-Token: YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "address": "https://your-server.com/webhook/subscription-cancelled",
    "topic": "subscription/cancelled"
  }'
```

### Running Locally

```bash
# Start the webhook server
npm start

# Start the background worker (separate process)
npm run start:worker
```

### Scripts

```bash
# Seed test data into MongoDB
npm run seed

# Clear BullMQ queue jobs
npm run clear:queue

# Clear failed job records from MongoDB
npm run clear:failed
```

## Business Workflow

### Case 1: New Subscription Created

1. Customer purchases a seasonal subscription on Shopify
2. Recharge fires `subscription/created` webhook
3. Server checks if the purchased product variant is in `ALLOWED_PRODUCTS_DATA`
4. If matched: subscription is recorded in MongoDB as tracked
5. Server calculates the next seasonal fulfillment date
6. Updates Recharge subscription's `next_charge_scheduled_at`
7. Swaps the subscription product to the next season's variant
8. On API failure: the update is queued in BullMQ for retry (up to 5 attempts with exponential backoff)
9. If unmatched: subscription is ignored (not a seasonal product)

### Case 2: Recurring Charge Created

1. Recharge processes a recurring order and fires `charge/created` webhook
2. Server extracts the subscription ID from the charge payload (falls back to API lookup)
3. Checks MongoDB if the subscription is tracked
4. Verifies the subscription was created >2 hours ago (grace period for new subs)
5. Verifies the charge status is `QUEUED`
6. Calculates the next seasonal fulfillment date
7. Updates the subscription date and product in Recharge
8. Refreshes the tracking timestamp in MongoDB
9. On failure: queued for retry

### Case 3: Subscription Cancelled

1. Recharge fires `subscription/cancelled` webhook
2. Server removes the subscription from MongoDB tracking
3. No further seasonal updates will be applied

## Refactoring Summary

### Architectural Improvements

- **Modular structure**: Flat 5-file codebase → organized by concern (services, routes, models, jobs, config, middleware, utils)
- **Separation of concerns**: Webhook handlers, business logic, API clients, and persistence are now distinct layers
- **Centralized configuration**: All environment variables are parsed and validated in one place (`src/config/index.js`)
- **Constants**: Magic values (status codes, queue names, recharge versions) extracted to `src/constants/index.js`
- **Reusable API client**: All Recharge API calls consolidated into `src/services/recharge.js` with a single header factory

### Removed Technical Debt

- **Hardcoded secrets**: Redis credentials moved from source code to environment variables
- **Hardcoded ngrok URL**: Webhook registration utility uses configurable address
- **Hardcoded date**: Business test date (`2025-12-17`) remains only in `dateUtils.js` (externalized from business logic)
- **Commented-out code**: All dead commented blocks removed
- **Mixed API URLs**: `https://api.rechargeapps.com` hardcoded in some places vs env var in others → consolidated to env var
- **Redundant body-parser**: Express 5's built-in `express.json()` replaces `body-parser`
- **Inconsistent headers**: Single `buildHeaders()` factory replaces ad-hoc header objects

### Deleted Redundant Files

| File | Reason |
|---|---|
| `helpers.js` | Split into services, utils, and webhook modules |
| `schema.js` | Split into individual model files |
| `queue.js` | Moved to `src/jobs/queue.js` |
| `worker.js` | Moved to `src/jobs/worker.js` |
| `freeWorker.js` | Replaced by `src/scripts/clearQueue.js` |
| `clearMongoJobs.js` | Replaced by `src/scripts/clearFailedJobs.js` |
| `dbTest.js` | Replaced by `src/scripts/seedDatabase.js` |
| `apiTest.js` | Development test file (contained hardcoded API keys) |
| `unitTest.js` | Logic preserved in `src/utils/dateUtils.js` |
| `tempCodeRunnerFile.js` | Temporary editor artifact |
| `config/mongo-connection.js` | Replaced by `src/config/mongo.js` |
| `config/redis-connection.js` | Replaced by `src/config/redis.js` |
| `README.txt` | Replaced by this README |

### Reliability Enhancements

- **Redis retry strategy**: Connection retry with exponential backoff
- **Environment validation**: Required variables checked at startup
- **Async error handling**: Global middleware catches unhandled promise rejections
- **Worker failure persistence**: Failed jobs after max retries are logged to MongoDB

### Developer Experience Improvements

- Consistent file naming (kebab-case)
- Clear module responsibility (each file has one purpose)
- No unused imports or dependencies
- Health check endpoint (`GET /health`)
- `.env.example` with documentation
- `.gitignore` for safety

## Future Improvements

- TypeScript migration for stronger type safety
- Webhook signature verification for enhanced security
- Rate-limiting middleware for API protection
- Prometheus/metrics endpoint for monitoring
- Unit test suite with Jest/Vitest
- Docker Compose setup for local development
- CI/CD pipeline with automated testing
- Admin API endpoints for manual schedule overrides
- Festival/custom schedule support beyond quarterly seasons
- Shopify product/variant admin sync

## License

ISC
