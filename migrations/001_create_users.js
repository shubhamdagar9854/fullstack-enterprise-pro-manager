require('dotenv').config();
const db = require('../src/db/connection');

async function migrate() {
  console.log('Migration shuru...');

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  console.log('Table ban gayi! ✅');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration fail ho gayi:', err);
  process.exit(1);
});