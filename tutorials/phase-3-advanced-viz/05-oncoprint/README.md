[← Back to Tutorials Index](../../README.md)

---

# Tutorial 3.5: OncoPrint (Mutation Matrix)

## Overview

Build an interactive OncoPrint visualization - a genes × samples matrix showing mutation patterns across a cohort. This is one of the most important visualizations in cancer genomics, popularized by cBioPortal and used extensively in ProteinPaint.

## Learning Objectives

By completing this tutorial, you will learn:

1. **Matrix Layout** - Organizing genes (rows) × samples (columns)
2. **Mutation Glyphs** - Different shapes/colors for mutation types
3. **Sorting Strategies** - By mutation frequency, sample count, or custom
4. **Track Annotations** - Clinical data bars above/below the matrix
5. **Interactivity** - Tooltips, selection, filtering

## 🎯 ProteinPaint Connection

This visualization is directly relevant to ProteinPaint:

- **sampleMatrix app** uses similar concepts
- **Mutation type coloring** follows ProteinPaint conventions
- **Gene/sample ordering** algorithms are similar
- **Track-based architecture** is a core ProteinPaint pattern

## Project Structure

```
05-oncoprint/
├── index.html              # Main HTML page
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── README.md               # This file
└── src/
    ├── main.js             # Application entry point
    ├── components/
    │   └── Oncoprint.js    # Main OncoPrint class
    ├── data/
    │   └── mutationData.js # Sample mutation data
    ├── utils/              # Utility functions (sorting, etc.)
    └── styles.css          # Styling
```

## Key Concepts

### 1. Data Structure

OncoPrint data is a sparse matrix:

```javascript
const data = {
  genes: ['TP53', 'EGFR', 'KRAS', 'BRAF', 'PIK3CA'],
  samples: ['TCGA-01', 'TCGA-02', 'TCGA-03', ...],
  mutations: [
    { gene: 'TP53', sample: 'TCGA-01', type: 'missense', vaf: 0.45 },
    { gene: 'TP53', sample: 'TCGA-01', type: 'splice', vaf: 0.12 },
    { gene: 'EGFR', sample: 'TCGA-02', type: 'nonsense', vaf: 0.38 },
    // ...
  ]
};
```

### 2. Cell Rendering

Each cell can have multiple mutations (compound mutations):

```javascript
function renderCell(g, mutations, cellWidth, cellHeight) {
  const mutationTypes = ['missense', 'nonsense', 'frameshift', 'splice'];

  // Background (no mutation = gray)
  g.append('rect')
    .attr('width', cellWidth)
    .attr('height', cellHeight)
    .attr('fill', mutations.length ? '#ddd' : '#f5f5f5');

  // Stack mutation glyphs
  mutations.forEach((mut, i) => {
    const glyphHeight = cellHeight / mutations.length;
    g.append('rect')
      .attr('y', i * glyphHeight)
      .attr('width', cellWidth)
      .attr('height', glyphHeight - 1)
      .attr('fill', mutationColors[mut.type]);
  });
}
```

### 3. Mutation Color Scheme

Standard genomics colors:

| Type          | Color        | Hex       |
| ------------- | ------------ | --------- |
| Missense      | Blue         | `#3498db` |
| Nonsense      | Red          | `#e74c3c` |
| Frameshift    | Orange       | `#f39c12` |
| Splice        | Purple       | `#9b59b6` |
| Inframe       | Green        | `#2ecc71` |
| Amplification | Red (light)  | `#ffcccc` |
| Deletion      | Blue (light) | `#ccccff` |

### 4. Sorting Algorithms

**By Gene Frequency:**

```javascript
genes.sort((a, b) => {
  const freqA = mutations.filter((m) => m.gene === a).length;
  const freqB = mutations.filter((m) => m.gene === b).length;
  return freqB - freqA; // Descending
});
```

**By Sample Mutation Burden:**

```javascript
samples.sort((a, b) => {
  const countA = mutations.filter((m) => m.sample === a).length;
  const countB = mutations.filter((m) => m.sample === b).length;
  return countB - countA;
});
```

**Mutual Exclusivity (advanced):**

```javascript
// Sort to reveal mutually exclusive patterns
// Genes that rarely co-occur in same sample
```

### 5. Track Annotations

Add clinical data as color bars:

```javascript
const tracks = [
  {
    name: 'Cancer Type',
    type: 'categorical',
    data: { 'TCGA-01': 'LUAD', 'TCGA-02': 'BRCA', ... }
  },
  {
    name: 'Age',
    type: 'continuous',
    data: { 'TCGA-01': 65, 'TCGA-02': 48, ... }
  }
];
```

## Running the Tutorial

```bash
cd tutorials/phase-3-advanced-viz/05-oncoprint
npm install
npm run dev
# Open http://localhost:5173
```

## Code Walkthrough

### File: `src/main.js` - Entry Point

Initializes the OncoPrint and handles UI controls.

### File: `src/components/Oncoprint.js` - Main Visualization ⭐

```javascript
class OncoPrint {
  constructor(container, config) {
    this.container = container;
    this.config = {
      cellWidth: 12,
      cellHeight: 20,
      geneGap: 2,
      sampleGap: 1,
      ...config
    };
  }

  // 1. Setup SVG and groups
  init() { ... }

  // 2. Process and sort data
  processData(data) { ... }

  // 3. Render gene labels (left side)
  renderGeneLabels() { ... }

  // 4. Render sample labels (top/bottom)
  renderSampleLabels() { ... }

  // 5. Render the mutation matrix
  renderMatrix() { ... }

  // 6. Render annotation tracks
  renderTracks() { ... }

  // 7. Add interactivity
  addInteractions() { ... }
}
```

### File: `src/data/mutationData.js` - Sample Data

Sample mutation data in OncoPrint format:

```javascript
export const mutationData = {
  genes: ['TP53', 'EGFR', 'KRAS', 'BRAF', 'PIK3CA'],
  samples: ['TCGA-01', 'TCGA-02', 'TCGA-03', ...],
  mutations: [
    { gene: 'TP53', sample: 'TCGA-01', type: 'missense', vaf: 0.45 },
    // ...
  ]
};
```

### Key Rendering Function

```javascript
renderMatrix() {
  const { genes, samples, mutations } = this.data;

  // Create lookup for fast access
  const mutationMap = new Map();
  mutations.forEach(m => {
    const key = `${m.gene}:${m.sample}`;
    if (!mutationMap.has(key)) mutationMap.set(key, []);
    mutationMap.get(key).push(m);
  });

  // Render cells
  genes.forEach((gene, geneIdx) => {
    samples.forEach((sample, sampleIdx) => {
      const x = sampleIdx * (this.config.cellWidth + this.config.sampleGap);
      const y = geneIdx * (this.config.cellHeight + this.config.geneGap);
      const muts = mutationMap.get(`${gene}:${sample}`) || [];

      const cellGroup = this.matrixGroup.append('g')
        .attr('transform', `translate(${x}, ${y})`);

      this.renderCell(cellGroup, muts);
    });
  });
}
```

## Exercises

1. **Add CNV Track**: Add copy number variation as a separate track
2. **Custom Sorting**: Implement sort by specific gene mutation status
3. **Selection**: Click a gene/sample to highlight all its mutations
4. **Export**: Add SVG/PNG export functionality

## Common Issues

### Performance with Large Datasets

- Use Canvas instead of SVG for >100 samples
- Virtual scrolling for >50 genes
- Aggregate rare mutations

### Overlapping Labels

- Rotate sample labels 45°
- Truncate long gene names
- Show on hover instead

## Resources

- [cBioPortal OncoPrint](https://www.cbioportal.org/)
- [ProteinPaint sampleMatrix](https://proteinpaint.stjude.org/)
- [D3 Matrix Examples](https://observablehq.com/@d3/matrix)

## Next Steps

Congratulations! You've completed Phase 3. Proceed to [Phase 4: Production](../../phase-4-production/README.md).

---

[← Back to Tutorials Index](../../README.md)
