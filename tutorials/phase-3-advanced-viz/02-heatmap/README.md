[← Back to Tutorials Index](../../README.md)

---

# Tutorial 3.2: Gene Expression Heatmap

## Overview

This tutorial builds an interactive clustered heatmap for visualizing gene expression data. Heatmaps are essential for identifying patterns in high-dimensional genomic data, revealing groups of co-expressed genes and sample similarities.

## Learning Objectives

By completing this tutorial, you will learn:

1. **Hierarchical Clustering** - Agglomerative clustering with different linkage methods
2. **Dendrogram Visualization** - Drawing cluster trees alongside heatmaps
3. **Color Scales** - Diverging color schemes for expression data
4. **Z-score Normalization** - Standardizing expression values
5. **Matrix Reordering** - Optimal leaf ordering for visualization

## Project Structure

```
02-heatmap/
├── index.html              # Main HTML page
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── README.md               # This file
└── src/
    ├── main.js             # Application entry point
    ├── components/
    │   └── Heatmap.js      # Main heatmap component
    ├── utils/
    │   └── clustering.js   # Hierarchical clustering
    └── data/
        └── expressionData.js # Data generator
```

## Key Concepts

### 1. Gene Expression Data

RNA-seq produces expression matrices:

- **Rows**: Genes (features)
- **Columns**: Samples (observations)
- **Values**: Expression levels (often log2-transformed)

### 2. Z-score Normalization

Standardizes each gene to mean=0, std=1:

```javascript
// For each gene (row)
const zScore = (value - mean) / stdDev;
```

This allows comparison across genes with different expression ranges.

### 3. Hierarchical Clustering

Agglomerative (bottom-up) clustering:

```
1. Start with each item as its own cluster
2. Find two closest clusters
3. Merge them
4. Repeat until one cluster remains
```

**Linkage Methods:**

- **Single**: Distance = min distance between clusters
- **Complete**: Distance = max distance between clusters
- **Average**: Distance = mean distance between clusters

**Distance Metrics:**

- **Euclidean**: Geometric distance
- **Correlation**: 1 - Pearson correlation (preserves shape)

### 4. Dendrogram Coordinates

Convert tree structure to drawable lines:

```javascript
function dendrogramCoords(node, x, y) {
  if (isLeaf(node)) return { x: 0, y: leafPosition };

  const left = dendrogramCoords(node.left);
  const right = dendrogramCoords(node.right);

  // Vertical line connecting children
  drawLine(x, left.y, x, right.y);

  // Horizontal lines to children
  drawLine(left.x, left.y, x, left.y);
  drawLine(right.x, right.y, x, right.y);
}
```

## Running the Tutorial

### Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3007 in your browser.

## Features

### Interactive Controls

| Control          | Effect                    |
| ---------------- | ------------------------- |
| Cluster genes    | Toggle row clustering     |
| Cluster samples  | Toggle column clustering  |
| Show dendrograms | Toggle dendrogram display |
| Regenerate       | Generate new random data  |

### Visual Elements

- **Heatmap cells**: Color-coded expression values
- **Row dendrogram**: Gene clustering hierarchy
- **Column dendrogram**: Sample clustering hierarchy
- **Row annotations**: Gene pathway colors
- **Column annotations**: Sample group colors
- **Color legend**: Z-score scale

### Data Patterns

The simulated data includes:

- **5 pathways**: Cell Cycle, Apoptosis, DNA Repair, Immune Response, Metabolism
- **3 conditions**: Control, Treatment A, Treatment B
- **Differential expression**: Treatment effects vary by pathway

## Code Deep Dive

### Clustering Implementation

```javascript
function hierarchicalCluster(data, options) {
  // Calculate distance matrix
  const distances = distanceMatrix(data, correlationDistance);

  // Initialize clusters
  let clusters = data.map((_, i) => ({ indices: [i] }));

  // Merge until one cluster
  while (clusters.length > 1) {
    // Find closest pair
    const [i, j, dist] = findClosestPair(clusters, distances);

    // Merge clusters
    clusters = merge(clusters, i, j, dist);
  }

  return clusters[0];
}
```

### Color Scale

```javascript
// Diverging scale: blue (low) → white (0) → red (high)
const colorScale = d3.scaleSequential().domain([-absMax, absMax]).interpolator(d3.interpolateRdBu);

// Reverse so red = high expression
const getColor = (v) => colorScale(-v);
```

### Matrix Reordering

```javascript
function reorderMatrix(matrix, rowOrder, colOrder) {
  return rowOrder.map((r) => colOrder.map((c) => matrix[r][c]));
}
```

## Exercises

### Exercise 1: Add Different Color Schemes

Implement multiple color options:

```javascript
const colorSchemes = {
  RdBu: d3.interpolateRdBu, // Red-Blue
  PiYG: d3.interpolatePiYG, // Pink-Green
  Viridis: d3.interpolateViridis, // Sequential
};
```

### Exercise 2: Gene Filtering

Add variance-based gene filtering:

```javascript
function filterTopVariableGenes(data, topN) {
  const variances = calculateVariances(data.matrix);
  const topIndices = variances
    .map((v, i) => ({ v, i }))
    .sort((a, b) => b.v - a.v)
    .slice(0, topN)
    .map((x) => x.i);

  return filterGenes(data, topIndices);
}
```

### Exercise 3: Row/Column Selection

Implement click-to-select for genes or samples:

```javascript
heatmap.on('rowClick', (gene) => {
  showGeneProfile(gene); // Line plot across samples
});

heatmap.on('colClick', (sample) => {
  showSampleProfile(sample); // Bar plot across genes
});
```

### Exercise 4: Export Functionality

Add data/image export:

```javascript
function exportCSV(data) {
  const csv = [
    ['Gene', ...data.samples].join(','),
    ...data.genes.map((gene, i) => [gene, ...data.matrix[i]].join(',')),
  ].join('\n');

  downloadFile(csv, 'expression_data.csv');
}
```

## Real-World Applications

- **Cancer Subtypes**: Identify molecular subtypes from expression patterns
- **Drug Response**: Compare gene expression before/after treatment
- **Biomarker Discovery**: Find genes that distinguish conditions
- **Pathway Analysis**: Identify co-regulated gene groups

## Color Scale Considerations

| Context                             | Recommended Scale |
| ----------------------------------- | ----------------- |
| Diverging data (up/down regulation) | RdBu, PiYG        |
| Sequential data (abundance)         | Viridis, YlOrRd   |
| Categorical annotations             | Set2, Paired      |

## Performance Tips

1. **Limit genes**: Filter to top variable genes for large datasets
2. **Canvas rendering**: Use canvas for >1000 cells
3. **Lazy clustering**: Only cluster on demand
4. **Memoization**: Cache distance calculations

## 🎯 ProteinPaint Connection

Heatmaps are a core visualization in ProteinPaint's expression analysis:

| Tutorial Concept        | ProteinPaint Usage                                  |
| ----------------------- | --------------------------------------------------- |
| Z-score normalization   | `client/plots/matrix.js` - expression normalization |
| Hierarchical clustering | Dendrogram rendering in matrix views                |
| Color scales            | `shared/common.js` - diverging color schemes        |
| Row/column reordering   | Optimal leaf ordering for patterns                  |
| Cell hover              | Tooltip showing gene, sample, value                 |

### ProteinPaint Matrix Architecture

```
┌─────────────────────────────────────────┐
│  ProteinPaint Matrix Plot               │
│                                         │
│  ┌─────┐ ┌─────────────────┐           │
│  │ Den │ │  Sample Annot   │           │
│  │ dro │ ├─────────────────┤           │
│  │ gram│ │                 │           │
│  │     │ │   Expression    │           │
│  │     │ │    Heatmap      │           │
│  │     │ │                 │           │
│  └─────┘ └─────────────────┘           │
│          Gene Labels                    │
└─────────────────────────────────────────┘
```

### Relevant ProteinPaint Files

- `client/plots/matrix.js` - Core matrix implementation
- `client/plots/hierCluster.js` - Clustering algorithms
- `client/termsetting/handlers/geneExpression.ts` - Expression data

## Sample Output

```
┌─────────────────────────────────────────────────────────────┐
│  Gene Expression Heatmap                                    │
│                                                             │
│  Cluster Dendrogram    Sample Annotations                   │
│      ┬                 ━━━━━━━━━━━━━━━━━━━━━━━━━           │
│    ┌─┴─┐               ▓▓▓▓░░░░▓▓▓▓░░░░▓▓▓▓               │
│  ┌─┴┐ ┌┴─┐                                                  │
│  │  │ │  │             S1 S2 S3 S4 S5 S6 S7 S8             │
│                        ─────────────────────                │
│  BRCA1 ─┤   ████ ████ ░░░░ ░░░░ ░░░░ ████ ████ ░░░░       │
│  TP53  ─┤   ░░░░ ████ ████ ████ ░░░░ ░░░░ ████ ████       │
│  EGFR  ─┤   ████ ░░░░ ████ ░░░░ ████ ░░░░ ████ ░░░░       │
│  MYC   ─┤   ░░░░ ░░░░ ████ ████ ████ ████ ░░░░ ░░░░       │
│  PTEN  ─┤   ████ ████ ░░░░ ░░░░ ████ ████ ░░░░ ░░░░       │
│                                                             │
│  Legend: ████ High (z>1)  ░░░░ Low (z<-1)                  │
│                                                             │
│  Annotation: ▓ Tumor  ░ Normal                              │
└─────────────────────────────────────────────────────────────┘
```

## Exercises

### Exercise 1: Add Row Annotations

Add a gene annotation track on the left side:

**Requirements:**

- Color genes by pathway (e.g., cell cycle, apoptosis)
- Add legend for pathway colors
- Allow filtering by pathway

### Exercise 2: Interactive Dendrogram

Make the dendrogram clickable:

**Requirements:**

- Click branch to collapse/expand
- Click leaf to highlight row
- Show cluster info on hover

### Exercise 3: Dual Heatmap Comparison

Create side-by-side heatmaps:

**Requirements:**

- Same genes, different sample groups
- Shared color scale
- Linked hover (highlight gene in both)

### Exercise 4: Export to PDF

Add PDF export with SVG:

**Requirements:**

- Include dendrogram
- Include color legend
- Include sample annotations
- Proper font embedding

## Resources

- [D3 Color Scales](https://github.com/d3/d3-scale-chromatic)
- [Hierarchical Clustering](https://en.wikipedia.org/wiki/Hierarchical_clustering)
- [Heatmap Best Practices](https://www.nature.com/articles/nmeth.3101)

## Next Steps

After completing this tutorial, continue with:

- [Tutorial 3.3: Kaplan-Meier Survival Curves](../03-survival-curves/README.md)
- [Tutorial 3.4: Volcano Plot](../04-volcano-plot/README.md)
- [Tutorial 3.5: OncoPrint](../05-oncoprint/README.md)

---

[← Back to Tutorials Index](../../README.md)
