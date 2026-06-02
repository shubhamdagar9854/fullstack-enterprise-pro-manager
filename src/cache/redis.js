const redis = require('redis');

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => {
  console.error('Redis Error:', err);
});

client.on('ready', () => {
  console.log('Redis connected and ready');
});

(async () => {
  try {
    await client.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();

module.exports = client;
