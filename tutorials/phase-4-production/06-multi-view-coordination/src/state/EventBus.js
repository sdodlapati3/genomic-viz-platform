/**
 * Event Bus - Decoupled communication between visualization components
 *
 * Provides publish/subscribe pattern for coordinating multiple views
 * without tight coupling between components.
 */

export class EventBus {
  constructor() {
    this.handlers = new Map();
    this.history = [];
    this.maxHistory = 100;
    this._debounceTimers = new Map();
    this._middlewares = [];
  }

  /**
   * Add middleware to process all events
   * @param {Function} middleware - (event, data, next) => void
   */
  use(middleware) {
    this._middlewares.push(middleware);
    return this;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name (supports wildcards: 'selection:*')
   * @param {Function} handler - Callback function
   * @param {Object} options - { once, priority }
   * @returns {Function} Unsubscribe function
   */
  on(event, handler, options = {}) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }

    const entry = {
      handler,
      once: options.once || false,
      priority: options.priority || 0,
      id: Symbol('handler'),
    };

    this.handlers.get(event).push(entry);

    // Sort by priority (higher first)
    this.handlers.get(event).sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event once
   */
  once(event, handler, options = {}) {
    return this.on(event, handler, { ...options, once: true });
  }

  /**
   * Unsubscribe from an event
   */
  off(event, handler) {
    const entries = this.handlers.get(event);
    if (entries) {
      const index = entries.findIndex((e) => e.handler === handler);
      if (index !== -1) {
        entries.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    // Run through middleware chain
    const runMiddleware = (index) => {
      if (index < this._middlewares.length) {
        this._middlewares[index](event, data, () => runMiddleware(index + 1));
      } else {
        this._doEmit(event, data);
      }
    };

    runMiddleware(0);
  }

  _doEmit(event, data) {
    // Record in history
    this.history.push({
      event,
      data,
      timestamp: Date.now(),
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Get direct handlers
    const directHandlers = this.handlers.get(event) || [];

    // Get wildcard handlers (e.g., 'selection:*' matches 'selection:change')
    const wildcardHandlers = [];
    for (const [pattern, handlers] of this.handlers) {
      if (pattern.endsWith(':*')) {
        const prefix = pattern.slice(0, -1);
        if (event.startsWith(prefix)) {
          wildcardHandlers.push(...handlers);
        }
      }
    }

    const allHandlers = [...directHandlers, ...wildcardHandlers];
    const toRemove = [];

    allHandlers.forEach((entry, index) => {
      try {
        entry.handler(data, event);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }

      if (entry.once && directHandlers.includes(entry)) {
        toRemove.push(index);
      }
    });

    // Remove one-time handlers
    toRemove.reverse().forEach((i) => {
      if (i < directHandlers.length) {
        directHandlers.splice(i, 1);
      }
    });
  }

  /**
   * Emit with debounce for high-frequency events
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @param {number} delay - Debounce delay in ms
   */
  emitDebounced(event, data, delay = 16) {
    if (this._debounceTimers.has(event)) {
      clearTimeout(this._debounceTimers.get(event));
    }

    this._debounceTimers.set(
      event,
      setTimeout(() => {
        this.emit(event, data);
        this._debounceTimers.delete(event);
      }, delay)
    );
  }

  /**
   * Emit with throttle for continuous events
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @param {number} limit - Minimum time between emissions in ms
   */
  emitThrottled(event, data, limit = 16) {
    const key = `_throttle_${event}`;
    const now = Date.now();

    if (!this[key] || now - this[key] >= limit) {
      this[key] = now;
      this.emit(event, data);
    }
  }

  /**
   * Wait for an event to occur
   * @param {string} event - Event to wait for
   * @param {number} timeout - Timeout in ms
   * @returns {Promise}
   */
  waitFor(event, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off(event, handler);
        reject(new Error(`Timeout waiting for event: ${event}`));
      }, timeout);

      const handler = (data) => {
        clearTimeout(timer);
        resolve(data);
      };

      this.once(event, handler);
    });
  }

  /**
   * Get event history
   * @param {string} event - Optional filter by event name
   * @returns {Array}
   */
  getHistory(event = null) {
    if (event) {
      return this.history.filter((h) => h.event === event);
    }
    return [...this.history];
  }

  /**
   * Clear all handlers
   */
  clear() {
    this.handlers.clear();
    this.history = [];
    this._debounceTimers.forEach((timer) => clearTimeout(timer));
    this._debounceTimers.clear();
  }

  /**
   * Get handler count for debugging
   */
  getHandlerCount(event = null) {
    if (event) {
      return (this.handlers.get(event) || []).length;
    }
    let total = 0;
    for (const handlers of this.handlers.values()) {
      total += handlers.length;
    }
    return total;
  }
}

// Singleton instance
export const eventBus = new EventBus();

// Add logging middleware in development
if (import.meta.env?.DEV) {
  eventBus.use((event, data, next) => {
    console.log(`[EventBus] ${event}`, data);
    next();
  });
}

// Standard event names
export const Events = {
  // Selection events
  SELECTION_CHANGE: 'selection:change',
  SELECTION_CLEAR: 'selection:clear',
  SELECTION_MODE: 'selection:mode',
  SELECTION_BRUSH: 'selection:brush',

  // Hover events
  HOVER_START: 'hover:start',
  HOVER_END: 'hover:end',

  // Zoom/pan events
  ZOOM_CHANGE: 'zoom:change',
  PAN_CHANGE: 'pan:change',
  REGION_CHANGE: 'region:change',

  // Filter events
  FILTER_CHANGE: 'filter:change',
  FILTER_RESET: 'filter:reset',

  // Data events
  DATA_LOAD: 'data:load',
  DATA_UPDATE: 'data:update',

  // View events
  VIEW_READY: 'view:ready',
  VIEW_RESIZE: 'view:resize',
  VIEW_DESTROY: 'view:destroy',
};
