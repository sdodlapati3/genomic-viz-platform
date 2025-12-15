/**
 * Solution: Exercise 2 - Selection Persistence and URL State
 *
 * URL-based state persistence with compression, migrations, and deep linking
 */

import { eventBus } from '../state/EventBus.js';
import { store } from '../state/Store.js';

// ============================================
// Part 1: URL State Manager
// ============================================

class URLStateManager {
  constructor(options = {}) {
    this.version = options.version || 1;
    this.prefix = options.prefix || 'state';
    this.migrations = options.migrations || {};
    this.compressionThreshold = options.compressionThreshold || 1000;
    this.debounceMs = options.debounceMs || 300;

    this._pushTimeout = null;
  }

  /**
   * Encode complex state to URL-safe string
   */
  encodeState(state) {
    const stateWithVersion = {
      v: this.version,
      t: Date.now(), // timestamp for debugging
      ...state,
    };

    // Step 1: JSON stringify
    let json = JSON.stringify(stateWithVersion);

    // Step 2: Compress if large
    let isCompressed = false;
    if (json.length > this.compressionThreshold) {
      json = this._compress(json);
      isCompressed = true;
    }

    // Step 3: Base64 encode
    const base64 = btoa(json);

    // Step 4: Add compression marker and URL encode
    const marker = isCompressed ? 'c:' : 'r:';
    return encodeURIComponent(marker + base64);
  }

  /**
   * Decode URL parameter back to state object
   */
  decodeState(encoded) {
    try {
      // Step 1: URL decode
      const decoded = decodeURIComponent(encoded);

      // Step 2: Check compression marker
      const isCompressed = decoded.startsWith('c:');
      const base64 = decoded.substring(2);

      // Step 3: Base64 decode
      let json = atob(base64);

      // Step 4: Decompress if needed
      if (isCompressed) {
        json = this._decompress(json);
      }

      // Step 5: JSON parse
      const state = JSON.parse(json);

      // Step 6: Run migrations if version mismatch
      const { v: version, t: timestamp, ...data } = state;

      if (version < this.version) {
        return this.migrate(data, version);
      }

      return data;
    } catch (e) {
      console.warn('Failed to decode state:', e);
      return null;
    }
  }

  /**
   * Simple LZ-based compression (simplified implementation)
   * For production, use lz-string library
   */
  _compress(str) {
    // Simple run-length encoding for repeated characters
    // In production, use LZString.compressToBase64
    let result = '';
    let count = 1;

    for (let i = 0; i < str.length; i++) {
      if (str[i] === str[i + 1]) {
        count++;
      } else {
        if (count > 3) {
          result += `\x00${count}\x01${str[i]}`;
        } else {
          result += str[i].repeat(count);
        }
        count = 1;
      }
    }

    return result;
  }

  _decompress(str) {
    let result = '';
    let i = 0;

    while (i < str.length) {
      if (str[i] === '\x00') {
        const endIdx = str.indexOf('\x01', i);
        const count = parseInt(str.substring(i + 1, endIdx));
        const char = str[endIdx + 1];
        result += char.repeat(count);
        i = endIdx + 2;
      } else {
        result += str[i];
        i++;
      }
    }

    return result;
  }

  /**
   * Migrate old state formats to current version
   */
  migrate(state, fromVersion) {
    let currentState = { ...state };

    for (let v = fromVersion; v < this.version; v++) {
      const migrationFn = this.migrations[v];
      if (migrationFn) {
        console.log(`Migrating state from v${v} to v${v + 1}`);
        currentState = migrationFn(currentState);
      }
    }

    return currentState;
  }

  /**
   * Push state to URL without page reload (debounced)
   */
  pushState(state, options = {}) {
    const { immediate = false, replace = false } = options;

    const doPush = () => {
      const encoded = this.encodeState(state);
      const url = new URL(window.location);
      url.searchParams.set(this.prefix, encoded);

      if (replace) {
        window.history.replaceState(state, '', url);
      } else {
        window.history.pushState(state, '', url);
      }
    };

    if (immediate) {
      doPush();
    } else {
      clearTimeout(this._pushTimeout);
      this._pushTimeout = setTimeout(doPush, this.debounceMs);
    }
  }

  /**
   * Read current state from URL
   */
  readState() {
    const url = new URL(window.location);
    const encoded = url.searchParams.get(this.prefix);

    if (!encoded) return null;

    return this.decodeState(encoded);
  }

  /**
   * Clear state from URL
   */
  clearState() {
    const url = new URL(window.location);
    url.searchParams.delete(this.prefix);
    window.history.replaceState(null, '', url);
  }

  /**
   * Get full URL with current state
   */
  getShareableURL(state) {
    const encoded = this.encodeState(state);
    const url = new URL(window.location);
    url.searchParams.set(this.prefix, encoded);
    return url.toString();
  }
}

// ============================================
// Part 2: Selection Serialization
// ============================================

class SelectionSerializer {
  /**
   * Serialize selections for URL storage
   */
  serialize(selections) {
    const serialized = {};

    // Point selections: store IDs
    if (selections.points && selections.points.size > 0) {
      const ids = Array.from(selections.points);
      serialized.p = ids.length > 100 ? this.compress(ids) : ids;
    }

    // Range selections: store bounds
    if (selections.ranges && selections.ranges.length > 0) {
      serialized.r = selections.ranges.map((r) => ({
        f: r.field,
        n: r.min,
        x: r.max,
      }));
    }

    // Brush selections: store coordinates
    if (selections.brushes && selections.brushes.length > 0) {
      serialized.b = selections.brushes.map((b) => ({
        v: b.viewId,
        x: [b.x0, b.x1].map((n) => +n.toFixed(2)),
        y: [b.y0, b.y1].map((n) => +n.toFixed(2)),
      }));
    }

    return serialized;
  }

  /**
   * Deserialize selections from URL
   */
  deserialize(serialized, validIds = null) {
    const selections = {
      points: new Set(),
      ranges: [],
      brushes: [],
    };

    // Point selections
    if (serialized.p) {
      const ids = typeof serialized.p === 'string' ? this.decompress(serialized.p) : serialized.p;

      // Validate IDs if validation set provided
      ids.forEach((id) => {
        if (!validIds || validIds.has(id)) {
          selections.points.add(id);
        }
      });
    }

    // Range selections
    if (serialized.r) {
      selections.ranges = serialized.r.map((r) => ({
        field: r.f,
        min: r.n,
        max: r.x,
      }));
    }

    // Brush selections
    if (serialized.b) {
      selections.brushes = serialized.b.map((b) => ({
        viewId: b.v,
        x0: b.x[0],
        x1: b.x[1],
        y0: b.y[0],
        y1: b.y[1],
      }));
    }

    return selections;
  }

  /**
   * Compress large selections using run-length encoding
   * [1,2,3,4,5,10,11,12] -> "1-5,10-12"
   */
  compress(ids) {
    if (ids.length === 0) return '';

    // Sort IDs
    const sorted = [...ids].sort((a, b) => a - b);
    const ranges = [];
    let start = sorted[0];
    let end = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === end + 1) {
        end = sorted[i];
      } else {
        ranges.push(start === end ? `${start}` : `${start}-${end}`);
        start = sorted[i];
        end = sorted[i];
      }
    }

    ranges.push(start === end ? `${start}` : `${start}-${end}`);

    return ranges.join(',');
  }

  /**
   * Decompress run-length encoded IDs
   * "1-5,10-12" -> [1,2,3,4,5,10,11,12]
   */
  decompress(compressed) {
    if (!compressed) return [];

    const ids = [];
    const ranges = compressed.split(',');

    for (const range of ranges) {
      if (range.includes('-')) {
        const [start, end] = range.split('-').map(Number);
        for (let i = start; i <= end; i++) {
          ids.push(i);
        }
      } else {
        ids.push(Number(range));
      }
    }

    return ids;
  }
}

// ============================================
// Part 3: Deep Linking
// ============================================

class DeepLinkManager {
  constructor(urlManager, options = {}) {
    this.urlManager = urlManager;
    this.selectionSerializer = new SelectionSerializer();
    this.viewRegistry = new Map();
    this.options = options;

    this._setupHistoryNavigation();
  }

  /**
   * Register a view for state persistence
   */
  registerView(id, view) {
    this.viewRegistry.set(id, view);
    return this;
  }

  /**
   * Unregister a view
   */
  unregisterView(id) {
    this.viewRegistry.delete(id);
    return this;
  }

  /**
   * Get current state from all views
   */
  getCurrentState() {
    const state = {
      selections: {},
      filters: {},
      views: {},
    };

    // Get selections from store
    const storeState = store.getState();
    if (storeState.selectedItems) {
      state.selections = this.selectionSerializer.serialize({
        points: storeState.selectedItems,
      });
    }

    // Get filters
    if (storeState.filters) {
      state.filters = storeState.filters;
    }

    // Get view-specific state
    this.viewRegistry.forEach((view, id) => {
      if (view.getState) {
        state.views[id] = view.getState();
      }
    });

    return state;
  }

  /**
   * Generate shareable link with current state
   */
  generateLink(options = {}) {
    const { includeSelections = true, includeFilters = true, includeViewState = false } = options;

    const state = {};
    const currentState = this.getCurrentState();

    if (includeSelections && currentState.selections) {
      state.sel = currentState.selections;
    }

    if (includeFilters && currentState.filters) {
      state.flt = currentState.filters;
    }

    if (includeViewState && currentState.views) {
      state.vws = currentState.views;
    }

    return this.urlManager.getShareableURL(state);
  }

  /**
   * Apply state from URL on page load
   */
  async applyDeepLink(validIds = null) {
    const state = this.urlManager.readState();
    if (!state) return false;

    try {
      // 1. Apply filters first (affects what data is visible)
      if (state.flt) {
        store.setState({ filters: state.flt });
        eventBus.emit('filter:restored', state.flt);
      }

      // 2. Apply selections
      if (state.sel) {
        const selections = this.selectionSerializer.deserialize(state.sel, validIds);

        store.setState({ selectedItems: selections.points });
        eventBus.emit('selection:restored', selections);
      }

      // 3. Apply view-specific state
      if (state.vws) {
        for (const [viewId, viewState] of Object.entries(state.vws)) {
          const view = this.viewRegistry.get(viewId);
          if (view && view.setState) {
            view.setState(viewState);
          }
        }
      }

      return true;
    } catch (e) {
      console.error('Failed to apply deep link:', e);
      return false;
    }
  }

  /**
   * Save current state to URL
   */
  saveToURL(options = {}) {
    const state = {};
    const currentState = this.getCurrentState();

    if (currentState.selections) {
      state.sel = currentState.selections;
    }

    if (currentState.filters) {
      state.flt = currentState.filters;
    }

    this.urlManager.pushState(state, options);
  }

  /**
   * Watch for popstate (browser back/forward)
   */
  _setupHistoryNavigation() {
    window.addEventListener('popstate', async (event) => {
      if (event.state) {
        // Restore from history state object
        await this._applyState(event.state);
      } else {
        // Try to read from URL
        await this.applyDeepLink();
      }
    });
  }

  async _applyState(state) {
    // Similar to applyDeepLink but with direct state object
    if (state.flt) {
      store.setState({ filters: state.flt });
    }

    if (state.sel) {
      const selections = this.selectionSerializer.deserialize(state.sel);
      store.setState({ selectedItems: selections.points });
    }

    eventBus.emit('state:restored', state);
  }

  /**
   * Copy shareable link to clipboard
   */
  async copyLinkToClipboard(options = {}) {
    const link = this.generateLink(options);

    try {
      await navigator.clipboard.writeText(link);
      eventBus.emit('link:copied', { link });
      return true;
    } catch (e) {
      console.error('Failed to copy link:', e);
      return false;
    }
  }
}

// ============================================
// Part 4: State Versioning
// ============================================

// Migration definitions for evolving state schemas
const stateMigrations = {
  // v1 -> v2: selections changed from array to object format
  1: (state) => ({
    ...state,
    sel: state.selections ? { p: state.selections } : state.sel,
  }),

  // v2 -> v3: filters restructured
  2: (state) => ({
    ...state,
    flt: state.filters
      ? {
          num: state.filters.ranges || {},
          cat: state.filters.categories || {},
        }
      : state.flt,
  }),

  // v3 -> v4: view state added
  3: (state) => ({
    ...state,
    vws: state.viewState || state.vws || {},
  }),
};

// ============================================
// Complete Integration
// ============================================

/**
 * Create pre-configured state persistence system
 */
function createStatePersistence(options = {}) {
  const urlManager = new URLStateManager({
    version: 4,
    prefix: 'viz',
    migrations: stateMigrations,
    debounceMs: 500,
    ...options.urlManager,
  });

  const deepLinkManager = new DeepLinkManager(urlManager, options.deepLink);

  // Auto-save state changes
  let saveTimeout = null;

  eventBus.on('selection:change', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      deepLinkManager.saveToURL({ replace: true });
    }, 1000);
  });

  eventBus.on('filter:change', () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      deepLinkManager.saveToURL({ replace: true });
    }, 1000);
  });

  return {
    urlManager,
    deepLinkManager,
    selectionSerializer: new SelectionSerializer(),

    // Convenience methods
    init: () => deepLinkManager.applyDeepLink(),
    save: () => deepLinkManager.saveToURL({ immediate: true }),
    getLink: (opts) => deepLinkManager.generateLink(opts),
    copyLink: (opts) => deepLinkManager.copyLinkToClipboard(opts),
    clear: () => urlManager.clearState(),
  };
}

// Export all components
export {
  URLStateManager,
  SelectionSerializer,
  DeepLinkManager,
  stateMigrations,
  createStatePersistence,
};
