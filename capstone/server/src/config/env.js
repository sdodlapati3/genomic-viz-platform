/**
 * Environment Configuration Validation
 * 
 * Validates required environment variables at startup
 * and provides typed access to configuration values.
 */

import Joi from 'joi';

// Define the schema for environment variables
const envSchema = Joi.object({
  // Node environment
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development'),

  // Server
  PORT: Joi.number().port().default(3001),
  HOST: Joi.string().default('localhost'),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(5432),
  DB_NAME: Joi.string().default('genomic_viz'),
  DB_USER: Joi.string().default('postgres'),
  DB_PASSWORD: Joi.string().default('postgres'),
  DB_SSL: Joi.boolean().default(false),
  DB_POOL_MIN: Joi.number().min(0).default(2),
  DB_POOL_MAX: Joi.number().min(1).default(10),
  DATABASE_URL: Joi.string().uri({ scheme: ['postgres', 'postgresql'] }).optional(),

  // Redis
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_URL: Joi.string().uri({ scheme: 'redis' }).optional(),

  // Authentication
  JWT_SECRET: Joi.string().min(32).required()
    .messages({
      'string.min': 'JWT_SECRET must be at least 32 characters long',
      'any.required': 'JWT_SECRET is required for security'
    }),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  CORS_CREDENTIALS: Joi.boolean().default(true),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),

  // File Uploads
  UPLOAD_DIR: Joi.string().default('./uploads'),
  MAX_FILE_SIZE: Joi.number().default(52428800),
  ALLOWED_EXTENSIONS: Joi.string().default('.vcf,.maf,.csv,.tsv,.txt'),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
  LOG_FORMAT: Joi.string()
    .valid('combined', 'common', 'dev', 'short', 'tiny')
    .default('dev'),

  // External Services
  OPENAI_API_KEY: Joi.string().optional(),
  OPENAI_MODEL: Joi.string().default('gpt-4'),
  SENTRY_DSN: Joi.string().uri().optional().allow(''),

  // Feature Flags
  FEATURE_AI_CHAT: Joi.boolean().default(true),
  FEATURE_FILE_UPLOAD: Joi.boolean().default(true),
  FEATURE_WEBSOCKET: Joi.boolean().default(false),
}).unknown(true); // Allow other env vars

/**
 * Validate environment variables
 * @returns {Object} Validated and transformed environment config
 * @throws {Error} If validation fails
 */
export function validateEnv() {
  const { error, value } = envSchema.validate(process.env, {
    abortEarly: false,
    stripUnknown: false,
  });

  if (error) {
    const messages = error.details.map(d => `  - ${d.message}`).join('\n');
    throw new Error(`Environment validation failed:\n${messages}`);
  }

  return value;
}

/**
 * Get typed configuration object
 * @returns {Config} Application configuration
 */
export function getConfig() {
  const env = validateEnv();

  return {
    env: env.NODE_ENV,
    isProduction: env.NODE_ENV === 'production',
    isDevelopment: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',

    server: {
      port: env.PORT,
      host: env.HOST,
    },

    database: {
      host: env.DB_HOST,
      port: env.DB_PORT,
      name: env.DB_NAME,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      ssl: env.DB_SSL,
      pool: {
        min: env.DB_POOL_MIN,
        max: env.DB_POOL_MAX,
      },
      url: env.DATABASE_URL,
    },

    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      url: env.REDIS_URL,
    },

    auth: {
      jwtSecret: env.JWT_SECRET,
      jwtExpiresIn: env.JWT_EXPIRES_IN,
      jwtRefreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
      bcryptRounds: env.BCRYPT_ROUNDS,
    },

    cors: {
      origin: env.CORS_ORIGIN.split(',').map(o => o.trim()),
      credentials: env.CORS_CREDENTIALS,
    },

    rateLimit: {
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    },

    upload: {
      dir: env.UPLOAD_DIR,
      maxSize: env.MAX_FILE_SIZE,
      allowedExtensions: env.ALLOWED_EXTENSIONS.split(',').map(e => e.trim()),
    },

    logging: {
      level: env.LOG_LEVEL,
      format: env.LOG_FORMAT,
    },

    services: {
      openai: {
        apiKey: env.OPENAI_API_KEY,
        model: env.OPENAI_MODEL,
      },
      sentry: {
        dsn: env.SENTRY_DSN,
      },
    },

    features: {
      aiChat: env.FEATURE_AI_CHAT,
      fileUpload: env.FEATURE_FILE_UPLOAD,
      websocket: env.FEATURE_WEBSOCKET,
    },
  };
}

// Export singleton config instance
let configInstance = null;

export function config() {
  if (!configInstance) {
    configInstance = getConfig();
  }
  return configInstance;
}

export default config;
