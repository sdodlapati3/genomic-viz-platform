[← Back to Tutorials Index](../../README.md)

---

# Tutorial 3.1: UMAP/t-SNE Scatter Plot

## Overview

This tutorial builds an interactive scatter plot for visualizing single-cell RNA sequencing data using UMAP (Uniform Manifold Approximation and Projection) or t-SNE dimensionality reduction coordinates. The visualization handles thousands of points efficiently using WebGL rendering.

## Learning Objectives

By completing this tutorial, you will learn:

1. **WebGL Rendering** - Efficient GPU-based rendering for large datasets
2. **Quadtree Spatial Indexing** - Fast point lookup for hover/click interactions
3. **D3.js Integration** - Combining WebGL canvas with SVG for axes/legends
4. **Single-Cell Data Visualization** - Understanding UMAP/t-SNE representations
5. **Interactive Features** - Zoom, pan, filter, and color mapping

## Project Structure

```
01-scatter-plot/
├── index.html              # Main HTML page
├── package.json            # Dependencies and scripts
├── vite.config.js          # Vite configuration
├── start-tutorial.sh       # Quick start script
├── README.md               # This file
└── src/
    ├── main.js             # Application entry point
    ├── components/
    │   └── ScatterPlot.js  # Main scatter plot component
    ├── utils/
    │   ├── webglRenderer.js # WebGL rendering engine
    │   └── quadtree.js     # Spatial indexing structure
    └── data/
        └── singleCellData.js # Data generation module
```

## Key Concepts

### 1. UMAP/t-SNE Dimensionality Reduction

Single-cell RNA-seq produces high-dimensional data (thousands of genes per cell). UMAP and t-SNE reduce this to 2D for visualization while preserving local structure:

- **UMAP**: Faster, preserves more global structure
- **t-SNE**: Better local clustering, computationally intensive

### 2. WebGL Rendering

For datasets with thousands of points, SVG becomes slow. WebGL provides:

- **GPU Acceleration**: Parallel processing of points
- **Vertex Shaders**: Position and size calculations
- **Fragment Shaders**: Point appearance (circles, colors)

```javascript
// Vertex shader - runs for each point
attribute vec2 a_position;
attribute vec4 a_color;
attribute float a_size;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
  gl_PointSize = a_size;
  v_color = a_color;
}
```

### 3. Quadtree Spatial Index

Efficient point lookup for interactions:

```javascript
// Without quadtree: O(n) - check all points
// With quadtree: O(log n) - divide and conquer

const quadtree = new Quadtree(bounds);
points.forEach((p) => quadtree.insert(p));

// Find nearest point to mouse
const nearest = quadtree.findNearest(mouseX, mouseY, radius);
```

### 4. Canvas + SVG Layering

Best of both worlds:

- **Canvas**: Fast point rendering (WebGL)
- **SVG**: Crisp axes, legends, tooltips

```
┌─────────────────────────┐
│  SVG (axes, legends)    │
│  ┌───────────────────┐  │
│  │ Canvas (points)   │  │
│  │                   │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

## Running the Tutorial

### Quick Start

```bash
chmod +x start-tutorial.sh
./start-tutorial.sh
```

### Manual Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open http://localhost:3005 in your browser.

## Features

### Interactive Controls

| Action            | Effect                      |
| ----------------- | --------------------------- |
| Scroll wheel      | Zoom in/out                 |
| Click + drag      | Pan view                    |
| Hover on point    | Show cell details           |
| Click on point    | Select and display info     |
| Click legend item | Toggle cell type visibility |

### Color Mapping

- **Cell Type**: Categorical coloring by cell population
- **Gene Expression**: Continuous coloring by marker gene level

### Cell Types

| Type            | Markers            | Color  |
| --------------- | ------------------ | ------ |
| T cells         | CD3D, CD4, CD8A    | Red    |
| B cells         | CD19, CD20, MS4A1  | Blue   |
| Macrophages     | CD14, CD68, CSF1R  | Green  |
| NK cells        | NKG7, GNLY, NCAM1  | Orange |
| Dendritic cells | CD1C, CLEC10A      | Purple |
| Fibroblasts     | COL1A1, DCN, LUM   | Cyan   |
| Tumor cells     | EPCAM, KRT8, KRT18 | Gray   |

## Code Deep Dive

### WebGL Renderer Setup

```javascript
// Initialize WebGL context
const gl = canvas.getContext('webgl');

// Compile shaders
const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

// Create program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
```

### Data Flow

```
Raw Data → Scale Mapping → Transform → WebGL Coords → Render
   ↓            ↓             ↓            ↓
[x, y]    [0, width]   [zoom/pan]   [-1, 1]
```

### Zoom/Pan with D3

```javascript
const zoom = d3
  .zoom()
  .scaleExtent([0.5, 20])
  .on('zoom', (event) => {
    transform = event.transform;
    render(); // Re-render with new transform
    updateAxes(); // Update axis scales
  });

svg.call(zoom);
```

## Exercises

### Exercise 1: Add Lasso Selection

Implement lasso selection to select multiple cells:

```javascript
// Track mouse path
let lassoPath = [];

overlay.on('mousedown', startLasso);
overlay.on('mousemove', updateLasso);
overlay.on('mouseup', completeLasso);

function completeLasso() {
  const selected = data.filter((d) => pointInPolygon([d.x, d.y], lassoPath));
}
```

### Exercise 2: Density Contours

Add density visualization using D3's contour generator:

```javascript
import { contourDensity } from 'd3-contour';

const contours = contourDensity()
  .x((d) => xScale(d.x))
  .y((d) => yScale(d.y))
  .size([width, height])
  .bandwidth(15)(data);
```

### Exercise 3: Cell Type Statistics

Add a statistics panel showing:

- Mean expression per cell type
- Cell count percentages
- Expression correlation matrix

### Exercise 4: Export Functionality

Implement plot export:

```javascript
function exportPNG() {
  const canvas = document.createElement('canvas');
  // Render to canvas
  // Download as PNG
}

function exportSVG() {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svg.node());
  // Download as SVG
}
```

## Performance Tips

1. **Batch Updates**: Don't re-render on every frame
2. **Frustum Culling**: Skip points outside viewport
3. **Level of Detail**: Reduce point size when zoomed out
4. **Debounce**: Limit hover detection frequency
5. **Web Workers**: Offload data processing

## 🎯 ProteinPaint Connection

Scatter plots are used extensively in ProteinPaint for sample visualization:

| Tutorial Concept  | ProteinPaint Usage                                      |
| ----------------- | ------------------------------------------------------- |
| Canvas rendering  | `client/plots/scatter.js` - main scatter implementation |
| Quadtree lookup   | Point hover detection in large datasets                 |
| Zoom/pan behavior | Sample navigation in matrix views                       |
| Color by category | Color samples by cancer type, cluster                   |
| WebGL (advanced)  | Future performance optimization                         |

### ProteinPaint Scatter Applications

```
┌─────────────────────────────────────────┐
│  ProteinPaint uses scatter for:         │
│                                         │
│  • Sample scatter (UMAP/t-SNE)          │
│  • Gene expression correlation          │
│  • Mutation VAF plots                   │
│  • Copy number visualizations           │
│                                         │
│  Key file: client/plots/scatter.js      │
└─────────────────────────────────────────┘
```

### Relevant ProteinPaint Code

- `client/plots/scatter.js` - Main scatter plot
- `client/plots/matrix.samples.js` - Sample matrix with scatter
- `client/filter/tvs.*.ts` - Filter controls for samples

## Sample Output

```
┌─────────────────────────────────────────────────────────────┐
│  Single-Cell RNA-seq UMAP                                   │
│                                                             │
│              ●●●●●                                          │
│           ●●●●●●●●●●          ▲▲▲                          │
│         ●●●●●●●●●●●●●      ▲▲▲▲▲▲▲                        │
│        ●●●●●●●●●●●●●●    ▲▲▲▲▲▲▲▲▲▲                       │
│         ●●●●●●●●●●●●●      ▲▲▲▲▲▲▲                        │
│           ●●●●●●●●●●                                       │
│                                                             │
│     ■■■■■■■                         ◆◆◆◆◆                  │
│   ■■■■■■■■■■■                     ◆◆◆◆◆◆◆                 │
│  ■■■■■■■■■■■■■                   ◆◆◆◆◆◆◆◆◆                │
│   ■■■■■■■■■■■                     ◆◆◆◆◆◆◆                 │
│     ■■■■■■■                         ◆◆◆◆◆                  │
│                                                             │
│  Legend: ● T-cells  ▲ B-cells  ■ Monocytes  ◆ NK cells    │
│                                                             │
│  [Zoom: 100%]  [Points: 15,234]  [Visible: 15,234]         │
└─────────────────────────────────────────────────────────────┘
```

## Exercises

### Exercise 1: Implement Lasso Selection

Add lasso selection to select multiple points:

**Requirements:**

- Click and drag to draw freeform selection
- Highlight selected points
- Show count of selected points
- Export selected cell IDs

**Hint:** Track mouse path, then use point-in-polygon test.

### Exercise 2: Add Density Contours

Overlay density contours on the scatter plot:

**Requirements:**

- Calculate 2D kernel density estimation
- Draw contour lines at density thresholds
- Color contours by density level

**Hint:** Use `d3-contour` library.

### Exercise 3: Split View by Category

Create a faceted scatter plot:

**Requirements:**

- Split into small multiples by cell type
- Shared axes across panels
- Linked hover (highlight same cell in all panels)

## Resources

- [UMAP Algorithm](https://umap-learn.readthedocs.io/)
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [D3.js Zoom](https://github.com/d3/d3-zoom)
- [Quadtree Data Structure](https://en.wikipedia.org/wiki/Quadtree)

## Next Steps

After completing this tutorial, continue with:

- [Tutorial 3.2: Gene Expression Heatmap](../02-heatmap/README.md)
- [Tutorial 3.3: Kaplan-Meier Survival Curves](../03-survival-curves/README.md)
- [Tutorial 3.4: Volcano Plot](../04-volcano-plot/README.md)
- [Tutorial 3.5: OncoPrint](../05-oncoprint/README.md)

---

## 🎯 Interview Preparation Q&A

### Q1: When would you use WebGL vs Canvas 2D for scatter plots?

**Answer:**
| Factor | WebGL | Canvas 2D |
|--------|-------|-----------|
| Point count | >10,000 points | <10,000 points |
| Setup complexity | High (shaders) | Low |
| Custom shapes | Harder | Easier |
| Color per point | Efficient (GPU) | Works, but slower |
| Browser support | IE11 issues | Universal |

**WebGL advantages:**

- GPU parallel processing (millions of points)
- Hardware-accelerated transforms
- Custom visual effects via shaders

**Canvas 2D advantages:**

- Simpler API
- Better debugging
- Text rendering support

---

### Q2: Explain how a quadtree improves hover detection in scatter plots.

**Answer:**
**Problem:** Finding nearest point to mouse requires checking all points: O(n)

**Quadtree solution:** Spatial index with O(log n) lookup

```javascript
class Quadtree {
  constructor(bounds, capacity = 4) {
    this.bounds = bounds;
    this.capacity = capacity;
    this.points = [];
    this.divided = false;
  }

  insert(point) {
    if (!this.contains(point)) return false;

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) this.subdivide();

    return (
      this.northeast.insert(point) ||
      this.northwest.insert(point) ||
      this.southeast.insert(point) ||
      this.southwest.insert(point)
    );
  }

  findNearest(x, y, radius) {
    // Only search quadrants that overlap with search circle
    // Dramatically reduces comparisons
  }
}
```

**Performance:**

- 50,000 points without quadtree: ~50ms per hover
- 50,000 points with quadtree: ~0.1ms per hover

---

### Q3: What is UMAP and why is it used for single-cell data?

**Answer:**
**UMAP (Uniform Manifold Approximation and Projection):**

- Dimensionality reduction algorithm
- Reduces 20,000+ genes to 2-3 dimensions
- Preserves local and global structure

**Why single-cell uses UMAP:**

1. Each cell = 20,000-dimensional point (gene expression values)
2. Direct visualization impossible
3. UMAP reveals cell clusters (cell types)
4. Faster than t-SNE, better global structure

**Comparison with t-SNE:**
| Feature | UMAP | t-SNE |
|---------|------|-------|
| Speed | Fast | Slow |
| Global structure | Preserved | Lost |
| Deterministic | More | Less |
| Hyperparameters | n_neighbors, min_dist | perplexity |

---

### Q4: How do you implement efficient color mapping for cell types?

**Answer:**

```javascript
// Categorical color scale for cell types
const cellTypeColors = d3
  .scaleOrdinal()
  .domain(['T_cell', 'B_cell', 'Macrophage', 'NK_cell', 'Tumor'])
  .range(['#e41a1c', '#377eb8', '#4daf4a', '#ff7f00', '#999999']);

// For WebGL: pre-compute colors as Float32Array
function prepareColorBuffer(points) {
  const colors = new Float32Array(points.length * 4); // RGBA

  points.forEach((p, i) => {
    const rgb = d3.color(cellTypeColors(p.cellType));
    colors[i * 4] = rgb.r / 255;
    colors[i * 4 + 1] = rgb.g / 255;
    colors[i * 4 + 2] = rgb.b / 255;
    colors[i * 4 + 3] = 1.0; // alpha
  });

  return colors;
}

// Continuous color for gene expression
const expressionColor = d3.scaleSequential(d3.interpolateViridis).domain([0, maxExpression]);
```

---

### Q5: How would you implement linked selection between scatter plot and other views?

**Answer:**

```javascript
// Event bus for cross-view communication
const eventBus = new EventEmitter();

// Scatter plot brush selection
const brush = d3
  .brush()
  .extent([
    [0, 0],
    [width, height],
  ])
  .on('end', (event) => {
    if (!event.selection) {
      eventBus.emit('selection:clear');
      return;
    }

    const [[x0, y0], [x1, y1]] = event.selection;
    const selectedIds = points
      .filter(
        (p) => xScale(p.x) >= x0 && xScale(p.x) <= x1 && yScale(p.y) >= y0 && yScale(p.y) <= y1
      )
      .map((p) => p.id);

    eventBus.emit('selection:update', {
      source: 'scatter',
      ids: selectedIds,
    });
  });

// Other components listen
eventBus.on('selection:update', ({ source, ids }) => {
  if (source !== 'heatmap') {
    heatmap.highlightSamples(ids);
  }
  if (source !== 'table') {
    table.filterRows(ids);
  }
});
```

---

[← Back to Tutorials Index](../../README.md)
