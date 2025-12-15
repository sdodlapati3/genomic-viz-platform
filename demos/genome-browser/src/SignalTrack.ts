/**
 * SignalTrack - Renders continuous signal data like coverage or ChIP-seq
 */

import * as d3 from 'd3';
import { Track, TrackRenderContext } from './Track';
import type { TrackConfig, SignalTrackData, SignalPoint } from './types';

export interface SignalTrackConfig extends TrackConfig {
  type: 'signal';
  color: string;
  fillOpacity: number;
  showAxis: boolean;
}

export class SignalTrack extends Track<SignalTrackData, SignalTrackConfig> {
  constructor(config: Partial<SignalTrackConfig> & { id: string; name: string }) {
    super({
      type: 'signal',
      height: 60,
      visible: true,
      collapsed: false,
      color: '#4CAF50',
      fillOpacity: 0.4,
      showAxis: true,
      ...config,
    });
  }

  protected renderContent(context: TrackRenderContext): void {
    if (!this.data?.points.length) {
      this.renderEmpty(context);
      return;
    }

    const { svg, xScale, height, region } = context;
    const { color, fillOpacity, showAxis } = this.config;

    const padding = { top: 5, bottom: 15 };
    const plotHeight = height - padding.top - padding.bottom;

    // Y scale based on data range
    const yScale = d3.scaleLinear().domain([0, this.data.max]).range([plotHeight, 0]).nice();

    // Filter points in visible region
    const visiblePoints = this.data.points.filter(
      (p) => p.position >= region.start && p.position <= region.end
    );

    // Create area generator
    const area = d3
      .area<SignalPoint>()
      .x((d) => xScale(d.position))
      .y0(plotHeight)
      .y1((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Create line generator
    const line = d3
      .line<SignalPoint>()
      .x((d) => xScale(d.position))
      .y((d) => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const plotGroup = svg.append('g').attr('transform', `translate(0, ${padding.top})`);

    // Render filled area
    plotGroup
      .append('path')
      .datum(visiblePoints)
      .attr('class', 'signal-area')
      .attr('d', area)
      .attr('fill', color)
      .attr('fill-opacity', fillOpacity);

    // Render line on top
    plotGroup
      .append('path')
      .datum(visiblePoints)
      .attr('class', 'signal-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 1.5);

    // Y axis
    if (showAxis) {
      const yAxis = d3.axisLeft(yScale).ticks(3).tickSize(-xScale.range()[1]);

      const axisGroup = plotGroup.append('g').attr('class', 'y-axis').call(yAxis);

      axisGroup.selectAll('.tick line').attr('stroke', '#e0e0e0').attr('stroke-dasharray', '2,2');

      axisGroup.select('.domain').remove();

      axisGroup.selectAll('.tick text').attr('font-size', '9px').attr('fill', '#666');
    }

    // Add hover line for precise value reading
    this.addHoverInteraction(plotGroup, xScale, yScale, plotHeight);
  }

  private addHoverInteraction(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    plotHeight: number
  ): void {
    if (!this.data) return;

    const hoverLine = group
      .append('line')
      .attr('class', 'hover-line')
      .attr('y1', 0)
      .attr('y2', plotHeight)
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,3')
      .style('opacity', 0);

    const hoverCircle = group
      .append('circle')
      .attr('class', 'hover-circle')
      .attr('r', 4)
      .attr('fill', this.config.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('opacity', 0);

    // Invisible overlay for mouse events
    group
      .append('rect')
      .attr('class', 'hover-overlay')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', xScale.range()[1])
      .attr('height', plotHeight)
      .attr('fill', 'transparent')
      .on('mousemove', (event) => {
        const [mouseX] = d3.pointer(event);
        const position = xScale.invert(mouseX);

        // Find closest data point
        const closest = this.findClosestPoint(position);
        if (!closest) return;

        const x = xScale(closest.position);
        const y = yScale(closest.value);

        hoverLine.attr('x1', x).attr('x2', x).style('opacity', 1);

        hoverCircle.attr('cx', x).attr('cy', y).style('opacity', 1);

        this.onFeatureHover?.(closest, event as unknown as MouseEvent);
      })
      .on('mouseout', () => {
        hoverLine.style('opacity', 0);
        hoverCircle.style('opacity', 0);
      });
  }

  private findClosestPoint(position: number): SignalPoint | null {
    if (!this.data?.points.length) return null;

    let closest = this.data.points[0];
    let minDist = Math.abs(position - closest.position);

    for (const point of this.data.points) {
      const dist = Math.abs(position - point.position);
      if (dist < minDist) {
        minDist = dist;
        closest = point;
      }
    }

    return closest;
  }

  private renderEmpty(context: TrackRenderContext): void {
    const { svg, width, height } = context;

    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#999')
      .attr('font-size', '12px')
      .text('No signal data in this region');
  }

  getTooltipContent(feature: unknown): string {
    const point = feature as SignalPoint;

    return `
      <strong>Position:</strong> ${point.position.toLocaleString()}<br>
      <strong>Value:</strong> ${point.value.toFixed(2)}
    `;
  }
}
