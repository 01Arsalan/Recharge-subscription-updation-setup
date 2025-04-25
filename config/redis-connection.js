import IORedis from 'ioredis';

export const connection = new IORedis({
  host: 'redis-16552.c239.us-east-1-2.ec2.redns.redis-cloud.com',
  port: 16552,
  username: 'default',
  password: 'iSnpXDEWTxE4yApUSL29w41G7NZlYHcL',
  maxRetriesPerRequest: null,
});

// Connection events
connection.on('connect', () => {
  console.log('✅ Connected to Redis');
});

connection.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});
