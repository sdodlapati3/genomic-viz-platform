/**
 * SVG Renderer for Genomic Data
 *
 * Standard D3.js-based renderer for comparison with Canvas.
 * Best for smaller datasets (<10,000 elements) where
 * interactivity and styling flexibility are priorities.
 */

import * as d3 from 'd3';

/**
 * SVG-based renderer for genomic visualizations
 *
 * @class SVGRenderer
 */
export class SVGRenderer {
  /**
   * @param {SVGElement} svg - Target SVG element
   * @param {Object} options - Configuration options
   */
  constructor(svg, options = {}) {
    this.svg = d3.select(svg);

    // Options with defaults
    this.options = {
      width: options.width || parseInt(svg.getAttribute('width')) || 1200,
      height: options.height || parseInt(svg.getAttribute('height')) || 300,
      margin: options.margin || { top: 20, right: 20, bottom: 40, left: 60 },
      colors: options.colors || {
        point: '#4a90d9',
        pointHover: '#e74c3c',
        grid: '#f0f0f0',
        axis: '#333333',
      },
      transitionDuration: options.transitionDuration || 300,
      ...options,
    };

    // Region state
    this.chromosome = null;
    this.start = 0;
    this.end = 0;

    // Data
    this.data = [];

    // Performance tracking
    this.lastRenderTime = 0;
    this.frameCount = 0;

    // Initialize SVG structure
    this._setupSVG();
  }

  /**
   * Set up SVG structure and groups
   * @private
   */
  _setupSVG() {
    const { width, height, margin } = this.options;

    // Clear existing content
    this.svg.selectAll('*').remove();

    // Set SVG size
    this.svg.attr('width', width).attr('height', height);

    // Calculate plot area
    this.plotArea = {
      x: margin.left,
      y: margin.top,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };

    // Create main group with margin transform
    this.g = this.svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Create layer groups (render order)
    this.gridGroup = this.g.append('g').attr('class', 'grid-layer');
    this.dataGroup = this.g.append('g').attr('class', 'data-layer');
    this.axisGroup = this.g.append('g').attr('class', 'axis-layer');

    // Create scales (will be updated when region is set)
    this.xScale = d3.scaleLinear().range([0, this.plotArea.width]);
    this.yScale = d3.scaleLinear().range([this.plotArea.height, 0]);

    // Create axes
    this.xAxis = d3
      .axisBottom(this.xScale)
      .ticks(5)
      .tickFormat((d) => this._formatPosition(d));

    this.yAxis = d3.axisLeft(this.yScale).ticks(5);

    // Add axis groups
    this.xAxisGroup = this.axisGroup
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.plotArea.height})`);

    this.yAxisGroup = this.axisGroup.append('g').attr('class', 'y-axis');

    // Add axis labels
    this.xAxisLabel = this.axisGroup
      .append('text')
      .attr('class', 'x-axis-label')
      .attr('x', this.plotArea.width / 2)
      .attr('y', this.plotArea.height + 35)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px');

    this.yAxisLabel = this.axisGroup
      .append('text')
      .attr('class', 'y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.plotArea.height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Value');
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

    // Update x scale domain
    this.xScale.domain([start, end]);

    // Update axis label
    this.xAxisLabel.text(chromosome);
  }

  /**
   * Set the data to render
   * @param {Array} data - Array of data points
   */
  setData(data) {
    this.data = data;

    // Update y scale domain
    if (data.length > 0) {
      const values = data.map((d) => d.value || d.y || 0);
      const maxValue = Math.max(...values, 1);
      this.yScale.domain([0, maxValue]);
    }
  }

  /**
   * Main render method
   */
  render() {
    const startTime = performance.now();

    this._drawGrid();
    this._drawAxes();
    this._drawData();

    this.lastRenderTime = performance.now() - startTime;
    this.frameCount++;

    return this.lastRenderTime;
  }

  /**
   * Draw grid lines
   * @private
   */
  _drawGrid() {
    const { plotArea, options, xScale, yScale } = this;

    // X grid lines
    const xGridLines = this.gridGroup.selectAll('.x-grid').data(xScale.ticks(10));

    xGridLines
      .enter()
      .append('line')
      .attr('class', 'x-grid')
      .merge(xGridLines)
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', plotArea.height)
      .attr('stroke', options.colors.grid)
      .attr('stroke-width', 0.5);

    xGridLines.exit().remove();

    // Y grid lines
    const yGridLines = this.gridGroup.selectAll('.y-grid').data(yScale.ticks(5));

    yGridLines
      .enter()
      .append('line')
      .attr('class', 'y-grid')
      .merge(yGridLines)
      .attr('x1', 0)
      .attr('x2', plotArea.width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', options.colors.grid)
      .attr('stroke-width', 0.5);

    yGridLines.exit().remove();
  }

  /**
   * Draw axes
   * @private
   */
  _drawAxes() {
    this.xAxisGroup.call(this.xAxis);
    this.yAxisGroup.call(this.yAxis);
  }

  /**
   * Draw data points using D3 data binding
   * @private
   */
  _drawData() {
    const { dataGroup, xScale, yScale, options, chromosome } = this;
    const self = this;

    // Filter to visible region
    const visibleData = this.data.filter((d) => {
      const pos = d.position || d.x || 0;
      const chr = d.chromosome || d.chr || '';
      return chr === chromosome && pos >= this.start && pos <= this.end;
    });

    // Calculate point size based on data density
    const pointSize = Math.max(2, Math.min(5, 2000 / visibleData.length));

    // Data binding
    const points = dataGroup
      .selectAll('.data-point')
      .data(visibleData, (d) => d.id || `${d.chromosome}-${d.position}`);

    // Enter
    const pointsEnter = points
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('r', 0)
      .attr('fill', options.colors.point)
      .attr('opacity', 0.7)
      .attr('cursor', 'pointer');

    // Enter + Update
    pointsEnter
      .merge(points)
      .attr('cx', (d) => xScale(d.position || d.x || 0))
      .attr('cy', (d) => yScale(d.value || d.y || 0))
      .attr('r', pointSize)
      .on('mouseover', function (event, d) {
        d3.select(this)
          .attr('fill', options.colors.pointHover)
          .attr('r', pointSize * 1.5);

        self._showTooltip(event, d);
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', options.colors.point).attr('r', pointSize);

        self._hideTooltip();
      })
      .on('click', function (event, d) {
        self.svg.node().dispatchEvent(
          new CustomEvent('itemclick', {
            detail: d,
          })
        );
      });

    // Exit
    points.exit().transition().duration(options.transitionDuration).attr('r', 0).remove();
  }

  /**
   * Show tooltip
   * @private
   */
  _showTooltip(event, d) {
    // Remove existing tooltip
    this._hideTooltip();

    const tooltip = this.svg.append('g').attr('class', 'tooltip');

    const text = `${d.id || 'Point'}: ${(d.value || 0).toFixed(2)}`;

    const textEl = tooltip
      .append('text')
      .attr('x', event.offsetX + 10)
      .attr('y', event.offsetY - 10)
      .style('font-size', '11px')
      .style('font-weight', 'bold')
      .text(text);

    const bbox = textEl.node().getBBox();

    tooltip
      .insert('rect', 'text')
      .attr('x', bbox.x - 4)
      .attr('y', bbox.y - 2)
      .attr('width', bbox.width + 8)
      .attr('height', bbox.height + 4)
      .attr('fill', 'rgba(0,0,0,0.8)')
      .attr('rx', 3);

    textEl.attr('fill', 'white');
  }

  /**
   * Hide tooltip
   * @private
   */
  _hideTooltip() {
    this.svg.selectAll('.tooltip').remove();
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
   * Get current render statistics
   */
  getStats() {
    return {
      renderTime: this.lastRenderTime,
      frameCount: this.frameCount,
      elements: this.dataGroup.selectAll('.data-point').size(),
    };
  }

  /**
   * Destroy the renderer and clean up
   */
  destroy() {
    this.svg.selectAll('*').remove();
    this.data = [];
  }
}

export default SVGRenderer;
