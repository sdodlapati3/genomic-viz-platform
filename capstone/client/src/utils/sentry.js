/**
 * Sentry Error Tracking - Client
 * 
 * Configures Sentry for frontend error tracking and performance monitoring
 */

import * as Sentry from '@sentry/browser';

/**
 * Initialize Sentry for the client application
 */
export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  
  if (!dsn) {
    console.warn('⚠️  VITE_SENTRY_DSN not configured, error tracking disabled');
    return null;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE || 'development',
    release: `mini-proteinpaint-client@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    
    // Performance monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,

    // Session replay for debugging
    replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,

    // Integrations
    integrations: [
      // Browser tracing
      Sentry.browserTracingIntegration({
        // Trace these navigation patterns
        tracingOrigins: ['localhost', /^\//],
      }),
      // Session replay
      Sentry.replayIntegration({
        // Don't mask text in development
        maskAllText: import.meta.env.PROD,
        blockAllMedia: false,
      }),
    ],

    // Filter sensitive data
    beforeSend(event) {
      // Remove any sensitive data from the event
      if (event.request?.headers) {
        delete event.request.headers.authorization;
      }
      return event;
    },

    // Ignore certain errors
    ignoreErrors: [
      // Network errors
      'Network Error',
      'NetworkError',
      'Failed to fetch',
      // Aborted requests
      'AbortError',
      // Resize observer errors (browser noise)
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      // Browser extension errors
      /^chrome-extension:\/\//,
      /^moz-extension:\/\//,
    ],

    // Deny URLs (don't report errors from these)
    denyUrls: [
      // Chrome extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      // Firefox extensions
      /^moz-extension:\/\//i,
    ],
  });

  console.log('✅ Sentry client error tracking initialized');
  return Sentry;
}

/**
 * Capture an exception
 */
export function captureException(error, context = {}) {
  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture a message
 */
export function captureMessage(message, level = 'info', context = {}) {
  Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Set user context
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
 * Clear user context (on logout)
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Add a breadcrumb for debugging
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
 * Set a tag for filtering in Sentry
 */
export function setTag(key, value) {
  Sentry.setTag(key, value);
}

/**
 * Set extra context
 */
export function setExtra(key, value) {
  Sentry.setExtra(key, value);
}

/**
 * Create a custom Sentry context
 */
export function setContext(name, context) {
  Sentry.setContext(name, context);
}

/**
 * Wrap a function with error tracking
 */
export function withSentryTracking(fn, name) {
  return async (...args) => {
    return Sentry.startSpan(
      { name, op: 'function' },
      async () => {
        try {
          return await fn(...args);
        } catch (error) {
          captureException(error, { function: name, args });
          throw error;
        }
      }
    );
  };
}

/**
 * Error boundary helper for components
 */
export function handleComponentError(error, componentStack) {
  captureException(error, {
    componentStack,
    type: 'component_error',
  });
}

export default {
  initSentry,
  captureException,
  captureMessage,
  setUser,
  clearUser,
  addBreadcrumb,
  setTag,
  setExtra,
  setContext,
  withSentryTracking,
  handleComponentError,
};
