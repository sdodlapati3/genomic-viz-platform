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

## Next Steps

- [Tutorial 4.9: Config Schema & Validation](../09-config-system/README.md)
