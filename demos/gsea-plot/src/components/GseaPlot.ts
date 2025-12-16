/**
 * GSEA Running Sum Plot Component
 *
 * Visualizes Gene Set Enrichment Analysis results with:
 * 1. Running enrichment score curve
 * 2. Gene hit markers (barcode plot)
 * 3. Ranked metric distribution
 */

import * as d3 from 'd3';
import type { GseaResult, GseaSettings, Gene } from '../types';

export class GseaPlot {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private settings: GseaSettings;
  private data: GseaResult | null = null;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;

  constructor(containerId: string, settings?: Partial<GseaSettings>) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    this.container = container;

    // Default settings
    this.settings = {
      width: 900,
      height: 500,
      margin: { top: 40, right: 40, bottom: 60, left: 60 },
      mainPlotHeight: 280,
      hitPlotHeight: 60,
      rankPlotHeight: 100,
      ...settings,
    };

    // Create SVG
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.settings.width)
      .attr('height', this.settings.height);

    // Create tooltip
    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('display', 'none');
  }

  /**
   * Update plot with new data
   */
  public update(data: GseaResult): void {
    this.data = data;
    this.render();
  }

  /**
   * Main render function
   */
  private render(): void {
    if (!this.data) return;

    this.svg.selectAll('*').remove();

    const { width, margin, mainPlotHeight, hitPlotHeight, rankPlotHeight } = this.settings;
    const plotWidth = width - margin.left - margin.right;

    // Create main group
    const mainGroup = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Calculate plot positions
    const mainPlotY = 0;
    const hitPlotY = mainPlotHeight;
    const rankPlotY = mainPlotHeight + hitPlotHeight;

    // X scale (shared across all subplots)
    const xScale = d3
      .scaleLinear()
      .domain([0, this.data.rankedList.length - 1])
      .range([0, plotWidth]);

    // Render subplots
    this.renderMainPlot(mainGroup, xScale, mainPlotY, plotWidth, mainPlotHeight);
    this.renderHitPlot(mainGroup, xScale, hitPlotY, plotWidth, hitPlotHeight);
    this.renderRankPlot(mainGroup, xScale, rankPlotY, plotWidth, rankPlotHeight);

    // Render X axis at bottom
    this.renderXAxis(mainGroup, xScale, rankPlotY + rankPlotHeight, plotWidth);

    // Add title
    this.svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', '#333')
      .text(this.data.geneSetName);
  }

  /**
   * Render the running enrichment score plot
   */
  private renderMainPlot(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleLinear<number, number>,
    y: number,
    width: number,
    height: number
  ): void {
    if (!this.data) return;

    const plotGroup = group.append('g').attr('transform', `translate(0, ${y})`);

    // Y scale for enrichment score
    const maxAbsES = Math.max(
      Math.abs(d3.min(this.data.runningSum) || 0),
      Math.abs(d3.max(this.data.runningSum) || 0)
    );
    const yPadding = maxAbsES * 0.1;

    const yScale = d3
      .scaleLinear()
      .domain([-maxAbsES - yPadding, maxAbsES + yPadding])
      .range([height, 0]);

    // Add Y axis
    const yAxis = d3.axisLeft(yScale).ticks(6);
    plotGroup.append('g').attr('class', 'axis').call(yAxis);

    // Y axis label
    plotGroup
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .text('Enrichment Score (ES)');

    // Zero line
    plotGroup
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#377eb8')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,2');

    // Running sum line
    const line = d3
      .line<number>()
      .x((_, i) => xScale(i))
      .y((d) => yScale(d))
      .curve(d3.curveMonotoneX);

    plotGroup
      .append('path')
      .datum(this.data.runningSum)
      .attr('class', 'running-sum-line')
      .attr('d', line)
      .attr('stroke', '#e41a1c')
      .attr('fill', 'none')
      .attr('stroke-width', 2);

    // Max ES marker line
    plotGroup
      .append('line')
      .attr('class', 'max-es-marker')
      .attr('x1', xScale(this.data.maxEsPosition))
      .attr('x2', xScale(this.data.maxEsPosition))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#e41a1c')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,2');

    // Max ES point
    plotGroup
      .append('circle')
      .attr('cx', xScale(this.data.maxEsPosition))
      .attr('cy', yScale(this.data.enrichmentScore))
      .attr('r', 5)
      .attr('fill', '#e41a1c')
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    // Add ES label
    const esLabel = this.data.enrichmentScore >= 0 ? -15 : 15;
    plotGroup
      .append('text')
      .attr('x', xScale(this.data.maxEsPosition))
      .attr('y', yScale(this.data.enrichmentScore) + esLabel)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#e41a1c')
      .text(`ES = ${this.data.enrichmentScore.toFixed(3)}`);
  }

  /**
   * Render gene hit markers (barcode plot)
   */
  private renderHitPlot(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleLinear<number, number>,
    y: number,
    width: number,
    height: number
  ): void {
    if (!this.data) return;

    const plotGroup = group
      .append('g')
      .attr('transform', `translate(0, ${y})`)
      .attr('class', 'hit-plot');

    // Background
    plotGroup
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#f8f8f8');

    // Gene hit markers
    const hitGenes = this.data.rankedList.filter((g) => g.inGeneSet);

    plotGroup
      .selectAll('line.gene-hit')
      .data(hitGenes)
      .join('line')
      .attr('class', 'gene-hit')
      .attr('x1', (d) => xScale(d.rank))
      .attr('x2', (d) => xScale(d.rank))
      .attr('y1', 5)
      .attr('y2', height - 5)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseout', () => this.hideTooltip());

    // Label
    plotGroup
      .append('text')
      .attr('x', -5)
      .attr('y', height / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text('Hits');
  }

  /**
   * Render ranked metric distribution
   */
  private renderRankPlot(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleLinear<number, number>,
    y: number,
    width: number,
    height: number
  ): void {
    if (!this.data) return;

    const plotGroup = group.append('g').attr('transform', `translate(0, ${y})`);

    // Y scale for scores
    const scoreExtent = d3.extent(this.data.rankedList, (d) => d.score) as [number, number];
    const maxAbsScore = Math.max(Math.abs(scoreExtent[0]), Math.abs(scoreExtent[1]));

    const yScale = d3.scaleLinear().domain([-maxAbsScore, maxAbsScore]).range([height, 0]);

    // Add Y axis
    const yAxis = d3.axisLeft(yScale).ticks(4);
    plotGroup.append('g').attr('class', 'axis').call(yAxis);

    // Y axis label
    plotGroup
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .text('Ranked Metric');

    // Zero line
    plotGroup
      .append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1);

    // Sample every nth gene for performance
    const sampleRate = Math.ceil(this.data.rankedList.length / 500);
    const sampledGenes = this.data.rankedList.filter((_, i) => i % sampleRate === 0);

    // Rank bars (area chart style)
    const area = d3
      .area<Gene>()
      .x((d) => xScale(d.rank))
      .y0(yScale(0))
      .y1((d) => yScale(d.score))
      .curve(d3.curveMonotoneX);

    // Positive area (red)
    plotGroup
      .append('path')
      .datum(sampledGenes.filter((d) => d.score >= 0))
      .attr('d', area)
      .attr('fill', 'rgba(228, 26, 28, 0.3)')
      .attr('stroke', 'none');

    // Negative area (blue)
    plotGroup
      .append('path')
      .datum(sampledGenes.filter((d) => d.score <= 0))
      .attr('d', area)
      .attr('fill', 'rgba(55, 126, 184, 0.3)')
      .attr('stroke', 'none');
  }

  /**
   * Render X axis
   */
  private renderXAxis(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleLinear<number, number>,
    y: number,
    width: number
  ): void {
    const axisGroup = group.append('g').attr('transform', `translate(0, ${y})`);

    const xAxis = d3.axisBottom(xScale).ticks(10);
    axisGroup.attr('class', 'axis').call(xAxis);

    // X axis label
    axisGroup
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', 40)
      .attr('text-anchor', 'middle')
      .text('Rank in Ordered Dataset');
  }

  /**
   * Show tooltip
   */
  private showTooltip(event: MouseEvent, gene: Gene): void {
    this.tooltip
      .style('display', 'block')
      .html(
        `
        <div class="tooltip-title">${gene.symbol}</div>
        <div class="tooltip-row">
          <span class="tooltip-label">Rank:</span>
          <span class="tooltip-value">${gene.rank + 1}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Score:</span>
          <span class="tooltip-value">${gene.score.toFixed(3)}</span>
        </div>
      `
      )
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`);
  }

  /**
   * Move tooltip
   */
  private moveTooltip(event: MouseEvent): void {
    this.tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY - 10}px`);
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    this.tooltip.style('display', 'none');
  }
}
