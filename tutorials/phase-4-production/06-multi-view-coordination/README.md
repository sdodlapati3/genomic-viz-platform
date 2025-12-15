# Tutorial 4.6: Multi-View Coordination

## Overview

Learn to build coordinated multi-view genomic visualizations where selections, zooms, and interactions in one view automatically update all related views. This pattern is essential for comprehensive genomic data exploration.

## Learning Objectives

By the end of this tutorial, you will be able to:

1. **Implement state management** for coordinated visualizations
2. **Build linked brushing** between multiple D3 views
3. **Create an event bus** for view communication
4. **Handle complex selection states** across views
5. **Optimize performance** with selective updates

## Prerequisites

- Completion of Phase 1-3 tutorials
- Understanding of D3.js data binding
- Familiarity with JavaScript event patterns
- Basic knowledge of state management concepts

## Concepts Covered

### 1. State Management Patterns

Multiple approaches to managing shared state:

```javascript
// Pattern 1: Centralized Store
const store = {
  selectedGene: null,
  selectedSamples: new Set(),
  zoomRegion: { chr: '1', start: 0, end: 1000000 },
  filters: { minVAF: 0, maxVAF: 1 },
};

// Pattern 2: Observable State
class ObservableState {
  constructor(initial) {
    this._state = initial;
    this._listeners = new Map();
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    const old = this._state[key];
    this._state[key] = value;
    this._notify(key, value, old);
  }
}
```

### 2. Linked Brushing

Selections in one view highlight corresponding data in others:

```javascript
// When user brushes in scatter plot
scatter.on('brush', (selection) => {
  const selectedIds = getPointsInBrush(selection);

  // Update all linked views
  heatmap.highlight(selectedIds);
  table.filterRows(selectedIds);
  lollipop.emphasize(selectedIds);
});
```

### 3. Event Bus Architecture

Decoupled communication between visualization components:

```javascript
class EventBus {
  constructor() {
    this.handlers = new Map();
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }

  emit(event, data) {
    const handlers = this.handlers.get(event) || [];
    handlers.forEach((h) => h(data));
  }
}
```

### 4. View Synchronization

Keep multiple views in sync during zoom/pan operations:

```javascript
// Synchronized genomic region views
const syncZoom = (region) => {
  genomeTrack.zoomTo(region);
  mutationTrack.zoomTo(region);
  coverageTrack.zoomTo(region);
  geneTrack.zoomTo(region);
};
```

## Project Structure

```
06-multi-view-coordination/
├── index.html              # Main entry point
├── package.json           # Dependencies
├── vite.config.js        # Build configuration
├── src/
│   ├── main.js           # Application entry
│   ├── state/
│   │   ├── EventBus.js   # Event communication
│   │   ├── Store.js      # Centralized state
│   │   └── Selections.js # Selection management
│   ├── components/
│   │   ├── ScatterPlot.js    # Gene expression scatter
│   │   ├── Heatmap.js        # Sample-gene heatmap
│   │   ├── LollipopTrack.js  # Mutation lollipop
│   │   ├── DataTable.js      # Filterable data table
│   │   └── GenomeTrack.js    # Chromosome view
│   └── utils/
│       ├── dataSync.js   # Data synchronization
│       └── brushUtils.js # Brush helpers
├── exercises/
│   ├── exercise-1.md     # Build filter coordination
│   └── exercise-2.md     # Add selection persistence
└── solutions/
```

## Quick Start

```bash
# Start the tutorial
./start-tutorial.sh

# Or manually:
npm install
npm run dev

# Open http://localhost:5178
```

## Architecture

### Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        Event Bus                             │
├─────────────────────────────────────────────────────────────┤
│  selection:change  │  zoom:change  │  filter:update         │
└─────────┬───────────────────┬────────────────┬──────────────┘
          │                   │                │
     ┌────▼────┐        ┌────▼────┐      ┌────▼────┐
     │ Scatter │◄──────►│ Heatmap │◄────►│ Lollipop│
     │  Plot   │        │  View   │      │  Track  │
     └────┬────┘        └────┬────┘      └────┬────┘
          │                   │                │
          └─────────┬─────────┴────────────────┘
                    │
              ┌─────▼─────┐
              │   Store   │
              │  (State)  │
              └───────────┘
```

### Selection States

```javascript
// Selection can have multiple modes
const SelectionMode = {
  SINGLE: 'single', // One item at a time
  MULTI: 'multi', // Multiple items
  RANGE: 'range', // Contiguous range
  BRUSH: 'brush', // 2D region
};

// Selection state structure
const selectionState = {
  mode: SelectionMode.MULTI,
  items: new Set(['sample1', 'sample2']),
  brushRegion: null,
  source: 'scatter-plot', // Which view initiated
};
```

## Implementation Guide

### Step 1: Create the Event Bus

```javascript
// src/state/EventBus.js
export class EventBus {
  constructor() {
    this.handlers = new Map();
    this.history = [];
    this.maxHistory = 100;
  }

  on(event, handler, options = {}) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }

    const entry = {
      handler,
      once: options.once || false,
      priority: options.priority || 0,
    };

    this.handlers.get(event).push(entry);

    // Sort by priority
    this.handlers.get(event).sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  off(event, handler) {
    const entries = this.handlers.get(event);
    if (entries) {
      const index = entries.findIndex((e) => e.handler === handler);
      if (index !== -1) {
        entries.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    // Record in history
    this.history.push({ event, data, timestamp: Date.now() });
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const entries = this.handlers.get(event) || [];
    const toRemove = [];

    entries.forEach((entry, index) => {
      entry.handler(data);
      if (entry.once) {
        toRemove.push(index);
      }
    });

    // Remove one-time handlers
    toRemove.reverse().forEach((i) => entries.splice(i, 1));
  }

  // Emit with debounce for high-frequency events
  emitDebounced(event, data, delay = 16) {
    if (!this._debounceTimers) {
      this._debounceTimers = new Map();
    }

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
}

// Singleton instance
export const eventBus = new EventBus();
```

### Step 2: Implement Centralized Store

```javascript
// src/state/Store.js
import { eventBus } from './EventBus.js';

export class Store {
  constructor(initialState = {}) {
    this._state = { ...initialState };
    this._watchers = new Map();
  }

  getState() {
    return { ...this._state };
  }

  get(key) {
    return this._state[key];
  }

  set(key, value) {
    const oldValue = this._state[key];

    // Check if actually changed
    if (this._isEqual(oldValue, value)) {
      return;
    }

    this._state[key] = value;

    // Notify watchers
    if (this._watchers.has(key)) {
      this._watchers.get(key).forEach((cb) => cb(value, oldValue));
    }

    // Emit to event bus
    eventBus.emit(`state:${key}`, { key, value, oldValue });
  }

  watch(key, callback) {
    if (!this._watchers.has(key)) {
      this._watchers.set(key, []);
    }
    this._watchers.get(key).push(callback);

    // Return unwatch function
    return () => {
      const watchers = this._watchers.get(key);
      const index = watchers.indexOf(callback);
      if (index !== -1) {
        watchers.splice(index, 1);
      }
    };
  }

  // Batch multiple updates
  batch(updates) {
    const changes = [];

    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = this._state[key];
      if (!this._isEqual(oldValue, value)) {
        this._state[key] = value;
        changes.push({ key, value, oldValue });
      }
    });

    // Notify after all changes
    changes.forEach(({ key, value, oldValue }) => {
      if (this._watchers.has(key)) {
        this._watchers.get(key).forEach((cb) => cb(value, oldValue));
      }
    });

    if (changes.length > 0) {
      eventBus.emit('state:batch', { changes });
    }
  }

  _isEqual(a, b) {
    if (a === b) return true;
    if (a instanceof Set && b instanceof Set) {
      if (a.size !== b.size) return false;
      for (const item of a) {
        if (!b.has(item)) return false;
      }
      return true;
    }
    return JSON.stringify(a) === JSON.stringify(b);
  }
}

// Default store instance
export const store = new Store({
  selectedSamples: new Set(),
  selectedGenes: new Set(),
  hoveredItem: null,
  zoomRegion: null,
  filters: {
    minExpression: 0,
    maxExpression: Infinity,
    geneType: 'all',
  },
});
```

### Step 3: Create Selection Manager

```javascript
// src/state/Selections.js
import { eventBus } from './EventBus.js';
import { store } from './Store.js';

export class SelectionManager {
  constructor() {
    this.mode = 'multi'; // single, multi, range
    this.source = null; // Track which view initiated selection
  }

  setMode(mode) {
    this.mode = mode;
    eventBus.emit('selection:mode', { mode });
  }

  select(type, ids, options = {}) {
    const { additive = false, source = null } = options;
    this.source = source;

    const key = `selected${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    const current = store.get(key);

    let newSelection;

    if (this.mode === 'single') {
      newSelection = new Set([ids[0]]);
    } else if (additive) {
      newSelection = new Set([...current, ...ids]);
    } else {
      newSelection = new Set(ids);
    }

    store.set(key, newSelection);

    eventBus.emit('selection:change', {
      type,
      ids: [...newSelection],
      source,
      additive,
    });
  }

  deselect(type, ids) {
    const key = `selected${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    const current = store.get(key);

    const newSelection = new Set(current);
    ids.forEach((id) => newSelection.delete(id));

    store.set(key, newSelection);

    eventBus.emit('selection:change', {
      type,
      ids: [...newSelection],
      source: this.source,
      removed: ids,
    });
  }

  clear(type) {
    const key = `selected${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    store.set(key, new Set());

    eventBus.emit('selection:clear', { type });
  }

  toggle(type, id, options = {}) {
    const key = `selected${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    const current = store.get(key);

    if (current.has(id)) {
      this.deselect(type, [id]);
    } else {
      this.select(type, [id], options);
    }
  }

  isSelected(type, id) {
    const key = `selected${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    return store.get(key).has(id);
  }

  getSelected(type) {
    const key = `selected${type.charAt(0).toUpperCase() + type.slice(1)}s`;
    return [...store.get(key)];
  }
}

export const selections = new SelectionManager();
```

### Step 4: Build Coordinated Views

See the `src/components/` directory for complete implementations of:

- **ScatterPlot.js**: Gene expression scatter with brush selection
- **Heatmap.js**: Sample-gene heatmap with row/column selection
- **LollipopTrack.js**: Mutation track with linked highlighting
- **DataTable.js**: Sortable/filterable table synced with visualizations

## Key Patterns

### Brush Coordination

```javascript
// In ScatterPlot.js
const brush = d3
  .brush()
  .extent([
    [0, 0],
    [width, height],
  ])
  .on('brush', brushed)
  .on('end', brushEnded);

function brushed(event) {
  if (!event.selection) return;

  const [[x0, y0], [x1, y1]] = event.selection;

  // Find points in brush
  const selected = data.filter((d) => {
    const x = xScale(d.x);
    const y = yScale(d.y);
    return x >= x0 && x <= x1 && y >= y0 && y <= y1;
  });

  // Update selection (debounced for performance)
  eventBus.emitDebounced('selection:brush', {
    source: 'scatter',
    ids: selected.map((d) => d.id),
    bounds: { x0, y0, x1, y1 },
  });
}
```

### Zoom Synchronization

```javascript
// Synchronized zoom across genomic tracks
const zoom = d3.zoom().scaleExtent([1, 1000]).on('zoom', zoomed);

function zoomed(event) {
  const { transform } = event;

  // Calculate genomic region from transform
  const region = {
    chr: currentChr,
    start: xScale.invert(transform.invertX(0)),
    end: xScale.invert(transform.invertX(width)),
  };

  // Emit to sync other views
  eventBus.emit('zoom:change', {
    source: 'genome-track',
    region,
    transform,
  });
}

// Other views listen and sync
eventBus.on('zoom:change', ({ region, source }) => {
  if (source !== 'mutation-track') {
    mutationTrack.zoomToRegion(region);
  }
});
```

### Filter Coordination

```javascript
// Filter state management
eventBus.on('filter:change', ({ filters }) => {
  store.set('filters', filters);
});

// Views react to filter changes
store.watch('filters', (filters) => {
  scatterPlot.applyFilters(filters);
  heatmap.applyFilters(filters);
  table.applyFilters(filters);
});
```

## Exercises

### Exercise 1: Filter Coordination

Build a filter panel that coordinates filters across all views:

- Expression level slider
- Gene type dropdown
- Sample group checkboxes
- Real-time updates across views

### Exercise 2: Selection Persistence

Implement selection state persistence:

- Save selections to URL parameters
- Restore selections on page load
- Support sharing links with selections

## Best Practices

1. **Debounce high-frequency events** (brush, zoom, hover)
2. **Use source tracking** to prevent infinite update loops
3. **Batch related state updates** for performance
4. **Clear selections appropriately** on data changes
5. **Provide visual feedback** during coordinated updates

## Next Steps

After completing this tutorial:

- Explore the capstone project combining all techniques
- Review production patterns in ProteinPaint
- Consider adding undo/redo support

---

## 🎯 Interview Preparation Q&A

### Q1: How do you implement linked brushing between multiple views?

**Answer:**

```javascript
class LinkedViews {
  constructor() {
    this.views = new Map();
    this.selection = new Set();
  }

  register(viewId, view) {
    this.views.set(viewId, view);
  }

  // Called when user brushes in any view
  onBrush(sourceViewId, selectedIds) {
    this.selection = new Set(selectedIds);

    // Update all other views
    for (const [viewId, view] of this.views) {
      if (viewId !== sourceViewId) {
        view.highlightSelection(this.selection);
      }
    }
  }
}

// View implementation
class ScatterPlot {
  highlightSelection(selectedIds) {
    this.svg
      .selectAll('circle')
      .classed('highlighted', (d) => selectedIds.has(d.id))
      .style('opacity', (d) => (selectedIds.has(d.id) ? 1 : 0.2));
  }
}
```

**Key patterns:**

1. Central coordinator tracks selection state
2. Source view excluded from updates (prevent loops)
3. Each view implements highlight interface

---

### Q2: How do you prevent infinite update loops in coordinated views?

**Answer:**

```javascript
class EventBus {
  constructor() {
    this.listeners = new Map();
    this.updating = new Set(); // Track in-progress updates
  }

  emit(event, data, source) {
    // Prevent recursion
    const updateKey = `${event}-${source}`;
    if (this.updating.has(updateKey)) return;

    this.updating.add(updateKey);

    const handlers = this.listeners.get(event) || [];
    for (const handler of handlers) {
      // Don't notify the source
      if (handler.source !== source) {
        handler.callback(data);
      }
    }

    this.updating.delete(updateKey);
  }
}

// Usage
bus.emit('selection', selectedIds, 'scatterPlot');
// scatterPlot won't receive its own event
```

**Strategies:**

1. **Source tracking** - Don't notify event source
2. **Update flags** - Track in-progress updates
3. **Debouncing** - Limit rapid successive updates
4. **Batching** - Combine multiple updates

---

### Q3: What state management pattern works best for genomic visualizations?

**Answer:**

```javascript
// Redux-like pattern for complex apps
class GenomicStore {
  constructor() {
    this.state = {
      selectedGene: null,
      selectedRegion: { chr: null, start: 0, end: 0 },
      selectedSamples: [],
      filters: { minVAF: 0, cancerTypes: [] },
      zoomLevel: 1,
    };
    this.subscribers = [];
  }

  // Immutable updates
  dispatch(action) {
    const oldState = this.state;

    switch (action.type) {
      case 'SELECT_GENE':
        this.state = { ...this.state, selectedGene: action.gene };
        break;
      case 'SET_REGION':
        this.state = { ...this.state, selectedRegion: action.region };
        break;
      case 'TOGGLE_SAMPLE':
        const samples = new Set(this.state.selectedSamples);
        action.selected ? samples.add(action.id) : samples.delete(action.id);
        this.state = { ...this.state, selectedSamples: [...samples] };
        break;
    }

    // Notify only if changed
    if (this.state !== oldState) {
      this.subscribers.forEach((fn) => fn(this.state, oldState));
    }
  }
}
```

**Choose based on complexity:**

- Simple: Event bus
- Medium: Observable state
- Complex: Redux-like store with actions

---

### Q4: How do you handle zoom coordination across views?

**Answer:**

```javascript
class ZoomCoordinator {
  constructor() {
    this.views = [];
    this.currentRegion = { chr: 'chr17', start: 7500000, end: 7700000 };
  }

  registerView(view) {
    this.views.push(view);

    // Set up zoom behavior
    view.zoom = d3
      .zoom()
      .scaleExtent([1, 1000])
      .on('zoom', (event) => {
        // Calculate new region from zoom transform
        const newRegion = this.transformToRegion(event.transform, view);
        this.setRegion(newRegion, view);
      });
  }

  setRegion(region, sourceView) {
    this.currentRegion = region;

    // Update all views
    this.views.forEach((view) => {
      if (view !== sourceView) {
        // Programmatically update zoom without firing event
        const transform = this.regionToTransform(region, view);
        view.svg.call(view.zoom.transform, transform);
      }
      view.renderRegion(region);
    });
  }

  // Convert pixel zoom to genomic coordinates
  transformToRegion(transform, view) {
    const scale = view.xScale.copy();
    const newScale = transform.rescaleX(scale);
    return {
      chr: this.currentRegion.chr,
      start: Math.floor(newScale.domain()[0]),
      end: Math.ceil(newScale.domain()[1]),
    };
  }
}
```

---

### Q5: How does ProteinPaint coordinate its multiple track views?

**Answer:**
**ProteinPaint coordination architecture:**

1. **Block-level coordination:**

   ```javascript
   // All tracks share genomic region
   block.setRegion({ chr, start, end });
   // Triggers update in: genes, mutations, coverage, etc.
   ```

2. **Track communication:**

   ```javascript
   // Tracks register with block
   class Track {
     constructor(block) {
       this.block = block;
       block.registerTrack(this);
     }

     // Called by block on region change
     onRegionChange(region) {
       this.fetchData(region).then(() => this.render());
     }

     // Emit selection to other tracks
     onMutationClick(mutation) {
       this.block.emit('mutation-select', mutation);
     }
   }
   ```

3. **Performance optimizations:**
   - Lazy loading - fetch data only for visible region
   - Request coalescing - batch rapid zoom updates
   - Virtual rendering - only render visible items
   - Caching - remember previously fetched regions

4. **Shared state:**
   ```javascript
   // GenomePaint global state
   state = {
     genome: 'hg38',
     region: { chr, start, end },
     selectedSamples: [],
     tracks: [],
     filters: {},
   };
   ```

---
