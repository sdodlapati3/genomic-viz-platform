/**
 * Validation Middleware
 * 
 * Express middleware for validating request data using Zod schemas
 */

import { ZodError } from 'zod';

/**
 * Validation error response formatter
 */
function formatZodError(error) {
  return {
    error: 'Validation Error',
    message: 'Invalid request data',
    details: error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
      code: err.code,
      ...(err.expected && { expected: err.expected }),
      ...(err.received && { received: err.received }),
    })),
  };
}

/**
 * Create validation middleware for request body
 * 
 * @param {ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export function validateBody(schema) {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(formatZodError(error));
      }
      next(error);
    }
  };
}

/**
 * Create validation middleware for query parameters
 * 
 * @param {ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export function validateQuery(schema) {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(formatZodError(error));
      }
      next(error);
    }
  };
}

/**
 * Create validation middleware for URL parameters
 * 
 * @param {ZodSchema} schema - Zod schema to validate against
 * @returns {Function} Express middleware
 */
export function validateParams(schema) {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json(formatZodError(error));
      }
      next(error);
    }
  };
}

/**
 * Combined validation middleware
 * Validates body, query, and params in one call
 * 
 * @param {Object} schemas - Object with body, query, and/or params schemas
 * @returns {Function} Express middleware
 */
export function validate({ body, query, params }) {
  return async (req, res, next) => {
    try {
      const errors = [];

      if (body) {
        try {
          req.body = await body.parseAsync(req.body);
        } catch (e) {
          if (e instanceof ZodError) {
            errors.push(...e.errors.map(err => ({
              ...err,
              path: ['body', ...err.path],
            })));
          } else throw e;
        }
      }

      if (query) {
        try {
          req.query = await query.parseAsync(req.query);
        } catch (e) {
          if (e instanceof ZodError) {
            errors.push(...e.errors.map(err => ({
              ...err,
              path: ['query', ...err.path],
            })));
          } else throw e;
        }
      }

      if (params) {
        try {
          req.params = await params.parseAsync(req.params);
        } catch (e) {
          if (e instanceof ZodError) {
            errors.push(...e.errors.map(err => ({
              ...err,
              path: ['params', ...err.path],
            })));
          } else throw e;
        }
      }

      if (errors.length > 0) {
        const zodError = new ZodError(errors);
        return res.status(400).json(formatZodError(zodError));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Async handler wrapper
 * Catches async errors and passes them to error handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export default {
  validateBody,
  validateQuery,
  validateParams,
  validate,
  asyncHandler,
};
