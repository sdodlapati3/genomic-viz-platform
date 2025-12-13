/**
 * Tutorial 3.2: Gene Expression Heatmap Component
 * 
 * Interactive clustered heatmap for gene expression data
 * Features:
 * - Hierarchical clustering of rows and columns
 * - Dendrograms showing cluster relationships
 * - Color scale with adjustable range
 * - Row/column annotations
 * - Zoom and pan
 * - Cell hover tooltips
 */

import * as d3 from 'd3';
import { hierarchicalCluster, dendrogramCoordinates, reorderMatrix, correlationDistance } from '../utils/clustering.js';

export class Heatmap {
  constructor(container, options = {}) {
    this.container = d3.select(container);
    
    // Configuration
    this.config = {
      width: options.width || 1000,
      height: options.height || 700,
      margin: options.margin || { top: 100, right: 50, bottom: 100, left: 150 },
      cellPadding: options.cellPadding || 1,
      dendrogramWidth: options.dendrogramWidth || 80,
      dendrogramHeight: options.dendrogramHeight || 60,
      annotationHeight: options.annotationHeight || 15,
      colorScheme: options.colorScheme || 'RdBu',
      fontSize: options.fontSize || 10,
      showRowDendrogram: options.showRowDendrogram !== false,
      showColDendrogram: options.showColDendrogram !== false,
      clusterRows: options.clusterRows !== false,
      clusterCols: options.clusterCols !== false
    };

    // State
    this.data = null;
    this.normalizedMatrix = null;
    this.rowOrder = [];
    this.colOrder = [];
    this.rowDendrogram = null;
    this.colDendrogram = null;
    this.colorScale = null;
    this.selectedCells = new Set();

    // Components
    this.svg = null;
    this.heatmapGroup = null;
    this.tooltip = null;

    this.init();
  }

  init() {
    this.container.html('');

    // Create SVG
    this.svg = this.container
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height)
      .style('font-family', '-apple-system, BlinkMacSystemFont, sans-serif');

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
      .style('z-index', '1000');

    // Create groups
    this.rowDendrogramGroup = this.svg.append('g').attr('class', 'row-dendrogram');
    this.colDendrogramGroup = this.svg.append('g').attr('class', 'col-dendrogram');
    this.rowAnnotationGroup = this.svg.append('g').attr('class', 'row-annotation');
    this.colAnnotationGroup = this.svg.append('g').attr('class', 'col-annotation');
    this.heatmapGroup = this.svg.append('g').attr('class', 'heatmap');
    this.rowLabelGroup = this.svg.append('g').attr('class', 'row-labels');
    this.colLabelGroup = this.svg.append('g').attr('class', 'col-labels');
    this.colorLegendGroup = this.svg.append('g').attr('class', 'color-legend');
  }

  setData(data, options = {}) {
    this.data = data;
    
    // Z-score normalize if requested
    if (options.normalize !== false) {
      this.normalizedMatrix = this.zScoreNormalize(data.matrix);
    } else {
      this.normalizedMatrix = data.matrix;
    }
    
    // Perform clustering
    this.cluster();
    
    // Setup color scale
    this.setupColorScale();
    
    // Render
    this.render();
  }

  zScoreNormalize(matrix) {
    return matrix.map(row => {
      const mean = row.reduce((a, b) => a + b, 0) / row.length;
      const std = Math.sqrt(row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length);
      return row.map(v => std > 0 ? (v - mean) / std : 0);
    });
  }

  cluster() {
    const { clusterRows, clusterCols } = this.config;
    
    // Cluster rows (genes)
    if (clusterRows && this.normalizedMatrix.length > 1) {
      const result = hierarchicalCluster(this.normalizedMatrix, {
        distanceFn: correlationDistance,
        linkage: 'average'
      });
      this.rowOrder = result.order;
      this.rowDendrogram = result.dendrogram;
    } else {
      this.rowOrder = this.normalizedMatrix.map((_, i) => i);
      this.rowDendrogram = null;
    }
    
    // Cluster columns (samples)
    if (clusterCols && this.data.samples.length > 1) {
      // Transpose matrix for column clustering
      const transposed = this.transpose(this.normalizedMatrix);
      const result = hierarchicalCluster(transposed, {
        distanceFn: correlationDistance,
        linkage: 'average'
      });
      this.colOrder = result.order;
      this.colDendrogram = result.dendrogram;
    } else {
      this.colOrder = this.data.samples.map((_, i) => i);
      this.colDendrogram = null;
    }
  }

  transpose(matrix) {
    if (matrix.length === 0) return [];
    return matrix[0].map((_, i) => matrix.map(row => row[i]));
  }

  setupColorScale() {
    // Calculate value range
    const values = this.normalizedMatrix.flat();
    const absMax = Math.max(Math.abs(d3.min(values)), Math.abs(d3.max(values)));
    const domain = [-absMax, 0, absMax];
    
    // Create diverging color scale
    this.colorScale = d3.scaleSequential()
      .domain([-absMax, absMax])
      .interpolator(d3.interpolateRdBu);
    
    // Reverse so red = high, blue = low (conventional)
    const originalScale = this.colorScale;
    this.colorScale = v => originalScale(-v);
  }

  render() {
    // Calculate dimensions
    const dendroLeft = this.config.showRowDendrogram ? this.config.dendrogramWidth : 0;
    const dendroTop = this.config.showColDendrogram ? this.config.dendrogramHeight : 0;
    const annotLeft = this.config.annotationHeight + 5;
    const annotTop = this.config.annotationHeight + 5;
    
    const heatmapLeft = this.config.margin.left + dendroLeft + annotLeft;
    const heatmapTop = this.config.margin.top + dendroTop + annotTop;
    const heatmapWidth = this.config.width - heatmapLeft - this.config.margin.right;
    const heatmapHeight = this.config.height - heatmapTop - this.config.margin.bottom;
    
    const cellWidth = heatmapWidth / this.colOrder.length;
    const cellHeight = heatmapHeight / this.rowOrder.length;
    
    // Render dendrograms
    if (this.config.showRowDendrogram && this.rowDendrogram) {
      this.renderRowDendrogram(
        this.config.margin.left,
        heatmapTop,
        dendroLeft,
        heatmapHeight
      );
    }
    
    if (this.config.showColDendrogram && this.colDendrogram) {
      this.renderColDendrogram(
        heatmapLeft,
        this.config.margin.top,
        heatmapWidth,
        dendroTop
      );
    }
    
    // Render annotations
    this.renderRowAnnotations(
      heatmapLeft - annotLeft,
      heatmapTop,
      this.config.annotationHeight,
      heatmapHeight,
      cellHeight
    );
    
    this.renderColAnnotations(
      heatmapLeft,
      heatmapTop - annotTop,
      heatmapWidth,
      this.config.annotationHeight,
      cellWidth
    );
    
    // Render heatmap cells
    this.renderHeatmap(heatmapLeft, heatmapTop, cellWidth, cellHeight);
    
    // Render labels
    this.renderRowLabels(heatmapLeft + heatmapWidth + 5, heatmapTop, cellHeight);
    this.renderColLabels(heatmapLeft, heatmapTop + heatmapHeight + 5, cellWidth);
    
    // Render color legend
    this.renderColorLegend(this.config.width - 120, this.config.margin.top);
  }

  renderHeatmap(x, y, cellWidth, cellHeight) {
    this.heatmapGroup
      .attr('transform', `translate(${x},${y})`);
    
    // Reorder matrix
    const reorderedMatrix = reorderMatrix(this.normalizedMatrix, this.rowOrder, this.colOrder);
    const reorderedGenes = this.rowOrder.map(i => this.data.genes[i]);
    const reorderedSamples = this.colOrder.map(i => this.data.samples[i]);
    
    // Create cells
    const cells = this.heatmapGroup
      .selectAll('.cell')
      .data(reorderedMatrix.flatMap((row, i) => 
        row.map((value, j) => ({
          row: i,
          col: j,
          value,
          gene: reorderedGenes[i],
          sample: reorderedSamples[j],
          originalValue: this.data.matrix[this.rowOrder[i]][this.colOrder[j]]
        }))
      ));
    
    cells.enter()
      .append('rect')
      .attr('class', 'cell')
      .merge(cells)
      .attr('x', d => d.col * cellWidth + this.config.cellPadding / 2)
      .attr('y', d => d.row * cellHeight + this.config.cellPadding / 2)
      .attr('width', Math.max(1, cellWidth - this.config.cellPadding))
      .attr('height', Math.max(1, cellHeight - this.config.cellPadding))
      .attr('fill', d => this.colorScale(d.value))
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => this.showTooltip(event, d))
      .on('mouseleave', () => this.hideTooltip())
      .on('click', (event, d) => this.onCellClick(d));
    
    cells.exit().remove();
  }

  renderRowDendrogram(x, y, width, height) {
    this.rowDendrogramGroup
      .attr('transform', `translate(${x},${y})`);
    
    this.rowDendrogramGroup.selectAll('*').remove();
    
    if (!this.rowDendrogram) return;
    
    const coords = dendrogramCoordinates(this.rowDendrogram, width, height, 'left');
    
    for (const line of coords) {
      if (line.type === 'vertical') {
        this.rowDendrogramGroup
          .append('line')
          .attr('x1', line.x)
          .attr('x2', line.x)
          .attr('y1', line.y1)
          .attr('y2', line.y2)
          .attr('stroke', '#666')
          .attr('stroke-width', 1);
      } else {
        this.rowDendrogramGroup
          .append('line')
          .attr('x1', line.x1)
          .attr('x2', line.x2)
          .attr('y1', line.y)
          .attr('y2', line.y)
          .attr('stroke', '#666')
          .attr('stroke-width', 1);
      }
    }
  }

  renderColDendrogram(x, y, width, height) {
    this.colDendrogramGroup
      .attr('transform', `translate(${x},${y})`);
    
    this.colDendrogramGroup.selectAll('*').remove();
    
    if (!this.colDendrogram) return;
    
    const coords = dendrogramCoordinates(this.colDendrogram, width, height, 'top');
    
    for (const line of coords) {
      if (line.type === 'vertical') {
        this.colDendrogramGroup
          .append('line')
          .attr('x1', line.x)
          .attr('x2', line.x)
          .attr('y1', line.y1)
          .attr('y2', line.y2)
          .attr('stroke', '#666')
          .attr('stroke-width', 1);
      } else {
        this.colDendrogramGroup
          .append('line')
          .attr('x1', line.x1)
          .attr('x2', line.x2)
          .attr('y1', line.y)
          .attr('y2', line.y)
          .attr('stroke', '#666')
          .attr('stroke-width', 1);
      }
    }
  }

  renderRowAnnotations(x, y, width, height, cellHeight) {
    this.rowAnnotationGroup
      .attr('transform', `translate(${x},${y})`);
    
    this.rowAnnotationGroup.selectAll('*').remove();
    
    // Gene pathway annotations
    const reorderedGenes = this.rowOrder.map(i => this.data.genes[i]);
    
    for (let i = 0; i < reorderedGenes.length; i++) {
      const gene = reorderedGenes[i];
      const info = this.data.geneInfo[gene];
      
      this.rowAnnotationGroup
        .append('rect')
        .attr('x', 0)
        .attr('y', i * cellHeight + this.config.cellPadding / 2)
        .attr('width', width)
        .attr('height', Math.max(1, cellHeight - this.config.cellPadding))
        .attr('fill', info?.pathwayColor || '#ccc');
    }
  }

  renderColAnnotations(x, y, width, height, cellWidth) {
    this.colAnnotationGroup
      .attr('transform', `translate(${x},${y})`);
    
    this.colAnnotationGroup.selectAll('*').remove();
    
    // Sample group annotations
    const reorderedSamples = this.colOrder.map(i => this.data.samples[i]);
    
    for (let i = 0; i < reorderedSamples.length; i++) {
      const sample = reorderedSamples[i];
      const info = this.data.sampleInfo[sample];
      
      this.colAnnotationGroup
        .append('rect')
        .attr('x', i * cellWidth + this.config.cellPadding / 2)
        .attr('y', 0)
        .attr('width', Math.max(1, cellWidth - this.config.cellPadding))
        .attr('height', height)
        .attr('fill', info?.color || '#ccc');
    }
  }

  renderRowLabels(x, y, cellHeight) {
    this.rowLabelGroup
      .attr('transform', `translate(${x},${y})`);
    
    this.rowLabelGroup.selectAll('*').remove();
    
    // Only show labels if there's enough space
    if (cellHeight < 8) return;
    
    const reorderedGenes = this.rowOrder.map(i => this.data.genes[i]);
    
    for (let i = 0; i < reorderedGenes.length; i++) {
      this.rowLabelGroup
        .append('text')
        .attr('x', 0)
        .attr('y', i * cellHeight + cellHeight / 2)
        .attr('dy', '0.35em')
        .attr('font-size', Math.min(this.config.fontSize, cellHeight - 2))
        .attr('fill', '#333')
        .text(reorderedGenes[i]);
    }
  }

  renderColLabels(x, y, cellWidth) {
    this.colLabelGroup
      .attr('transform', `translate(${x},${y})`);
    
    this.colLabelGroup.selectAll('*').remove();
    
    const reorderedSamples = this.colOrder.map(i => this.data.samples[i]);
    
    for (let i = 0; i < reorderedSamples.length; i++) {
      this.colLabelGroup
        .append('text')
        .attr('x', i * cellWidth + cellWidth / 2)
        .attr('y', 5)
        .attr('transform', `rotate(45, ${i * cellWidth + cellWidth / 2}, 5)`)
        .attr('font-size', this.config.fontSize)
        .attr('fill', '#333')
        .attr('text-anchor', 'start')
        .text(reorderedSamples[i]);
    }
  }

  renderColorLegend(x, y) {
    this.colorLegendGroup
      .attr('transform', `translate(${x},${y})`);
    
    this.colorLegendGroup.selectAll('*').remove();
    
    const legendHeight = 150;
    const legendWidth = 20;
    
    // Title
    this.colorLegendGroup
      .append('text')
      .attr('x', legendWidth / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .attr('font-size', 11)
      .attr('font-weight', 'bold')
      .text('Z-score');
    
    // Gradient
    const values = this.normalizedMatrix.flat();
    const absMax = Math.max(Math.abs(d3.min(values)), Math.abs(d3.max(values)));
    
    const defs = this.colorLegendGroup.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'heatmap-gradient')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '0%')
      .attr('y2', '100%');
    
    const steps = 10;
    for (let i = 0; i <= steps; i++) {
      const value = absMax - (2 * absMax * i / steps);
      gradient.append('stop')
        .attr('offset', `${i * 100 / steps}%`)
        .attr('stop-color', this.colorScale(value));
    }
    
    this.colorLegendGroup
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', 'url(#heatmap-gradient)')
      .attr('stroke', '#ccc');
    
    // Scale
    const legendScale = d3.scaleLinear()
      .domain([absMax, -absMax])
      .range([0, legendHeight]);
    
    const legendAxis = d3.axisRight(legendScale)
      .ticks(5)
      .tickFormat(d3.format('.1f'));
    
    this.colorLegendGroup
      .append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .select('.domain').remove();
  }

  showTooltip(event, d) {
    const geneInfo = this.data.geneInfo[d.gene];
    
    this.tooltip
      .style('visibility', 'visible')
      .html(`
        <strong>${d.gene}</strong><br>
        <strong>Sample:</strong> ${d.sample}<br>
        <strong>Expression:</strong> ${d.originalValue.toFixed(2)}<br>
        <strong>Z-score:</strong> ${d.value.toFixed(2)}<br>
        <strong>Pathway:</strong> ${geneInfo?.pathway || 'Unknown'}
      `)
      .style('left', `${event.offsetX + 15}px`)
      .style('top', `${event.offsetY - 10}px`);
  }

  hideTooltip() {
    this.tooltip.style('visibility', 'hidden');
  }

  onCellClick(cell) {
    console.log('Cell clicked:', cell);
    
    const event = new CustomEvent('cellClick', { detail: cell });
    this.container.node().dispatchEvent(event);
  }

  // Public methods for interactivity
  setClusterRows(cluster) {
    this.config.clusterRows = cluster;
    if (this.data) {
      this.cluster();
      this.render();
    }
  }

  setClusterCols(cluster) {
    this.config.clusterCols = cluster;
    if (this.data) {
      this.cluster();
      this.render();
    }
  }

  setShowDendrograms(showRow, showCol) {
    this.config.showRowDendrogram = showRow;
    this.config.showColDendrogram = showCol;
    if (this.data) {
      this.render();
    }
  }

  destroy() {
    this.container.html('');
  }
}

export default Heatmap;
