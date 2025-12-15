/**
 * ExpressionRankPlot - Expression rank visualization with outlier highlighting
 *
 * Displays gene expression values ranked by magnitude,
 * with outliers highlighted and linked selection support.
 */

import * as d3 from 'd3';
import { GeneExpression, ExpressionSample, OutlierConfig, DEFAULT_OUTLIER_CONFIG } from '../types';
import { EventBus } from '../state';
import { processExpressionData, getOutlierColor } from '../utils';

export interface ExpressionRankPlotConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  pointRadius: number;
  highlightRadius: number;
  showOutlierLabels: boolean;
  outlierConfig: OutlierConfig;
}

const DEFAULT_CONFIG: ExpressionRankPlotConfig = {
  width: 600,
  height: 400,
  margin: { top: 40, right: 30, bottom: 60, left: 80 },
  pointRadius: 5,
  highlightRadius: 8,
  showOutlierLabels: true,
  outlierConfig: DEFAULT_OUTLIER_CONFIG,
};

export class ExpressionRankPlot {
  private container: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private config: ExpressionRankPlotConfig;
  private data: ExpressionSample[] = [];
  private geneName: string = '';
  private selectedSamples: Set<string> = new Set();
  private highlightedSamples: Set<string> = new Set();

  private xScale!: d3.ScaleLinear<number, number>;
  private yScale!: d3.ScaleLinear<number, number>;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;

  constructor(parentSelector: string, config: Partial<ExpressionRankPlotConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    const parent = d3.select(parentSelector);
    parent.selectAll('*').remove();

    this.svg = parent
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height)
      .attr('class', 'expression-rank-plot');

    this.container = this.svg
      .append('g')
      .attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);

    // Create tooltip
    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'expression-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'white')
      .style('border', '1px solid #ccc')
      .style('border-radius', '4px')
      .style('padding', '8px 12px')
      .style('font-size', '12px')
      .style('box-shadow', '0 2px 4px rgba(0,0,0,0.1)')
      .style('pointer-events', 'none')
      .style('z-index', '1000');

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen for selection changes
    EventBus.on('selection:change', (event) => {
      if (event.source !== 'expression-plot') {
        this.selectedSamples = new Set(event.sampleIds);
        this.updateSelection();
      }
    });

    EventBus.on('selection:clear', (event) => {
      if (event.source !== 'expression-plot') {
        this.selectedSamples.clear();
        this.updateSelection();
      }
    });

    EventBus.on('highlight:show', (event) => {
      if (event.source !== 'expression-plot') {
        this.highlightedSamples = new Set(event.sampleIds);
        this.updateHighlight();
      }
    });

    EventBus.on('highlight:hide', () => {
      this.highlightedSamples.clear();
      this.updateHighlight();
    });
  }

  /**
   * Set expression data
   */
  setData(expressions: GeneExpression[], geneName: string): void {
    this.geneName = geneName;

    // Filter to this gene and process
    const geneData = expressions.filter((e) => e.geneName === geneName);
    const sampleIds = geneData.map((e) => e.sampleId);
    const values = geneData.map((e) => e.value);

    this.data = processExpressionData(sampleIds, values, this.config.outlierConfig);

    this.render();
  }

  private render(): void {
    const { width, height, margin } = this.config;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous content
    this.container.selectAll('*').remove();

    if (this.data.length === 0) {
      this.container
        .append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .text('No data available');
      return;
    }

    // Create scales
    this.xScale = d3
      .scaleLinear()
      .domain([0, this.data.length + 1])
      .range([0, innerWidth]);

    const yExtent = d3.extent(this.data, (d) => d.value) as [number, number];
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;
    this.yScale = d3
      .scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([innerHeight, 0]);

    // Add axes
    this.renderAxes(innerWidth, innerHeight);

    // Add reference lines for outlier thresholds
    this.renderThresholdLines(innerWidth);

    // Add points
    this.renderPoints();

    // Add title
    this.svg.selectAll('.plot-title').remove();
    this.svg
      .append('text')
      .attr('class', 'plot-title')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-weight', 'bold')
      .style('font-size', '14px')
      .text(`${this.geneName} Expression Rank Plot`);

    // Add brush for selection
    this.setupBrush(innerWidth, innerHeight);
  }

  private renderAxes(innerWidth: number, innerHeight: number): void {
    // X axis
    const xAxis = d3
      .axisBottom(this.xScale)
      .ticks(10)
      .tickFormat((d) => String(d));

    this.container
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    // X axis label
    this.container
      .append('text')
      .attr('class', 'x-label')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 45)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Sample Rank');

    // Y axis
    const yAxis = d3.axisLeft(this.yScale).ticks(8);

    this.container.append('g').attr('class', 'y-axis').call(yAxis);

    // Y axis label
    this.container
      .append('text')
      .attr('class', 'y-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -55)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text('Expression (log₂ TPM+1)');
  }

  private renderThresholdLines(innerWidth: number): void {
    // Calculate thresholds based on data statistics
    const values = this.data.map((d) => d.value);
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const q1 = sorted[Math.floor(n / 4)];
    const q3 = sorted[Math.floor((3 * n) / 4)];
    const iqr = q3 - q1;

    const lowerThreshold = q1 - this.config.outlierConfig.threshold * iqr;
    const upperThreshold = q3 + this.config.outlierConfig.threshold * iqr;

    // Lower threshold line
    this.container
      .append('line')
      .attr('class', 'threshold-line lower')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', this.yScale(lowerThreshold))
      .attr('y2', this.yScale(lowerThreshold))
      .attr('stroke', '#42a5f5')
      .attr('stroke-dasharray', '5,5')
      .attr('stroke-width', 1)
      .attr('opacity', 0.7);

    // Upper threshold line
    this.container
      .append('line')
      .attr('class', 'threshold-line upper')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', this.yScale(upperThreshold))
      .attr('y2', this.yScale(upperThreshold))
      .attr('stroke', '#f57c00')
      .attr('stroke-dasharray', '5,5')
      .attr('stroke-width', 1)
      .attr('opacity', 0.7);

    // Labels
    this.container
      .append('text')
      .attr('x', innerWidth - 5)
      .attr('y', this.yScale(upperThreshold) - 5)
      .attr('text-anchor', 'end')
      .style('font-size', '10px')
      .style('fill', '#f57c00')
      .text('High Outlier Threshold');

    this.container
      .append('text')
      .attr('x', innerWidth - 5)
      .attr('y', this.yScale(lowerThreshold) + 12)
      .attr('text-anchor', 'end')
      .style('font-size', '10px')
      .style('fill', '#42a5f5')
      .text('Low Outlier Threshold');
  }

  private renderPoints(): void {
    const points = this.container
      .selectAll<SVGCircleElement, ExpressionSample>('.point')
      .data(this.data, (d) => d.sampleId)
      .join('circle')
      .attr('class', 'point')
      .attr('cx', (d) => this.xScale(d.rank))
      .attr('cy', (d) => this.yScale(d.value))
      .attr('r', (d) => (d.isOutlier ? this.config.pointRadius + 2 : this.config.pointRadius))
      .attr('fill', (d) => (d.isOutlier ? getOutlierColor(d.outlierType!) : '#757575'))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('opacity', 0.8)
      .attr('cursor', 'pointer')
      .attr('data-sample-id', (d) => d.sampleId);

    // Add event handlers
    points
      .on('mouseover', (event, d) => this.handleMouseOver(event, d))
      .on('mouseout', () => this.handleMouseOut())
      .on('click', (event, d) => this.handleClick(event, d));

    // Add labels for outliers
    if (this.config.showOutlierLabels) {
      this.container
        .selectAll('.outlier-label')
        .data(
          this.data.filter(
            (d) =>
              d.isOutlier && (d.outlierType === 'extreme_high' || d.outlierType === 'extreme_low')
          )
        )
        .join('text')
        .attr('class', 'outlier-label')
        .attr('x', (d) => this.xScale(d.rank))
        .attr('y', (d) => this.yScale(d.value) + (d.outlierType === 'extreme_high' ? -12 : 18))
        .attr('text-anchor', 'middle')
        .style('font-size', '9px')
        .style('fill', (d) => getOutlierColor(d.outlierType!))
        .text((d) => d.sampleId);
    }
  }

  private handleMouseOver(event: MouseEvent, d: ExpressionSample): void {
    // Show tooltip
    this.tooltip.style('visibility', 'visible').html(`
        <strong>${d.sampleId}</strong><br/>
        Expression: ${d.value.toFixed(2)}<br/>
        Rank: ${d.rank} / ${this.data.length}<br/>
        Percentile: ${d.percentile.toFixed(1)}%<br/>
        Z-score: ${d.zScore.toFixed(2)}<br/>
        ${d.isOutlier ? `<span style="color: ${getOutlierColor(d.outlierType!)}"><strong>Outlier: ${d.outlierType}</strong></span>` : ''}
      `);

    // Position tooltip
    this.tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 10}px`);

    // Emit highlight event
    EventBus.emit('highlight:show', {
      sampleIds: [d.sampleId],
      mutationIds: [],
      source: 'expression-plot',
    });
  }

  private handleMouseOut(): void {
    this.tooltip.style('visibility', 'hidden');
    EventBus.emit('highlight:hide', {
      sampleIds: [],
      mutationIds: [],
      source: 'expression-plot',
    });
  }

  private handleClick(event: MouseEvent, d: ExpressionSample): void {
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;

    if (additive) {
      if (this.selectedSamples.has(d.sampleId)) {
        this.selectedSamples.delete(d.sampleId);
      } else {
        this.selectedSamples.add(d.sampleId);
      }
    } else {
      this.selectedSamples = new Set([d.sampleId]);
    }

    EventBus.emit('selection:change', {
      sampleIds: Array.from(this.selectedSamples),
      mutationIds: [],
      source: 'expression-plot',
      type: 'click',
      additive,
    });
  }

  private setupBrush(innerWidth: number, innerHeight: number): void {
    const brush = d3
      .brush<unknown>()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on('end', (event) => this.handleBrushEnd(event));

    this.container.append('g').attr('class', 'brush').call(brush);
  }

  private handleBrushEnd(event: d3.D3BrushEvent<unknown>): void {
    if (!event.selection) {
      // Click without drag - clear selection
      return;
    }

    const [[x0, y0], [x1, y1]] = event.selection as [[number, number], [number, number]];

    const selected = this.data.filter((d) => {
      const cx = this.xScale(d.rank);
      const cy = this.yScale(d.value);
      return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
    });

    this.selectedSamples = new Set(selected.map((d) => d.sampleId));

    EventBus.emit('selection:change', {
      sampleIds: Array.from(this.selectedSamples),
      mutationIds: [],
      source: 'expression-plot',
      type: 'brush',
    });

    // Clear brush selection visually
    this.container.select('.brush').call(d3.brush<unknown>().clear as never);
  }

  private updateSelection(): void {
    this.container
      .selectAll<SVGCircleElement, ExpressionSample>('.point')
      .attr('stroke', (d) => (this.selectedSamples.has(d.sampleId) ? '#000' : '#fff'))
      .attr('stroke-width', (d) => (this.selectedSamples.has(d.sampleId) ? 2 : 1))
      .attr('r', (d) => {
        let r = d.isOutlier ? this.config.pointRadius + 2 : this.config.pointRadius;
        if (this.selectedSamples.has(d.sampleId)) r += 2;
        return r;
      });
  }

  private updateHighlight(): void {
    this.container.selectAll<SVGCircleElement, ExpressionSample>('.point').attr('opacity', (d) => {
      if (this.highlightedSamples.size === 0) return 0.8;
      return this.highlightedSamples.has(d.sampleId) ? 1 : 0.3;
    });
  }

  /**
   * Get outlier samples
   */
  getOutliers(): ExpressionSample[] {
    return this.data.filter((d) => d.isOutlier);
  }

  /**
   * Update outlier configuration
   */
  setOutlierConfig(config: Partial<OutlierConfig>): void {
    this.config.outlierConfig = { ...this.config.outlierConfig, ...config };
    // Re-process data with new config
    if (this.data.length > 0) {
      const sampleIds = this.data.map((d) => d.sampleId);
      const values = this.data.map((d) => d.value);
      this.data = processExpressionData(sampleIds, values, this.config.outlierConfig);
      this.render();
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.tooltip.remove();
    this.svg.remove();
  }
}
