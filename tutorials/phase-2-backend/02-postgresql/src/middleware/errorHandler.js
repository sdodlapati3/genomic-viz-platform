/**
 * Error handling middleware for Express
 */

export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error(`[ERROR] ${new Date().toISOString()}`);
  console.error(`  Path: ${req.method} ${req.originalUrl}`);
  console.error(`  Message: ${err.message}`);
  
  // PostgreSQL specific errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        return res.status(409).json({
          success: false,
          error: 'Duplicate Entry',
          message: 'A record with this value already exists'
        });
      case '23503': // foreign_key_violation
        return res.status(400).json({
          success: false,
          error: 'Invalid Reference',
          message: 'Referenced record does not exist'
        });
      case 'ECONNREFUSED':
        return res.status(503).json({
          success: false,
          error: 'Database Unavailable',
          message: 'Cannot connect to database'
        });
    }
  }
  
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.name,
      message: err.message,
      details: err.details
    });
  }
  
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.name || 'Error',
    message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message
  });
};

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });
  
  next();
};
