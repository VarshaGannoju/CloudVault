/**
 * PostgreSQL connection pool.
 * Uses `pg`'s Pool for efficient connection reuse across requests.
 */
const { Pool } = require('pg');
const { env } = require('./env');

const poolConfig = env.DATABASE_URL
  ? {
      connectionString: env.DATABASE_URL,
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
    }
  : {
      host: env.DB_HOST,
      port: env.DB_PORT,
      database: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ssl: env.DB_SSL ? { rejectUnauthorized: false } : false,
    };

const pool = new Pool({
  ...poolConfig,
  max: 20, // max clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  // Unexpected errors on idle clients should not crash the app silently.
   
  console.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Run a query using a pooled connection.
 * @param {string} text - SQL query text (parameterized).
 * @param {Array} params - Query parameters.
 */
async function query(text, params) {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  if (env.NODE_ENV === 'development') {
     
    console.log('executed query', { text, duration, rows: result.rowCount });
  }
  return result;
}

/**
 * Get a client from the pool for running a transaction.
 * Caller is responsible for calling client.release() when done.
 */
async function getClient() {
  const client = await pool.connect();
  return client;
}

async function checkConnection() {
  const result = await pool.query('SELECT NOW()');
  return result.rows[0];
}

module.exports = { pool, query, getClient, checkConnection };
