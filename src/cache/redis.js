const redis = require('redis');
const { redisUrl } = require('../config');

const client = redis.createClient({
  url: redisUrl,
});

client.on('error', (err) => {
  console.error('Redis Error:', err);
});

client.on('connect', () => {
  console.log('Redis connecting...');
});

client.on('ready', () => {
  console.log('Redis connected and ready');
});

async function clearCacheByPattern(pattern) {
  try {
    const keys = await client.keys(pattern);
    if (keys.length) {
      await client.del(...keys);
    }
  } catch (err) {
    console.error(`Failed to clear cache for pattern ${pattern}:`, err);
  }
}

client.invalidateSearchCache = async () => {
  await clearCacheByPattern('users:search:*');
};

client.invalidateListCache = async () => {
  await clearCacheByPattern('users:all:*');
};

module.exports = client;
