/**
 * Track - Base class for genome browser tracks
 *
 * Implements the track abstraction pattern used in ProteinPaint and other genome browsers.
 * Each track type extends this base class and implements its own rendering logic.
 */

import * as d3 from 'd3';
import type { GenomicRegion, TrackConfig } from './types';

export interface TrackRenderContext {
  svg: d3.Selection<SVGGElement, unknown, null, undefined>;
  region: GenomicRegion;
  width: number;
  height: number;
  xScale: d3.ScaleLinear<number, number>;
}

export abstract class Track<TData, TConfig extends TrackConfig = TrackConfig> {
  protected config: TConfig;
  protected data: TData | null = null;
  protected container: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;

  // Callbacks
  protected onFeatureHover?: (feature: unknown, event: MouseEvent) => void;
  protected onFeatureClick?: (feature: unknown, event: MouseEvent) => void;

  constructor(config: TConfig) {
    this.config = config;
  }

  get id(): string {
    return this.config.id;
  }

  get name(): string {
    return this.config.name;
  }

  get type(): string {
    return this.config.type;
  }

  get height(): number {
    return this.config.collapsed ? 20 : this.config.height;
  }

  get visible(): boolean {
    return this.config.visible;
  }

  get collapsed(): boolean {
    return this.config.collapsed;
  }

  setData(data: TData): void {
    this.data = data;
  }

  setVisible(visible: boolean): void {
    this.config.visible = visible;
  }

  setCollapsed(collapsed: boolean): void {
    this.config.collapsed = collapsed;
  }

  setHoverCallback(callback: (feature: unknown, event: MouseEvent) => void): void {
    this.onFeatureHover = callback;
  }

  setClickCallback(callback: (feature: unknown, event: MouseEvent) => void): void {
    this.onFeatureClick = callback;
  }

  /**
   * Render the track
   */
  render(context: TrackRenderContext): void {
    this.container = context.svg;

    // Clear previous content
    this.container.selectAll('*').remove();

    if (!this.config.visible) {
      return;
    }

    // Render background
    this.renderBackground(context);

    // Render track-specific content
    if (this.config.collapsed) {
      this.renderCollapsed(context);
    } else {
      this.renderContent(context);
    }
  }

  protected renderBackground(context: TrackRenderContext): void {
    const { svg, width, height } = context;

    svg
      .append('rect')
      .attr('class', 'track-bg')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', height)
      .attr('fill', '#fafafa')
      .attr('stroke', '#e0e0e0');
  }

  protected renderCollapsed(context: TrackRenderContext): void {
    const { svg, width, height } = context;

    svg
      .append('text')
      .attr('class', 'collapsed-label')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '11px')
      .text(`${this.name} (collapsed)`);
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  protected abstract renderContent(context: TrackRenderContext): void;

  /**
   * Get tooltip content for a feature
   */
  abstract getTooltipContent(feature: unknown): string;
}
