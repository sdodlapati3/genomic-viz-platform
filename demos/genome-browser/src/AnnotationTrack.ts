/**
 * AnnotationTrack - Renders genomic annotations like regulatory elements
 */

import * as d3 from 'd3';
import { Track, TrackRenderContext } from './Track';
import type { TrackConfig, AnnotationFeature, AnnotationTrackData } from './types';

export interface AnnotationTrackConfig extends TrackConfig {
  type: 'annotation';
  showLabels: boolean;
}

export class AnnotationTrack extends Track<AnnotationTrackData, AnnotationTrackConfig> {
  constructor(config: Partial<AnnotationTrackConfig> & { id: string; name: string }) {
    super({
      type: 'annotation',
      height: 40,
      visible: true,
      collapsed: false,
      showLabels: true,
      ...config,
    });
  }

  protected renderContent(context: TrackRenderContext): void {
    if (!this.data?.annotations.length) {
      this.renderEmpty(context);
      return;
    }

    const { svg, xScale, height, region } = context;
    const barHeight = 16;
    const barY = (height - barHeight) / 2;

    // Filter annotations in visible region
    const visible = this.data.annotations.filter(
      (a) =>
        (a.start >= region.start && a.start <= region.end) ||
        (a.end >= region.start && a.end <= region.end) ||
        (a.start <= region.start && a.end >= region.end)
    );

    visible.forEach((annotation) => {
      this.renderAnnotation(svg, annotation, xScale, barY, barHeight);
    });
  }

  private renderAnnotation(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    annotation: AnnotationFeature,
    xScale: d3.ScaleLinear<number, number>,
    y: number,
    height: number
  ): void {
    const startX = Math.max(0, xScale(annotation.start));
    const endX = Math.min(xScale.range()[1], xScale(annotation.end));
    const width = Math.max(2, endX - startX);

    const group = svg
      .append('g')
      .attr('class', 'annotation')
      .attr('data-annotation-id', annotation.id);

    // Rectangle
    const rect = group
      .append('rect')
      .attr('x', startX)
      .attr('y', y)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', annotation.color || '#9C27B0')
      .attr('rx', 3)
      .attr('opacity', 0.8)
      .style('cursor', 'pointer');

    // Label
    if (this.config.showLabels && width > 30) {
      group
        .append('text')
        .attr('x', startX + width / 2)
        .attr('y', y + height / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(this.truncateLabel(annotation.name, width));
    }

    // Hover handlers
    rect.on('mouseover', (event) => {
      rect.attr('opacity', 1).attr('stroke', '#333').attr('stroke-width', 2);
      this.onFeatureHover?.(annotation, event as unknown as MouseEvent);
    });

    rect.on('mouseout', () => {
      rect.attr('opacity', 0.8).attr('stroke', 'none');
    });

    rect.on('click', (event) => {
      this.onFeatureClick?.(annotation, event as unknown as MouseEvent);
    });
  }

  private truncateLabel(label: string, width: number): string {
    const maxChars = Math.floor(width / 7);
    if (label.length <= maxChars) return label;
    return label.substring(0, maxChars - 2) + '..';
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
      .text('No annotations in this region');
  }

  getTooltipContent(feature: unknown): string {
    const annotation = feature as AnnotationFeature;

    return `
      <strong>${annotation.name}</strong><br>
      <strong>Type:</strong> ${annotation.type}<br>
      <strong>Location:</strong> ${annotation.chromosome}:${annotation.start.toLocaleString()}-${annotation.end.toLocaleString()}<br>
      <strong>Size:</strong> ${(annotation.end - annotation.start).toLocaleString()} bp
    `;
  }
}
