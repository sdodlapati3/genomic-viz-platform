[← Back to Phase 1](../README.md)

---

# Tutorial 1.5: Performance Optimization for Genomic Visualization

> Render millions of data points smoothly with Canvas, virtualization, and Web Workers

## Overview

Genomic datasets are massive. A whole-genome view might have:

- **3+ billion base pairs** (human genome)
- **Millions of variants** (population data)
- **Thousands of coverage points** per gene

Standard D3.js/SVG approaches break down at this scale. This tutorial teaches production-grade techniques used by tools like ProteinPaint, IGV.js, and the UCSC Genome Browser.

## Learning Objectives

By the end of this tutorial, you will be able to:

- [ ] Understand SVG vs Canvas performance tradeoffs
- [ ] Build a Canvas-based genomic renderer
- [ ] Implement virtualized rendering for large datasets
- [ ] Use Web Workers for off-thread computation
- [ ] Apply level-of-detail (LOD) rendering
- [ ] Profile and optimize rendering performance

## Prerequisites

- Tutorial 1.4 (Genome Browser basics)
- JavaScript Canvas API familiarity helpful
- Understanding of requestAnimationFrame

## Project Structure

```
05-performance/
├── package.json
├── vite.config.js
├── index.html
├── README.md
├── public/
│   └── data/
├── src/
│   ├── main.js
│   ├── styles.css
│   ├── renderers/
│   │   ├── svgRenderer.js      # Baseline SVG renderer
│   │   ├── canvasRenderer.js   # High-performance Canvas
│   │   └── hybridRenderer.js   # SVG + Canvas combined
│   ├── virtualization/
│   │   ├── viewportManager.js  # Visible region tracking
│   │   └── dataWindow.js       # Smart data loading
│   ├── workers/
│   │   ├── dataProcessor.worker.js
│   │   └── aggregator.worker.js
│   └── examples/
│       ├── 01-svg-limits.js
│       ├── 02-canvas-basics.js
│       ├── 03-virtualization.js
│       ├── 04-web-workers.js
│       └── 05-combined.js
└── exercises/
```

## Getting Started

```bash
cd tutorials/phase-1-frontend/05-performance
npm install
npm run dev
```

Open **http://localhost:5173**

## Key Concepts

### The Scale Problem

| Dataset           | Data Points | SVG Performance | Canvas Performance |
| ----------------- | ----------- | --------------- | ------------------ |
| 100 mutations     | 100         | ✅ 60fps        | ✅ 60fps           |
| 10,000 mutations  | 10,000      | ⚠️ 30fps        | ✅ 60fps           |
| 100,000 variants  | 100,000     | ❌ <5fps        | ⚠️ 30fps           |
| 1,000,000+ points | 1,000,000   | ❌ Crashes      | ✅ 60fps\*         |

\*With virtualization and LOD

### SVG vs Canvas

```
┌───────────────────────────────────────────────────────────────┐
│                           SVG                                  │
├───────────────────────────────────────────────────────────────┤
│ ✅ Retained mode (DOM nodes persist)                          │
│ ✅ Built-in events (click, hover per element)                 │
│ ✅ CSS styling                                                │
│ ✅ Easy D3.js integration                                     │
│ ❌ DOM overhead per element                                   │
│ ❌ Slow repaints with many elements                           │
│ → Best for: <10,000 elements, interactive charts             │
└───────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                          Canvas                                │
├───────────────────────────────────────────────────────────────┤
│ ✅ Immediate mode (draw and forget)                           │
│ ✅ Constant memory regardless of elements                     │
│ ✅ GPU acceleration for 2D operations                         │
│ ❌ Manual hit testing for interactions                        │
│ ❌ No built-in accessibility                                  │
│ → Best for: >10,000 elements, dense visualizations           │
└───────────────────────────────────────────────────────────────┘
```

### Virtualization Strategy

Only render what's visible:

```
┌─────────────────────────────────────────────────────────────┐
│ Full Dataset: chr17 (81 million bp)                          │
│ ████████████████████████████████████████████████████████████│
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ Viewport: 100,000 bp visible                                 │
│ ░░░░░░░░░░░░░░░░████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│                  ↑                                           │
│           Only render this                                   │
└─────────────────────────────────────────────────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────┐
│ With Buffer Zone: 150,000 bp loaded                          │
│ ░░░░░░░░░░░░░▓▓▓████████▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
│              ↑           ↑                                   │
│           Buffer zones for smooth panning                    │
└─────────────────────────────────────────────────────────────┘
```

### Level of Detail (LOD)

Aggregate data at different zoom levels:

```
Zoom Level 1 (Chromosome view):
├── 1 bar per 100,000 bp (summary statistics)

Zoom Level 2 (Region view):
├── 1 bar per 1,000 bp (medium detail)

Zoom Level 3 (Gene view):
├── 1 bar per 10 bp (high detail)

Zoom Level 4 (Base view):
└── Individual data points
```

## API Reference

### CanvasRenderer

```javascript
const renderer = new CanvasRenderer(canvas, {
  width: 1200,
  height: 400,
  pixelRatio: window.devicePixelRatio,
});

renderer.setRegion('chr17', 7668402, 7687550);
renderer.setData(mutations);
renderer.render();
```

### ViewportManager

```javascript
const viewport = new ViewportManager({
  containerWidth: 1200,
  minBpPerPixel: 0.1,
  maxBpPerPixel: 100000,
});

viewport.on('change', ({ chromosome, start, end, bpPerPixel }) => {
  renderer.setRegion(chromosome, start, end);
  renderer.render();
});
```

### Web Worker Usage

```javascript
// Main thread
const worker = new Worker('./workers/aggregator.worker.js', { type: 'module' });

worker.postMessage({
  type: 'aggregate',
  data: mutations,
  binSize: 1000,
});

worker.onmessage = (e) => {
  const { bins } = e.data;
  renderer.setData(bins);
  renderer.render();
};
```

## Performance Benchmarks

Run the benchmark suite:

```bash
npm run benchmark
```

Expected results on modern hardware:

| Scenario    | SVG   | Canvas | Canvas + Virtual |
| ----------- | ----- | ------ | ---------------- |
| 1K points   | 60fps | 60fps  | 60fps            |
| 10K points  | 25fps | 60fps  | 60fps            |
| 100K points | 2fps  | 45fps  | 60fps            |
| 1M points   | crash | 15fps  | 60fps            |

## Exercises

### Exercise 1: Canvas Hit Testing

Implement click detection on canvas-rendered mutations.

### Exercise 2: Infinite Scroll

Create a virtualized mutation list that loads data on demand.

### Exercise 3: Worker-Based Aggregation

Use a Web Worker to compute coverage statistics.

## Next Steps

After completing this tutorial:

- Apply Canvas rendering to Genome Browser (Phase 1.4)
- Use virtualization in large scatter plots (Phase 3.1)
- Integrate with binary format streaming (Phase 2.5)

---

## Resources

- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [React Virtualized](https://github.com/bvaughn/react-virtualized) (concepts apply to vanilla JS)
- [ProteinPaint Source](https://github.com/stjude/proteinpaint) (real-world examples)

---

_Tutorial 1.5 - Performance Optimization_
