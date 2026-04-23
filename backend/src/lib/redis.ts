import Redis from 'ioredis';

let redis: Redis;

export async function connectRedis(): Promise<void> {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not defined');
  redis = new Redis(url);
  console.log('[Redis] Connected');
}

export function getRedis(): Redis {
  if (!redis) throw new Error('Redis not initialized');
  return redis;
}
