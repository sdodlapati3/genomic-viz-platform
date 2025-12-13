/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors in child components and displays fallback UI
 */

import { captureException, addBreadcrumb } from '../utils/sentry.js';

/**
 * Create an error boundary wrapper
 * 
 * Since we're using vanilla JS, this is a functional wrapper pattern
 * For React, you would use a class component or react-error-boundary
 */
export class ErrorBoundary {
  constructor(options = {}) {
    this.fallbackRender = options.fallbackRender || this.defaultFallback;
    this.onError = options.onError || this.defaultOnError;
    this.onReset = options.onReset || (() => {});
  }

  /**
   * Default error handler
   */
  defaultOnError(error, errorInfo) {
    console.error('Error caught by boundary:', error);
    
    // Report to Sentry
    captureException(error, {
      componentStack: errorInfo?.componentStack,
      boundary: 'ErrorBoundary',
    });

    // Add breadcrumb for debugging
    addBreadcrumb(
      'Error boundary triggered',
      'error',
      { message: error.message }
    );
  }

  /**
   * Default fallback UI
   */
  defaultFallback(error, resetError) {
    const container = document.createElement('div');
    container.className = 'error-boundary-fallback';
    container.innerHTML = `
      <div class="error-content">
        <h2>Something went wrong</h2>
        <p>We're sorry, but something unexpected happened.</p>
        <details>
          <summary>Error details</summary>
          <pre>${error.message}</pre>
        </details>
        <button class="retry-button">Try Again</button>
      </div>
    `;

    // Add retry handler
    container.querySelector('.retry-button').addEventListener('click', () => {
      resetError();
    });

    return container;
  }

  /**
   * Wrap a function with error handling
   */
  wrap(fn) {
    return async (...args) => {
      try {
        return await fn(...args);
      } catch (error) {
        this.onError(error, {});
        throw error;
      }
    };
  }

  /**
   * Wrap a DOM element with error boundary
   */
  wrapElement(element, renderFn) {
    const container = document.createElement('div');
    container.className = 'error-boundary';

    const render = () => {
      try {
        container.innerHTML = '';
        const content = renderFn();
        if (content instanceof HTMLElement) {
          container.appendChild(content);
        } else {
          container.innerHTML = content;
        }
      } catch (error) {
        this.onError(error, {});
        container.innerHTML = '';
        container.appendChild(
          this.fallbackRender(error, render)
        );
      }
    };

    render();
    return container;
  }
}

/**
 * Global error handler
 */
export function setupGlobalErrorHandler() {
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    
    captureException(event.error || new Error(event.message), {
      type: 'uncaught_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled rejection:', event.reason);
    
    captureException(event.reason || new Error('Unhandled Promise Rejection'), {
      type: 'unhandled_rejection',
    });
  });
}

/**
 * Async error wrapper
 */
export function withErrorHandling(asyncFn, errorHandler) {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      if (errorHandler) {
        errorHandler(error);
      } else {
        console.error('Error in async function:', error);
        captureException(error, { function: asyncFn.name });
      }
      throw error;
    }
  };
}

/**
 * Error toast notification
 */
export function showErrorToast(message, options = {}) {
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.innerHTML = `
    <div class="error-toast-content">
      <span class="error-icon">⚠️</span>
      <span class="error-message">${message}</span>
      <button class="close-button">×</button>
    </div>
  `;

  // Auto-dismiss after 5 seconds
  const duration = options.duration || 5000;

  toast.querySelector('.close-button').addEventListener('click', () => {
    toast.remove();
  });

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, duration);

  return toast;
}

// CSS styles for error boundary (can be added to stylesheet)
export const errorBoundaryStyles = `
.error-boundary-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: 20px;
  background-color: #fff3f3;
  border: 1px solid #ffcdd2;
  border-radius: 8px;
}

.error-content {
  text-align: center;
  max-width: 500px;
}

.error-content h2 {
  color: #c62828;
  margin-bottom: 10px;
}

.error-content p {
  color: #666;
  margin-bottom: 15px;
}

.error-content details {
  margin: 15px 0;
  text-align: left;
}

.error-content pre {
  background: #f5f5f5;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

.retry-button {
  background-color: #1976d2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.retry-button:hover {
  background-color: #1565c0;
}

.error-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: #c62828;
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  z-index: 10000;
  animation: slideIn 0.3s ease;
}

.error-toast.fade-out {
  animation: fadeOut 0.3s ease;
}

.error-toast-content {
  display: flex;
  align-items: center;
  gap: 10px;
}

.error-toast .close-button {
  background: none;
  border: none;
  color: white;
  font-size: 18px;
  cursor: pointer;
  padding: 0 5px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes fadeOut {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}
`;

export default {
  ErrorBoundary,
  setupGlobalErrorHandler,
  withErrorHandling,
  showErrorToast,
  errorBoundaryStyles,
};
