/**
 * Centralized Store - State management for coordinated visualizations
 *
 * Provides a single source of truth for application state with
 * change notifications and computed properties.
 */

import { eventBus, Events } from './EventBus.js';

export class Store {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._watchers = new Map();
    this._computed = new Map();
    this._history = [];
    this._historyIndex = -1;
    this._maxHistory = 50;
    this._batchUpdates = null;
  }

  /**
   * Get complete state snapshot
   */
  getState() {
    return { ...this._state };
  }

  /**
   * Get a specific state value
   * @param {string} key - State key (supports dot notation: 'filters.minValue')
   */
  get(key) {
    // Handle dot notation
    if (key.includes('.')) {
      return key.split('.').reduce((obj, k) => obj?.[k], this._state);
    }
    return this._state[key];
  }

  /**
   * Set a state value
   * @param {string} key - State key
   * @param {*} value - New value
   * @param {Object} options - { silent, recordHistory }
   */
  set(key, value, options = {}) {
    const { silent = false, recordHistory = true } = options;

    const oldValue = this.get(key);

    // Check if actually changed
    if (this._isEqual(oldValue, value)) {
      return false;
    }

    // Handle dot notation
    if (key.includes('.')) {
      const keys = key.split('.');
      const lastKey = keys.pop();
      let obj = this._state;

      for (const k of keys) {
        if (!obj[k]) obj[k] = {};
        obj = obj[k];
      }
      obj[lastKey] = value;
    } else {
      this._state[key] = value;
    }

    // Record history for undo/redo
    if (recordHistory) {
      this._recordHistory(key, oldValue, value);
    }

    // Notify watchers
    if (!silent) {
      this._notifyWatchers(key, value, oldValue);

      // Emit to event bus
      eventBus.emit(`state:${key}`, { key, value, oldValue });
    }

    // Invalidate computed properties that depend on this key
    this._invalidateComputed(key);

    return true;
  }

  /**
   * Update multiple values at once
   * @param {Object} updates - Key-value pairs to update
   * @param {Object} options - { silent, recordHistory }
   */
  batch(updates, options = {}) {
    const { silent = false, recordHistory = true } = options;
    const changes = [];

    // Collect changes
    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = this.get(key);
      if (!this._isEqual(oldValue, value)) {
        this.set(key, value, { silent: true, recordHistory: false });
        changes.push({ key, value, oldValue });
      }
    });

    if (changes.length === 0) {
      return false;
    }

    // Record batch in history
    if (recordHistory) {
      this._recordBatchHistory(changes);
    }

    // Notify watchers after all changes
    if (!silent) {
      changes.forEach(({ key, value, oldValue }) => {
        this._notifyWatchers(key, value, oldValue);
      });

      eventBus.emit('state:batch', { changes });
    }

    return true;
  }

  /**
   * Watch a state key for changes
   * @param {string|Array} keys - Key(s) to watch
   * @param {Function} callback - (value, oldValue) => void
   * @returns {Function} Unwatch function
   */
  watch(keys, callback) {
    const keyArray = Array.isArray(keys) ? keys : [keys];

    keyArray.forEach((key) => {
      if (!this._watchers.has(key)) {
        this._watchers.set(key, []);
      }
      this._watchers.get(key).push(callback);
    });

    // Return unwatch function
    return () => {
      keyArray.forEach((key) => {
        const watchers = this._watchers.get(key);
        if (watchers) {
          const index = watchers.indexOf(callback);
          if (index !== -1) {
            watchers.splice(index, 1);
          }
        }
      });
    };
  }

  /**
   * Define a computed property
   * @param {string} name - Computed property name
   * @param {Function} compute - () => value
   * @param {Array} deps - Keys this computed depends on
   */
  computed(name, compute, deps = []) {
    this._computed.set(name, {
      compute,
      deps,
      value: undefined,
      valid: false,
    });
  }

  /**
   * Get a computed property value
   * @param {string} name - Computed property name
   */
  getComputed(name) {
    const entry = this._computed.get(name);
    if (!entry) {
      throw new Error(`Unknown computed property: ${name}`);
    }

    if (!entry.valid) {
      entry.value = entry.compute(this._state);
      entry.valid = true;
    }

    return entry.value;
  }

  /**
   * Undo the last change
   */
  undo() {
    if (this._historyIndex < 0) {
      return false;
    }

    const entry = this._history[this._historyIndex];
    this._historyIndex--;

    if (entry.batch) {
      // Undo batch
      entry.changes.reverse().forEach(({ key, oldValue }) => {
        this.set(key, oldValue, { recordHistory: false });
      });
    } else {
      this.set(entry.key, entry.oldValue, { recordHistory: false });
    }

    eventBus.emit('state:undo', entry);
    return true;
  }

  /**
   * Redo the last undone change
   */
  redo() {
    if (this._historyIndex >= this._history.length - 1) {
      return false;
    }

    this._historyIndex++;
    const entry = this._history[this._historyIndex];

    if (entry.batch) {
      entry.changes.forEach(({ key, value }) => {
        this.set(key, value, { recordHistory: false });
      });
    } else {
      this.set(entry.key, entry.value, { recordHistory: false });
    }

    eventBus.emit('state:redo', entry);
    return true;
  }

  /**
   * Check if undo is available
   */
  canUndo() {
    return this._historyIndex >= 0;
  }

  /**
   * Check if redo is available
   */
  canRedo() {
    return this._historyIndex < this._history.length - 1;
  }

  /**
   * Reset state to initial values
   * @param {Object} initialState - New initial state
   */
  reset(initialState = {}) {
    this._state = { ...initialState };
    this._history = [];
    this._historyIndex = -1;
    this._computed.forEach((entry) => (entry.valid = false));

    eventBus.emit('state:reset', { state: this._state });
  }

  /**
   * Serialize state to JSON
   */
  toJSON() {
    return JSON.stringify(this._state, (key, value) => {
      if (value instanceof Set) {
        return { __type: 'Set', values: [...value] };
      }
      if (value instanceof Map) {
        return { __type: 'Map', entries: [...value.entries()] };
      }
      return value;
    });
  }

  /**
   * Load state from JSON
   * @param {string} json - Serialized state
   */
  fromJSON(json) {
    const state = JSON.parse(json, (key, value) => {
      if (value?.__type === 'Set') {
        return new Set(value.values);
      }
      if (value?.__type === 'Map') {
        return new Map(value.entries);
      }
      return value;
    });

    this.batch(state);
  }

  // Private methods

  _notifyWatchers(key, value, oldValue) {
    if (this._watchers.has(key)) {
      this._watchers.get(key).forEach((cb) => {
        try {
          cb(value, oldValue, key);
        } catch (error) {
          console.error(`Error in watcher for ${key}:`, error);
        }
      });
    }

    // Also notify parent watchers for nested keys
    if (key.includes('.')) {
      const parts = key.split('.');
      for (let i = parts.length - 1; i > 0; i--) {
        const parentKey = parts.slice(0, i).join('.');
        if (this._watchers.has(parentKey)) {
          this._watchers.get(parentKey).forEach((cb) => {
            cb(this.get(parentKey), undefined, key);
          });
        }
      }
    }
  }

  _invalidateComputed(changedKey) {
    this._computed.forEach((entry, name) => {
      if (entry.deps.includes(changedKey)) {
        entry.valid = false;
      }
    });
  }

  _recordHistory(key, oldValue, newValue) {
    // Remove any future history if we're not at the end
    if (this._historyIndex < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }

    this._history.push({
      key,
      oldValue: this._clone(oldValue),
      value: this._clone(newValue),
      timestamp: Date.now(),
    });

    // Trim history if too long
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    } else {
      this._historyIndex++;
    }
  }

  _recordBatchHistory(changes) {
    if (this._historyIndex < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }

    this._history.push({
      batch: true,
      changes: changes.map((c) => ({
        key: c.key,
        oldValue: this._clone(c.oldValue),
        value: this._clone(c.value),
      })),
      timestamp: Date.now(),
    });

    if (this._history.length > this._maxHistory) {
      this._history.shift();
    } else {
      this._historyIndex++;
    }
  }

  _isEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return a === b;

    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (const item of a) {
        if (!b.has(item)) return false;
      }
      return true;
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) => this._isEqual(item, b[i]));
    }

    if (typeof a === 'object' && typeof b === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every((key) => this._isEqual(a[key], b[key]));
    }

    return false;
  }

  _clone(value) {
    if (value == null) return value;
    if (value instanceof Set) return new Set(value);
    if (value instanceof Map) return new Map(value);
    if (Array.isArray(value)) return value.map((v) => this._clone(v));
    if (typeof value === 'object') {
      const cloned = {};
      for (const key in value) {
        cloned[key] = this._clone(value[key]);
      }
      return cloned;
    }
    return value;
  }
}

// Create default store with genomics-focused initial state
export const store = new Store({
  // Selection state
  selectedSamples: new Set(),
  selectedGenes: new Set(),
  selectedMutations: new Set(),

  // Hover state
  hoveredItem: null,
  hoveredType: null,

  // Zoom/region state
  zoomRegion: null, // { chr, start, end }
  zoomLevel: 1,

  // Filter state
  filters: {
    minExpression: 0,
    maxExpression: Infinity,
    minVAF: 0,
    maxVAF: 1,
    geneType: 'all',
    sampleGroups: [],
  },

  // View state
  activeView: null,
  viewLayout: 'grid',
});

// Define useful computed properties
store.computed(
  'hasSelection',
  (state) => {
    return (
      state.selectedSamples.size > 0 ||
      state.selectedGenes.size > 0 ||
      state.selectedMutations.size > 0
    );
  },
  ['selectedSamples', 'selectedGenes', 'selectedMutations']
);

store.computed(
  'selectionCount',
  (state) => {
    return state.selectedSamples.size + state.selectedGenes.size + state.selectedMutations.size;
  },
  ['selectedSamples', 'selectedGenes', 'selectedMutations']
);
