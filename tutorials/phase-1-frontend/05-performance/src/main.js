/**
 * Main Application - Performance Optimization Tutorial
 *
 * Tutorial 1.5: Demonstrates SVG vs Canvas performance
 * with large genomic datasets
 */

import * as d3 from 'd3';
import { CanvasRenderer } from './renderers/canvasRenderer.js';
import { SVGRenderer } from './renderers/svgRenderer.js';
import { ViewportManager } from './virtualization/viewportManager.js';

// State
let currentRenderer = null;
let currentData = [];
let viewport = null;
let fpsHistory = [];
let animationId = null;

// DOM Elements
const dataSizeSelect = document.getElementById('dataSize');
const rendererSelect = document.getElementById('renderer');
const runBenchmarkBtn = document.getElementById('runBenchmark');
const fpsDisplay = document.getElementById('fps');
const renderTimeDisplay = document.getElementById('renderTime');
const memoryDisplay = document.getElementById('memory');
const elementsDisplay = document.getElementById('elements');
const svgElement = document.getElementById('svg-viz');
const canvasElement = document.getElementById('canvas-viz');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Performance Tutorial initialized');

  setupViewport();
  setupEventListeners();
  generateData(10000);
  createRenderer('canvas');
  startRenderLoop();
});

/**
 * Set up viewport manager
 */
function setupViewport() {
  viewport = new ViewportManager({
    containerWidth: 1200,
    chromosome: 'chr17',
    chromosomeLength: 83257441,
  });

  // Set initial region (TP53 area)
  viewport.setRegion(7000000, 8000000);

  viewport.on('change', (state) => {
    if (currentRenderer) {
      currentRenderer.setRegion(state.chromosome, state.start, state.end);
    }
  });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  dataSizeSelect.addEventListener('change', (e) => {
    const size = parseInt(e.target.value, 10);
    generateData(size);
    if (currentRenderer) {
      currentRenderer.setData(currentData);
    }
  });

  rendererSelect.addEventListener('change', (e) => {
    createRenderer(e.target.value);
  });

  runBenchmarkBtn.addEventListener('click', runBenchmark);

  // Canvas pan/zoom
  canvasElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.2 : 0.8;
    const rect = canvasElement.getBoundingClientRect();
    const x = e.clientX - rect.left;
    viewport.zoom(factor, x);
  });

  let isDragging = false;
  let lastX = 0;

  canvasElement.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastX = e.clientX;
    canvasElement.style.cursor = 'grabbing';
  });

  canvasElement.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const deltaX = e.clientX - lastX;
    viewport.pan(-deltaX);
    lastX = e.clientX;
  });

  canvasElement.addEventListener('mouseup', () => {
    isDragging = false;
    canvasElement.style.cursor = 'default';
  });

  canvasElement.addEventListener('mouseleave', () => {
    isDragging = false;
    canvasElement.style.cursor = 'default';
  });

  // Example navigation
  document.querySelectorAll('.example-nav button').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelector('.example-nav button.active').classList.remove('active');
      btn.classList.add('active');
      loadExample(btn.dataset.example);
    });
  });
}

/**
 * Generate random genomic data
 */
function generateData(count) {
  console.log(`Generating ${count.toLocaleString()} data points...`);

  const chromosome = 'chr17';
  const regionStart = 0;
  const regionEnd = 83257441;

  currentData = [];

  for (let i = 0; i < count; i++) {
    currentData.push({
      id: `point_${i}`,
      chromosome,
      position: regionStart + Math.random() * (regionEnd - regionStart),
      value: Math.random() * 100 + Math.random() * 50 * Math.sin(i / 100),
    });
  }

  // Sort by position for better access patterns
  currentData.sort((a, b) => a.position - b.position);

  console.log(`✓ Generated ${currentData.length.toLocaleString()} points`);
  updateStats();
}

/**
 * Create renderer based on type
 */
function createRenderer(type) {
  // Clean up existing renderer
  if (currentRenderer) {
    currentRenderer.destroy();
  }

  const state = viewport.getState();

  switch (type) {
    case 'svg':
      document.getElementById('svg-container').style.display = 'block';
      document.getElementById('canvas-container').style.display = 'none';

      currentRenderer = new SVGRenderer(svgElement, {
        width: 1200,
        height: 300,
      });
      break;

    case 'canvas':
    default:
      document.getElementById('svg-container').style.display = 'none';
      document.getElementById('canvas-container').style.display = 'block';

      currentRenderer = new CanvasRenderer(canvasElement, {
        width: 1200,
        height: 300,
      });
      break;
  }

  currentRenderer.setRegion(state.chromosome, state.start, state.end);
  currentRenderer.setData(currentData);

  console.log(`✓ Created ${type} renderer`);
}

/**
 * Main render loop
 */
function startRenderLoop() {
  let lastTime = performance.now();
  let frameCount = 0;

  function loop() {
    const now = performance.now();

    // Render
    if (currentRenderer) {
      const renderTime = currentRenderer.render();
      renderTimeDisplay.textContent = renderTime.toFixed(1);

      // Color code render time
      renderTimeDisplay.className = 'stat-value';
      if (renderTime > 33) {
        renderTimeDisplay.classList.add('danger');
      } else if (renderTime > 16) {
        renderTimeDisplay.classList.add('warning');
      } else {
        renderTimeDisplay.classList.add('good');
      }
    }

    // Calculate FPS
    frameCount++;
    if (now - lastTime >= 1000) {
      const fps = Math.round((frameCount * 1000) / (now - lastTime));
      fpsHistory.push(fps);
      if (fpsHistory.length > 60) fpsHistory.shift();

      fpsDisplay.textContent = fps;

      // Color code FPS
      fpsDisplay.className = 'stat-value';
      if (fps < 30) {
        fpsDisplay.classList.add('danger');
      } else if (fps < 55) {
        fpsDisplay.classList.add('warning');
      } else {
        fpsDisplay.classList.add('good');
      }

      frameCount = 0;
      lastTime = now;
    }

    // Update memory usage
    if (performance.memory) {
      const usedMB = Math.round(performance.memory.usedJSHeapSize / 1048576);
      memoryDisplay.textContent = usedMB;
    }

    animationId = requestAnimationFrame(loop);
  }

  loop();
}

/**
 * Update statistics display
 */
function updateStats() {
  elementsDisplay.textContent = currentData.length.toLocaleString();
}

/**
 * Run benchmark
 */
async function runBenchmark() {
  runBenchmarkBtn.disabled = true;
  runBenchmarkBtn.textContent = 'Running...';

  const results = [];
  const sizes = [100, 1000, 10000, 100000];
  const renderers = ['svg', 'canvas'];

  for (const renderer of renderers) {
    for (const size of sizes) {
      // Skip large sizes for SVG
      if (renderer === 'svg' && size > 10000) continue;

      generateData(size);
      createRenderer(renderer);

      // Warm up
      for (let i = 0; i < 5; i++) {
        currentRenderer.render();
        await new Promise((r) => setTimeout(r, 50));
      }

      // Measure
      const times = [];
      for (let i = 0; i < 20; i++) {
        const time = currentRenderer.render();
        times.push(time);
        await new Promise((r) => setTimeout(r, 20));
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const fps = Math.round(1000 / avgTime);

      results.push({
        renderer,
        size,
        avgTime: avgTime.toFixed(2),
        fps,
      });

      console.log(`${renderer} @ ${size}: ${avgTime.toFixed(2)}ms (${fps} fps)`);
    }
  }

  // Display results
  displayBenchmarkResults(results);

  // Restore original settings
  generateData(parseInt(dataSizeSelect.value, 10));
  createRenderer(rendererSelect.value);

  runBenchmarkBtn.disabled = false;
  runBenchmarkBtn.textContent = 'Run Benchmark';
}

/**
 * Display benchmark results
 */
function displayBenchmarkResults(results) {
  const container = document.getElementById('example-content');

  let html = '<h3>Benchmark Results</h3>';
  html += '<table style="width:100%;border-collapse:collapse;margin:1rem 0;">';
  html += '<tr style="background:#333;color:white;">';
  html += '<th style="padding:0.5rem;">Renderer</th>';
  html += '<th style="padding:0.5rem;">Data Points</th>';
  html += '<th style="padding:0.5rem;">Avg Render (ms)</th>';
  html += '<th style="padding:0.5rem;">FPS</th>';
  html += '</tr>';

  results.forEach((r, i) => {
    const bg = i % 2 === 0 ? '#f8f8f8' : '#fff';
    const fpsColor = r.fps >= 55 ? '#2ecc71' : r.fps >= 30 ? '#f39c12' : '#e74c3c';

    html += `<tr style="background:${bg};">`;
    html += `<td style="padding:0.5rem;">${r.renderer.toUpperCase()}</td>`;
    html += `<td style="padding:0.5rem;">${r.size.toLocaleString()}</td>`;
    html += `<td style="padding:0.5rem;">${r.avgTime}</td>`;
    html += `<td style="padding:0.5rem;color:${fpsColor};font-weight:bold;">${r.fps}</td>`;
    html += '</tr>';
  });

  html += '</table>';

  html += `
    <div style="margin-top:1rem;padding:1rem;background:#e8f4f8;border-radius:4px;">
      <strong>Key Takeaways:</strong>
      <ul style="margin:0.5rem 0 0 1rem;">
        <li>SVG maintains good performance up to ~10,000 elements</li>
        <li>Canvas handles 100,000+ elements with consistent 60fps</li>
        <li>Canvas uses constant memory regardless of element count</li>
        <li>For interactive genomic visualizations, use Canvas for dense data</li>
      </ul>
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Load example content
 */
function loadExample(example) {
  const container = document.getElementById('example-content');

  const examples = {
    '01': `
      <h3>Example 1: SVG Limits</h3>
      <p>This example demonstrates where SVG performance breaks down.</p>
      <div class="code-example">
<span class="comment">// SVG creates a DOM element for each data point</span>
<span class="keyword">const</span> circles = svg.selectAll(<span class="string">'circle'</span>)
  .data(data)  <span class="comment">// 10,000 items = 10,000 DOM nodes</span>
  .enter()
  .append(<span class="string">'circle'</span>)
  .attr(<span class="string">'cx'</span>, d => xScale(d.x))
  .attr(<span class="string">'cy'</span>, d => yScale(d.y))
  .attr(<span class="string">'r'</span>, <span class="number">5</span>);

<span class="comment">// Each circle has:</span>
<span class="comment">// - DOM node overhead (~500 bytes)</span>
<span class="comment">// - Event listeners</span>
<span class="comment">// - Style computations</span>
<span class="comment">// - Layout/paint in browser</span>
      </div>
      <p>Try increasing data points to see FPS drop.</p>
    `,
    '02': `
      <h3>Example 2: Canvas Basics</h3>
      <p>Canvas uses immediate-mode rendering - draw once and forget.</p>
      <div class="code-example">
<span class="comment">// Canvas draws directly to pixels</span>
<span class="keyword">const</span> ctx = canvas.getContext(<span class="string">'2d'</span>);

<span class="comment">// Single draw call for all points</span>
ctx.beginPath();
<span class="keyword">for</span> (<span class="keyword">const</span> d <span class="keyword">of</span> data) {
  ctx.moveTo(xScale(d.x) + <span class="number">5</span>, yScale(d.y));
  ctx.arc(xScale(d.x), yScale(d.y), <span class="number">5</span>, <span class="number">0</span>, Math.PI * <span class="number">2</span>);
}
ctx.fill();  <span class="comment">// One GPU operation</span>

<span class="comment">// Benefits:</span>
<span class="comment">// - No DOM overhead</span>
<span class="comment">// - GPU-accelerated</span>
<span class="comment">// - Constant memory</span>
      </div>
    `,
    '03': `
      <h3>Example 3: Virtualization</h3>
      <p>Only render what's visible on screen.</p>
      <div class="code-example">
<span class="comment">// Filter to visible region</span>
<span class="keyword">const</span> visible = data.filter(d => 
  d.position >= viewport.start && 
  d.position <= viewport.end
);

<span class="comment">// Add buffer zones for smooth panning</span>
<span class="keyword">const</span> buffer = (viewport.end - viewport.start) * <span class="number">0.2</span>;
<span class="keyword">const</span> buffered = data.filter(d =>
  d.position >= viewport.start - buffer &&
  d.position <= viewport.end + buffer
);

<span class="comment">// Result: Render 1,000 points instead of 1,000,000</span>
      </div>
    `,
    '04': `
      <h3>Example 4: Web Workers</h3>
      <p>Move heavy computation off the main thread.</p>
      <div class="code-example">
<span class="comment">// Main thread</span>
<span class="keyword">const</span> worker = <span class="keyword">new</span> Worker(<span class="string">'aggregator.worker.js'</span>);

worker.postMessage({
  type: <span class="string">'aggregate'</span>,
  data: millionPoints,
  binSize: <span class="number">1000</span>
});

worker.onmessage = (e) => {
  <span class="comment">// Receive pre-computed bins</span>
  <span class="keyword">const</span> { bins } = e.data;
  render(bins);  <span class="comment">// Only ~1000 bins to render</span>
};

<span class="comment">// Worker thread does the heavy lifting</span>
<span class="comment">// Main thread stays responsive</span>
      </div>
    `,
    '05': `
      <h3>Example 5: Combined Approach</h3>
      <p>Production systems combine all techniques:</p>
      <div class="code-example">
<span class="keyword">class</span> GenomicRenderer {
  render() {
    <span class="comment">// 1. Get visible region from viewport</span>
    <span class="keyword">const</span> region = <span class="keyword">this</span>.viewport.getState();
    
    <span class="comment">// 2. Request aggregated data from worker</span>
    <span class="keyword">this</span>.worker.postMessage({
      type: <span class="string">'aggregate'</span>,
      region,
      zoomLevel: <span class="keyword">this</span>.getZoomLevel()
    });
    
    <span class="comment">// 3. Draw with Canvas (from worker callback)</span>
    <span class="keyword">this</span>.worker.onmessage = (e) => {
      <span class="keyword">this</span>.drawCanvas(e.data.bins);
    };
    
    <span class="comment">// 4. Overlay SVG for interactive elements</span>
    <span class="keyword">this</span>.drawSVGOverlay(selectedItems);
  }
}
      </div>
    `,
  };

  container.innerHTML = examples[example] || '<p>Example not found</p>';
}

// Load initial example
loadExample('01');
