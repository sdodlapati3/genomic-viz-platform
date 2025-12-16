/**
 * BigWig Track Component
 *
 * Visualizes signal/coverage data from BigWig files:
 * - Area/line/bar chart display modes
 * - Auto-scaling and fixed scale options
 * - Multiple overlay support
 * - Gradient coloring
 * - Smoothing options
 * - ChIP-seq, ATAC-seq, RNA-seq coverage
 */

import * as d3 from 'd3';

export interface BigWigData {
  chr: string;
  start: number;
  end: number;
  value: number;
}

export interface BigWigTrackSettings {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  displayMode: 'area' | 'line' | 'bar' | 'heatmap';
  scaleMode: 'auto' | 'fixed' | 'log';
  fixedMin: number;
  fixedMax: number;
  color: string;
  colorGradient?: [string, string];
  showAxis: boolean;
  showBaseline: boolean;
  smooth: number; // Window size for smoothing, 0 = no smoothing
  opacity: number;
  trackName: string;
  onRangeSelect?: (start: number, end: number) => void;
}

const DEFAULT_SETTINGS: BigWigTrackSettings = {
  width: 800,
  height: 80,
  margin: { top: 10, right: 20, bottom: 20, left: 60 },
  displayMode: 'area',
  scaleMode: 'auto',
  fixedMin: 0,
  fixedMax: 100,
  color: '#3498db',
  showAxis: true,
  showBaseline: true,
  smooth: 0,
  opacity: 0.8,
  trackName: 'Signal',
};

/**
 * Color presets for common assay types
 */
export const BIGWIG_COLOR_PRESETS = {
  chipseq: '#e74c3c', // Red for ChIP-seq
  atacseq: '#27ae60', // Green for ATAC-seq
  rnaseq: '#3498db', // Blue for RNA-seq
  methylation: '#9b59b6', // Purple for methylation
  coverage: '#7f8c8d', // Gray for coverage
  h3k4me3: '#e74c3c', // Active promoter
  h3k27ac: '#f39c12', // Active enhancer
  h3k27me3: '#2c3e50', // Repressive
  ctcf: '#16a085', // CTCF binding
};

/**
 * BigWig Track Visualization
 */
export class BigWigTrack {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private settings: BigWigTrackSettings;
  private data: BigWigData[] = [];
  private viewRegion: { chr: string; start: number; end: number } | null = null;
  private xScale: d3.ScaleLinear<number, number> | null = null;
  private yScale: d3.ScaleLinear<number, number> | d3.ScaleLogarithmic<number, number> | null =
    null;
  private brush: d3.BrushX<unknown> | null = null;

  constructor(containerId: string, settings?: Partial<BigWigTrackSettings>) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    this.container = container;
    this.settings = { ...DEFAULT_SETTINGS, ...settings };

    // Create SVG
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.settings.width)
      .attr('height', this.settings.height)
      .attr('class', 'bigwig-track');

    // Add gradient definition
    this.setupGradient();
  }

  /**
   * Setup gradient definition
   */
  private setupGradient(): void {
    const defs = this.svg.append('defs');

    // Vertical gradient for area fill
    const gradient = defs
      .append('linearGradient')
      .attr('id', 'bigwig-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    if (this.settings.colorGradient) {
      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', this.settings.colorGradient[0])
        .attr('stop-opacity', this.settings.opacity);

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', this.settings.colorGradient[1])
        .attr('stop-opacity', 0.1);
    } else {
      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', this.settings.color)
        .attr('stop-opacity', this.settings.opacity);

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', this.settings.color)
        .attr('stop-opacity', 0.1);
    }
  }

  /**
   * Load signal data
   */
  public loadData(data: BigWigData[]): void {
    this.data = data;

    // Apply smoothing if enabled
    if (this.settings.smooth > 0) {
      this.data = this.smoothData(data, this.settings.smooth);
    }
  }

  /**
   * Apply moving average smoothing
   */
  private smoothData(data: BigWigData[], windowSize: number): BigWigData[] {
    if (windowSize <= 1) return data;

    const smoothed: BigWigData[] = [];
    const halfWindow = Math.floor(windowSize / 2);

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - halfWindow);
      const end = Math.min(data.length - 1, i + halfWindow);
      let sum = 0;
      let count = 0;

      for (let j = start; j <= end; j++) {
        sum += data[j].value;
        count++;
      }

      smoothed.push({
        ...data[i],
        value: sum / count,
      });
    }

    return smoothed;
  }

  /**
   * Set view region
   */
  public setRegion(chr: string, start: number, end: number): void {
    this.viewRegion = { chr, start, end };
    this.render();
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: Partial<BigWigTrackSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    // Re-smooth if smoothing changed
    if ('smooth' in newSettings && this.data.length > 0) {
      this.data = this.smoothData(this.data, this.settings.smooth);
    }

    if (this.viewRegion) {
      this.render();
    }
  }

  /**
   * Main render function
   */
  public render(): void {
    if (!this.viewRegion) return;

    this.svg.selectAll('g').remove();

    const { width, height, margin, showAxis, showBaseline, trackName } = this.settings;
    const { chr, start, end } = this.viewRegion;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Create main group
    const mainGroup = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Filter data to view region
    const visibleData = this.data.filter((d) => d.chr === chr && d.end >= start && d.start <= end);

    if (visibleData.length === 0) {
      this.renderEmptyState(mainGroup, plotWidth, plotHeight);
      return;
    }

    // Create scales
    this.xScale = d3.scaleLinear().domain([start, end]).range([0, plotWidth]);

    const [yMin, yMax] = this.calculateYDomain(visibleData);

    if (this.settings.scaleMode === 'log') {
      this.yScale = d3
        .scaleLog()
        .domain([Math.max(0.1, yMin), yMax])
        .range([plotHeight, 0])
        .clamp(true);
    } else {
      this.yScale = d3.scaleLinear().domain([yMin, yMax]).range([plotHeight, 0]);
    }

    // Render based on display mode
    switch (this.settings.displayMode) {
      case 'area':
        this.renderArea(mainGroup, visibleData, plotHeight);
        break;
      case 'line':
        this.renderLine(mainGroup, visibleData);
        break;
      case 'bar':
        this.renderBar(mainGroup, visibleData, plotHeight);
        break;
      case 'heatmap':
        this.renderHeatmap(mainGroup, visibleData, plotHeight);
        break;
    }

    // Baseline
    if (showBaseline && yMin <= 0 && yMax >= 0) {
      mainGroup
        .append('line')
        .attr('x1', 0)
        .attr('y1', this.yScale(0))
        .attr('x2', plotWidth)
        .attr('y2', this.yScale(0))
        .attr('stroke', '#666')
        .attr('stroke-dasharray', '2,2');
    }

    // Y-axis
    if (showAxis) {
      this.renderYAxis(mainGroup, plotHeight);
    }

    // X-axis
    this.renderXAxis(mainGroup, plotHeight, plotWidth);

    // Track name
    mainGroup
      .append('text')
      .attr('x', 5)
      .attr('y', 15)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text(trackName);

    // Scale info
    mainGroup
      .append('text')
      .attr('x', plotWidth - 5)
      .attr('y', 15)
      .attr('text-anchor', 'end')
      .attr('fill', '#888')
      .attr('font-size', '10px')
      .text(`[${yMin.toFixed(1)} - ${yMax.toFixed(1)}]`);

    // Setup brush for range selection
    if (this.settings.onRangeSelect) {
      this.setupBrush(mainGroup, plotWidth, plotHeight);
    }
  }

  /**
   * Calculate Y domain based on scale mode
   */
  private calculateYDomain(data: BigWigData[]): [number, number] {
    if (this.settings.scaleMode === 'fixed') {
      return [this.settings.fixedMin, this.settings.fixedMax];
    }

    const values = data.map((d) => d.value);
    const min = d3.min(values) || 0;
    const max = d3.max(values) || 100;

    // Add some padding
    const padding = (max - min) * 0.1;
    return [Math.min(0, min - padding), max + padding];
  }

  /**
   * Render area chart
   */
  private renderArea(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: BigWigData[],
    plotHeight: number
  ): void {
    if (!this.xScale || !this.yScale) return;

    const area = d3
      .area<BigWigData>()
      .x((d) => this.xScale!((d.start + d.end) / 2))
      .y0(plotHeight)
      .y1((d) => this.yScale!(Math.max(0.01, d.value)))
      .curve(d3.curveMonotoneX);

    group
      .append('path')
      .datum(data)
      .attr('class', 'signal-area')
      .attr('d', area)
      .attr('fill', 'url(#bigwig-gradient)');

    // Add stroke line on top
    const line = d3
      .line<BigWigData>()
      .x((d) => this.xScale!((d.start + d.end) / 2))
      .y((d) => this.yScale!(Math.max(0.01, d.value)))
      .curve(d3.curveMonotoneX);

    group
      .append('path')
      .datum(data)
      .attr('class', 'signal-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', this.settings.color)
      .attr('stroke-width', 1.5);
  }

  /**
   * Render line chart
   */
  private renderLine(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: BigWigData[]
  ): void {
    if (!this.xScale || !this.yScale) return;

    const line = d3
      .line<BigWigData>()
      .x((d) => this.xScale!((d.start + d.end) / 2))
      .y((d) => this.yScale!(Math.max(0.01, d.value)))
      .curve(d3.curveMonotoneX);

    group
      .append('path')
      .datum(data)
      .attr('class', 'signal-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', this.settings.color)
      .attr('stroke-width', 2)
      .attr('opacity', this.settings.opacity);
  }

  /**
   * Render bar chart
   */
  private renderBar(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: BigWigData[],
    plotHeight: number
  ): void {
    if (!this.xScale || !this.yScale) return;

    const barWidth = Math.max(1, this.xScale(data[0]?.end || 0) - this.xScale(data[0]?.start || 0));

    group
      .selectAll('.signal-bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'signal-bar')
      .attr('x', (d) => this.xScale!(d.start))
      .attr('y', (d) => this.yScale!(Math.max(0, d.value)))
      .attr('width', barWidth)
      .attr('height', (d) => plotHeight - this.yScale!(Math.max(0, d.value)))
      .attr('fill', this.settings.color)
      .attr('opacity', this.settings.opacity);
  }

  /**
   * Render heatmap
   */
  private renderHeatmap(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: BigWigData[],
    plotHeight: number
  ): void {
    if (!this.xScale) return;

    const [yMin, yMax] = this.calculateYDomain(data);
    const colorScale = d3.scaleSequential(d3.interpolateViridis).domain([yMin, yMax]);

    const barWidth = Math.max(1, this.xScale(data[0]?.end || 0) - this.xScale(data[0]?.start || 0));

    group
      .selectAll('.signal-heat')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'signal-heat')
      .attr('x', (d) => this.xScale!(d.start))
      .attr('y', 0)
      .attr('width', barWidth)
      .attr('height', plotHeight)
      .attr('fill', (d) => colorScale(d.value));
  }

  /**
   * Render Y axis
   */
  private renderYAxis(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    plotHeight: number
  ): void {
    if (!this.yScale) return;

    const yAxis = d3.axisLeft(this.yScale).ticks(4).tickSize(4);

    const axisGroup = group.append('g').attr('class', 'y-axis').call(yAxis);

    axisGroup.selectAll('text').attr('fill', '#888').attr('font-size', '9px');
    axisGroup.selectAll('.domain, .tick line').attr('stroke', '#444');
  }

  /**
   * Render X axis
   */
  private renderXAxis(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    plotHeight: number,
    plotWidth: number
  ): void {
    if (!this.xScale) return;

    const xAxis = d3
      .axisBottom(this.xScale)
      .ticks(6)
      .tickFormat((d) => this.formatPosition(d as number));

    const axisGroup = group
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${plotHeight})`)
      .call(xAxis);

    axisGroup.selectAll('text').attr('fill', '#888').attr('font-size', '9px');
    axisGroup.selectAll('.domain, .tick line').attr('stroke', '#444');
  }

  /**
   * Setup brush for range selection
   */
  private setupBrush(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    plotWidth: number,
    plotHeight: number
  ): void {
    if (!this.xScale) return;

    this.brush = d3
      .brushX()
      .extent([
        [0, 0],
        [plotWidth, plotHeight],
      ])
      .on('end', (event) => {
        if (!event.selection || !this.xScale || !this.settings.onRangeSelect) return;
        const [x0, x1] = event.selection as [number, number];
        const start = Math.round(this.xScale.invert(x0));
        const end = Math.round(this.xScale.invert(x1));
        this.settings.onRangeSelect(start, end);
      });

    group
      .append('g')
      .attr('class', 'brush')
      .call(this.brush)
      .selectAll('.selection')
      .attr('fill', 'rgba(255, 255, 255, 0.1)')
      .attr('stroke', '#fff');
  }

  /**
   * Render empty state
   */
  private renderEmptyState(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    plotWidth: number,
    plotHeight: number
  ): void {
    group
      .append('text')
      .attr('x', plotWidth / 2)
      .attr('y', plotHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '12px')
      .text('No data in this region');
  }

  /**
   * Format genomic position
   */
  private formatPosition(pos: number): string {
    if (pos >= 1e6) return `${(pos / 1e6).toFixed(2)}Mb`;
    if (pos >= 1e3) return `${(pos / 1e3).toFixed(1)}kb`;
    return `${pos}bp`;
  }

  /**
   * Get current data
   */
  public getData(): BigWigData[] {
    return this.data;
  }
}

/**
 * Multi-track BigWig overlay
 */
export class BigWigOverlay {
  private container: HTMLElement;
  private tracks: Map<string, { track: BigWigTrack; data: BigWigData[] }> = new Map();
  private viewRegion: { chr: string; start: number; end: number } | null = null;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    this.container = container;
  }

  /**
   * Add a track
   */
  public addTrack(id: string, data: BigWigData[], settings: Partial<BigWigTrackSettings>): void {
    const trackContainer = document.createElement('div');
    trackContainer.id = `track-${id}`;
    trackContainer.style.marginBottom = '4px';
    this.container.appendChild(trackContainer);

    const track = new BigWigTrack(`track-${id}`, {
      ...settings,
      displayMode: 'area',
    });
    track.loadData(data);

    this.tracks.set(id, { track, data });

    if (this.viewRegion) {
      track.setRegion(this.viewRegion.chr, this.viewRegion.start, this.viewRegion.end);
    }
  }

  /**
   * Remove a track
   */
  public removeTrack(id: string): void {
    const trackDiv = document.getElementById(`track-${id}`);
    if (trackDiv) {
      trackDiv.remove();
    }
    this.tracks.delete(id);
  }

  /**
   * Set view region for all tracks
   */
  public setRegion(chr: string, start: number, end: number): void {
    this.viewRegion = { chr, start, end };
    this.tracks.forEach(({ track }) => {
      track.setRegion(chr, start, end);
    });
  }
}

/**
 * CSS styles for BigWig Track
 */
export const bigWigTrackStyles = `
  .bigwig-track {
    background: #1a1a2e;
    border-radius: 4px;
  }
  
  .bigwig-track .signal-area {
    transition: opacity 0.2s;
  }
  
  .bigwig-track .signal-area:hover {
    opacity: 1;
  }
  
  .bigwig-track .brush .selection {
    fill-opacity: 0.2;
  }
`;

/**
 * Generate sample BigWig data for demo
 */
export function generateSampleBigWigData(
  chr: string,
  start: number,
  end: number,
  resolution: number = 100,
  signalType: 'chipseq' | 'rnaseq' | 'atacseq' = 'chipseq'
): BigWigData[] {
  const data: BigWigData[] = [];
  const numPoints = Math.floor((end - start) / resolution);

  // Generate peaks based on signal type
  const peaks: { center: number; width: number; height: number }[] = [];
  const numPeaks = signalType === 'atacseq' ? 20 : signalType === 'chipseq' ? 15 : 30;

  for (let i = 0; i < numPeaks; i++) {
    peaks.push({
      center: start + Math.random() * (end - start),
      width: signalType === 'atacseq' ? 500 + Math.random() * 1000 : 1000 + Math.random() * 3000,
      height: 10 + Math.random() * 90,
    });
  }

  for (let i = 0; i < numPoints; i++) {
    const pos = start + i * resolution;

    // Calculate signal as sum of Gaussian peaks
    let value = Math.random() * 2; // Background noise

    peaks.forEach((peak) => {
      const dist = Math.abs(pos - peak.center);
      if (dist < peak.width * 2) {
        value += peak.height * Math.exp(-0.5 * Math.pow(dist / (peak.width / 2), 2));
      }
    });

    data.push({
      chr,
      start: pos,
      end: pos + resolution,
      value,
    });
  }

  return data;
}
