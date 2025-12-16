/**
 * Hi-C Contact Matrix Component
 *
 * Visualizes chromatin interaction data as a heatmap
 */

import * as d3 from 'd3';
import type { HicMatrix, HicSettings, HicBin } from '../types';

export class HicMatrixPlot {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private settings: HicSettings;
  private data: HicMatrix | null = null;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private colorScale: d3.ScaleSequential<string> | null = null;

  constructor(containerId: string, settings?: Partial<HicSettings>) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    this.container = container;

    // Default settings
    this.settings = {
      width: 600,
      height: 600,
      margin: { top: 50, right: 20, bottom: 40, left: 60 },
      colormap: 'red',
      logScale: true,
      showTADs: false,
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
   * Update colormap
   */
  public setColormap(colormap: 'red' | 'blue' | 'viridis'): void {
    this.settings.colormap = colormap;
    if (this.data) this.render();
  }

  /**
   * Update plot with new data
   */
  public update(data: HicMatrix): void {
    this.data = data;
    this.render();
  }

  /**
   * Get color scale for colorbar
   */
  public getColorScale(): d3.ScaleSequential<string> | null {
    return this.colorScale;
  }

  /**
   * Get data range
   */
  public getDataRange(): [number, number] | null {
    if (!this.data) return null;
    return [this.data.minValue, this.data.maxValue];
  }

  /**
   * Main render function
   */
  private render(): void {
    if (!this.data) return;

    this.svg.selectAll('*').remove();

    const { width, height, margin } = this.settings;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Create main group
    const mainGroup = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const cellSize = plotWidth / this.data.numBins;

    // Position scales
    const xScale = d3
      .scaleLinear()
      .domain([this.data.startPos, this.data.endPos])
      .range([0, plotWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([this.data.startPos, this.data.endPos])
      .range([0, plotHeight]);

    // Color scale
    this.colorScale = this.createColorScale();

    // Render matrix cells
    this.renderMatrix(mainGroup, cellSize);

    // Render axes
    this.renderAxes(mainGroup, xScale, yScale, plotWidth, plotHeight);
  }

  /**
   * Create color scale based on colormap setting
   */
  private createColorScale(): d3.ScaleSequential<string> {
    if (!this.data) throw new Error('No data');

    const maxVal = this.settings.logScale ? Math.log10(this.data.maxValue + 1) : this.data.maxValue;

    let interpolator: (t: number) => string;
    switch (this.settings.colormap) {
      case 'blue':
        interpolator = d3.interpolateBlues;
        break;
      case 'viridis':
        interpolator = d3.interpolateViridis;
        break;
      case 'red':
      default:
        interpolator = d3.interpolateReds;
        break;
    }

    return d3.scaleSequential(interpolator).domain([0, maxVal]);
  }

  /**
   * Render matrix cells
   */
  private renderMatrix(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    cellSize: number
  ): void {
    if (!this.data || !this.colorScale) return;

    const colorScale = this.colorScale;
    const logScale = this.settings.logScale;

    // Draw cells
    group
      .selectAll('rect.matrix-cell')
      .data(this.data.bins)
      .join('rect')
      .attr('class', 'matrix-cell')
      .attr('x', (d) => d.col * cellSize)
      .attr('y', (d) => d.row * cellSize)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('fill', (d) => {
        const val = logScale ? Math.log10(d.value + 1) : d.value;
        return colorScale(val);
      })
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseout', () => this.hideTooltip());

    // Mirror for lower triangle (Hi-C is symmetric)
    group
      .selectAll('rect.matrix-cell-mirror')
      .data(this.data.bins.filter((d) => d.row !== d.col))
      .join('rect')
      .attr('class', 'matrix-cell')
      .attr('x', (d) => d.row * cellSize)
      .attr('y', (d) => d.col * cellSize)
      .attr('width', cellSize)
      .attr('height', cellSize)
      .attr('fill', (d) => {
        const val = logScale ? Math.log10(d.value + 1) : d.value;
        return colorScale(val);
      })
      .on('mouseover', (event, d) => this.showTooltip(event, d, true))
      .on('mousemove', (event) => this.moveTooltip(event))
      .on('mouseout', () => this.hideTooltip());
  }

  /**
   * Render axes
   */
  private renderAxes(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    width: number,
    height: number
  ): void {
    if (!this.data) return;

    // Region label (e.g., "chr1 (Mb)")
    const regionLabel = `${this.data.chromosome} (Mb)`;

    // Format axis ticks as Mb
    const formatMb = (d: d3.NumberValue) => `${Number(d) / 1e6}`;

    // X axis (top)
    const xAxis = d3.axisTop(xScale).ticks(6).tickFormat(formatMb);
    group.append('g').attr('class', 'axis').call(xAxis);

    // X axis label
    group
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', -25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#555')
      .text(regionLabel);

    // Y axis (left)
    const yAxis = d3.axisLeft(yScale).ticks(6).tickFormat(formatMb);
    group.append('g').attr('class', 'axis').call(yAxis);

    // Y axis label
    group
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -35)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#555')
      .text(regionLabel);
  }

  /**
   * Show tooltip
   */
  private showTooltip(event: MouseEvent, bin: HicBin, mirrored = false): void {
    const pos1Start = mirrored ? bin.startCol : bin.startRow;
    const pos1End = mirrored ? bin.endCol : bin.endRow;
    const pos2Start = mirrored ? bin.startRow : bin.startCol;
    const pos2End = mirrored ? bin.endRow : bin.endCol;

    this.tooltip
      .style('display', 'block')
      .html(
        `
        <div class="tooltip-title">Interaction</div>
        <div class="tooltip-row">
          <span class="tooltip-label">Region 1:</span>
          <span class="tooltip-value">${(pos1Start / 1e6).toFixed(2)}-${(pos1End / 1e6).toFixed(2)} Mb</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Region 2:</span>
          <span class="tooltip-value">${(pos2Start / 1e6).toFixed(2)}-${(pos2End / 1e6).toFixed(2)} Mb</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Contact:</span>
          <span class="tooltip-value">${bin.value.toFixed(2)}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Distance:</span>
          <span class="tooltip-value">${((pos2Start - pos1Start) / 1e6).toFixed(2)} Mb</span>
        </div>
      `
      )
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`);

    // Update info panel
    this.updateInfoPanel(bin, mirrored);
  }

  /**
   * Update info panel
   */
  private updateInfoPanel(bin: HicBin, mirrored: boolean): void {
    const infoPanel = document.getElementById('info-panel');
    if (!infoPanel) return;

    const pos1 = mirrored ? bin.startCol : bin.startRow;
    const pos2 = mirrored ? bin.startRow : bin.startCol;

    infoPanel.innerHTML = `
      <div class="info-item">
        <span class="info-label">Locus 1:</span>
        <span class="info-value">${(pos1 / 1e6).toFixed(2)} Mb</span>
      </div>
      <div class="info-item">
        <span class="info-label">Locus 2:</span>
        <span class="info-value">${(pos2 / 1e6).toFixed(2)} Mb</span>
      </div>
      <div class="info-item">
        <span class="info-label">Contact Frequency:</span>
        <span class="info-value">${bin.value.toFixed(2)}</span>
      </div>
    `;
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

/**
 * Colorbar Component
 */
export class Colorbar {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private width = 40;
  private height = 300;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    this.container = container;

    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', 60)
      .attr('height', this.height);
  }

  /**
   * Update colorbar
   */
  public update(
    colorScale: d3.ScaleSequential<string>,
    range: [number, number],
    logScale = true
  ): void {
    this.svg.selectAll('*').remove();

    const margin = { top: 10, bottom: 30 };
    const barHeight = this.height - margin.top - margin.bottom;

    // Create gradient
    const defs = this.svg.append('defs');
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'colorbar-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    // Add gradient stops
    const numStops = 20;
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      gradient
        .append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', colorScale(t * colorScale.domain()[1]));
    }

    // Draw colorbar
    this.svg
      .append('rect')
      .attr('x', 10)
      .attr('y', margin.top)
      .attr('width', this.width)
      .attr('height', barHeight)
      .attr('fill', 'url(#colorbar-gradient)')
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1);

    // Create scale for axis
    const yScale = d3.scaleLinear().domain(range).range([barHeight, 0]);

    const tickFormat = logScale
      ? (d: d3.NumberValue) => `${Number(d).toFixed(0)}`
      : (d: d3.NumberValue) => `${Number(d).toFixed(1)}`;

    const yAxis = d3.axisRight(yScale).ticks(5).tickFormat(tickFormat);

    this.svg
      .append('g')
      .attr('transform', `translate(${10 + this.width}, ${margin.top})`)
      .attr('class', 'axis')
      .call(yAxis);
  }
}
