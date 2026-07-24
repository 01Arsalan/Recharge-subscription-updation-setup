import dotenv from 'dotenv';

dotenv.config();

function parseJsonArray(value, name) {
  try {
    const parsed = JSON.parse(value || '[]');
    if (!Array.isArray(parsed)) {
      console.warn(`⚠️ ${name} is not an array, using empty array.`);
      return [];
    }
    return parsed;
  } catch (err) {
    console.error(`❌ Failed to parse ${name} from env:`, err.message);
    return [];
  }
}

export const config = Object.freeze({
  port: parseInt(process.env.PORT, 10) || 8080,
  recharge: {
    apiToken: process.env.RECHARGE_API_TOKEN,
    baseUrl: process.env.RECHARGE_BASE_URL || 'https://api.rechargeapps.com',
  },
  mongo: {
    uri: process.env.MONGO_URI,
  },
  redis: {
    host: process.env.REDIS_HOST || 'redis-16552.c239.us-east-1-2.ec2.redns.redis-cloud.com',
    port: parseInt(process.env.REDIS_PORT, 10) || 16552,
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
  },
  allowedProductsData: parseJsonArray(process.env.ALLOWED_PRODUCTS_DATA, 'ALLOWED_PRODUCTS_DATA'),
  fulfillmentDates: parseJsonArray(process.env.FULFILLMENT_DATES, 'FULFILLMENT_DATES'),
});

export function validateConfig() {
  const missing = [];
  if (!config.recharge.apiToken) missing.push('RECHARGE_API_TOKEN');
  if (!config.mongo.uri) missing.push('MONGO_URI');
  if (!config.recharge.baseUrl) missing.push('RECHARGE_BASE_URL');

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (config.allowedProductsData.length === 0) {
    console.warn('⚠️ ALLOWED_PRODUCTS_DATA is empty or not properly set.');
  }
  if (config.fulfillmentDates.length === 0) {
    console.warn('⚠️ FULFILLMENT_DATES is empty or not properly set.');
  }
}
