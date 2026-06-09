const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool(config.db);

pool.on('error', (err) => {
  console.error('Postgres idle client error:', err);
});

module.exports = pool;