# Implementation Plan: Performance Optimization (Phase 1.5)

> Build scalable visualizations that handle millions of data points

## Overview

ProteinPaint handles millions of mutations, thousands of tracks, and gigabytes of coverage data smoothly. Our current tutorials teach only SVG-based rendering, which breaks down at scale. This tutorial teaches the performance techniques needed for production genomic visualization.

---

## Learning Objectives

By the end of this tutorial, students will be able to:

1. Choose between SVG and Canvas based on data scale
2. Implement viewport virtualization for large datasets
3. Use Web Workers for background computation
4. Apply RequestAnimationFrame for smooth animations
5. Profile and optimize visualization performance
6. Build a 60fps interactive genome browser

---

## Tutorial Structure

```
05-performance/
├── README.md
├── package.json
├── index.html
├── start-tutorial.sh
├── src/
│   ├── main.js
│   ├── styles.css
│   ├── 01-svg-vs-canvas.js
│   ├── 02-canvas-rendering.js
│   ├── 03-virtualization.js
│   ├── 04-web-workers.js
│   ├── 05-request-animation-frame.js
│   ├── 06-profiling.js
│   └── 07-optimized-browser.js
├── workers/
│   ├── data-processor.worker.js
│   ├── clustering.worker.js
│   └── statistics.worker.js
├── benchmarks/
│   ├── svg-benchmark.js
│   ├── canvas-benchmark.js
│   └── results/
└── exercises/
    ├── exercise-1.md
    ├── exercise-2.md
    ├── exercise-3.md
    └── solutions/
```

---

## Module 1: SVG vs Canvas Decision Matrix

### 1.1 When to Use Each

```javascript
// src/01-svg-vs-canvas.js

/*
DECISION MATRIX: SVG vs Canvas

┌─────────────────────┬─────────────────┬─────────────────┐
│ Criteria            │ SVG             │ Canvas          │
├─────────────────────┼─────────────────┼─────────────────┤
│ Data Points         │ < 5,000         │ > 5,000         │
│ Interactivity       │ Per-element     │ Manual hit-test │
│ Animation           │ CSS/SMIL        │ RAF loop        │
│ Text rendering      │ Excellent       │ Basic           │
│ Zoom quality        │ Infinite        │ Pixelated       │
│ Memory usage        │ High (DOM)      │ Low (bitmap)    │
│ Export quality      │ Vector          │ Raster          │
│ Accessibility       │ Built-in        │ Manual          │
└─────────────────────┴─────────────────┴─────────────────┘

RECOMMENDATIONS:
- Lollipop plots: SVG (< 1000 mutations typically)
- Coverage tracks: Canvas (millions of positions)
- Gene annotations: SVG (< 100 genes in view)
- Scatter plots: Canvas for > 10,000 points
- Heatmaps: Canvas (except small matrices)
*/

// Benchmark function to test performance
export function benchmarkRendering(count, container) {
  const results = {
    svg: { create: 0, update: 0, memory: 0 },
    canvas: { create: 0, update: 0, memory: 0 },
  };

  // SVG Benchmark
  const svgStart = performance.now();
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', 800);
  svg.setAttribute('height', 600);

  for (let i = 0; i < count; i++) {
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', Math.random() * 800);
    circle.setAttribute('cy', Math.random() * 600);
    circle.setAttribute('r', 3);
    circle.setAttribute('fill', `hsl(${Math.random() * 360}, 70%, 50%)`);
    svg.appendChild(circle);
  }
  results.svg.create = performance.now() - svgStart;

  // Canvas Benchmark
  const canvasStart = performance.now();
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');

  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * 800, Math.random() * 600, 3, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 50%)`;
    ctx.fill();
  }
  results.canvas.create = performance.now() - canvasStart;

  return results;
}
```

### 1.2 Hybrid Approach

```javascript
// Best practice: Use both!
class HybridVisualization {
  constructor(container) {
    // SVG for interactive elements
    this.svg = d3
      .select(container)
      .append('svg')
      .style('position', 'absolute')
      .style('pointer-events', 'none'); // Let canvas handle mouse

    // Canvas for dense data
    this.canvas = d3.select(container).append('canvas').style('position', 'absolute');

    this.ctx = this.canvas.node().getContext('2d');
  }

  render(data) {
    // Render dense coverage on Canvas
    this.renderCoverageCanvas(data.coverage);

    // Render interactive mutations on SVG
    this.renderMutationsSVG(data.mutations);
  }

  renderCoverageCanvas(coverage) {
    const { width, height } = this.canvas.node();
    this.ctx.clearRect(0, 0, width, height);

    this.ctx.beginPath();
    this.ctx.moveTo(0, height);

    coverage.forEach((point, i) => {
      const x = (i / coverage.length) * width;
      const y = height - (point.value / this.maxCoverage) * height;
      this.ctx.lineTo(x, y);
    });

    this.ctx.lineTo(width, height);
    this.ctx.fillStyle = 'rgba(70, 130, 180, 0.6)';
    this.ctx.fill();
  }

  renderMutationsSVG(mutations) {
    const circles = this.svg.selectAll('.mutation').data(mutations, (d) => d.id);

    circles
      .enter()
      .append('circle')
      .attr('class', 'mutation')
      .attr('cx', (d) => this.xScale(d.position))
      .attr('cy', (d) => this.yScale(d.count))
      .attr('r', (d) => this.radiusScale(d.count))
      .style('pointer-events', 'all') // Enable interaction
      .on('mouseover', this.showTooltip)
      .on('mouseout', this.hideTooltip);
  }
}
```

---

## Module 2: Canvas Rendering for Genomics

### 2.1 Efficient Canvas Patterns

```javascript
// src/02-canvas-rendering.js

export class CanvasTrack {
  constructor(container, options = {}) {
    this.width = options.width || 1000;
    this.height = options.height || 150;
    this.pixelRatio = window.devicePixelRatio || 1;

    // Create high-DPI canvas
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width * this.pixelRatio;
    this.canvas.height = this.height * this.pixelRatio;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(this.pixelRatio, this.pixelRatio);

    container.appendChild(this.canvas);
  }

  // Batch rendering for performance
  renderCoverage(data, region) {
    const { start, end } = region;
    const binWidth = (end - start) / this.width;

    // Pre-compute colors (avoid per-iteration string creation)
    const colorCache = this.buildColorCache();

    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height);

    // Use single path for better performance
    this.ctx.beginPath();

    // Bin data to pixel resolution
    const bins = this.binData(data, binWidth);

    bins.forEach((bin, i) => {
      const x = i;
      const barHeight = (bin.value / bin.maxValue) * this.height;
      const y = this.height - barHeight;

      // Batch rectangles by color
      this.ctx.rect(x, y, 1, barHeight);
    });

    this.ctx.fillStyle = '#4682B4';
    this.ctx.fill();
  }

  // ImageData for pixel-level control (fastest)
  renderHeatmap(matrix) {
    const imageData = this.ctx.createImageData(this.width, this.height);
    const data = imageData.data;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const value = matrix[y]?.[x] || 0;
        const idx = (y * this.width + x) * 4;

        // Direct pixel manipulation
        const [r, g, b] = this.valueToColor(value);
        data[idx] = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(imageData, 0, 0);
  }

  // Off-screen canvas for complex rendering
  renderWithBuffer(data) {
    // Create off-screen buffer
    const buffer = document.createElement('canvas');
    buffer.width = this.canvas.width;
    buffer.height = this.canvas.height;
    const bufferCtx = buffer.getContext('2d');

    // Render to buffer (can be done in requestIdleCallback)
    this.renderToContext(bufferCtx, data);

    // Copy to main canvas (single operation)
    this.ctx.drawImage(buffer, 0, 0);
  }

  binData(data, binWidth) {
    const bins = [];
    let currentBin = { sum: 0, count: 0, maxValue: 0 };
    let currentBinEnd = binWidth;

    data.forEach((point) => {
      if (point.position >= currentBinEnd) {
        if (currentBin.count > 0) {
          bins.push({
            value: currentBin.sum / currentBin.count,
            maxValue: currentBin.maxValue,
          });
        }
        currentBin = { sum: 0, count: 0, maxValue: 0 };
        currentBinEnd += binWidth;
      }
      currentBin.sum += point.value;
      currentBin.count++;
      currentBin.maxValue = Math.max(currentBin.maxValue, point.value);
    });

    return bins;
  }

  valueToColor(value) {
    // Pre-computed color gradient
    const normalized = Math.min(1, Math.max(0, value));
    return [
      Math.round(255 * normalized),
      Math.round(100 * (1 - normalized)),
      Math.round(100 * (1 - normalized)),
    ];
  }
}
```

### 2.2 Canvas Hit Testing

```javascript
// Implementing interaction on Canvas
class InteractiveCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.elements = []; // Track rendered elements
    this.quadTree = null; // Spatial index

    this.setupInteraction();
  }

  setupInteraction() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Find element under cursor
      const hit = this.hitTest(x, y);

      if (hit) {
        this.canvas.style.cursor = 'pointer';
        this.showTooltip(hit, e);
      } else {
        this.canvas.style.cursor = 'default';
        this.hideTooltip();
      }
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const hit = this.hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (hit) this.onClick(hit);
    });
  }

  // Spatial indexing for fast hit testing
  buildQuadTree() {
    this.quadTree = d3
      .quadtree()
      .x((d) => d.x)
      .y((d) => d.y)
      .addAll(this.elements);
  }

  hitTest(x, y, radius = 10) {
    if (!this.quadTree) return null;

    return this.quadTree.find(x, y, radius);
  }

  // Alternative: Color-based hit testing
  hitTestByColor(x, y) {
    // Render each element with unique color to hidden canvas
    const hitCanvas = document.createElement('canvas');
    hitCanvas.width = this.canvas.width;
    hitCanvas.height = this.canvas.height;
    const hitCtx = hitCanvas.getContext('2d');

    this.elements.forEach((el, i) => {
      // Encode index as RGB color
      const color = `rgb(${(i >> 16) & 255}, ${(i >> 8) & 255}, ${i & 255})`;
      hitCtx.fillStyle = color;
      hitCtx.beginPath();
      hitCtx.arc(el.x, el.y, el.r, 0, Math.PI * 2);
      hitCtx.fill();
    });

    // Read pixel at mouse position
    const pixel = hitCtx.getImageData(x, y, 1, 1).data;
    const index = (pixel[0] << 16) | (pixel[1] << 8) | pixel[2];

    return this.elements[index];
  }
}
```

---

## Module 3: Viewport Virtualization

### 3.1 Virtual Scrolling for Large Lists

```javascript
// src/03-virtualization.js

export class VirtualizedTrackList {
  constructor(container, options = {}) {
    this.container = container;
    this.trackHeight = options.trackHeight || 100;
    this.bufferSize = options.buffer || 3; // Extra tracks to render
    this.tracks = [];
    this.visibleRange = { start: 0, end: 0 };

    this.setupContainer();
    this.setupScrollListener();
  }

  setupContainer() {
    // Outer container (scrollable)
    this.scrollContainer = document.createElement('div');
    this.scrollContainer.style.cssText = `
      height: 100%;
      overflow-y: auto;
      position: relative;
    `;

    // Inner container (full height spacer)
    this.spacer = document.createElement('div');
    this.spacer.style.cssText = `
      width: 100%;
      position: relative;
    `;

    // Viewport (visible tracks)
    this.viewport = document.createElement('div');
    this.viewport.style.cssText = `
      position: absolute;
      width: 100%;
      will-change: transform;
    `;

    this.spacer.appendChild(this.viewport);
    this.scrollContainer.appendChild(this.spacer);
    this.container.appendChild(this.scrollContainer);
  }

  setTracks(tracks) {
    this.tracks = tracks;
    this.spacer.style.height = `${tracks.length * this.trackHeight}px`;
    this.updateVisibleTracks();
  }

  setupScrollListener() {
    let ticking = false;

    this.scrollContainer.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.updateVisibleTracks();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  updateVisibleTracks() {
    const scrollTop = this.scrollContainer.scrollTop;
    const viewportHeight = this.scrollContainer.clientHeight;

    // Calculate visible range with buffer
    const startIndex = Math.max(0, Math.floor(scrollTop / this.trackHeight) - this.bufferSize);
    const endIndex = Math.min(
      this.tracks.length,
      Math.ceil((scrollTop + viewportHeight) / this.trackHeight) + this.bufferSize
    );

    // Only re-render if range changed
    if (startIndex !== this.visibleRange.start || endIndex !== this.visibleRange.end) {
      this.visibleRange = { start: startIndex, end: endIndex };
      this.renderVisibleTracks();
    }
  }

  renderVisibleTracks() {
    // Position viewport to cover visible tracks
    this.viewport.style.transform = `translateY(${this.visibleRange.start * this.trackHeight}px)`;

    // Clear and render only visible tracks
    this.viewport.innerHTML = '';

    for (let i = this.visibleRange.start; i < this.visibleRange.end; i++) {
      const track = this.tracks[i];
      const trackEl = this.createTrackElement(track, i);
      this.viewport.appendChild(trackEl);
    }
  }

  createTrackElement(track, index) {
    const el = document.createElement('div');
    el.style.cssText = `
      height: ${this.trackHeight}px;
      border-bottom: 1px solid #eee;
    `;
    el.dataset.index = index;

    // Render track content
    track.render(el);

    return el;
  }
}
```

### 3.2 Genomic Region Virtualization

```javascript
// Only fetch and render data in visible viewport
class VirtualizedGenomeBrowser {
  constructor(container, options) {
    this.container = container;
    this.region = options.region;
    this.dataCache = new Map();
    this.pendingRequests = new Map();

    this.setupViewport();
  }

  async setRegion(chr, start, end) {
    this.region = { chr, start, end };

    // Calculate tile boundaries
    const tiles = this.calculateTiles(start, end);

    // Fetch only missing tiles
    const tilesToFetch = tiles.filter((t) => !this.dataCache.has(t.key));

    if (tilesToFetch.length > 0) {
      await this.fetchTiles(tilesToFetch);
    }

    // Render from cache
    this.renderFromCache(tiles);
  }

  calculateTiles(start, end) {
    const tileSize = 10000; // 10kb tiles
    const tiles = [];

    const startTile = Math.floor(start / tileSize);
    const endTile = Math.ceil(end / tileSize);

    for (let i = startTile; i <= endTile; i++) {
      tiles.push({
        key: `${this.region.chr}:${i}`,
        start: i * tileSize,
        end: (i + 1) * tileSize,
      });
    }

    return tiles;
  }

  async fetchTiles(tiles) {
    // Batch fetch with deduplication
    const promises = tiles.map(async (tile) => {
      if (this.pendingRequests.has(tile.key)) {
        return this.pendingRequests.get(tile.key);
      }

      const promise = this.fetchData(tile);
      this.pendingRequests.set(tile.key, promise);

      try {
        const data = await promise;
        this.dataCache.set(tile.key, data);
        return data;
      } finally {
        this.pendingRequests.delete(tile.key);
      }
    });

    return Promise.all(promises);
  }

  // LRU cache management
  pruneCache(maxSize = 100) {
    if (this.dataCache.size <= maxSize) return;

    // Remove oldest entries
    const toRemove = this.dataCache.size - maxSize;
    const keys = Array.from(this.dataCache.keys());

    for (let i = 0; i < toRemove; i++) {
      this.dataCache.delete(keys[i]);
    }
  }
}
```

---

## Module 4: Web Workers

### 4.1 Data Processing Worker

```javascript
// workers/data-processor.worker.js

self.onmessage = function (e) {
  const { type, data, id } = e.data;

  try {
    let result;

    switch (type) {
      case 'binCoverage':
        result = binCoverage(data.coverage, data.binSize);
        break;
      case 'filterMutations':
        result = filterMutations(data.mutations, data.filters);
        break;
      case 'calculateStatistics':
        result = calculateStatistics(data.values);
        break;
      case 'clusterData':
        result = hierarchicalCluster(data.matrix);
        break;
      default:
        throw new Error(`Unknown operation: ${type}`);
    }

    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({ id, success: false, error: error.message });
  }
};

function binCoverage(coverage, binSize) {
  const bins = [];
  let currentBin = { sum: 0, count: 0, min: Infinity, max: -Infinity };
  let binStart = coverage[0]?.position || 0;

  for (const point of coverage) {
    if (point.position >= binStart + binSize) {
      if (currentBin.count > 0) {
        bins.push({
          start: binStart,
          end: binStart + binSize,
          mean: currentBin.sum / currentBin.count,
          min: currentBin.min,
          max: currentBin.max,
        });
      }
      binStart += binSize;
      currentBin = { sum: 0, count: 0, min: Infinity, max: -Infinity };
    }

    currentBin.sum += point.value;
    currentBin.count++;
    currentBin.min = Math.min(currentBin.min, point.value);
    currentBin.max = Math.max(currentBin.max, point.value);
  }

  return bins;
}

function filterMutations(mutations, filters) {
  return mutations.filter((m) => {
    if (filters.minCount && m.count < filters.minCount) return false;
    if (filters.types && !filters.types.includes(m.type)) return false;
    if (filters.region) {
      if (m.position < filters.region.start || m.position > filters.region.end) {
        return false;
      }
    }
    return true;
  });
}

function calculateStatistics(values) {
  const n = values.length;
  if (n === 0) return null;

  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;

  return {
    count: n,
    sum,
    mean,
    median: n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)],
    min: sorted[0],
    max: sorted[n - 1],
    variance,
    stdDev: Math.sqrt(variance),
    q1: sorted[Math.floor(n * 0.25)],
    q3: sorted[Math.floor(n * 0.75)],
  };
}
```

### 4.2 Worker Pool Manager

```javascript
// src/04-web-workers.js

export class WorkerPool {
  constructor(workerScript, poolSize = navigator.hardwareConcurrency || 4) {
    this.workers = [];
    this.taskQueue = [];
    this.taskId = 0;
    this.pendingTasks = new Map();

    // Create worker pool
    for (let i = 0; i < poolSize; i++) {
      const worker = new Worker(workerScript);
      worker.onmessage = (e) => this.handleResult(e.data);
      worker.busy = false;
      this.workers.push(worker);
    }
  }

  async execute(type, data) {
    return new Promise((resolve, reject) => {
      const id = this.taskId++;

      this.pendingTasks.set(id, { resolve, reject });
      this.taskQueue.push({ id, type, data });

      this.processQueue();
    });
  }

  processQueue() {
    const availableWorker = this.workers.find((w) => !w.busy);

    if (availableWorker && this.taskQueue.length > 0) {
      const task = this.taskQueue.shift();
      availableWorker.busy = true;
      availableWorker.currentTask = task.id;
      availableWorker.postMessage(task);
    }
  }

  handleResult(result) {
    const { id, success, result: data, error } = result;
    const task = this.pendingTasks.get(id);

    if (task) {
      this.pendingTasks.delete(id);

      // Find and free the worker
      const worker = this.workers.find((w) => w.currentTask === id);
      if (worker) {
        worker.busy = false;
        worker.currentTask = null;
      }

      if (success) {
        task.resolve(data);
      } else {
        task.reject(new Error(error));
      }

      // Process next task
      this.processQueue();
    }
  }

  terminate() {
    this.workers.forEach((w) => w.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.pendingTasks.clear();
  }
}

// Usage
const pool = new WorkerPool('./workers/data-processor.worker.js');

async function processLargeDataset(coverage) {
  // Split into chunks and process in parallel
  const chunkSize = 100000;
  const chunks = [];

  for (let i = 0; i < coverage.length; i += chunkSize) {
    chunks.push(coverage.slice(i, i + chunkSize));
  }

  const results = await Promise.all(
    chunks.map((chunk) => pool.execute('binCoverage', { coverage: chunk, binSize: 100 }))
  );

  return results.flat();
}
```

---

## Module 5: RequestAnimationFrame Patterns

### 5.1 Smooth Animation Loop

```javascript
// src/05-request-animation-frame.js

export class AnimationController {
  constructor() {
    this.animations = new Map();
    this.running = false;
    this.lastTime = 0;
  }

  add(id, updateFn) {
    this.animations.set(id, {
      update: updateFn,
      startTime: performance.now(),
    });

    if (!this.running) {
      this.start();
    }
  }

  remove(id) {
    this.animations.delete(id);

    if (this.animations.size === 0) {
      this.stop();
    }
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    this.tick();
  }

  stop() {
    this.running = false;
  }

  tick() {
    if (!this.running) return;

    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    this.animations.forEach((anim, id) => {
      const elapsed = now - anim.startTime;
      const shouldContinue = anim.update(deltaTime, elapsed);

      if (shouldContinue === false) {
        this.remove(id);
      }
    });

    requestAnimationFrame(() => this.tick());
  }
}

// Smooth pan/zoom for genome browser
export class SmoothPanZoom {
  constructor(onUpdate) {
    this.onUpdate = onUpdate;
    this.animation = new AnimationController();

    this.target = { x: 0, zoom: 1 };
    this.current = { x: 0, zoom: 1 };
    this.velocity = { x: 0, zoom: 0 };

    this.friction = 0.95;
    this.stiffness = 0.15;
  }

  panTo(x) {
    this.target.x = x;
    this.startAnimation();
  }

  zoomTo(zoom, center) {
    this.target.zoom = Math.max(0.1, Math.min(100, zoom));
    this.zoomCenter = center;
    this.startAnimation();
  }

  startAnimation() {
    this.animation.add('panZoom', (dt) => {
      // Spring physics
      const dx = this.target.x - this.current.x;
      const dz = this.target.zoom - this.current.zoom;

      this.velocity.x += dx * this.stiffness;
      this.velocity.zoom += dz * this.stiffness;

      this.velocity.x *= this.friction;
      this.velocity.zoom *= this.friction;

      this.current.x += this.velocity.x;
      this.current.zoom += this.velocity.zoom;

      this.onUpdate(this.current);

      // Stop when settled
      const moving = Math.abs(this.velocity.x) > 0.001 || Math.abs(this.velocity.zoom) > 0.0001;

      return moving;
    });
  }
}
```

### 5.2 Debounced Rendering

```javascript
// Avoid excessive re-renders
export class DebouncedRenderer {
  constructor(renderFn, options = {}) {
    this.render = renderFn;
    this.delay = options.delay || 16; // ~60fps
    this.maxWait = options.maxWait || 100;

    this.pending = false;
    this.lastRender = 0;
    this.scheduledData = null;
  }

  schedule(data) {
    this.scheduledData = data;

    if (this.pending) return;

    const now = performance.now();
    const timeSinceLastRender = now - this.lastRender;

    if (timeSinceLastRender >= this.maxWait) {
      // Max wait exceeded, render immediately
      this.executeRender();
    } else {
      // Schedule render
      this.pending = true;

      requestAnimationFrame(() => {
        this.pending = false;
        this.executeRender();
      });
    }
  }

  executeRender() {
    if (this.scheduledData !== null) {
      this.lastRender = performance.now();
      this.render(this.scheduledData);
      this.scheduledData = null;
    }
  }
}
```

---

## Module 6: Performance Profiling

### 6.1 Built-in Profiler

```javascript
// src/06-profiling.js

export class PerformanceProfiler {
  constructor() {
    this.metrics = new Map();
    this.marks = new Map();
  }

  start(label) {
    this.marks.set(label, performance.now());
  }

  end(label) {
    const startTime = this.marks.get(label);
    if (startTime === undefined) {
      console.warn(`No start mark for ${label}`);
      return;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(label);

    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label).push(duration);

    return duration;
  }

  measure(label, fn) {
    this.start(label);
    const result = fn();
    this.end(label);
    return result;
  }

  async measureAsync(label, fn) {
    this.start(label);
    const result = await fn();
    this.end(label);
    return result;
  }

  getStats(label) {
    const times = this.metrics.get(label) || [];
    if (times.length === 0) return null;

    const sorted = [...times].sort((a, b) => a - b);
    const sum = times.reduce((a, b) => a + b, 0);

    return {
      count: times.length,
      mean: sum / times.length,
      median: sorted[Math.floor(sorted.length / 2)],
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  report() {
    console.group('Performance Report');
    this.metrics.forEach((times, label) => {
      const stats = this.getStats(label);
      console.log(`${label}:`, stats);
    });
    console.groupEnd();
  }

  // FPS Counter
  createFPSCounter() {
    let frames = 0;
    let lastTime = performance.now();

    const measure = () => {
      frames++;
      const now = performance.now();

      if (now - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (now - lastTime));
        this.metrics.set('fps', [fps]);
        frames = 0;
        lastTime = now;
      }

      requestAnimationFrame(measure);
    };

    requestAnimationFrame(measure);
  }
}

// Usage
const profiler = new PerformanceProfiler();
profiler.createFPSCounter();

function renderTrack(data) {
  profiler.start('render');

  profiler.start('binning');
  const binned = binData(data);
  profiler.end('binning');

  profiler.start('drawing');
  draw(binned);
  profiler.end('drawing');

  profiler.end('render');
}
```

---

## Exercises

### Exercise 1: Canvas vs SVG Benchmark

Create a visualization that renders the same data with both SVG and Canvas, measuring performance at different data scales (100, 1000, 10000, 100000 points).

### Exercise 2: Virtualized Gene List

Build a virtualized list that can smoothly scroll through 50,000 genes, only rendering visible items.

### Exercise 3: Web Worker Statistics

Implement a statistics calculation worker that computes mean, median, std dev for coverage data without blocking the UI.

---

## Success Metrics

- [ ] Canvas rendering: 100,000+ points at 60fps
- [ ] Virtualized list: Smooth scrolling with 50,000 items
- [ ] Worker processing: No UI blocking for 1M+ data points
- [ ] Memory usage: < 100MB for typical genome browser session

---

_Implementation plan for Tutorial 1.5 - Performance Optimization_
