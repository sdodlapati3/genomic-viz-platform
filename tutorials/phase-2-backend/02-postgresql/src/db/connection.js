/**
 * Database Connection Pool
 * Uses pg (node-postgres) for PostgreSQL connectivity
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Create connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'genomic_viz',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,                    // Maximum pool size
  idleTimeoutMillis: 30000,   // Close idle clients after 30s
  connectionTimeoutMillis: 2000, // Return error after 2s if connection not available
});

// Log connection events
pool.on('connect', () => {
  console.log('📊 New client connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle PostgreSQL client', err);
});

/**
 * Query helper with automatic client release
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export const query = async (text, params) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`📝 Query executed in ${duration}ms:`, {
      text: text.substring(0, 100),
      rows: result.rowCount
    });
  }
  
  return result;
};

/**
 * Get a client from the pool for transactions
 * @returns {Promise<pg.PoolClient>}
 */
export const getClient = async () => {
  const client = await pool.connect();
  const originalRelease = client.release.bind(client);
  
  // Override release to log
  client.release = () => {
    console.log('📊 Client released back to pool');
    return originalRelease();
  };
  
  return client;
};

/**
 * Execute a transaction
 * @param {Function} callback - Function receiving client for transaction
 * @returns {Promise<any>}
 */
export const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Test database connection
 * @returns {Promise<boolean>}
 */
export const testConnection = async () => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as pg_version');
    console.log('✅ Database connected:', result.rows[0].current_time);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

/**
 * Close all pool connections
 */
export const closePool = async () => {
  await pool.end();
  console.log('📊 Database pool closed');
};

export default pool;
