[← Back to Tutorials Index](../../README.md)

---

# Tutorial 4.7: Interactive Protein Panel

## Overview

This tutorial builds a production-ready protein mutation visualization panel inspired by St. Jude's ProteinPaint. It demonstrates how to create a type-safe, componentized D3.js visualization with proper separation of concerns.

## Learning Objectives

By completing this tutorial, you will learn:

1. **TypeScript with D3.js** - Strict typing for visualization components
2. **Component Architecture** - Reusable, testable visualization modules
3. **Domain Visualization** - Protein domains with proper positioning
4. **Mutation Lollipop Plots** - Genomic mutation representation
5. **Interactive Features** - Hover states, tooltips, filtering

## Project Structure

```
07-protein-panel/
├── index.html              # Main HTML page
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── README.md               # This file
└── src/
    ├── main.ts             # Application entry point
    ├── styles.css          # Component styles
    ├── types/
    │   └── index.ts        # TypeScript type definitions
    ├── data/
    │   └── tp53Data.ts     # Sample TP53 mutation data
    └── components/
        ├── ProteinPanel.ts # Main container component
        ├── ProteinTrack.ts # Protein backbone visualization
        ├── DomainTrack.ts  # Protein domain rectangles
        ├── MutationTrack.ts # Lollipop plot for mutations
        └── Tooltip.ts      # Hover tooltip component
```

## Key Concepts

### 1. TypeScript for Genomic Data

Strong typing ensures data integrity:

```typescript
interface Mutation {
  id: string;
  position: number;
  aaChange: string;
  consequence: 'missense' | 'nonsense' | 'frameshift' | 'splice';
  frequency?: number;
  samples?: string[];
}

interface ProteinDomain {
  name: string;
  start: number;
  end: number;
  color: string;
  description?: string;
}
```

### 2. Component-Based D3.js Architecture

Each visualization element is a separate, testable class:

```typescript
class MutationTrack {
  private container: d3.Selection<SVGGElement, unknown, null, undefined>;
  private xScale: d3.ScaleLinear<number, number>;

  constructor(container: SVGGElement, config: TrackConfig) {
    this.container = d3.select(container);
    this.xScale = d3.scaleLinear().domain([0, config.proteinLength]).range([0, config.width]);
  }

  render(mutations: Mutation[]): void {
    // Lollipop rendering logic
  }
}
```

### 3. Protein Domain Visualization

Domains are rendered as colored rectangles on the protein backbone:

```
┌────────────────────────────────────────────────────────────┐
│                    TP53 Protein (393 aa)                    │
│  ┌──────┐    ┌─────────────────────┐    ┌─────────────┐   │
│  │ TAD  │    │    DNA Binding      │    │   Tetramer  │   │
│  │1-42  │    │      95-289         │    │   324-356   │   │
│  └──────┘    └─────────────────────┘    └─────────────┘   │
│  ●     ●●   ●●●●●●●●●●●●●●●●●●●    ●●  ●                  │
│  R175H R248Q G245S  R273H  R282W                          │
└────────────────────────────────────────────────────────────┘
```

### 4. Interactive Tooltips

Context-sensitive information on hover:

```typescript
class Tooltip {
  show(event: MouseEvent, data: Mutation): void {
    this.element
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .html(
        `
        <strong>${data.aaChange}</strong><br/>
        Position: ${data.position}<br/>
        Type: ${data.consequence}
      `
      )
      .style('opacity', 1);
  }
}
```

## Running the Tutorial

### Quick Start

```bash
# From project root
cd tutorials/phase-4-production/07-protein-panel
npm install
npm run dev
```

The visualization will be available at **http://localhost:5181**

### What You'll See

1. **TP53 Protein Backbone** - Full-length protein representation
2. **Domain Regions** - Colored boxes for TAD, DNA Binding, Tetramerization domains
3. **Mutation Lollipops** - Circles on stems showing mutation positions
4. **Color-Coded Consequences** - Different colors for missense, nonsense, etc.
5. **Interactive Tooltips** - Detailed info on hover

## Exercises

### Exercise 1: Add Mutation Clustering

Modify the `MutationTrack` to cluster nearby mutations when they would overlap.

### Exercise 2: Add Zoom/Pan

Implement zoom behavior to focus on specific protein regions.

### Exercise 3: Add Filtering

Add controls to filter mutations by consequence type or frequency.

## Connection to ProteinPaint

This component mirrors key ProteinPaint patterns:

| Feature       | This Tutorial   | ProteinPaint       |
| ------------- | --------------- | ------------------ |
| Domains       | DomainTrack     | Domain rendering   |
| Mutations     | MutationTrack   | Lollipop plot      |
| Interactivity | Tooltip         | Rich tooltips      |
| Architecture  | Component-based | Modular components |

## Next Steps

- [Tutorial 4.8: Linked Views & Multi-Panel Coordination](../08-linked-views/README.md)
- [Tutorial 4.9: Config Schema & Validation](../09-config-system/README.md)
