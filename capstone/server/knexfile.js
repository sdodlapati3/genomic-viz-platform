/**
 * Knex Configuration
 * 
 * Database configuration for migrations and seeds
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database connection settings from environment
const connection = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'genomic_viz',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Pool configuration
const pool = {
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  acquireTimeoutMillis: 30000,
  createTimeoutMillis: 30000,
  destroyTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
  reapIntervalMillis: 1000,
  createRetryIntervalMillis: 100,
};

// Migration settings
const migrations = {
  directory: join(__dirname, 'src/db/migrations'),
  tableName: 'knex_migrations',
  extension: 'js',
  loadExtensions: ['.js'],
};

// Seed settings
const seeds = {
  directory: join(__dirname, 'src/db/seeds'),
  loadExtensions: ['.js'],
};

/**
 * Knex configuration for different environments
 */
const knexConfig = {
  development: {
    client: 'pg',
    connection,
    pool,
    migrations,
    seeds,
    debug: process.env.DB_DEBUG === 'true',
  },

  staging: {
    client: 'pg',
    connection: process.env.DATABASE_URL || connection,
    pool: {
      ...pool,
      min: 2,
      max: 20,
    },
    migrations,
    seeds,
  },

  production: {
    client: 'pg',
    connection: {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    },
    pool: {
      ...pool,
      min: 5,
      max: 30,
    },
    migrations,
    seeds: {
      directory: join(__dirname, 'src/db/seeds/production'),
    },
  },

  test: {
    client: 'pg',
    connection: {
      ...connection,
      database: `${connection.database}_test`,
    },
    pool: {
      min: 1,
      max: 5,
    },
    migrations,
    seeds: {
      directory: join(__dirname, 'src/db/seeds/test'),
    },
  },
};

export default knexConfig;
