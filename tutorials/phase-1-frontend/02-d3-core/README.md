[← Back to Tutorials Index](../../README.md)

---

# Tutorial 1.2: D3.js Core Concepts

> Master data-driven visualization with the D3.js library

## Learning Objectives

By the end of this tutorial, you will be able to:

- [ ] Use D3 selections to manipulate DOM elements
- [ ] Bind data to elements using the data join pattern
- [ ] Create scales for mapping data to visual properties
- [ ] Build and customize axes
- [ ] Implement enter/update/exit pattern for dynamic data
- [ ] Create smooth transitions and animations

## Prerequisites

- Tutorial 1.1 (SVG & Canvas Fundamentals)
- JavaScript ES6+ (arrow functions, array methods)

## Concepts Covered

### 1. Selections

```javascript
d3.select('#chart'); // Select single element
d3.selectAll('.bar'); // Select all matching elements
selection.append('rect'); // Add child element
selection.attr('x', 10); // Set attribute
selection.style('fill', 'blue'); // Set CSS style
```

### 2. Data Binding

```javascript
const data = [10, 20, 30, 40];

// Modern join pattern
svg
  .selectAll('rect')
  .data(data)
  .join('rect')
  .attr('height', (d) => d);

// Traditional enter/update/exit
const bars = svg.selectAll('rect').data(data);
bars.enter().append('rect'); // New elements
bars.attr('height', (d) => d); // Update existing
bars.exit().remove(); // Remove old
```

### 3. Scales

```javascript
// Linear scale (numbers → numbers)
const xScale = d3
  .scaleLinear()
  .domain([0, 100]) // Data range
  .range([0, 500]); // Pixel range

// Band scale (categories → positions)
const xBand = d3.scaleBand().domain(['A', 'B', 'C']).range([0, 500]).padding(0.1);

// Color scales
const color = d3.scaleOrdinal(d3.schemeCategory10);
const sequential = d3.scaleSequential(d3.interpolateBlues);
```

### 4. Axes

```javascript
const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('.1f'));

svg.append('g').attr('transform', `translate(0, ${height})`).call(xAxis);
```

### 5. Transitions

```javascript
selection
  .transition()
  .duration(750)
  .ease(d3.easeCubicInOut)
  .attr('height', (d) => yScale(d));
```

## Files

```
02-d3-core/
├── README.md
├── package.json
├── index.html
├── src/
│   ├── main.js                # Entry point, tab navigation
│   ├── 01-selections.js       # DOM manipulation
│   ├── 02-data-binding.js     # Data join pattern
│   ├── 03-scales.js           # All scale types
│   ├── 04-transitions.js      # Animations & axes
│   ├── 05-genomic-chart.js    # Complete genomic example
│   └── styles.css             # Styling
├── exercises/
│   └── ...
└── solutions/
    └── ...
```

## Code Walkthrough

### File: `src/01-selections.js` - DOM Manipulation

Demonstrates D3 selection methods:

```javascript
// select() vs selectAll()
d3.select('#demo .box'); // First matching
d3.selectAll('#demo .box'); // All matching

// Method chaining
svg
  .selectAll('circle')
  .data(circles)
  .join('circle')
  .attr('cx', (d) => d.cx)
  .attr('cy', (d) => d.cy)
  .attr('fill', '#3498db');
```

### File: `src/02-data-binding.js` - Enter/Update/Exit ⭐

The core D3 pattern for data-driven visualization:

```javascript
// Modern join() pattern
svg
  .selectAll('rect')
  .data(data)
  .join(
    (enter) => enter.append('rect').attr('fill', 'green'),
    (update) => update.attr('fill', 'blue'),
    (exit) => exit.remove()
  );
```

### File: `src/03-scales.js` - Scale Types

All scale types used in genomic visualization:

```javascript
// Linear: numbers → numbers
d3.scaleLinear().domain([0, 100]).range([0, 500]);

// Band: categories → positions (for bar charts)
d3.scaleBand().domain(['A', 'B', 'C']).range([0, 500]).padding(0.1);

// Sqrt: for area scaling (lollipop radii)
d3.scaleSqrt().domain([0, 1000]).range([3, 15]);

// Color scales
d3.scaleOrdinal(d3.schemeCategory10);
d3.scaleSequential(d3.interpolateBlues);
```

### File: `src/04-transitions.js` - Animations

Smooth transitions between states:

```javascript
selection
  .transition()
  .duration(750)
  .ease(d3.easeCubicInOut)
  .attr('height', (d) => yScale(d));
```

### File: `src/05-genomic-chart.js` - Complete Example ⭐

A full mutation frequency chart combining all concepts:

- Scales for position and count
- Axes with genomic formatting
- Bar/line/area chart options
- Tooltips on hover
- Animated transitions between views

## Getting Started

```bash
cd tutorials/phase-1-frontend/02-d3-core
npm install
npm run dev
```

## Key D3 Modules

| Module         | Purpose                    |
| -------------- | -------------------------- |
| d3-selection   | DOM manipulation           |
| d3-scale       | Data → Visual mapping      |
| d3-axis        | Axis generators            |
| d3-shape       | Line, area, arc generators |
| d3-transition  | Animations                 |
| d3-format      | Number formatting          |
| d3-time-format | Date formatting            |

## 🎯 ProteinPaint Connection

D3.js is the foundation of all ProteinPaint visualizations:

| Tutorial Concept                | ProteinPaint Usage                        |
| ------------------------------- | ----------------------------------------- |
| `d3.select()` / `selectAll()`   | DOM element access throughout codebase    |
| Data binding (`.data().join()`) | Rendering tracks, mutations, samples      |
| `d3.scaleLinear()`              | `block.exonsf` - genomic → screen mapping |
| `d3.scaleBand()`                | Bar charts, sample matrices               |
| `d3.scaleOrdinal()`             | Mutation type → color mapping             |
| `d3.axisBottom/Left()`          | Axes in all plots                         |
| Transitions                     | Smooth zoom/pan, data updates             |

### Key ProteinPaint Files Using D3

- `client/src/block.js` - Core genome browser using D3 scales
- `client/plots/*.js` - All visualization components
- `shared/mclass.ts` - Color scales for mutation classes
- `client/dom/` - D3-based DOM utilities

### The ProteinPaint Scale Pattern

```javascript
// ProteinPaint creates scales like this:
const exonsf = d3
  .scaleLinear()
  .domain([start, stop]) // Genomic coordinates
  .range([0, width]); // Screen pixels

// Inverse for click → position
const genomicPos = exonsf.invert(mouseX);
```

## Sample Output

```
┌─────────────────────────────────────────────────────────────┐
│  D3 Data Binding Demo                                       │
│                                                             │
│  Before update:  ■ ■ ■ ■                                    │
│  After update:   ■ ■ ■ ■ ■ ■  (enter: green)               │
│  After remove:   ■ ■ ■        (exit: removed)              │
│                                                             │
│  Scale Visualization:                                       │
│                                                             │
│  Data:    [0]─────────[50]─────────[100]                   │
│             ↓           ↓            ↓                      │
│  Pixels:  [0]─────────[250]────────[500]                   │
│                                                             │
│  Mutation Frequency Chart:                                  │
│                                                             │
│   900 │           ██                                        │
│   600 │      ██   ██ ██                                     │
│   300 │  ██  ██   ██ ██  ██                                │
│     0 └──┴───┴────┴──┴───┴──▶ Position                     │
│       125  175   248 273  282                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Exercises

### Exercise 1: Enter/Update/Exit Visualization

Create a visualization that demonstrates the enter/update/exit pattern:

**Requirements:**

- Display circles for an initial array `[10, 20, 30, 40]`
- Button to add elements (enter - green highlight)
- Button to remove elements (exit - fade out)
- Button to change values (update - blue highlight)

### Exercise 2: Multi-Scale Genomic Ruler

Build a genomic position ruler that uses multiple scales:

**Requirements:**

```javascript
const region = { chr: 'chr17', start: 7668402, end: 7687550 };
```

- Create xScale for position → pixels
- Create axis with formatted ticks (kb/Mb)
- Add click-to-position functionality
- Display: `Click position: chr17:7,675,234`

### Exercise 3: Animated Bar Chart

Create a bar chart with smooth transitions:

**Requirements:**

- Mutation count data for 5 genes
- Animated bars on initial render
- "Sort by count" button with animated reorder
- "Randomize" button with value transitions

**Hint:** Use `transition().duration(750)` for smooth animations.

## Next Steps

After completing this tutorial, proceed to [Tutorial 1.3: Mutation Lollipop Plot](../03-lollipop-plot/README.md).

---

[← Back to Tutorials Index](../../README.md)
