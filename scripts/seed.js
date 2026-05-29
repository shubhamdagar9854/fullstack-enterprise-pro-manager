require('dotenv').config();
const db = require('../src/db/connection');

async function seed() {
  console.log('Seed data dal raha hun...');

  await db.query(`
    INSERT INTO users (name, email) VALUES
    ('Rahul Sharma', 'rahul@example.com'),
    ('Priya Singh', 'priya@example.com')
    ON CONFLICT DO NOTHING
  `);

  console.log('Seed data dal diya! ✅');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed fail:', err);
  process.exit(1);
});