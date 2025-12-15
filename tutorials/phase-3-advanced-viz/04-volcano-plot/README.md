[← Back to Tutorials Index](../../README.md)

---

# Tutorial 3.4: Volcano Plot for Differential Expression

## Overview

Learn to create interactive volcano plots for visualizing differential expression analysis results. Volcano plots are essential tools in genomics for identifying significantly up/down-regulated genes from RNA-seq or microarray experiments.

**This implementation uses Canvas rendering to handle 20,000+ genes smoothly!**

## Learning Objectives

- Understand volcano plot interpretation for differential expression
- Implement scatter plots with log-transformed axes
- Add interactive threshold controls
- Build gene search and filtering functionality
- **Use Canvas for high-performance rendering of large datasets**
- **Optimize mouse interactions with throttling**
- Display gene annotations on hover/click

## Volcano Plot Concepts

### Axes

- **X-axis**: log₂(Fold Change) - Magnitude of expression change
  - Positive values = upregulated in treatment vs control
  - Negative values = downregulated
- **Y-axis**: -log₁₀(p-value) - Statistical significance
  - Higher values = more significant

### Significance Thresholds

Genes are considered differentially expressed if:

- |log₂FC| > threshold (typically 1, meaning 2-fold change)
- Adjusted p-value < 0.05

### Color Coding

- **Red**: Significantly upregulated
- **Blue**: Significantly downregulated
- **Gray**: Not significant

## Key Features

### 1. Canvas + SVG Hybrid Rendering

We use **Canvas for points** (fast) and **SVG for axes/labels** (crisp):

```javascript
// Canvas for 20,000+ points
this.canvas = container.append('canvas');
this.ctx = this.canvas.node().getContext('2d');

// SVG overlay for axes, thresholds, labels
this.svg = container.append('svg').style('position', 'absolute');
```

### 2. Threshold Lines

```javascript
// Horizontal p-value threshold
const pThresholdY = yScale(-Math.log10(pValueThreshold));
svg.append('line').attr('y1', pThresholdY).attr('y2', pThresholdY).attr('stroke-dasharray', '5,5');

// Vertical fold change thresholds
[-fcThreshold, fcThreshold].forEach((fc) => {
  svg.append('line').attr('x1', xScale(fc)).attr('x2', xScale(fc));
});
```

### 2. Interactive Thresholds

Users can adjust thresholds dynamically:

```javascript
slider.on('input', (e) => {
  fcThreshold = e.target.value;
  volcanoPlot.setFCThreshold(fcThreshold);
  updateSummaryStats();
});
```

### 3. Gene Search with Throttled Mouse Events

Efficient hover detection with throttled events:

```javascript
// Throttle mouse events to every 50ms for performance
let lastCheck = 0;
svg.on('mousemove', function (event) {
  const now = Date.now();
  if (now - lastCheck < 50) return;
  lastCheck = now;

  // Find nearest point using linear search
  // (fast enough with pre-computed positions)
  const nearest = findNearest(x, y, maxDist);
});
```

### 4. Gene Labeling

Top significant genes are labeled:

```javascript
const topGenes = data
  .filter((d) => d.significant)
  .sort((a, b) => b.negLogP - a.negLogP)
  .slice(0, 15);
```

## Project Structure

```
04-volcano-plot/
├── index.html              # Main HTML with controls
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration (port 3009)
├── README.md               # This file
└── src/
    ├── main.js             # Application entry point
    ├── components/
    │   └── VolcanoPlot.js  # Main visualization (Canvas + SVG)
    └── data/
        └── deData.js       # DE data generation
```

## Code Walkthrough

### File: `src/main.js` - Entry Point

Initializes the volcano plot and handles UI controls (threshold sliders, gene search).

### File: `src/components/VolcanoPlot.js` - Canvas Visualization ⭐

Key patterns for high-performance rendering:

```javascript
class VolcanoPlot {
  constructor(container, data) {
    // Hybrid: Canvas for points, SVG for axes
    this.canvas = container.append('canvas');
    this.ctx = this.canvas.node().getContext('2d');
    this.svg = container.append('svg').style('position', 'absolute');
  }

  render() {
    this.ctx.clearRect(0, 0, width, height);

    // Batch rendering by color for performance
    const byColor = groupBy(this.data, (d) => d.color);
    Object.entries(byColor).forEach(([color, points]) => {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      points.forEach((d) => {
        this.ctx.moveTo(d.cx + 2, d.cy);
        this.ctx.arc(d.cx, d.cy, 2, 0, Math.PI * 2);
      });
      this.ctx.fill();
    });
  }

  // Throttled mouse detection
  handleHover(event) {
    const nearest = this.findNearest(event.offsetX, event.offsetY);
    if (nearest) this.showTooltip(nearest);
  }
}
```

### File: `src/data/deData.js` - Data Generation

Generates realistic differential expression data:

```javascript
export function generateDEData(numGenes = 20000) {
  return Array.from({ length: numGenes }, () => ({
    gene: randomGeneName(),
    log2FC: normalRandom(0, 1.5),
    pValue: Math.pow(10, -Math.random() * 10),
    category: randomCategory(),
  }));
}
```

**Performance Insights:**

- Canvas can render 20,000+ points at 60fps
- Throttle mouse events to 50ms intervals
- Pre-compute screen coordinates
- Batch draw calls by fill color

## Running the Tutorial

```bash
# Navigate to tutorial directory
cd tutorials/phase-3-advanced-viz/04-volcano-plot

# Install dependencies
npm install

# Start development server
npm run dev
```

Opens at http://localhost:3009 (or next available port)

## Current Implementation

### Data Scale

- **20,000 genes** - Full human transcriptome scale
- ~10% differentially expressed (configurable)
- Real-time threshold adjustment
- Smooth hover interactions

## Usage Guide

### Threshold Adjustment

- **Fold Change**: Slide to adjust minimum expression change
- **P-value**: Slide to adjust significance cutoff
- Watch gene counts update in real-time

### Gene Exploration

- **Hover**: See gene details in tooltip
- **Click**: View full gene information
- **Search**: Type gene name to highlight
- **Category Filter**: Focus on specific pathways

### Data Interpretation

- Genes in upper-left: Significantly downregulated
- Genes in upper-right: Significantly upregulated
- Genes near center: Small or non-significant changes

## Key Code Components

### Point Classification

```javascript
const classifiedData = data.map((d) => {
  const isSignificant = d.padj < pValueThreshold && Math.abs(d.log2FoldChange) > fcThreshold;
  let color = colors.none;
  if (isSignificant) {
    color = d.log2FoldChange > 0 ? colors.up : colors.down;
  }
  return { ...d, isSignificant, color };
});
```

### Multiple Hypothesis Correction

Real RNA-seq analysis uses Benjamini-Hochberg adjustment:

```javascript
// Simplified BH adjustment in simulation
gene.padj = Math.min((gene.pValue * nGenes * rank) / nGenes, 1);
```

## Differential Expression Context

### Why Volcano Plots?

- Combine fold change AND significance in one view
- Quickly identify genes of interest
- Compare multiple conditions
- Guide downstream analysis (GO enrichment, pathway analysis)

### Common Applications

1. **Cancer vs Normal**: Find tumor-specific markers
2. **Treatment Response**: Identify drug targets
3. **Time Course**: Track expression changes
4. **Knockdown Studies**: Validate gene function

### Typical Workflow

1. RNA-seq alignment → counts matrix
2. Normalization (DESeq2, edgeR)
3. Statistical testing
4. Multiple testing correction
5. **Volcano plot visualization**
6. Pathway enrichment analysis

## Exercises

### Exercise 1: MA Plot

Create an MA plot (M vs A) alternative view:

- X: Average expression (A = log₂(baseMean))
- Y: Log fold change (M = log₂FC)

### Exercise 2: Enhanced Labels

Implement smart label placement to avoid overlaps using collision detection.

### Exercise 3: Export Functionality

Add buttons to export:

- Significant gene list as CSV
- Plot as SVG/PNG
- Filtered results

### Exercise 4: Comparison View

Side-by-side volcano plots for multiple comparisons with linked interactions.

## References

1. Bland JM, Altman DG. (1986) "Statistical methods for assessing agreement"
2. Love MI, et al. (2014) "DESeq2" - Genome Biology
3. Robinson MD, et al. (2010) "edgeR" - Bioinformatics
4. Ritchie ME, et al. (2015) "limma" - Nucleic Acids Research

## Next Steps

- Tutorial 3.5: Oncoprint/Mutation Matrix

## Troubleshooting

### Points not rendering

- Check data has log2FoldChange and pValue fields
- Verify scales are set up correctly
- Ensure clip path is applied

### Search not working

- Gene names are case-insensitive
- Minimum 2 characters to search
- Check quadtree is built after data load

### Performance issues

- ✅ **Solved**: Canvas rendering handles 20,000+ genes smoothly
- Batch drawing by color reduces draw calls
- Throttled mouse events prevent UI lag
- Pre-computed positions avoid recalculation

## Performance Optimizations

This tutorial demonstrates several key optimization techniques:

| Technique                       | Benefit                                      |
| ------------------------------- | -------------------------------------------- |
| **Canvas instead of SVG**       | No DOM overhead for 20k elements             |
| **Batch drawing by color**      | Single `fill()` call per color group         |
| **Throttled mouse events**      | Only check every 50ms instead of every frame |
| **Pre-computed positions**      | Calculate cx/cy once, reuse on hover         |
| **Squared distance comparison** | Avoids expensive `Math.sqrt()` calls         |

### Canvas Batch Drawing

```javascript
// Group points by color, then draw each group in one path
const byColor = {};
processedData.forEach((d) => {
  const key = d.sig ? d.color : 'gray';
  if (!byColor[key]) byColor[key] = [];
  byColor[key].push(d);
});

// Single fill() call for all gray points
ctx.fillStyle = 'rgba(189,195,199,0.3)';
ctx.beginPath();
byColor.gray.forEach((d) => {
  ctx.moveTo(d.cx + 1.5, d.cy);
  ctx.arc(d.cx, d.cy, 1.5, 0, Math.PI * 2);
});
ctx.fill();
```

## 🎯 ProteinPaint Connection

Volcano plots are used in ProteinPaint for differential expression visualization:

| Tutorial Concept | ProteinPaint Usage               |
| ---------------- | -------------------------------- |
| Canvas rendering | Used for large point datasets    |
| Log transforms   | Standard for expression data     |
| Threshold lines  | Significance cutoffs             |
| Gene search      | Quick gene lookup functionality  |
| Batch drawing    | Performance optimization pattern |

### ProteinPaint DE Analysis Pattern

```
┌─────────────────────────────────────────────────────────────┐
│  Differential Expression Volcano Plot                       │
│                                                             │
│                           ●                                 │
│               ●        ●  ●  ●         ●                   │
│            ●     ●   ●      ●    ●        ●                │
│  -log10(p) ●●  ●● ●●●●●●●●●●●●●●● ●●  ●●                   │
│         ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●                 │
│       ●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●●               │
│     ═══════════════════════════════════════ p = 0.05      │
│       ·····························                        │
│           ║                 ║                               │
│         -1.0              +1.0     log2(FC)                │
│                                                             │
│     ● Down-regulated  ● Up-regulated  · Not significant    │
└─────────────────────────────────────────────────────────────┘
```

### Relevant ProteinPaint Files

- `client/plots/volcano.js` - Volcano plot implementation
- `client/plots/DEanalysis.js` - Differential expression module
- `shared/types/expression.ts` - Expression data interfaces

## Sample Output

```
┌─────────────────────────────────────────────────────────────┐
│  Volcano Plot: Tumor vs Normal                              │
│                                                             │
│   15 ─┤                    ▲ MYC                           │
│       │                ▲ EGFR                               │
│       │         ▼ BRCA1        ▲ ERBB2                     │
│   10 ─┤      ▼          ·     ▲                            │
│       │   ▼ PTEN    · · · · · · ·  ▲ CDK4                  │
│  -log │  ▼    ·  · · · · · · · · · · ·  ▲                  │
│  (p)  │═══════════════════════════════════ FDR=0.05       │
│    5 ─┤ · · · · · · · · · · · · · · · · · · ·              │
│       │· · · · · · · · · · · · · · · · · · · ·             │
│       │ · · · · · · · · · · · · · · · · · · ·              │
│    0 ─┴─────────┬─────────┬─────────┬─────────             │
│               -2         0         +2                       │
│                    log2(Fold Change)                        │
│                                                             │
│  ▼ Down (156)  · NS (18,432)  ▲ Up (212)                  │
│  |FC| > 1, FDR < 0.05                                       │
│                                                             │
│  🔍 Search: [BRCA___]  Found: BRCA1, BRCA2                 │
└─────────────────────────────────────────────────────────────┘
```

## Exercises

### Exercise 1: Gene Set Highlighting

Highlight genes from a specific pathway:

**Requirements:**

- Load gene set (e.g., KEGG pathway)
- Highlight pathway genes with different color
- Show pathway enrichment statistics

### Exercise 2: MA Plot Toggle

Add toggle to switch between Volcano and MA plot:

**Requirements:**

- MA plot: x = mean expression, y = log2FC
- Share same gene data
- Maintain selection across views

### Exercise 3: Interactive Gene Table

Add a linked data table:

**Requirements:**

- Sortable columns (gene, FC, p-value)
- Click row to highlight in plot
- Export selected genes

### Exercise 4: Comparison Mode

Compare two differential expression analyses:

**Requirements:**

- Side-by-side volcano plots
- Identify genes significant in both/either
- Venn diagram of significant genes

## Next Steps

- [Tutorial 3.5: OncoPrint](../05-oncoprint/README.md)
- [Phase 4: Production](../../phase-4-production/README.md)

---

[← Back to Tutorials Index](../../README.md)
