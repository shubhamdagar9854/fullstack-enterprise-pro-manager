require('dotenv').config();

const requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'REDIS_URL'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  throw new Error(`Missing required environment variables: ${missingEnv.join(', ')}`);
}

const port = parseInt(process.env.PORT, 10) || 3000;
const dbPort = parseInt(process.env.DB_PORT, 10);

module.exports = {
  port,
  db: {
    host: process.env.DB_HOST,
    port: dbPort,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  redisUrl: process.env.REDIS_URL,
};
