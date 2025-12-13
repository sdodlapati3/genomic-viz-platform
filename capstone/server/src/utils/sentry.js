/**
 * Sentry Error Tracking - Server
 * 
 * Configures Sentry for backend error tracking and performance monitoring
 */

import * as Sentry from '@sentry/node';

/**
 * Initialize Sentry for the Express application
 * 
 * @param {Express} app - Express application instance
 * @returns {Object} Sentry instance
 */
export function initSentry(app) {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('⚠️  SENTRY_DSN not configured, error tracking disabled');
    return null;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    release: `mini-proteinpaint-server@${process.env.npm_package_version || '1.0.0'}`,
    
    // Performance monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Set sampling rate for profiling
    profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Integrations
    integrations: [
      // HTTP integration for tracing requests
      Sentry.httpIntegration(),
      // Express integration
      Sentry.expressIntegration({ app }),
    ],

    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Remove sensitive body data
      if (event.request?.data) {
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
        sensitiveFields.forEach(field => {
          if (event.request.data[field]) {
            event.request.data[field] = '[REDACTED]';
          }
        });
      }

      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Network errors
      'ECONNREFUSED',
      'ENOTFOUND',
      // Rate limiting
      'Too Many Requests',
      // Client errors we expect
      'Unauthorized',
      'Forbidden',
    ],
  });

  console.log('✅ Sentry error tracking initialized');
  return Sentry;
}

/**
 * Sentry request handler middleware
 * Must be the first middleware
 */
export function sentryRequestHandler() {
  return Sentry.Handlers.requestHandler({
    // Include user info in events
    user: ['id', 'email', 'role'],
    // Include IP address
    ip: true,
    // Include request data
    request: ['method', 'url', 'query_string', 'data'],
  });
}

/**
 * Sentry tracing handler middleware
 * Must be after request handler
 */
export function sentryTracingHandler() {
  return Sentry.Handlers.tracingHandler();
}

/**
 * Sentry error handler middleware
 * Must be before other error handlers
 */
export function sentryErrorHandler() {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Report 4xx and 5xx errors
      if (error.status >= 400) {
        return true;
      }
      return true;
    },
  });
}

/**
 * Capture a custom exception
 */
export function captureException(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a custom message
 */
export function captureMessage(message, level = 'info', context = {}) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context for Sentry
 */
export function setUser(user) {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message, category, data = {}) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

/**
 * Start a transaction for performance monitoring
 */
export function startTransaction(name, op) {
  return Sentry.startSpan({ name, op });
}

/**
 * Wrap async function with error capturing
 */
export function withSentry(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      captureException(error);
      throw error;
    }
  };
}

export default {
  initSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUser,
  addBreadcrumb,
  startTransaction,
  withSentry,
};
