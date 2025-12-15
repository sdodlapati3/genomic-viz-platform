# Implementation Plan: Multi-View Coordination (Phase 5.1)

> Build professional linked visualizations with shared state and synchronized interactions

## Overview

ProteinPaint excels at coordinating multiple views - brushing in a scatter plot updates the lollipop, filtering mutations updates survival curves, etc. Our tutorials teach visualizations in isolation. This tutorial bridges that gap with professional-grade view coordination patterns.

---

## Learning Objectives

By the end of this tutorial, students will be able to:

1. Implement state management for multi-view applications
2. Create linked brushing between visualizations
3. Build coordinated zoom/pan across genome views
4. Implement filter propagation across views
5. Export coordinated views as publication figures
6. Handle performance with many synchronized views

---

## Tutorial Structure

```
phase-5-integration/
└── 01-multi-view/
    ├── README.md
    ├── package.json
    ├── index.html
    ├── vite.config.js
    ├── start-tutorial.sh
    ├── src/
    │   ├── main.js
    │   ├── styles.css
    │   ├── state/
    │   │   ├── store.js            # Central state store
    │   │   ├── actions.js          # State actions
    │   │   └── selectors.js        # State selectors
    │   ├── coordination/
    │   │   ├── EventBus.js         # Pub/sub event system
    │   │   ├── LinkedBrush.js      # Brush coordination
    │   │   ├── SyncedZoom.js       # Zoom synchronization
    │   │   └── FilterManager.js    # Filter propagation
    │   ├── components/
    │   │   ├── CoordinatedScatter.js
    │   │   ├── CoordinatedLollipop.js
    │   │   ├── CoordinatedSurvival.js
    │   │   ├── CoordinatedHeatmap.js
    │   │   └── FilterPanel.js
    │   ├── layouts/
    │   │   ├── DashboardLayout.js
    │   │   ├── SplitView.js
    │   │   └── GridLayout.js
    │   ├── export/
    │   │   ├── SVGExporter.js
    │   │   ├── PNGExporter.js
    │   │   └── MultiViewExporter.js
    │   └── 01-state-management.js
    │       02-event-coordination.js
    │       03-linked-brushing.js
    │       04-synced-navigation.js
    │       05-filter-propagation.js
    │       06-export-pipeline.js
    │       07-full-dashboard.js
    └── exercises/
        ├── exercise-1.md
        ├── exercise-2.md
        └── solutions/
```

---

## Module 1: State Management

### 1.1 Central State Store

```javascript
// src/state/store.js

/**
 * Simple but effective state management for genomic visualizations
 * Inspired by Redux but lighter weight
 */

export class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Set();
    this.middleware = [];
  }

  getState() {
    return this.state;
  }

  setState(updater) {
    const prevState = this.state;

    // Support both object and function updaters
    const newState =
      typeof updater === 'function' ? updater(prevState) : { ...prevState, ...updater };

    // Run middleware
    for (const mw of this.middleware) {
      mw(prevState, newState);
    }

    this.state = newState;

    // Notify listeners
    this.listeners.forEach((listener) => {
      listener(newState, prevState);
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  use(middleware) {
    this.middleware.push(middleware);
  }

  // Selector support for efficient updates
  select(selector) {
    let prevValue = selector(this.state);

    return (callback) => {
      return this.subscribe((state) => {
        const newValue = selector(state);
        if (newValue !== prevValue) {
          callback(newValue, prevValue);
          prevValue = newValue;
        }
      });
    };
  }
}

// Create the application store
export const store = new Store({
  // Data
  mutations: [],
  samples: [],
  clinicalData: [],
  expressionMatrix: null,

  // View state
  selectedSamples: new Set(),
  highlightedMutation: null,

  // Filters
  filters: {
    mutationType: [],
    chromosome: null,
    minCount: 0,
    sampleGroup: null,
  },

  // Navigation
  genomicRegion: {
    chromosome: 'chr17',
    start: 7668402,
    end: 7687550,
  },

  // UI state
  activeView: 'dashboard',
  panelSizes: { left: 0.3, center: 0.4, right: 0.3 },
});

// Middleware for logging
store.use((prev, next) => {
  console.log('State change:', {
    prev,
    next,
    changed: Object.keys(next).filter((k) => prev[k] !== next[k]),
  });
});
```

### 1.2 Actions

```javascript
// src/state/actions.js

import { store } from './store.js';

// Data actions
export const actions = {
  // Load data
  loadMutations(mutations) {
    store.setState({ mutations });
  },

  loadSamples(samples) {
    store.setState({ samples });
  },

  // Selection actions
  selectSamples(sampleIds) {
    store.setState((state) => ({
      selectedSamples: new Set(sampleIds),
    }));
  },

  addToSelection(sampleId) {
    store.setState((state) => ({
      selectedSamples: new Set([...state.selectedSamples, sampleId]),
    }));
  },

  removeFromSelection(sampleId) {
    store.setState((state) => {
      const selected = new Set(state.selectedSamples);
      selected.delete(sampleId);
      return { selectedSamples: selected };
    });
  },

  clearSelection() {
    store.setState({ selectedSamples: new Set() });
  },

  // Highlight actions (for hover)
  highlightMutation(mutation) {
    store.setState({ highlightedMutation: mutation });
  },

  clearHighlight() {
    store.setState({ highlightedMutation: null });
  },

  // Filter actions
  setFilter(filterName, value) {
    store.setState((state) => ({
      filters: { ...state.filters, [filterName]: value },
    }));
  },

  resetFilters() {
    store.setState({
      filters: {
        mutationType: [],
        chromosome: null,
        minCount: 0,
        sampleGroup: null,
      },
    });
  },

  // Navigation actions
  setGenomicRegion(region) {
    store.setState({ genomicRegion: region });
  },

  zoomToGene(gene) {
    store.setState({
      genomicRegion: {
        chromosome: gene.chromosome,
        start: gene.start - 1000, // Add padding
        end: gene.end + 1000,
      },
    });
  },

  panRegion(delta) {
    store.setState((state) => ({
      genomicRegion: {
        ...state.genomicRegion,
        start: state.genomicRegion.start + delta,
        end: state.genomicRegion.end + delta,
      },
    }));
  },
};
```

### 1.3 Selectors

```javascript
// src/state/selectors.js

import { store } from './store.js';

export const selectors = {
  // Get mutations filtered by current filters
  getFilteredMutations(state) {
    let mutations = state.mutations;
    const { filters } = state;

    if (filters.mutationType.length > 0) {
      mutations = mutations.filter((m) => filters.mutationType.includes(m.type));
    }

    if (filters.chromosome) {
      mutations = mutations.filter((m) => m.chromosome === filters.chromosome);
    }

    if (filters.minCount > 0) {
      mutations = mutations.filter((m) => m.count >= filters.minCount);
    }

    return mutations;
  },

  // Get samples with selected mutations
  getSamplesWithMutation(state, mutationId) {
    const mutation = state.mutations.find((m) => m.id === mutationId);
    if (!mutation) return [];

    return state.samples.filter((s) => mutation.samples.includes(s.id));
  },

  // Get mutations in selected samples
  getMutationsInSelectedSamples(state) {
    if (state.selectedSamples.size === 0) {
      return state.mutations;
    }

    return state.mutations.filter((m) => m.samples.some((s) => state.selectedSamples.has(s)));
  },

  // Get clinical data for selected samples
  getClinicalForSelected(state) {
    if (state.selectedSamples.size === 0) {
      return state.clinicalData;
    }

    return state.clinicalData.filter((c) => state.selectedSamples.has(c.sampleId));
  },

  // Get mutations in current genomic region
  getMutationsInRegion(state) {
    const { chromosome, start, end } = state.genomicRegion;

    return state.mutations.filter(
      (m) => m.chromosome === chromosome && m.position >= start && m.position <= end
    );
  },
};

// Create memoized selectors
export function createSelector(selector, dependencies = []) {
  let cache = null;
  let prevDeps = null;

  return (state) => {
    const currentDeps = dependencies.map((dep) =>
      typeof dep === 'function' ? dep(state) : state[dep]
    );

    const depsChanged = !prevDeps || currentDeps.some((d, i) => d !== prevDeps[i]);

    if (depsChanged) {
      cache = selector(state);
      prevDeps = currentDeps;
    }

    return cache;
  };
}
```

---

## Module 2: Event Coordination

### 2.1 Event Bus

```javascript
// src/coordination/EventBus.js

/**
 * Publish-subscribe event system for view coordination
 * Decouples components while enabling communication
 */

export class EventBus {
  constructor() {
    this.subscribers = new Map();
    this.history = []; // For debugging
    this.maxHistory = 100;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {function} callback - Handler function
   * @param {object} options - { once: boolean, priority: number }
   * @returns {function} Unsubscribe function
   */
  on(event, callback, options = {}) {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, []);
    }

    const subscriber = {
      callback,
      once: options.once || false,
      priority: options.priority || 0,
    };

    const subs = this.subscribers.get(event);
    subs.push(subscriber);

    // Sort by priority (higher first)
    subs.sort((a, b) => b.priority - a.priority);

    // Return unsubscribe function
    return () => {
      const index = subs.indexOf(subscriber);
      if (index > -1) {
        subs.splice(index, 1);
      }
    };
  }

  /**
   * Subscribe to an event once
   */
  once(event, callback) {
    return this.on(event, callback, { once: true });
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    // Record history
    this.history.push({
      event,
      data,
      timestamp: Date.now(),
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    const subs = this.subscribers.get(event);
    if (!subs) return;

    // Create a copy to allow modifications during iteration
    const subsToCall = [...subs];

    subsToCall.forEach((sub) => {
      try {
        sub.callback(data);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }

      if (sub.once) {
        const index = subs.indexOf(sub);
        if (index > -1) {
          subs.splice(index, 1);
        }
      }
    });
  }

  /**
   * Remove all subscribers for an event
   */
  off(event) {
    this.subscribers.delete(event);
  }

  /**
   * Get event history for debugging
   */
  getHistory(event = null) {
    if (event) {
      return this.history.filter((h) => h.event === event);
    }
    return this.history;
  }
}

// Event types
export const Events = {
  // Selection events
  SAMPLES_SELECTED: 'samples:selected',
  SAMPLE_HIGHLIGHTED: 'sample:highlighted',
  MUTATION_SELECTED: 'mutation:selected',
  MUTATION_HIGHLIGHTED: 'mutation:highlighted',

  // Navigation events
  REGION_CHANGED: 'region:changed',
  ZOOM_CHANGED: 'zoom:changed',
  PAN_STARTED: 'pan:started',
  PAN_ENDED: 'pan:ended',

  // Filter events
  FILTER_CHANGED: 'filter:changed',
  FILTERS_RESET: 'filters:reset',

  // Data events
  DATA_LOADED: 'data:loaded',
  DATA_UPDATED: 'data:updated',

  // View events
  VIEW_READY: 'view:ready',
  VIEW_RESIZED: 'view:resized',
};

// Create singleton instance
export const eventBus = new EventBus();
```

### 2.2 Linked Brushing

```javascript
// src/coordination/LinkedBrush.js

import { eventBus, Events } from './EventBus.js';
import { store } from '../state/store.js';
import { actions } from '../state/actions.js';

/**
 * Coordinate brushing/selection across multiple views
 */

export class LinkedBrush {
  constructor(options = {}) {
    this.views = new Map(); // viewId -> view instance
    this.brushing = false;
    this.activeBrushView = null;

    this.setupListeners();
  }

  /**
   * Register a view for linked brushing
   */
  registerView(viewId, view, options = {}) {
    this.views.set(viewId, {
      instance: view,
      dataAccessor: options.dataAccessor || ((d) => d),
      idAccessor: options.idAccessor || ((d) => d.id),
      bidirectional: options.bidirectional !== false,
    });

    // Setup view's brush handler
    if (view.onBrush) {
      view.onBrush((selection) => {
        this.handleBrush(viewId, selection);
      });
    }
  }

  /**
   * Unregister a view
   */
  unregisterView(viewId) {
    this.views.delete(viewId);
  }

  /**
   * Handle brush event from a view
   */
  handleBrush(sourceViewId, selection) {
    if (this.brushing && this.activeBrushView !== sourceViewId) {
      return; // Prevent loops
    }

    this.brushing = true;
    this.activeBrushView = sourceViewId;

    const sourceView = this.views.get(sourceViewId);
    if (!sourceView) return;

    // Extract IDs from selection
    const selectedIds = selection.map((d) => sourceView.idAccessor(d));

    // Update central state
    actions.selectSamples(selectedIds);

    // Emit event for non-registered listeners
    eventBus.emit(Events.SAMPLES_SELECTED, {
      source: sourceViewId,
      ids: selectedIds,
      data: selection,
    });

    // Update other views
    this.views.forEach((view, viewId) => {
      if (viewId !== sourceViewId && view.bidirectional) {
        this.updateView(viewId, selectedIds);
      }
    });

    this.brushing = false;
    this.activeBrushView = null;
  }

  /**
   * Update a view with selected IDs
   */
  updateView(viewId, selectedIds) {
    const view = this.views.get(viewId);
    if (!view || !view.instance.highlightSelection) return;

    view.instance.highlightSelection(selectedIds);
  }

  /**
   * Setup global listeners
   */
  setupListeners() {
    // Listen for selection changes from state
    store.select((state) => state.selectedSamples)((selected) => {
      if (!this.brushing) {
        // External state change, update all views
        const ids = Array.from(selected);
        this.views.forEach((view, viewId) => {
          this.updateView(viewId, ids);
        });
      }
    });
  }

  /**
   * Clear all brushes
   */
  clearAll() {
    actions.clearSelection();

    this.views.forEach((view) => {
      if (view.instance.clearBrush) {
        view.instance.clearBrush();
      }
    });

    eventBus.emit(Events.SAMPLES_SELECTED, {
      source: 'linkedBrush',
      ids: [],
      data: [],
    });
  }
}

// Singleton instance
export const linkedBrush = new LinkedBrush();
```

---

## Module 3: Coordinated Components

### 3.1 Coordinated Scatter Plot

```javascript
// src/components/CoordinatedScatter.js

import * as d3 from 'd3';
import { store } from '../state/store.js';
import { linkedBrush } from '../coordination/LinkedBrush.js';
import { eventBus, Events } from '../coordination/EventBus.js';

export class CoordinatedScatter {
  constructor(container, options = {}) {
    this.container = container;
    this.width = options.width || 500;
    this.height = options.height || 400;
    this.margin = { top: 20, right: 20, bottom: 40, left: 50 };

    this.brushCallbacks = [];

    this.setup();
    this.registerWithLinkedBrush();
    this.subscribeToState();
  }

  setup() {
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    this.plotArea = this.svg
      .append('g')
      .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

    // Scales
    this.xScale = d3.scaleLinear().range([0, this.width - this.margin.left - this.margin.right]);

    this.yScale = d3.scaleLinear().range([this.height - this.margin.top - this.margin.bottom, 0]);

    // Brush
    this.brush = d3
      .brush()
      .extent([
        [0, 0],
        [
          this.width - this.margin.left - this.margin.right,
          this.height - this.margin.top - this.margin.bottom,
        ],
      ])
      .on('start brush end', (event) => this.handleBrush(event));

    this.plotArea.append('g').attr('class', 'brush').call(this.brush);

    // Axes
    this.xAxis = this.plotArea
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.height - this.margin.top - this.margin.bottom})`);

    this.yAxis = this.plotArea.append('g').attr('class', 'y-axis');
  }

  registerWithLinkedBrush() {
    linkedBrush.registerView('scatter', this, {
      idAccessor: (d) => d.sampleId,
    });
  }

  subscribeToState() {
    // Listen for data changes
    store.subscribe((state, prevState) => {
      if (state.samples !== prevState.samples) {
        this.render(state.samples);
      }
    });

    // Listen for highlight events
    eventBus.on(Events.SAMPLE_HIGHLIGHTED, ({ sampleId }) => {
      this.highlightPoint(sampleId);
    });
  }

  render(data) {
    this.data = data;

    // Update scales
    this.xScale.domain(d3.extent(data, (d) => d.x));
    this.yScale.domain(d3.extent(data, (d) => d.y));

    // Update axes
    this.xAxis.call(d3.axisBottom(this.xScale));
    this.yAxis.call(d3.axisLeft(this.yScale));

    // Render points
    const points = this.plotArea.selectAll('.point').data(data, (d) => d.sampleId);

    points
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('r', 4)
      .merge(points)
      .attr('cx', (d) => this.xScale(d.x))
      .attr('cy', (d) => this.yScale(d.y))
      .attr('fill', (d) => d.color || '#4169E1')
      .on('mouseenter', (event, d) => {
        eventBus.emit(Events.SAMPLE_HIGHLIGHTED, { sampleId: d.sampleId });
      })
      .on('mouseleave', () => {
        eventBus.emit(Events.SAMPLE_HIGHLIGHTED, { sampleId: null });
      });

    points.exit().remove();
  }

  handleBrush(event) {
    if (!event.selection) {
      this.brushCallbacks.forEach((cb) => cb([]));
      return;
    }

    const [[x0, y0], [x1, y1]] = event.selection;

    const selected = this.data.filter((d) => {
      const x = this.xScale(d.x);
      const y = this.yScale(d.y);
      return x >= x0 && x <= x1 && y >= y0 && y <= y1;
    });

    this.brushCallbacks.forEach((cb) => cb(selected));
  }

  onBrush(callback) {
    this.brushCallbacks.push(callback);
  }

  highlightSelection(sampleIds) {
    const idSet = new Set(sampleIds);

    this.plotArea
      .selectAll('.point')
      .classed('selected', (d) => idSet.has(d.sampleId))
      .attr('r', (d) => (idSet.has(d.sampleId) ? 6 : 4))
      .attr('stroke', (d) => (idSet.has(d.sampleId) ? '#333' : 'none'))
      .attr('stroke-width', 2);
  }

  highlightPoint(sampleId) {
    this.plotArea
      .selectAll('.point')
      .classed('highlighted', (d) => d.sampleId === sampleId)
      .attr('r', (d) => (d.sampleId === sampleId ? 8 : this.isSelected(d.sampleId) ? 6 : 4));
  }

  isSelected(sampleId) {
    return store.getState().selectedSamples.has(sampleId);
  }

  clearBrush() {
    this.plotArea.select('.brush').call(this.brush.move, null);
  }
}
```

### 3.2 Coordinated Lollipop

```javascript
// src/components/CoordinatedLollipop.js

import * as d3 from 'd3';
import { store } from '../state/store.js';
import { selectors } from '../state/selectors.js';
import { eventBus, Events } from '../coordination/EventBus.js';

export class CoordinatedLollipop {
  constructor(container, options = {}) {
    this.container = container;
    this.width = options.width || 800;
    this.height = options.height || 250;

    this.setup();
    this.subscribeToState();
  }

  setup() {
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', this.height);

    // Create groups for layers
    this.domainGroup = this.svg.append('g').attr('class', 'domains');
    this.lollipopGroup = this.svg.append('g').attr('class', 'lollipops');

    // Scales
    this.xScale = d3.scaleLinear().range([50, this.width - 50]);
    this.yScale = d3.scaleLinear().range([180, 30]);
    this.radiusScale = d3.scaleSqrt().range([3, 15]);

    // Color scale for mutation types
    this.colorScale = d3
      .scaleOrdinal()
      .domain(['missense', 'nonsense', 'frameshift', 'splice', 'silent'])
      .range(['#4DAF4A', '#E41A1C', '#984EA3', '#FF7F00', '#999999']);
  }

  subscribeToState() {
    // Subscribe to filtered mutations (respects global filters)
    store.subscribe((state) => {
      const mutations = selectors.getMutationsInSelectedSamples(state);
      const filtered = selectors.getFilteredMutations({
        ...state,
        mutations,
      });
      this.render(filtered, state.genomicRegion);
    });

    // Listen for mutation highlight
    eventBus.on(Events.MUTATION_HIGHLIGHTED, ({ mutation }) => {
      this.highlightMutation(mutation);
    });

    // Listen for region changes
    eventBus.on(Events.REGION_CHANGED, ({ region }) => {
      this.updateRegion(region);
    });
  }

  render(mutations, region) {
    if (!mutations || mutations.length === 0) {
      this.clear();
      return;
    }

    this.mutations = mutations;
    this.region = region;

    // Update scales
    this.xScale.domain([region.start, region.end]);
    this.yScale.domain([0, d3.max(mutations, (d) => d.count) || 10]);
    this.radiusScale.domain([1, d3.max(mutations, (d) => d.count) || 10]);

    // Render lollipops
    const lollipops = this.lollipopGroup.selectAll('.lollipop').data(mutations, (d) => d.id);

    // Enter
    const enter = lollipops.enter().append('g').attr('class', 'lollipop');

    enter.append('line').attr('class', 'stem');

    enter.append('circle').attr('class', 'head');

    // Update
    const merged = enter.merge(lollipops);

    merged
      .select('.stem')
      .attr('x1', (d) => this.xScale(d.position))
      .attr('y1', 180)
      .attr('x2', (d) => this.xScale(d.position))
      .attr('y2', (d) => this.yScale(d.count))
      .attr('stroke', (d) => this.colorScale(d.type))
      .attr('stroke-width', 2);

    merged
      .select('.head')
      .attr('cx', (d) => this.xScale(d.position))
      .attr('cy', (d) => this.yScale(d.count))
      .attr('r', (d) => this.radiusScale(d.count))
      .attr('fill', (d) => this.colorScale(d.type))
      .on('mouseenter', (event, d) => {
        eventBus.emit(Events.MUTATION_HIGHLIGHTED, { mutation: d });
        this.showTooltip(event, d);
      })
      .on('mouseleave', () => {
        eventBus.emit(Events.MUTATION_HIGHLIGHTED, { mutation: null });
        this.hideTooltip();
      })
      .on('click', (event, d) => {
        eventBus.emit(Events.MUTATION_SELECTED, { mutation: d });
      });

    // Exit
    lollipops.exit().remove();

    // Update opacity based on selection
    this.updateSelectionOpacity();
  }

  updateSelectionOpacity() {
    const selectedSamples = store.getState().selectedSamples;

    if (selectedSamples.size === 0) {
      this.lollipopGroup.selectAll('.lollipop').attr('opacity', 1);
      return;
    }

    this.lollipopGroup.selectAll('.lollipop').attr('opacity', (d) => {
      // Check if mutation is in any selected sample
      const hasSelectedSample = d.samples.some((s) => selectedSamples.has(s));
      return hasSelectedSample ? 1 : 0.2;
    });
  }

  highlightMutation(mutation) {
    this.lollipopGroup
      .selectAll('.lollipop')
      .classed('highlighted', (d) => mutation && d.id === mutation.id);

    this.lollipopGroup
      .selectAll('.head')
      .attr('stroke', (d) => (mutation && d.id === mutation.id ? '#333' : 'none'))
      .attr('stroke-width', (d) => (mutation && d.id === mutation.id ? 2 : 0));
  }

  updateRegion(region) {
    this.xScale.domain([region.start, region.end]);

    // Animate transition
    this.lollipopGroup
      .selectAll('.stem')
      .transition()
      .duration(300)
      .attr('x1', (d) => this.xScale(d.position))
      .attr('x2', (d) => this.xScale(d.position));

    this.lollipopGroup
      .selectAll('.head')
      .transition()
      .duration(300)
      .attr('cx', (d) => this.xScale(d.position));
  }

  clear() {
    this.lollipopGroup.selectAll('*').remove();
  }

  showTooltip(event, d) {
    // Tooltip implementation
  }

  hideTooltip() {
    // Hide tooltip
  }
}
```

---

## Module 4: Full Dashboard

### 4.1 Dashboard Layout

```javascript
// src/layouts/DashboardLayout.js

import { CoordinatedScatter } from '../components/CoordinatedScatter.js';
import { CoordinatedLollipop } from '../components/CoordinatedLollipop.js';
import { CoordinatedSurvival } from '../components/CoordinatedSurvival.js';
import { CoordinatedHeatmap } from '../components/CoordinatedHeatmap.js';
import { FilterPanel } from '../components/FilterPanel.js';
import { store } from '../state/store.js';
import { linkedBrush } from '../coordination/LinkedBrush.js';

export class GenomicDashboard {
  constructor(container) {
    this.container = container;
    this.views = {};

    this.setupLayout();
    this.initializeViews();
    this.setupGlobalControls();
  }

  setupLayout() {
    this.container.innerHTML = `
      <div class="dashboard">
        <header class="dashboard-header">
          <h1>Genomic Analysis Dashboard</h1>
          <div class="global-controls">
            <button id="clear-selection">Clear Selection</button>
            <button id="reset-filters">Reset Filters</button>
            <button id="export-views">Export</button>
          </div>
        </header>
        
        <aside class="filter-panel" id="filter-panel"></aside>
        
        <main class="view-grid">
          <section class="view-panel" id="scatter-panel">
            <h3>Sample Distribution</h3>
            <div id="scatter-view"></div>
          </section>
          
          <section class="view-panel" id="lollipop-panel">
            <h3>Mutation Landscape</h3>
            <div id="lollipop-view"></div>
          </section>
          
          <section class="view-panel" id="survival-panel">
            <h3>Survival Analysis</h3>
            <div id="survival-view"></div>
          </section>
          
          <section class="view-panel" id="heatmap-panel">
            <h3>Expression Heatmap</h3>
            <div id="heatmap-view"></div>
          </section>
        </main>
        
        <footer class="dashboard-footer">
          <div id="selection-summary"></div>
        </footer>
      </div>
    `;
  }

  initializeViews() {
    // Initialize filter panel
    this.views.filters = new FilterPanel(document.getElementById('filter-panel'));

    // Initialize scatter plot
    this.views.scatter = new CoordinatedScatter(document.getElementById('scatter-view'), {
      width: 400,
      height: 300,
    });

    // Initialize lollipop plot
    this.views.lollipop = new CoordinatedLollipop(document.getElementById('lollipop-view'), {
      width: 500,
      height: 200,
    });

    // Initialize survival plot
    this.views.survival = new CoordinatedSurvival(document.getElementById('survival-view'), {
      width: 400,
      height: 300,
    });

    // Initialize heatmap
    this.views.heatmap = new CoordinatedHeatmap(document.getElementById('heatmap-view'), {
      width: 500,
      height: 300,
    });
  }

  setupGlobalControls() {
    document.getElementById('clear-selection').addEventListener('click', () => {
      linkedBrush.clearAll();
    });

    document.getElementById('reset-filters').addEventListener('click', () => {
      store.setState({
        filters: {
          mutationType: [],
          chromosome: null,
          minCount: 0,
          sampleGroup: null,
        },
      });
    });

    document.getElementById('export-views').addEventListener('click', () => {
      this.exportAllViews();
    });

    // Update selection summary
    store.subscribe((state) => {
      const count = state.selectedSamples.size;
      document.getElementById('selection-summary').textContent =
        count > 0 ? `${count} samples selected` : 'No selection';
    });
  }

  async loadData(dataSource) {
    // Load and set data
    const [mutations, samples, clinical, expression] = await Promise.all([
      dataSource.getMutations(),
      dataSource.getSamples(),
      dataSource.getClinicalData(),
      dataSource.getExpressionMatrix(),
    ]);

    store.setState({
      mutations,
      samples,
      clinicalData: clinical,
      expressionMatrix: expression,
    });
  }

  async exportAllViews() {
    const { MultiViewExporter } = await import('../export/MultiViewExporter.js');
    const exporter = new MultiViewExporter();

    await exporter.exportDashboard(this.views, {
      format: 'png',
      filename: 'genomic-dashboard.png',
    });
  }
}
```

---

## Module 5: Export Pipeline

### 5.1 Multi-View Exporter

```javascript
// src/export/MultiViewExporter.js

export class MultiViewExporter {
  constructor() {
    this.supportedFormats = ['svg', 'png', 'pdf'];
  }

  async exportDashboard(views, options = {}) {
    const format = options.format || 'png';
    const filename = options.filename || `dashboard-${Date.now()}.${format}`;

    // Collect all SVG elements
    const svgs = Object.entries(views)
      .filter(([key, view]) => view.svg)
      .map(([key, view]) => ({
        name: key,
        element: view.svg.node(),
      }));

    switch (format) {
      case 'svg':
        return this.exportAsSVG(svgs, filename);
      case 'png':
        return this.exportAsPNG(svgs, options);
      case 'pdf':
        return this.exportAsPDF(svgs, options);
    }
  }

  async exportAsSVG(svgs, filename) {
    // Create combined SVG
    const combined = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    combined.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

    let yOffset = 0;
    let maxWidth = 0;

    svgs.forEach(({ element }) => {
      const clone = element.cloneNode(true);
      const width = parseFloat(element.getAttribute('width'));
      const height = parseFloat(element.getAttribute('height'));

      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('transform', `translate(0, ${yOffset})`);
      g.appendChild(clone);
      combined.appendChild(g);

      yOffset += height + 20;
      maxWidth = Math.max(maxWidth, width);
    });

    combined.setAttribute('width', maxWidth);
    combined.setAttribute('height', yOffset);

    // Serialize and download
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(combined);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });

    this.download(blob, filename);
  }

  async exportAsPNG(svgs, options) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Calculate total size
    let totalHeight = 0;
    let maxWidth = 0;

    svgs.forEach(({ element }) => {
      totalHeight += parseFloat(element.getAttribute('height')) + 20;
      maxWidth = Math.max(maxWidth, parseFloat(element.getAttribute('width')));
    });

    canvas.width = maxWidth * 2; // 2x for retina
    canvas.height = totalHeight * 2;
    ctx.scale(2, 2);
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, maxWidth, totalHeight);

    let yOffset = 0;

    for (const { element } of svgs) {
      const svgString = new XMLSerializer().serializeToString(element);
      const img = await this.svgToImage(svgString);

      ctx.drawImage(img, 0, yOffset);
      yOffset += parseFloat(element.getAttribute('height')) + 20;
    }

    canvas.toBlob((blob) => {
      this.download(blob, options.filename);
    }, 'image/png');
  }

  svgToImage(svgString) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };

      img.onerror = reject;
      img.src = url;
    });
  }

  download(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
```

---

## Exercises

### Exercise 1: Add a New Coordinated View

Create a coordinated bar chart that shows mutation counts by type and responds to sample selection.

### Exercise 2: Implement Cross-View Filtering

Add the ability to click on a bar in the mutation type chart to filter all other views.

### Exercise 3: Custom Export Layout

Implement a custom export layout that arranges views in a 2x2 grid with titles.

---

## Success Criteria

- [ ] Central state management working
- [ ] Event bus for decoupled communication
- [ ] Linked brushing across 3+ views
- [ ] Filter propagation to all views
- [ ] Synchronized zoom/pan in genome views
- [ ] Multi-view export (SVG, PNG)
- [ ] 60fps performance with updates

---

_Implementation plan for Tutorial 5.1 - Multi-View Coordination_
