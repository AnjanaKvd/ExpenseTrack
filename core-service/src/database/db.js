const { Pool } = require('pg');

const config = require('../config/config');

const pool = new Pool({
  connectionString: config.dbUrl,
});

pool.on('connect', () => {
  console.log('🔗 Successfully connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
  console.error('🔴 Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  // A query function that uses the pool to run SQL queries
  query: (text, params) => pool.query(text, params),
};