/**
 * Tutorial 3.1: UMAP/t-SNE Scatter Plot Component
 * 
 * Interactive scatter plot for single-cell data visualization
 * Features:
 * - WebGL rendering for thousands of points
 * - D3.js for axes, legends, and interactions
 * - Quadtree for efficient point lookup
 * - Zoom/pan with smooth transitions
 * - Cell type filtering and highlighting
 * - Gene expression color mapping
 */

import * as d3 from 'd3';
import { WebGLScatterRenderer } from '../utils/webglRenderer.js';
import { buildQuadtree } from '../utils/quadtree.js';

export class ScatterPlot {
  constructor(container, options = {}) {
    this.container = d3.select(container);
    
    // Configuration
    this.config = {
      width: options.width || 900,
      height: options.height || 700,
      margin: options.margin || { top: 40, right: 200, bottom: 60, left: 60 },
      pointSize: options.pointSize || 4,
      pointOpacity: options.pointOpacity || 0.8,
      useWebGL: options.useWebGL !== false,
      transitionDuration: options.transitionDuration || 300
    };

    // Calculate plot dimensions
    this.plotWidth = this.config.width - this.config.margin.left - this.config.margin.right;
    this.plotHeight = this.config.height - this.config.margin.top - this.config.margin.bottom;

    // State
    this.data = [];
    this.filteredData = [];
    this.selectedCellTypes = new Set();
    this.colorBy = 'cellType';
    this.colorScale = null;
    this.quadtree = null;
    this.transform = d3.zoomIdentity;

    // Components
    this.svg = null;
    this.canvas = null;
    this.webglRenderer = null;
    this.xScale = null;
    this.yScale = null;
    this.zoom = null;

    this.init();
  }

  init() {
    this.container.html('');

    // Create main container
    const wrapper = this.container
      .append('div')
      .attr('class', 'scatter-wrapper')
      .style('position', 'relative')
      .style('width', `${this.config.width}px`)
      .style('height', `${this.config.height}px`);

    // Create canvas for WebGL/2D rendering
    this.canvas = wrapper
      .append('canvas')
      .attr('width', this.plotWidth)
      .attr('height', this.plotHeight)
      .style('position', 'absolute')
      .style('left', `${this.config.margin.left}px`)
      .style('top', `${this.config.margin.top}px`)
      .style('pointer-events', 'none')
      .style('background', '#fafafa');

    // Create SVG for axes, legends, and interactions
    this.svg = wrapper
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height)
      .style('position', 'absolute')
      .style('left', '0')
      .style('top', '0');

    // Create plot group
    this.plotGroup = this.svg
      .append('g')
      .attr('class', 'plot-area')
      .attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);

    // Create clip path
    this.svg.append('defs')
      .append('clipPath')
      .attr('id', 'plot-clip')
      .append('rect')
      .attr('width', this.plotWidth)
      .attr('height', this.plotHeight);

    // Create axes groups
    this.xAxisGroup = this.plotGroup
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.plotHeight})`);

    this.yAxisGroup = this.plotGroup
      .append('g')
      .attr('class', 'y-axis');

    // Create axis labels
    this.plotGroup
      .append('text')
      .attr('class', 'x-label')
      .attr('x', this.plotWidth / 2)
      .attr('y', this.plotHeight + 45)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('UMAP 1');

    this.plotGroup
      .append('text')
      .attr('class', 'y-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.plotHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .text('UMAP 2');

    // Create title
    this.svg
      .append('text')
      .attr('class', 'plot-title')
      .attr('x', this.config.width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .text('Single-Cell UMAP Visualization');

    // Create legend group
    this.legendGroup = this.svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${this.config.width - this.config.margin.right + 20}, ${this.config.margin.top})`);

    // Create tooltip
    this.tooltip = this.container
      .append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0,0,0,0.85)')
      .style('color', 'white')
      .style('padding', '10px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('max-width', '250px');

    // Create interaction overlay
    this.overlay = this.plotGroup
      .append('rect')
      .attr('class', 'overlay')
      .attr('width', this.plotWidth)
      .attr('height', this.plotHeight)
      .attr('fill', 'transparent')
      .style('cursor', 'crosshair');

    // Initialize WebGL renderer
    if (this.config.useWebGL) {
      try {
        this.webglRenderer = new WebGLScatterRenderer(this.canvas.node());
      } catch (e) {
        console.warn('WebGL not available, falling back to Canvas 2D');
        this.config.useWebGL = false;
      }
    }

    // Setup zoom behavior
    this.setupZoom();

    // Setup interactions
    this.setupInteractions();
  }

  setupZoom() {
    this.zoom = d3.zoom()
      .scaleExtent([0.5, 20])
      .on('zoom', (event) => {
        this.transform = event.transform;
        this.render();
        this.updateAxes();
      });

    this.overlay.call(this.zoom);
  }

  setupInteractions() {
    // Mouse move for hover
    this.overlay.on('mousemove', (event) => {
      const [mx, my] = d3.pointer(event);
      
      // Transform mouse coordinates
      const x = this.transform.invertX(mx);
      const y = this.transform.invertY(my);
      
      // Convert to data coordinates
      const dataX = this.xScale.invert(x);
      const dataY = this.yScale.invert(y);
      
      // Find nearest point using quadtree
      if (this.quadtree) {
        const searchRadius = 10 / this.transform.k;
        const nearest = this.quadtree.findNearest(dataX, dataY, searchRadius);
        
        if (nearest) {
          this.showTooltip(nearest, event);
          this.highlightPoint(nearest);
        } else {
          this.hideTooltip();
          this.clearHighlight();
        }
      }
    });

    this.overlay.on('mouseleave', () => {
      this.hideTooltip();
      this.clearHighlight();
    });

    // Click for selection
    this.overlay.on('click', (event) => {
      const [mx, my] = d3.pointer(event);
      const x = this.transform.invertX(mx);
      const y = this.transform.invertY(my);
      const dataX = this.xScale.invert(x);
      const dataY = this.yScale.invert(y);
      
      if (this.quadtree) {
        const searchRadius = 10 / this.transform.k;
        const nearest = this.quadtree.findNearest(dataX, dataY, searchRadius);
        
        if (nearest) {
          this.onCellClick(nearest);
        }
      }
    });
  }

  setData(data, cellTypeInfo) {
    this.data = data.map(d => ({
      ...d,
      x: d.umap1,
      y: d.umap2
    }));
    
    this.cellTypeInfo = cellTypeInfo;
    this.filteredData = [...this.data];
    
    // Set all cell types as selected initially
    this.selectedCellTypes = new Set(Object.keys(cellTypeInfo));
    
    // Setup scales
    this.setupScales();
    
    // Setup color scale
    this.setupColorScale();
    
    // Build quadtree
    this.buildQuadtree();
    
    // Render
    this.render();
    this.updateAxes();
    this.renderLegend();
  }

  setupScales() {
    const xExtent = d3.extent(this.data, d => d.x);
    const yExtent = d3.extent(this.data, d => d.y);
    
    // Add padding
    const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
    
    this.xScale = d3.scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([0, this.plotWidth]);
    
    this.yScale = d3.scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([this.plotHeight, 0]);
  }

  setupColorScale() {
    if (this.colorBy === 'cellType') {
      const cellTypes = Object.keys(this.cellTypeInfo);
      const colors = cellTypes.map(ct => this.cellTypeInfo[ct].color);
      this.colorScale = d3.scaleOrdinal()
        .domain(cellTypes)
        .range(colors);
    } else {
      // Color by gene expression
      const values = this.data.map(d => d.geneExpression[this.colorBy] || 0);
      this.colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain(d3.extent(values));
    }
  }

  buildQuadtree() {
    this.quadtree = buildQuadtree(this.filteredData.map(d => ({
      ...d,
      x: d.x,
      y: d.y
    })));
  }

  getPointColor(d) {
    if (this.colorBy === 'cellType') {
      return this.cellTypeInfo[d.cellType]?.color || '#999';
    } else {
      const value = d.geneExpression[this.colorBy] || 0;
      return this.colorScale(value);
    }
  }

  render() {
    if (this.config.useWebGL && this.webglRenderer) {
      this.renderWebGL();
    } else {
      this.renderCanvas2D();
    }
  }

  renderWebGL() {
    const positions = [];
    const colors = [];
    const sizes = [];
    
    for (const d of this.filteredData) {
      // Apply transforms
      const sx = this.transform.applyX(this.xScale(d.x));
      const sy = this.transform.applyY(this.yScale(d.y));
      
      // Skip points outside viewport
      if (sx < -10 || sx > this.plotWidth + 10 || sy < -10 || sy > this.plotHeight + 10) {
        continue;
      }
      
      // Normalize to WebGL coordinates (-1 to 1)
      const nx = (sx / this.plotWidth) * 2 - 1;
      const ny = 1 - (sy / this.plotHeight) * 2;
      
      positions.push(nx, ny);
      
      // Parse color
      const color = d3.color(this.getPointColor(d));
      colors.push(color.r / 255, color.g / 255, color.b / 255, this.config.pointOpacity);
      
      sizes.push(this.config.pointSize * this.transform.k);
    }
    
    this.webglRenderer.render(
      new Float32Array(positions),
      new Float32Array(colors),
      new Float32Array(sizes)
    );
  }

  renderCanvas2D() {
    const ctx = this.canvas.node().getContext('2d');
    
    // Clear with light background
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, this.plotWidth, this.plotHeight);
    
    // Draw border
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, this.plotWidth, this.plotHeight);
    
    // Draw points
    for (const d of this.filteredData) {
      const sx = this.transform.applyX(this.xScale(d.x));
      const sy = this.transform.applyY(this.yScale(d.y));
      
      // Skip points outside viewport
      if (sx < -10 || sx > this.plotWidth + 10 || sy < -10 || sy > this.plotHeight + 10) {
        continue;
      }
      
      ctx.beginPath();
      ctx.arc(sx, sy, this.config.pointSize * this.transform.k * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = this.getPointColor(d);
      ctx.globalAlpha = this.config.pointOpacity;
      ctx.fill();
      
      // Add subtle border to points
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1;
  }

  updateAxes() {
    // Create transformed scales
    const xScaleZoomed = this.transform.rescaleX(this.xScale);
    const yScaleZoomed = this.transform.rescaleY(this.yScale);
    
    // Update axes
    this.xAxisGroup.call(d3.axisBottom(xScaleZoomed).ticks(8));
    this.yAxisGroup.call(d3.axisLeft(yScaleZoomed).ticks(8));
  }

  renderLegend() {
    this.legendGroup.selectAll('*').remove();
    
    // Title
    this.legendGroup
      .append('text')
      .attr('class', 'legend-title')
      .attr('y', -5)
      .style('font-weight', 'bold')
      .style('font-size', '13px')
      .text('Cell Types');
    
    const cellTypes = Object.entries(this.cellTypeInfo);
    
    // Legend items
    const items = this.legendGroup
      .selectAll('.legend-item')
      .data(cellTypes)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${i * 22 + 15})`)
      .style('cursor', 'pointer')
      .on('click', (event, [cellType]) => {
        this.toggleCellType(cellType);
      })
      .on('mouseenter', (event, [cellType]) => {
        this.highlightCellType(cellType);
      })
      .on('mouseleave', () => {
        this.clearCellTypeHighlight();
      });
    
    // Color circles
    items
      .append('circle')
      .attr('r', 6)
      .attr('fill', ([, info]) => info.color)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .attr('opacity', ([cellType]) => this.selectedCellTypes.has(cellType) ? 1 : 0.3);
    
    // Labels
    items
      .append('text')
      .attr('x', 12)
      .attr('y', 4)
      .style('font-size', '11px')
      .style('fill', ([cellType]) => this.selectedCellTypes.has(cellType) ? '#333' : '#999')
      .text(([cellType, info]) => `${cellType} (${info.count || 0})`);
    
    // Add count display
    const totalCount = this.filteredData.length;
    this.legendGroup
      .append('text')
      .attr('class', 'cell-count')
      .attr('y', cellTypes.length * 22 + 35)
      .style('font-size', '11px')
      .style('fill', '#666')
      .text(`Total: ${totalCount.toLocaleString()} cells`);
    
    // Add controls
    this.addControls(cellTypes.length * 22 + 60);
  }

  addControls(yOffset) {
    // Reset zoom button
    this.legendGroup
      .append('text')
      .attr('class', 'control-button')
      .attr('y', yOffset)
      .style('font-size', '11px')
      .style('fill', '#0066cc')
      .style('cursor', 'pointer')
      .style('text-decoration', 'underline')
      .text('Reset Zoom')
      .on('click', () => this.resetZoom());
    
    // Select all button
    this.legendGroup
      .append('text')
      .attr('class', 'control-button')
      .attr('y', yOffset + 18)
      .style('font-size', '11px')
      .style('fill', '#0066cc')
      .style('cursor', 'pointer')
      .style('text-decoration', 'underline')
      .text('Select All')
      .on('click', () => this.selectAllCellTypes());
    
    // Deselect all button
    this.legendGroup
      .append('text')
      .attr('class', 'control-button')
      .attr('y', yOffset + 36)
      .style('font-size', '11px')
      .style('fill', '#0066cc')
      .style('cursor', 'pointer')
      .style('text-decoration', 'underline')
      .text('Deselect All')
      .on('click', () => this.deselectAllCellTypes());
  }

  toggleCellType(cellType) {
    if (this.selectedCellTypes.has(cellType)) {
      this.selectedCellTypes.delete(cellType);
    } else {
      this.selectedCellTypes.add(cellType);
    }
    this.filterData();
  }

  selectAllCellTypes() {
    this.selectedCellTypes = new Set(Object.keys(this.cellTypeInfo));
    this.filterData();
  }

  deselectAllCellTypes() {
    this.selectedCellTypes.clear();
    this.filterData();
  }

  filterData() {
    this.filteredData = this.data.filter(d => this.selectedCellTypes.has(d.cellType));
    this.buildQuadtree();
    this.render();
    this.renderLegend();
  }

  highlightCellType(cellType) {
    // Temporarily highlight one cell type
    const originalFiltered = this.filteredData;
    this.filteredData = this.data.filter(d => d.cellType === cellType);
    this.render();
    this.filteredData = originalFiltered;
  }

  clearCellTypeHighlight() {
    this.render();
  }

  showTooltip(point, event) {
    const expression = point.geneExpression || {};
    const genes = Object.entries(expression)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([gene, value]) => `${gene}: ${value.toFixed(2)}`)
      .join('<br>');
    
    this.tooltip
      .style('visibility', 'visible')
      .html(`
        <strong>Cell ID:</strong> ${point.cellId}<br>
        <strong>Type:</strong> ${point.cellType}<br>
        <strong>Sample:</strong> ${point.sample}<br>
        <strong>UMAP:</strong> (${point.x.toFixed(2)}, ${point.y.toFixed(2)})<br>
        <hr style="margin: 5px 0; border-color: #444;">
        <strong>Top Genes:</strong><br>
        ${genes}
      `)
      .style('left', `${event.offsetX + 15}px`)
      .style('top', `${event.offsetY - 10}px`);
  }

  hideTooltip() {
    this.tooltip.style('visibility', 'hidden');
  }

  highlightPoint(point) {
    // Draw highlight circle on SVG
    this.plotGroup.selectAll('.highlight-circle').remove();
    
    const sx = this.transform.applyX(this.xScale(point.x));
    const sy = this.transform.applyY(this.yScale(point.y));
    
    this.plotGroup
      .append('circle')
      .attr('class', 'highlight-circle')
      .attr('cx', sx)
      .attr('cy', sy)
      .attr('r', this.config.pointSize * this.transform.k + 4)
      .attr('fill', 'none')
      .attr('stroke', '#ff0')
      .attr('stroke-width', 2);
  }

  clearHighlight() {
    this.plotGroup.selectAll('.highlight-circle').remove();
  }

  onCellClick(cell) {
    console.log('Cell clicked:', cell);
    
    // Dispatch custom event
    const event = new CustomEvent('cellClick', { detail: cell });
    this.container.node().dispatchEvent(event);
  }

  resetZoom() {
    this.overlay.transition()
      .duration(500)
      .call(this.zoom.transform, d3.zoomIdentity);
  }

  colorByGene(geneName) {
    this.colorBy = geneName;
    
    // Update color scale for gene expression
    const values = this.data.map(d => d.geneExpression[geneName] || 0);
    this.colorScale = d3.scaleSequential(d3.interpolateViridis)
      .domain(d3.extent(values));
    
    this.render();
    this.renderGeneColorLegend();
  }

  colorByCellType() {
    this.colorBy = 'cellType';
    this.setupColorScale();
    this.render();
    this.renderLegend();
  }

  renderGeneColorLegend() {
    this.legendGroup.selectAll('*').remove();
    
    // Title
    this.legendGroup
      .append('text')
      .attr('class', 'legend-title')
      .attr('y', -5)
      .style('font-weight', 'bold')
      .style('font-size', '13px')
      .text(`${this.colorBy} Expression`);
    
    // Color gradient
    const gradientWidth = 120;
    const gradientHeight = 15;
    
    const gradient = this.legendGroup
      .append('defs')
      .append('linearGradient')
      .attr('id', 'color-gradient')
      .attr('x1', '0%')
      .attr('x2', '100%');
    
    gradient.append('stop').attr('offset', '0%').attr('stop-color', d3.interpolateViridis(0));
    gradient.append('stop').attr('offset', '50%').attr('stop-color', d3.interpolateViridis(0.5));
    gradient.append('stop').attr('offset', '100%').attr('stop-color', d3.interpolateViridis(1));
    
    this.legendGroup
      .append('rect')
      .attr('y', 15)
      .attr('width', gradientWidth)
      .attr('height', gradientHeight)
      .attr('fill', 'url(#color-gradient)');
    
    // Labels
    const domain = this.colorScale.domain();
    this.legendGroup
      .append('text')
      .attr('y', 45)
      .style('font-size', '10px')
      .text(domain[0].toFixed(2));
    
    this.legendGroup
      .append('text')
      .attr('x', gradientWidth)
      .attr('y', 45)
      .attr('text-anchor', 'end')
      .style('font-size', '10px')
      .text(domain[1].toFixed(2));
    
    // Back to cell type button
    this.legendGroup
      .append('text')
      .attr('y', 70)
      .style('font-size', '11px')
      .style('fill', '#0066cc')
      .style('cursor', 'pointer')
      .style('text-decoration', 'underline')
      .text('← Color by Cell Type')
      .on('click', () => this.colorByCellType());
  }

  destroy() {
    if (this.webglRenderer) {
      this.webglRenderer.destroy();
    }
    this.container.html('');
  }
}

export default ScatterPlot;
