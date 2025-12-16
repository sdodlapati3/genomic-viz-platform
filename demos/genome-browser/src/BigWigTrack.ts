/**
 * BigWig Track - Signal/Coverage Visualization
 *
 * Displays continuous signal data from BigWig files.
 * Features:
 * - Multiple visualization modes (line, area, bar, heatmap)
 * - Auto-scaling and manual scale options
 * - Multiple tracks overlay
 * - Smooth rendering with binning
 */

import * as d3 from 'd3';
import { Track, TrackRenderContext } from './Track';
import type { TrackConfig, GenomicRegion } from './types';

export interface BigWigDataPoint {
  start: number;
  end: number;
  value: number;
}

export interface BigWigTrackData {
  points: BigWigDataPoint[];
  min: number;
  max: number;
  mean: number;
}

export type BigWigDisplayMode = 'line' | 'area' | 'bar' | 'heatmap';

export interface BigWigTrackConfig extends TrackConfig {
  type: 'bigwig';
  displayMode: BigWigDisplayMode;
  color: string;
  negativeColor?: string; // For values below zero
  autoScale: boolean;
  scaleMin?: number;
  scaleMax?: number;
  smoothing: boolean;
  showAxis: boolean;
  showZeroLine: boolean;
}

export class BigWigTrack extends Track<BigWigTrackData, BigWigTrackConfig> {
  constructor(config: Partial<BigWigTrackConfig>) {
    super({
      id: 'bigwig-track',
      type: 'bigwig',
      name: 'Signal',
      height: 80,
      visible: true,
      collapsed: false,
      displayMode: 'area',
      color: '#4a90d9',
      negativeColor: '#e74c3c',
      autoScale: true,
      smoothing: true,
      showAxis: true,
      showZeroLine: true,
      ...config,
    } as BigWigTrackConfig);
  }

  protected renderContent(context: TrackRenderContext): void {
    if (!this.data || this.data.points.length === 0) return;

    const { svg, width, height, xScale, region } = context;

    // Filter points in view
    const visiblePoints = this.data.points.filter(
      (p) => p.end >= region.start && p.start <= region.end
    );

    if (visiblePoints.length === 0) return;

    // Calculate Y scale
    const yMin = this.config.autoScale ? this.data.min : (this.config.scaleMin ?? 0);
    const yMax = this.config.autoScale ? this.data.max : (this.config.scaleMax ?? this.data.max);

    const yScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .range([height - 5, 5])
      .nice();

    // Render based on display mode
    switch (this.config.displayMode) {
      case 'line':
        this.renderLine(svg, visiblePoints, xScale, yScale, width, height);
        break;
      case 'area':
        this.renderArea(svg, visiblePoints, xScale, yScale, width, height);
        break;
      case 'bar':
        this.renderBar(svg, visiblePoints, xScale, yScale, width, height);
        break;
      case 'heatmap':
        this.renderHeatmap(svg, visiblePoints, xScale, width, height);
        break;
    }

    // Render axis
    if (this.config.showAxis) {
      this.renderAxis(svg, yScale, width, height);
    }

    // Render zero line
    if (this.config.showZeroLine && yMin < 0 && yMax > 0) {
      const zeroY = yScale(0);
      svg
        .append('line')
        .attr('class', 'zero-line')
        .attr('x1', 0)
        .attr('y1', zeroY)
        .attr('x2', width)
        .attr('y2', zeroY)
        .attr('stroke', '#666')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3');
    }
  }

  private renderLine(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    points: BigWigDataPoint[],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    _width: number,
    _height: number
  ): void {
    const lineGenerator = d3
      .line<BigWigDataPoint>()
      .x((d) => xScale((d.start + d.end) / 2))
      .y((d) => yScale(d.value))
      .curve(this.config.smoothing ? d3.curveBasis : d3.curveLinear);

    svg
      .append('path')
      .datum(points)
      .attr('class', 'signal-line')
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', this.config.color)
      .attr('stroke-width', 1.5);
  }

  private renderArea(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    points: BigWigDataPoint[],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    _width: number,
    _height: number
  ): void {
    const baseline = yScale(Math.max(0, yScale.domain()[0]));

    const areaGenerator = d3
      .area<BigWigDataPoint>()
      .x((d) => xScale((d.start + d.end) / 2))
      .y0(baseline)
      .y1((d) => yScale(d.value))
      .curve(this.config.smoothing ? d3.curveBasis : d3.curveLinear);

    // Positive values
    const positivePoints = points.filter((p) => p.value >= 0);
    if (positivePoints.length > 0) {
      svg
        .append('path')
        .datum(positivePoints)
        .attr('class', 'signal-area-positive')
        .attr('d', areaGenerator)
        .attr('fill', this.config.color)
        .attr('fill-opacity', 0.6)
        .attr('stroke', this.config.color)
        .attr('stroke-width', 1);
    }

    // Negative values
    const negativePoints = points.filter((p) => p.value < 0);
    if (negativePoints.length > 0 && this.config.negativeColor) {
      svg
        .append('path')
        .datum(negativePoints)
        .attr('class', 'signal-area-negative')
        .attr('d', areaGenerator)
        .attr('fill', this.config.negativeColor)
        .attr('fill-opacity', 0.6)
        .attr('stroke', this.config.negativeColor)
        .attr('stroke-width', 1);
    }
  }

  private renderBar(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    points: BigWigDataPoint[],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    _width: number,
    _height: number
  ): void {
    const baseline = yScale(Math.max(0, yScale.domain()[0]));

    svg
      .selectAll('rect.signal-bar')
      .data(points)
      .join('rect')
      .attr('class', 'signal-bar')
      .attr('x', (d) => xScale(d.start))
      .attr('y', (d) => (d.value >= 0 ? yScale(d.value) : baseline))
      .attr('width', (d) => Math.max(1, xScale(d.end) - xScale(d.start)))
      .attr('height', (d) => Math.abs(yScale(d.value) - baseline))
      .attr('fill', (d) =>
        d.value >= 0 ? this.config.color : (this.config.negativeColor ?? this.config.color)
      )
      .attr('fill-opacity', 0.7);
  }

  private renderHeatmap(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    points: BigWigDataPoint[],
    xScale: d3.ScaleLinear<number, number>,
    _width: number,
    height: number
  ): void {
    if (!this.data) return;

    const colorScale = d3
      .scaleSequential(d3.interpolateViridis)
      .domain([this.data.min, this.data.max]);

    svg
      .selectAll('rect.signal-heatmap')
      .data(points)
      .join('rect')
      .attr('class', 'signal-heatmap')
      .attr('x', (d) => xScale(d.start))
      .attr('y', 2)
      .attr('width', (d) => Math.max(1, xScale(d.end) - xScale(d.start)))
      .attr('height', height - 4)
      .attr('fill', (d) => colorScale(d.value));
  }

  private renderAxis(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    yScale: d3.ScaleLinear<number, number>,
    width: number,
    _height: number
  ): void {
    const yAxis = d3.axisRight(yScale).ticks(3).tickSize(3);

    svg
      .append('g')
      .attr('class', 'signal-axis')
      .attr('transform', `translate(${width - 30}, 0)`)
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('fill', '#666');

    // Track label
    svg
      .append('text')
      .attr('x', 5)
      .attr('y', 12)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(this.config.name);
  }

  getTooltipContent(feature: unknown): string {
    const point = feature as BigWigDataPoint;
    return `
      <div class="tooltip-title">Signal</div>
      <div class="tooltip-row">
        <span class="tooltip-label">Position:</span>
        <span class="tooltip-value">${point.start.toLocaleString()}-${point.end.toLocaleString()}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Value:</span>
        <span class="tooltip-value">${point.value.toFixed(2)}</span>
      </div>
    `;
  }
}

/**
 * Generate mock BigWig data for demonstration
 */
export function generateMockBigWigData(
  region: GenomicRegion,
  binSize: number = 100,
  signalType: 'chip' | 'atac' | 'rnaseq' = 'chip'
): BigWigTrackData {
  const points: BigWigDataPoint[] = [];
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  // Generate signal with peaks
  const numPeaks = Math.floor((region.end - region.start) / 10000);
  const peakPositions: number[] = [];
  for (let i = 0; i < numPeaks; i++) {
    peakPositions.push(region.start + Math.floor(Math.random() * (region.end - region.start)));
  }

  for (let pos = region.start; pos < region.end; pos += binSize) {
    // Base signal (noise)
    let value = Math.random() * 2;

    // Add peak contributions
    for (const peakPos of peakPositions) {
      const distance = Math.abs(pos - peakPos);
      const peakWidth = signalType === 'chip' ? 500 : signalType === 'atac' ? 200 : 1000;
      const peakHeight = signalType === 'chip' ? 10 : signalType === 'atac' ? 15 : 8;

      if (distance < peakWidth * 3) {
        value += peakHeight * Math.exp(-Math.pow(distance, 2) / (2 * Math.pow(peakWidth, 2)));
      }
    }

    points.push({
      start: pos,
      end: pos + binSize,
      value,
    });

    min = Math.min(min, value);
    max = Math.max(max, value);
    sum += value;
  }

  return {
    points,
    min,
    max,
    mean: sum / points.length,
  };
}
