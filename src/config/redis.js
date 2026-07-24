import IORedis from 'ioredis';

export function createRedisConnection() {
  const connection = new IORedis({
    host: process.env.REDIS_HOST || 'redis-16552.c239.us-east-1-2.ec2.redns.redis-cloud.com',
    port: parseInt(process.env.REDIS_PORT, 10) || 16552,
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  connection.on('connect', () => {
    console.log('✅ Connected to Redis');
  });

  connection.on('error', (err) => {
    console.error('❌ Redis connection error:', err.message);
  });

  return connection;
}
