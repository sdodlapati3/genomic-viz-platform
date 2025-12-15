/**
 * Selection Manager - Handles selection state across coordinated views
 *
 * Provides unified selection API with support for:
 * - Single/multi selection modes
 * - Brush (2D range) selection
 * - Selection history and persistence
 */

import { eventBus, Events } from './EventBus.js';
import { store } from './Store.js';

export const SelectionMode = {
  SINGLE: 'single', // Only one item selected at a time
  MULTI: 'multi', // Multiple items (default)
  RANGE: 'range', // Contiguous range (for tables)
  BRUSH: 'brush', // 2D brush region
};

export class SelectionManager {
  constructor() {
    this.mode = SelectionMode.MULTI;
    this.source = null; // Track which view initiated selection
    this._history = [];
    this._maxHistory = 20;
  }

  /**
   * Set selection mode
   * @param {string} mode - One of SelectionMode values
   */
  setMode(mode) {
    if (!Object.values(SelectionMode).includes(mode)) {
      throw new Error(`Invalid selection mode: ${mode}`);
    }
    this.mode = mode;
    eventBus.emit(Events.SELECTION_MODE, { mode });
  }

  /**
   * Get current selection mode
   */
  getMode() {
    return this.mode;
  }

  /**
   * Select items
   * @param {string} type - 'sample', 'gene', or 'mutation'
   * @param {Array} ids - IDs to select
   * @param {Object} options - { additive, source, silent }
   */
  select(type, ids, options = {}) {
    const { additive = false, source = null, silent = false } = options;

    this.source = source;

    const key = this._getStoreKey(type);
    const current = store.get(key);

    let newSelection;

    switch (this.mode) {
      case SelectionMode.SINGLE:
        // Only keep the last selected item
        newSelection = new Set(ids.length > 0 ? [ids[ids.length - 1]] : []);
        break;

      case SelectionMode.MULTI:
        if (additive) {
          newSelection = new Set([...current, ...ids]);
        } else {
          newSelection = new Set(ids);
        }
        break;

      case SelectionMode.RANGE:
      case SelectionMode.BRUSH:
        // Range/brush replaces selection
        newSelection = new Set(ids);
        break;

      default:
        newSelection = new Set(ids);
    }

    // Record history
    this._recordHistory(type, current, newSelection);

    // Update store
    store.set(key, newSelection);

    if (!silent) {
      eventBus.emit(Events.SELECTION_CHANGE, {
        type,
        ids: [...newSelection],
        previousIds: [...current],
        source,
        additive,
        mode: this.mode,
      });
    }

    return [...newSelection];
  }

  /**
   * Deselect items
   * @param {string} type - 'sample', 'gene', or 'mutation'
   * @param {Array} ids - IDs to deselect
   */
  deselect(type, ids, options = {}) {
    const { source = null, silent = false } = options;

    const key = this._getStoreKey(type);
    const current = store.get(key);

    const newSelection = new Set(current);
    ids.forEach((id) => newSelection.delete(id));

    this._recordHistory(type, current, newSelection);

    store.set(key, newSelection);

    if (!silent) {
      eventBus.emit(Events.SELECTION_CHANGE, {
        type,
        ids: [...newSelection],
        previousIds: [...current],
        source,
        removed: ids,
        mode: this.mode,
      });
    }

    return [...newSelection];
  }

  /**
   * Toggle selection of an item
   * @param {string} type - 'sample', 'gene', or 'mutation'
   * @param {string} id - ID to toggle
   */
  toggle(type, id, options = {}) {
    if (this.isSelected(type, id)) {
      return this.deselect(type, [id], options);
    } else {
      return this.select(type, [id], { ...options, additive: true });
    }
  }

  /**
   * Clear selection for a type
   * @param {string} type - 'sample', 'gene', 'mutation', or 'all'
   */
  clear(type = 'all', options = {}) {
    const { source = null, silent = false } = options;

    if (type === 'all') {
      ['sample', 'gene', 'mutation'].forEach((t) => this.clear(t, options));
      return;
    }

    const key = this._getStoreKey(type);
    const current = store.get(key);

    if (current.size === 0) {
      return;
    }

    this._recordHistory(type, current, new Set());

    store.set(key, new Set());

    if (!silent) {
      eventBus.emit(Events.SELECTION_CLEAR, {
        type,
        previousIds: [...current],
        source,
      });
    }
  }

  /**
   * Check if an item is selected
   */
  isSelected(type, id) {
    const key = this._getStoreKey(type);
    return store.get(key).has(id);
  }

  /**
   * Get all selected items of a type
   * @param {string} type - 'sample', 'gene', or 'mutation'
   * @returns {Array}
   */
  getSelected(type) {
    const key = this._getStoreKey(type);
    return [...store.get(key)];
  }

  /**
   * Get selection count
   * @param {string} type - Optional type filter
   */
  getCount(type = null) {
    if (type) {
      return store.get(this._getStoreKey(type)).size;
    }
    return (
      store.get('selectedSamples').size +
      store.get('selectedGenes').size +
      store.get('selectedMutations').size
    );
  }

  /**
   * Check if anything is selected
   */
  hasSelection() {
    return this.getCount() > 0;
  }

  /**
   * Set selection from brush region
   * @param {Object} bounds - { x0, y0, x1, y1 }
   * @param {Array} data - Data points to filter
   * @param {Function} accessor - (d) => { x, y } position accessor
   */
  selectFromBrush(type, bounds, data, accessor, options = {}) {
    const { x0, y0, x1, y1 } = bounds;

    const selectedIds = data
      .filter((d) => {
        const { x, y } = accessor(d);
        return x >= x0 && x <= x1 && y >= y0 && y <= y1;
      })
      .map((d) => d.id);

    this.select(type, selectedIds, { ...options, mode: SelectionMode.BRUSH });

    eventBus.emit(Events.SELECTION_BRUSH, {
      type,
      bounds,
      ids: selectedIds,
      source: options.source,
    });

    return selectedIds;
  }

  /**
   * Invert selection
   * @param {string} type - Selection type
   * @param {Array} allIds - All possible IDs
   */
  invert(type, allIds, options = {}) {
    const current = new Set(this.getSelected(type));
    const inverted = allIds.filter((id) => !current.has(id));
    return this.select(type, inverted, options);
  }

  /**
   * Select all
   * @param {string} type - Selection type
   * @param {Array} allIds - All IDs to select
   */
  selectAll(type, allIds, options = {}) {
    return this.select(type, allIds, options);
  }

  /**
   * Undo last selection change
   */
  undo() {
    if (this._history.length === 0) {
      return false;
    }

    const entry = this._history.pop();
    const key = this._getStoreKey(entry.type);

    store.set(key, entry.previous, { recordHistory: false });

    eventBus.emit(Events.SELECTION_CHANGE, {
      type: entry.type,
      ids: [...entry.previous],
      source: 'undo',
      isUndo: true,
    });

    return true;
  }

  /**
   * Get selection as URL parameters for sharing
   */
  toURLParams() {
    const params = new URLSearchParams();

    const samples = this.getSelected('sample');
    const genes = this.getSelected('gene');
    const mutations = this.getSelected('mutation');

    if (samples.length > 0) {
      params.set('samples', samples.join(','));
    }
    if (genes.length > 0) {
      params.set('genes', genes.join(','));
    }
    if (mutations.length > 0) {
      params.set('mutations', mutations.join(','));
    }

    return params.toString();
  }

  /**
   * Restore selection from URL parameters
   */
  fromURLParams(searchParams) {
    const params = new URLSearchParams(searchParams);

    const samples = params.get('samples');
    const genes = params.get('genes');
    const mutations = params.get('mutations');

    if (samples) {
      this.select('sample', samples.split(','), { silent: true });
    }
    if (genes) {
      this.select('gene', genes.split(','), { silent: true });
    }
    if (mutations) {
      this.select('mutation', mutations.split(','), { silent: true });
    }

    // Emit combined event after loading
    eventBus.emit(Events.SELECTION_CHANGE, {
      type: 'all',
      source: 'url',
      restored: true,
    });
  }

  // Private methods

  _getStoreKey(type) {
    const typeMap = {
      sample: 'selectedSamples',
      gene: 'selectedGenes',
      mutation: 'selectedMutations',
    };

    const key = typeMap[type];
    if (!key) {
      throw new Error(`Invalid selection type: ${type}`);
    }
    return key;
  }

  _recordHistory(type, previous, current) {
    this._history.push({
      type,
      previous: new Set(previous),
      current: new Set(current),
      timestamp: Date.now(),
    });

    if (this._history.length > this._maxHistory) {
      this._history.shift();
    }
  }
}

// Singleton instance
export const selections = new SelectionManager();

// Helper: Create CSS class string based on selection state
export function getSelectionClasses(type, id, options = {}) {
  const { selectedClass = 'selected', hoveredClass = 'hovered' } = options;

  const classes = [];

  if (selections.isSelected(type, id)) {
    classes.push(selectedClass);
  }

  const hovered = store.get('hoveredItem');
  if (hovered === id) {
    classes.push(hoveredClass);
  }

  return classes.join(' ');
}
