[← Back to Tutorials Index](../../README.md)

---

# Tutorial 4.8: Linked Views & Multi-Panel Coordination

## Overview

This tutorial implements a coordinated multi-view visualization system where selections in one panel update related panels. This is a core pattern in ProteinPaint and other genomic visualization tools where exploring data across multiple representations is essential.

## Learning Objectives

By completing this tutorial, you will learn:

1. **Event Bus Architecture** - Decoupled component communication
2. **Shared Selection State** - Coordinating selections across views
3. **Multiple Visualization Types** - Expression plots, mutation panels, data tables
4. **Brush-based Selection** - D3.js brushing for range selection
5. **Reactive Updates** - Efficient re-rendering on state changes

## Project Structure

```
08-linked-views/
├── index.html              # Main HTML page
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── README.md               # This file
└── src/
    ├── main.ts             # Application entry point
    ├── styles.css          # Component styles
    ├── types/
    │   └── index.ts        # Shared type definitions
    ├── data/
    │   └── sampleData.ts   # Multi-dimensional sample data
    ├── state/
    │   ├── EventBus.ts     # Pub/sub event system
    │   └── SelectionStore.ts # Shared selection state
    └── components/
        ├── LinkedViewsContainer.ts # Main container
        ├── ExpressionRankPlot.ts   # Gene expression visualization
        ├── MutationPanel.ts        # Mutation summary panel
        └── SampleTable.ts          # Sortable data table
```

## Key Concepts

### 1. Event Bus Pattern

Decoupled communication between components:

```typescript
class EventBus {
  private listeners: Map<string, Set<Function>> = new Map();

  emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((fn) => fn(data));
  }

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
    return () => this.listeners.get(event)?.delete(callback);
  }
}
```

### 2. Selection Store

Centralized selection state:

```typescript
interface Selection {
  type: 'click' | 'brush' | 'lasso';
  samples: string[];
  source: string;
  timestamp: number;
}

class SelectionStore {
  private selection: Selection | null = null;
  private subscribers: Set<(s: Selection | null) => void> = new Set();

  setSelection(selection: Selection): void {
    this.selection = selection;
    this.subscribers.forEach((fn) => fn(selection));
  }
}
```

### 3. Coordinated Views Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Event Bus                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐    │
│  │ Expression  │──│  Selection  │──│  Mutation  │ Sample │    │
│  │ Rank Plot   │  │   Store     │  │   Panel    │ Table  │    │
│  └─────────────┘  └─────────────┘  └──────────────────────┘    │
│        │                 │                    │                  │
│        └─────────────────┼────────────────────┘                  │
│                          │                                       │
│                    State Changes                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. D3.js Brush for Selection

Drag-to-select in scatter plots:

```typescript
const brush = d3
  .brush()
  .extent([
    [0, 0],
    [width, height],
  ])
  .on('end', (event) => {
    if (!event.selection) return;

    const [[x0, y0], [x1, y1]] = event.selection;
    const selectedSamples = data.filter(
      (d) => xScale(d.x) >= x0 && xScale(d.x) <= x1 && yScale(d.y) >= y0 && yScale(d.y) <= y1
    );

    selectionStore.setSelection({
      type: 'brush',
      samples: selectedSamples.map((d) => d.id),
      source: 'expression-plot',
    });
  });
```

### 5. Reactive Panel Updates

Each component subscribes to selection changes:

```typescript
class MutationPanel {
  constructor(private store: SelectionStore) {
    store.subscribe((selection) => {
      this.highlightSamples(selection?.samples || []);
    });
  }

  highlightSamples(sampleIds: string[]): void {
    this.container
      .selectAll('.mutation-bar')
      .classed('highlighted', (d) => sampleIds.includes(d.sampleId));
  }
}
```

## Running the Tutorial

### Quick Start

```bash
cd tutorials/phase-4-production/08-linked-views
npm install
npm run dev
```

The visualization will be available at **http://localhost:5183**

### What You'll See

1. **Expression Rank Plot** - Scatter plot with brushable selection
2. **Mutation Panel** - Bar chart showing mutation counts per gene
3. **Sample Table** - Sortable table with sample details
4. **Linked Highlighting** - Select samples in any view to highlight across all views

## Interaction Patterns

| Action          | Source          | Effect                                         |
| --------------- | --------------- | ---------------------------------------------- |
| Brush selection | Expression Plot | Highlights samples in table and mutation panel |
| Row click       | Sample Table    | Highlights point in scatter plot               |
| Bar click       | Mutation Panel  | Filters to samples with that mutation          |
| Clear button    | Any             | Clears all selections                          |

## Exercises

### Exercise 1: Add Lasso Selection

Implement freeform lasso selection in the scatter plot.

### Exercise 2: Add Selection History

Store selection history with undo/redo capability.

### Exercise 3: Add Filter Chaining

Allow combining multiple selections (AND/OR logic).

## Connection to ProteinPaint

This pattern is fundamental to ProteinPaint's multi-view architecture:

| Feature           | This Tutorial  | ProteinPaint      |
| ----------------- | -------------- | ----------------- |
| Event system      | EventBus       | Message bus       |
| State management  | SelectionStore | Shared state      |
| Coordinated views | Linked panels  | Multi-track views |
| Brush selection   | D3 brush       | Custom brush      |

---

## 🎯 Interview Preparation Q&A

### Q1: How do you implement an event bus for view coordination?

**Answer:**

```typescript
class EventBus {
  private listeners: Map<string, Set<Function>> = new Map();

  on(event: string, callback: Function): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data: any, source?: string): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((cb) => cb(data, source));
    }
  }

  // Typed events for safety
  emitSelection(samples: string[], source: string): void {
    this.emit('selection:change', { samples, source }, source);
  }
}

// Usage
const bus = new EventBus();

// Subscribe
const unsubscribe = bus.on('selection:change', ({ samples, source }) => {
  if (source !== 'table') {
    // Prevent self-update
    table.highlight(samples);
  }
});

// Emit
scatterPlot.on('brush', (samples) => {
  bus.emitSelection(samples, 'scatter');
});
```

---

### Q2: How do you manage shared selection state across views?

**Answer:**

```typescript
class SelectionStore {
  private state = {
    selectedSamples: new Set<string>(),
    selectedGene: null as string | null,
    highlightedRegion: null as { start: number; end: number } | null,
  };

  private subscribers: ((state: typeof this.state) => void)[] = [];

  // Immutable updates
  selectSamples(samples: string[], mode: 'replace' | 'add' | 'toggle' = 'replace') {
    const newSet = new Set(mode === 'replace' ? samples : this.state.selectedSamples);

    if (mode === 'add') {
      samples.forEach((s) => newSet.add(s));
    } else if (mode === 'toggle') {
      samples.forEach((s) => {
        newSet.has(s) ? newSet.delete(s) : newSet.add(s);
      });
    }

    this.state = { ...this.state, selectedSamples: newSet };
    this.notify();
  }

  subscribe(callback: (state: typeof this.state) => void) {
    this.subscribers.push(callback);
    callback(this.state); // Initial call
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== callback);
    };
  }

  private notify() {
    this.subscribers.forEach((cb) => cb(this.state));
  }
}
```

**Selection modes:**

- Replace: Clear existing, select new
- Add: Union with existing
- Toggle: XOR with existing

---

### Q3: How do you implement D3 brush-based selection?

**Answer:**

```typescript
function setupBrush(
  svg: d3.Selection<SVGGElement>,
  xScale: d3.ScaleLinear<number, number>,
  yScale: d3.ScaleLinear<number, number>,
  data: DataPoint[],
  onSelect: (selected: DataPoint[]) => void
) {
  const brush = d3
    .brush()
    .extent([
      [0, 0],
      [width, height],
    ])
    .on('brush', brushed)
    .on('end', brushEnded);

  svg.append('g').attr('class', 'brush').call(brush);

  function brushed(event: d3.D3BrushEvent<unknown>) {
    if (!event.selection) return;

    const [[x0, y0], [x1, y1]] = event.selection as [[number, number], [number, number]];

    // Find points within brush rectangle
    const selected = data.filter((d) => {
      const x = xScale(d.x);
      const y = yScale(d.y);
      return x >= x0 && x <= x1 && y >= y0 && y <= y1;
    });

    // Highlight during brush
    svg.selectAll('circle').classed('brushed', (d) => selected.includes(d));
  }

  function brushEnded(event: d3.D3BrushEvent<unknown>) {
    if (!event.selection) {
      onSelect([]); // Clear if brush dismissed
      return;
    }
    // Final selection
    const selected = getSelectedPoints(event.selection);
    onSelect(selected);
  }
}
```

---

### Q4: How do you handle performance with many linked views?

**Answer:**

```typescript
class OptimizedLinkedViews {
  private updateQueue: Set<string> = new Set();
  private rafId: number | null = null;

  // Batch updates to single animation frame
  scheduleUpdate(viewId: string) {
    this.updateQueue.add(viewId);

    if (!this.rafId) {
      this.rafId = requestAnimationFrame(() => {
        this.flushUpdates();
        this.rafId = null;
      });
    }
  }

  private flushUpdates() {
    const views = [...this.updateQueue];
    this.updateQueue.clear();

    // Update all pending views
    views.forEach((viewId) => {
      this.views.get(viewId)?.render();
    });
  }

  // Debounce rapid selection changes
  private debouncedSelect = debounce((samples: string[]) => {
    this.store.selectSamples(samples);
  }, 16); // ~60fps

  // Use requestIdleCallback for non-critical updates
  updateTable(data: any[]) {
    requestIdleCallback(
      () => {
        this.table.setData(data);
      },
      { timeout: 100 }
    );
  }
}
```

**Optimization strategies:**

1. Batch updates with requestAnimationFrame
2. Debounce rapid selection changes
3. Use requestIdleCallback for non-critical updates
4. Virtual rendering for large tables/lists

---

### Q5: How does ProteinPaint implement its linked view system?

**Answer:**
**ProteinPaint linking patterns:**

1. **Block-level coordination:**

   ```javascript
   // All tracks in a block share region
   block.on('region-change', (region) => {
     tracks.forEach((track) => track.setRegion(region));
   });
   ```

2. **Cross-block communication:**

   ```javascript
   // Matrix view ↔ Lollipop plot
   matrixView.on('sample-select', (samples) => {
     lollipopPlot.highlightSamples(samples);
   });

   lollipopPlot.on('mutation-click', (mutation) => {
     matrixView.filterByMutation(mutation);
   });
   ```

3. **App-level state:**

   ```javascript
   // Global app state
   app.state = {
     selectedSamples: [],
     selectedGenes: [],
     filters: {},
     region: { chr, start, end },
   };

   // Views subscribe to relevant state slices
   scatterPlot.observe((state) => state.selectedSamples);
   ```

4. **Performance patterns:**
   - Lazy data loading per region
   - Virtual scrolling in sample lists
   - Canvas rendering for dense data
   - Request coalescing for API calls

---

## Next Steps

- [Tutorial 4.9: Config Schema & Validation](../09-config-system/README.md)
