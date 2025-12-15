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

---

## 🎯 Interview Preparation Q&A

### Q1: How do you render protein domains with proper positioning?

**Answer:**

```typescript
interface ProteinDomain {
  name: string;
  start: number; // Amino acid position
  end: number;
  color: string;
}

function renderDomains(
  svg: d3.Selection<SVGGElement>,
  domains: ProteinDomain[],
  xScale: d3.ScaleLinear<number, number>
) {
  svg
    .selectAll('rect.domain')
    .data(domains)
    .join('rect')
    .attr('class', 'domain')
    .attr('x', (d) => xScale(d.start))
    .attr('width', (d) => xScale(d.end) - xScale(d.start))
    .attr('y', domainTrackY)
    .attr('height', domainHeight)
    .attr('fill', (d) => d.color)
    .attr('rx', 3); // Rounded corners

  // Add domain labels
  svg
    .selectAll('text.domain-label')
    .data(domains.filter((d) => d.end - d.start > minLabelWidth))
    .join('text')
    .text((d) => d.name)
    .attr('x', (d) => xScale((d.start + d.end) / 2))
    .attr('text-anchor', 'middle');
}
```

**Key considerations:**

- Only show labels if domain is wide enough
- Use consistent color scheme (functional domains)
- Handle overlapping domains

---

### Q2: How do you handle overlapping mutations in a lollipop plot?

**Answer:**

```typescript
function clusterMutations(mutations: Mutation[], threshold: number) {
  // Sort by position
  const sorted = [...mutations].sort((a, b) => a.position - b.position);
  const clusters: Mutation[][] = [];
  let currentCluster: Mutation[] = [];

  for (const mut of sorted) {
    if (currentCluster.length === 0 || mut.position - currentCluster[0].position < threshold) {
      currentCluster.push(mut);
    } else {
      clusters.push(currentCluster);
      currentCluster = [mut];
    }
  }
  if (currentCluster.length) clusters.push(currentCluster);

  return clusters.map((cluster) => ({
    position: cluster[0].position, // Use first position
    mutations: cluster,
    totalCount: cluster.reduce((sum, m) => sum + m.count, 0),
  }));
}

// Render with staggered heights
function renderLollipops(clustered: ClusteredMutation[]) {
  clustered.forEach((cluster, i) => {
    const staggerOffset = (i % 3) * 10; // Stagger to avoid overlap
    renderLollipop(cluster, baseHeight + staggerOffset);
  });
}
```

---

### Q3: How do you implement type-safe D3.js in TypeScript?

**Answer:**

```typescript
// Define data types explicitly
interface Mutation {
  id: string;
  position: number;
  aaChange: string;
  consequence: 'missense' | 'nonsense' | 'frameshift';
  count: number;
}

// Type the selection
const svg: d3.Selection<SVGSVGElement, unknown, null, undefined> = d3.select('#viz').append('svg');

// Type the data binding
const circles: d3.Selection<SVGCircleElement, Mutation, SVGGElement, unknown> = svg
  .selectAll<SVGCircleElement, Mutation>('circle')
  .data(mutations, (d) => d.id); // Key function typed

// Type event handlers
circles.on('click', (event: MouseEvent, d: Mutation) => {
  console.log(`Clicked mutation at position ${d.position}`);
});

// Type scales
const xScale: d3.ScaleLinear<number, number> = d3
  .scaleLinear()
  .domain([0, proteinLength])
  .range([margin.left, width - margin.right]);
```

**Benefits:**

- Catch errors at compile time
- IDE autocomplete for data properties
- Refactoring safety

---

### Q4: What component architecture works best for genomic visualizations?

**Answer:**

```typescript
// Base visualization component
abstract class VisualizationComponent<D, C extends Config> {
  protected svg: d3.Selection<SVGGElement>;
  protected data: D | null = null;
  protected config: C;

  constructor(container: HTMLElement, config: C) {
    this.config = config;
    this.svg = d3.select(container).append('svg').append('g');
  }

  abstract render(): void;

  setData(data: D) {
    this.data = data;
    this.render();
    return this;
  }

  updateConfig(config: Partial<C>) {
    this.config = { ...this.config, ...config };
    this.render();
    return this;
  }

  destroy() {
    this.svg.remove();
  }
}

// Specific component
class MutationTrack extends VisualizationComponent<Mutation[], MutationConfig> {
  render() {
    // D3 rendering logic
  }
}

// Composition
class ProteinPanel {
  private domainTrack: DomainTrack;
  private mutationTrack: MutationTrack;
  private tooltip: Tooltip;

  constructor(container: HTMLElement) {
    this.domainTrack = new DomainTrack(container, domainConfig);
    this.mutationTrack = new MutationTrack(container, mutationConfig);
    this.tooltip = new Tooltip(container);
  }
}
```

---

### Q5: How does ProteinPaint structure its mutation visualization?

**Answer:**
**ProteinPaint architecture:**

1. **Layered rendering:**

   ```
   Protein backbone (gray line)
        ↓
   Domain rectangles (colored)
        ↓
   Lollipop stems (vertical lines)
        ↓
   Mutation circles (sized by count)
        ↓
   Labels (on hover)
   ```

2. **Data structure:**

   ```typescript
   interface ProteinPaintMutation {
     aachange: string; // e.g., "R175H"
     chr: string;
     pos: number; // Genomic position
     codon: number; // Amino acid position
     class: string; // missense, nonsense, etc.
     samples: Sample[]; // Associated samples
   }
   ```

3. **Interactions:**
   - Hover: Show detailed tooltip with sample info
   - Click: Expand to show individual samples
   - Drag: Select multiple mutations
   - Zoom: Focus on protein region

4. **Performance:**
   - Group mutations at same position
   - Lazy-load sample details
   - Canvas rendering for many mutations

---

## Next Steps

- [Tutorial 4.8: Linked Views & Multi-Panel Coordination](../08-linked-views/README.md)
- [Tutorial 4.9: Config Schema & Validation](../09-config-system/README.md)
