/**
 * Error handling middleware for Express
 * Provides consistent error responses and logging
 */

/**
 * Custom API Error class
 */
export class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'ApiError';
  }
}

/**
 * Not found handler - catches 404 errors for unmatched routes
 */
export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableEndpoints: [
      'GET /api/genes',
      'GET /api/genes/:symbol',
      'GET /api/genes/:symbol/domains',
      'GET /api/genes/region/:chromosome/:start-:end',
      'GET /api/variants',
      'GET /api/variants/stats',
      'GET /api/variants/:id',
      'GET /api/variants/region/:chromosome/:start-:end',
      'GET /api/samples',
      'GET /api/samples/stats',
      'GET /api/samples/:id',
      'GET /api/samples/:id/variants',
      'GET /api/health'
    ]
  });
};

/**
 * Global error handler
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error(`[ERROR] ${new Date().toISOString()}`);
  console.error(`  Path: ${req.method} ${req.originalUrl}`);
  console.error(`  Message: ${err.message}`);
  if (process.env.NODE_ENV !== 'production') {
    console.error(`  Stack: ${err.stack}`);
  }
  
  // Handle ApiError instances
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.name,
      message: err.message,
      details: err.details
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: err.message,
      details: err.details || null
    });
  }
  
  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON',
      message: 'The request body contains invalid JSON'
    });
  }
  
  // Default to 500 Internal Server Error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;
  
  res.status(statusCode).json({
    success: false,
    error: err.name || 'Error',
    message
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    
    console.log(
      `[${timestamp}] ${req.method} ${req.originalUrl} ` +
      `${res.statusCode} ${duration}ms`
    );
  });
  
  next();
};
