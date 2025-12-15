/**
 * Canvas Renderer for Genomic Data
 *
 * High-performance rendering for large genomic datasets
 * using HTML5 Canvas API.
 */

/**
 * Canvas-based renderer for genomic visualizations
 *
 * @class CanvasRenderer
 */
export class CanvasRenderer {
  /**
   * @param {HTMLCanvasElement} canvas - Target canvas element
   * @param {Object} options - Configuration options
   */
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Options with defaults
    this.options = {
      width: options.width || canvas.width || 1200,
      height: options.height || canvas.height || 300,
      pixelRatio: options.pixelRatio || window.devicePixelRatio || 1,
      margin: options.margin || { top: 20, right: 20, bottom: 40, left: 60 },
      colors: options.colors || {
        background: '#ffffff',
        grid: '#f0f0f0',
        axis: '#333333',
        point: '#4a90d9',
        pointHover: '#e74c3c',
      },
      ...options,
    };

    // Region state
    this.chromosome = null;
    this.start = 0;
    this.end = 0;

    // Data
    this.data = [];
    this.visibleData = [];

    // Interaction state
    this.hoveredItem = null;
    this.selectedItems = new Set();

    // Spatial index for hit testing
    this.spatialIndex = null;

    // Performance tracking
    this.lastRenderTime = 0;
    this.frameCount = 0;

    // Initialize canvas
    this._setupCanvas();
    this._setupEvents();
  }

  /**
   * Set up canvas with proper sizing and pixel ratio
   * @private
   */
  _setupCanvas() {
    const { width, height, pixelRatio } = this.options;

    // Set display size
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    // Set actual size with pixel ratio for crisp rendering
    this.canvas.width = width * pixelRatio;
    this.canvas.height = height * pixelRatio;

    // Scale context to match pixel ratio
    this.ctx.scale(pixelRatio, pixelRatio);

    // Calculate plot area
    const { margin } = this.options;
    this.plotArea = {
      x: margin.left,
      y: margin.top,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };
  }

  /**
   * Set up mouse/touch event handlers
   * @private
   */
  _setupEvents() {
    this.canvas.addEventListener('mousemove', (e) => this._onMouseMove(e));
    this.canvas.addEventListener('click', (e) => this._onClick(e));
    this.canvas.addEventListener('mouseleave', () => this._onMouseLeave());
  }

  /**
   * Set the genomic region to display
   * @param {string} chromosome - Chromosome name
   * @param {number} start - Start position
   * @param {number} end - End position
   */
  setRegion(chromosome, start, end) {
    this.chromosome = chromosome;
    this.start = start;
    this.end = end;

    // Update scales
    this._updateScales();

    // Filter visible data
    this._updateVisibleData();
  }

  /**
   * Set the data to render
   * @param {Array} data - Array of data points
   */
  setData(data) {
    this.data = data;
    this._updateVisibleData();
    this._buildSpatialIndex();
  }

  /**
   * Update x/y scales based on current region and data
   * @private
   */
  _updateScales() {
    const { plotArea } = this;

    // X scale: genomic position to pixels
    this.xScale = (pos) => {
      return plotArea.x + ((pos - this.start) / (this.end - this.start)) * plotArea.width;
    };

    // Inverse x scale: pixels to genomic position
    this.xScaleInverse = (px) => {
      return this.start + ((px - plotArea.x) / plotArea.width) * (this.end - this.start);
    };

    // Y scale: data value to pixels
    if (this.data.length > 0) {
      const values = this.data.map((d) => d.value || d.y || 0);
      const maxValue = Math.max(...values, 1);

      this.yScale = (value) => {
        return plotArea.y + plotArea.height - (value / maxValue) * plotArea.height;
      };

      this.yMax = maxValue;
    }
  }

  /**
   * Filter data to only visible region
   * @private
   */
  _updateVisibleData() {
    if (!this.chromosome) {
      this.visibleData = [];
      return;
    }

    // Filter to current region with small buffer
    const buffer = (this.end - this.start) * 0.1;
    const visibleStart = this.start - buffer;
    const visibleEnd = this.end + buffer;

    this.visibleData = this.data.filter((d) => {
      const pos = d.position || d.x || 0;
      const chr = d.chromosome || d.chr || '';
      return chr === this.chromosome && pos >= visibleStart && pos <= visibleEnd;
    });
  }

  /**
   * Build spatial index for efficient hit testing
   * @private
   */
  _buildSpatialIndex() {
    // Simple grid-based spatial index
    const gridSize = 20; // pixels
    this.spatialIndex = new Map();

    this.visibleData.forEach((d, i) => {
      const x = this.xScale(d.position || d.x || 0);
      const y = this.yScale(d.value || d.y || 0);

      const gridX = Math.floor(x / gridSize);
      const gridY = Math.floor(y / gridSize);
      const key = `${gridX},${gridY}`;

      if (!this.spatialIndex.has(key)) {
        this.spatialIndex.set(key, []);
      }
      this.spatialIndex.get(key).push({ ...d, _x: x, _y: y, _index: i });
    });
  }

  /**
   * Main render method
   */
  render() {
    const startTime = performance.now();

    // Clear canvas
    this._clear();

    // Draw layers in order
    this._drawBackground();
    this._drawGrid();
    this._drawData();
    this._drawAxes();
    this._drawHover();

    // Track performance
    this.lastRenderTime = performance.now() - startTime;
    this.frameCount++;

    return this.lastRenderTime;
  }

  /**
   * Clear the canvas
   * @private
   */
  _clear() {
    const { width, height } = this.options;
    this.ctx.clearRect(0, 0, width, height);
  }

  /**
   * Draw background
   * @private
   */
  _drawBackground() {
    const { ctx, plotArea, options } = this;

    ctx.fillStyle = options.colors.background;
    ctx.fillRect(plotArea.x, plotArea.y, plotArea.width, plotArea.height);
  }

  /**
   * Draw grid lines
   * @private
   */
  _drawGrid() {
    const { ctx, plotArea, options } = this;

    ctx.strokeStyle = options.colors.grid;
    ctx.lineWidth = 0.5;

    // Horizontal grid lines
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
      const y = plotArea.y + (plotArea.height / yTicks) * i;
      ctx.beginPath();
      ctx.moveTo(plotArea.x, y);
      ctx.lineTo(plotArea.x + plotArea.width, y);
      ctx.stroke();
    }

    // Vertical grid lines (based on genomic position)
    const xTicks = 10;
    for (let i = 0; i <= xTicks; i++) {
      const x = plotArea.x + (plotArea.width / xTicks) * i;
      ctx.beginPath();
      ctx.moveTo(x, plotArea.y);
      ctx.lineTo(x, plotArea.y + plotArea.height);
      ctx.stroke();
    }
  }

  /**
   * Draw data points - optimized for large datasets
   * @private
   */
  _drawData() {
    const { ctx, visibleData, xScale, yScale, plotArea, options } = this;

    if (visibleData.length === 0) return;

    ctx.fillStyle = options.colors.point;

    // For very large datasets, use pixel aggregation
    if (visibleData.length > 10000) {
      this._drawAggregatedData();
      return;
    }

    // Draw individual points for smaller datasets
    const pointSize = Math.max(2, Math.min(6, 2000 / visibleData.length));

    // Batch drawing by starting a single path
    ctx.beginPath();

    for (const d of visibleData) {
      const x = xScale(d.position || d.x || 0);
      const y = yScale(d.value || d.y || 0);

      // Skip if outside plot area
      if (x < plotArea.x || x > plotArea.x + plotArea.width) continue;
      if (y < plotArea.y || y > plotArea.y + plotArea.height) continue;

      // Draw circle
      ctx.moveTo(x + pointSize, y);
      ctx.arc(x, y, pointSize, 0, Math.PI * 2);
    }

    ctx.fill();
  }

  /**
   * Draw aggregated data for very large datasets
   * @private
   */
  _drawAggregatedData() {
    const { ctx, visibleData, plotArea, xScale, yScale, options } = this;

    // Aggregate into pixels
    const pixelBins = new Map();

    for (const d of visibleData) {
      const x = Math.floor(xScale(d.position || d.x || 0));
      const value = d.value || d.y || 0;

      if (x < plotArea.x || x > plotArea.x + plotArea.width) continue;

      if (!pixelBins.has(x)) {
        pixelBins.set(x, { sum: 0, count: 0, max: -Infinity, min: Infinity });
      }

      const bin = pixelBins.get(x);
      bin.sum += value;
      bin.count++;
      bin.max = Math.max(bin.max, value);
      bin.min = Math.min(bin.min, value);
    }

    // Draw as vertical lines (min-max range)
    ctx.strokeStyle = options.colors.point;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (const [x, bin] of pixelBins) {
      const yMin = yScale(bin.min);
      const yMax = yScale(bin.max);

      ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMax);
    }
    ctx.stroke();

    // Draw mean as dots
    ctx.fillStyle = options.colors.point;
    ctx.beginPath();
    for (const [x, bin] of pixelBins) {
      const yMean = yScale(bin.sum / bin.count);
      ctx.moveTo(x + 1, yMean);
      ctx.arc(x, yMean, 1, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  /**
   * Draw axes
   * @private
   */
  _drawAxes() {
    const { ctx, plotArea, options, yMax } = this;

    ctx.strokeStyle = options.colors.axis;
    ctx.fillStyle = options.colors.axis;
    ctx.lineWidth = 1;
    ctx.font = '11px -apple-system, sans-serif';

    // X axis
    ctx.beginPath();
    ctx.moveTo(plotArea.x, plotArea.y + plotArea.height);
    ctx.lineTo(plotArea.x + plotArea.width, plotArea.y + plotArea.height);
    ctx.stroke();

    // X axis labels
    const xTicks = 5;
    ctx.textAlign = 'center';
    for (let i = 0; i <= xTicks; i++) {
      const x = plotArea.x + (plotArea.width / xTicks) * i;
      const pos = this.start + ((this.end - this.start) / xTicks) * i;
      const label = this._formatPosition(pos);

      ctx.fillText(label, x, plotArea.y + plotArea.height + 20);
    }

    // Y axis
    ctx.beginPath();
    ctx.moveTo(plotArea.x, plotArea.y);
    ctx.lineTo(plotArea.x, plotArea.y + plotArea.height);
    ctx.stroke();

    // Y axis labels
    const yTicks = 5;
    ctx.textAlign = 'right';
    for (let i = 0; i <= yTicks; i++) {
      const y = plotArea.y + (plotArea.height / yTicks) * i;
      const value = yMax * (1 - i / yTicks);

      ctx.fillText(value.toFixed(0), plotArea.x - 10, y + 4);
    }

    // Axis titles
    ctx.save();
    ctx.textAlign = 'center';

    // X axis title
    ctx.fillText(
      `${this.chromosome}`,
      plotArea.x + plotArea.width / 2,
      plotArea.y + plotArea.height + 35
    );

    // Y axis title
    ctx.translate(15, plotArea.y + plotArea.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Value', 0, 0);
    ctx.restore();
  }

  /**
   * Draw hover highlight
   * @private
   */
  _drawHover() {
    if (!this.hoveredItem) return;

    const { ctx, options } = this;
    const { _x, _y } = this.hoveredItem;

    // Highlight circle
    ctx.fillStyle = options.colors.pointHover;
    ctx.beginPath();
    ctx.arc(_x, _y, 6, 0, Math.PI * 2);
    ctx.fill();

    // Tooltip
    const label = `${this.hoveredItem.id || 'Point'}: ${(this.hoveredItem.value || 0).toFixed(2)}`;
    ctx.font = 'bold 11px -apple-system, sans-serif';
    const textWidth = ctx.measureText(label).width;

    const tooltipX = _x + 10;
    const tooltipY = _y - 10;

    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(tooltipX - 4, tooltipY - 14, textWidth + 8, 18);

    ctx.fillStyle = 'white';
    ctx.fillText(label, tooltipX, tooltipY);
  }

  /**
   * Format genomic position for display
   * @private
   */
  _formatPosition(pos) {
    if (pos >= 1e6) return (pos / 1e6).toFixed(2) + 'M';
    if (pos >= 1e3) return (pos / 1e3).toFixed(1) + 'K';
    return pos.toFixed(0);
  }

  /**
   * Handle mouse move for hover effects
   * @private
   */
  _onMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find nearest item using spatial index
    const item = this._findNearestItem(x, y, 10);

    if (item !== this.hoveredItem) {
      this.hoveredItem = item;
      this.render();

      // Dispatch event
      this.canvas.dispatchEvent(
        new CustomEvent('itemhover', {
          detail: item,
        })
      );
    }
  }

  /**
   * Handle click events
   * @private
   */
  _onClick(event) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const item = this._findNearestItem(x, y, 10);

    if (item) {
      this.canvas.dispatchEvent(
        new CustomEvent('itemclick', {
          detail: item,
        })
      );
    }
  }

  /**
   * Handle mouse leave
   * @private
   */
  _onMouseLeave() {
    if (this.hoveredItem) {
      this.hoveredItem = null;
      this.render();
    }
  }

  /**
   * Find nearest data item to a point
   * @private
   */
  _findNearestItem(x, y, maxDistance) {
    if (!this.spatialIndex) return null;

    const gridSize = 20;
    const gridX = Math.floor(x / gridSize);
    const gridY = Math.floor(y / gridSize);

    let nearest = null;
    let nearestDist = maxDistance * maxDistance;

    // Check neighboring grid cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const key = `${gridX + dx},${gridY + dy}`;
        const items = this.spatialIndex.get(key);

        if (!items) continue;

        for (const item of items) {
          const distSq = (item._x - x) ** 2 + (item._y - y) ** 2;
          if (distSq < nearestDist) {
            nearestDist = distSq;
            nearest = item;
          }
        }
      }
    }

    return nearest;
  }

  /**
   * Get current render statistics
   */
  getStats() {
    return {
      renderTime: this.lastRenderTime,
      frameCount: this.frameCount,
      visiblePoints: this.visibleData.length,
      totalPoints: this.data.length,
    };
  }

  /**
   * Destroy the renderer and clean up
   */
  destroy() {
    this.canvas.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('click', this._onClick);
    this.canvas.removeEventListener('mouseleave', this._onMouseLeave);
    this.data = [];
    this.visibleData = [];
    this.spatialIndex = null;
  }
}

export default CanvasRenderer;
