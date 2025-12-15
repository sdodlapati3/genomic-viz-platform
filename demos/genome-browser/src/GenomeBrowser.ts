/**
 * GenomeBrowser - Main genome browser visualization component
 *
 * Orchestrates multiple tracks, handles navigation, zoom/pan, and coordinates.
 */

import * as d3 from 'd3';
import type { GenomicRegion, BrowserConfig, RulerTick, TrackType } from './types';
import { Track, TrackRenderContext } from './Track';
import { GeneTrack } from './GeneTrack';
import { MutationTrack } from './MutationTrack';
import { SignalTrack } from './SignalTrack';
import { AnnotationTrack } from './AnnotationTrack';
import {
  getGenesInRegion,
  generateMutations,
  generateSignalData,
  generateAnnotations,
} from './data';

const DEFAULT_CONFIG: BrowserConfig = {
  width: 1000,
  trackAreaHeight: 400,
  rulerHeight: 40,
  labelWidth: 100,
  minBp: 100,
  maxBp: 10000000,
};

export class GenomeBrowser {
  private container: HTMLElement;
  private config: BrowserConfig;

  // SVG elements
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private rulerSvg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private trackContainer!: d3.Selection<SVGGElement, unknown, null, undefined>;

  // State
  private region: GenomicRegion;
  private tracks: Map<string, Track<unknown>> = new Map();
  private trackOrder: string[] = [];

  // Scales
  private xScale!: d3.ScaleLinear<number, number>;

  // Zoom behavior
  private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;

  // Tooltip
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown> | null = null;

  // Callbacks
  private onRegionChange?: (region: GenomicRegion) => void;
  private onFeatureSelect?: (feature: unknown) => void;

  constructor(rulerSelector: string, trackSelector: string, config: Partial<BrowserConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    const rulerEl = document.querySelector(rulerSelector);
    const trackEl = document.querySelector(trackSelector);

    if (!rulerEl || !trackEl) {
      throw new Error('Browser containers not found');
    }

    this.container = trackEl as HTMLElement;

    // Default region: TP53
    this.region = {
      chromosome: 'chr17',
      start: 7560000,
      end: 7730000,
    };

    this.initRuler(rulerEl as HTMLElement);
    this.initTracks();
    this.setupZoom();

    // Add default tracks
    this.addDefaultTracks();

    this.render();
  }

  private initRuler(container: HTMLElement): void {
    const { width, rulerHeight, labelWidth } = this.config;

    this.rulerSvg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', rulerHeight)
      .attr('class', 'ruler-svg');

    // Ruler group with label offset
    this.rulerSvg
      .append('g')
      .attr('class', 'ruler-group')
      .attr('transform', `translate(${labelWidth}, 0)`);
  }

  private initTracks(): void {
    const { width, trackAreaHeight, labelWidth } = this.config;

    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', trackAreaHeight)
      .attr('class', 'tracks-svg');

    this.trackContainer = this.svg
      .append('g')
      .attr('class', 'track-container')
      .attr('transform', `translate(${labelWidth}, 0)`);
  }

  private setupZoom(): void {
    const { width, labelWidth } = this.config;
    const trackWidth = width - labelWidth;

    this.zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 1000])
      .translateExtent([
        [0, 0],
        [trackWidth, this.config.trackAreaHeight],
      ])
      .on('zoom', (event) => {
        this.handleZoom(event);
      });

    this.svg.call(this.zoom);
  }

  private handleZoom(event: d3.D3ZoomEvent<SVGSVGElement, unknown>): void {
    const transform = event.transform;
    const { labelWidth, minBp, maxBp } = this.config;
    const trackWidth = this.config.width - labelWidth;

    // Calculate new region based on zoom/pan
    const originalSpan = this.region.end - this.region.start;
    const newSpan = Math.max(minBp, Math.min(maxBp, originalSpan / transform.k));

    const center = this.region.start + originalSpan / 2;
    const offset = (-transform.x / trackWidth) * newSpan;

    const newStart = Math.max(0, center - newSpan / 2 + offset);
    const newEnd = newStart + newSpan;

    this.region = {
      ...this.region,
      start: Math.floor(newStart),
      end: Math.floor(newEnd),
    };

    this.updateXScale();
    this.renderRuler();
    this.renderTracks();

    this.onRegionChange?.(this.region);
  }

  private updateXScale(): void {
    const { width, labelWidth } = this.config;
    const trackWidth = width - labelWidth;

    this.xScale = d3
      .scaleLinear()
      .domain([this.region.start, this.region.end])
      .range([0, trackWidth]);
  }

  private addDefaultTracks(): void {
    // Gene track
    const geneTrack = new GeneTrack({
      id: 'genes',
      name: 'Genes',
      height: 80,
    });
    geneTrack.setHoverCallback((feature, event) => this.showTooltip(geneTrack, feature, event));
    geneTrack.setClickCallback((feature) => this.onFeatureSelect?.(feature));
    this.addTrack(geneTrack);

    // Mutation track
    const mutationTrack = new MutationTrack({
      id: 'mutations',
      name: 'Mutations',
      height: 100,
    });
    mutationTrack.setHoverCallback((feature, event) =>
      this.showTooltip(mutationTrack, feature, event)
    );
    mutationTrack.setClickCallback((feature) => this.onFeatureSelect?.(feature));
    this.addTrack(mutationTrack);

    // Signal track
    const signalTrack = new SignalTrack({
      id: 'coverage',
      name: 'Coverage',
      height: 60,
      color: '#4CAF50',
    });
    signalTrack.setHoverCallback((feature, event) => this.showTooltip(signalTrack, feature, event));
    this.addTrack(signalTrack);

    // Annotation track
    const annotationTrack = new AnnotationTrack({
      id: 'annotations',
      name: 'Regulatory',
      height: 40,
    });
    annotationTrack.setHoverCallback((feature, event) =>
      this.showTooltip(annotationTrack, feature, event)
    );
    annotationTrack.setClickCallback((feature) => this.onFeatureSelect?.(feature));
    this.addTrack(annotationTrack);
  }

  addTrack(track: Track<unknown>): void {
    this.tracks.set(track.id, track);
    this.trackOrder.push(track.id);
    this.updateTrackLayout();
  }

  removeTrack(trackId: string): void {
    this.tracks.delete(trackId);
    this.trackOrder = this.trackOrder.filter((id) => id !== trackId);
    this.updateTrackLayout();
    this.render();
  }

  private updateTrackLayout(): void {
    // Calculate total height needed
    let totalHeight = 0;
    for (const trackId of this.trackOrder) {
      const track = this.tracks.get(trackId);
      if (track?.visible) {
        totalHeight += track.height + 5; // 5px gap between tracks
      }
    }

    this.svg.attr('height', Math.max(this.config.trackAreaHeight, totalHeight));
  }

  setRegion(region: GenomicRegion): void {
    this.region = region;
    this.updateXScale();
    this.loadTrackData();
    this.render();
    this.onRegionChange?.(region);
  }

  getRegion(): GenomicRegion {
    return { ...this.region };
  }

  zoomIn(): void {
    const span = this.region.end - this.region.start;
    const center = this.region.start + span / 2;
    const newSpan = Math.max(this.config.minBp, span * 0.5);

    this.region = {
      ...this.region,
      start: Math.floor(center - newSpan / 2),
      end: Math.floor(center + newSpan / 2),
    };

    this.render();
    this.onRegionChange?.(this.region);
  }

  zoomOut(): void {
    const span = this.region.end - this.region.start;
    const center = this.region.start + span / 2;
    const newSpan = Math.min(this.config.maxBp, span * 2);

    this.region = {
      ...this.region,
      start: Math.floor(center - newSpan / 2),
      end: Math.floor(center + newSpan / 2),
    };

    this.render();
    this.onRegionChange?.(this.region);
  }

  panLeft(): void {
    const span = this.region.end - this.region.start;
    const shift = span * 0.25;

    this.region = {
      ...this.region,
      start: Math.max(0, Math.floor(this.region.start - shift)),
      end: Math.floor(this.region.end - shift),
    };

    this.render();
    this.onRegionChange?.(this.region);
  }

  panRight(): void {
    const span = this.region.end - this.region.start;
    const shift = span * 0.25;

    this.region = {
      ...this.region,
      start: Math.floor(this.region.start + shift),
      end: Math.floor(this.region.end + shift),
    };

    this.render();
    this.onRegionChange?.(this.region);
  }

  private loadTrackData(): void {
    // Load gene data
    const geneTrack = this.tracks.get('genes') as GeneTrack | undefined;
    if (geneTrack) {
      const genes = getGenesInRegion(this.region.chromosome, this.region.start, this.region.end);
      geneTrack.setData({ genes });
    }

    // Load mutation data
    const mutationTrack = this.tracks.get('mutations') as MutationTrack | undefined;
    if (mutationTrack) {
      const allMutations = generateMutations();
      const visibleMutations = allMutations.filter(
        (m) => m.position >= this.region.start && m.position <= this.region.end
      );
      mutationTrack.setData({ mutations: visibleMutations });
    }

    // Load signal data
    const signalTrack = this.tracks.get('coverage') as SignalTrack | undefined;
    if (signalTrack) {
      const points = generateSignalData(this.region.start, this.region.end);
      const values = points.map((p) => p.value);
      signalTrack.setData({
        points,
        min: Math.min(...values),
        max: Math.max(...values),
      });
    }

    // Load annotation data
    const annotationTrack = this.tracks.get('annotations') as AnnotationTrack | undefined;
    if (annotationTrack) {
      annotationTrack.setData({ annotations: generateAnnotations() });
    }
  }

  render(): void {
    this.updateXScale();
    this.loadTrackData();
    this.renderRuler();
    this.renderTracks();
  }

  private renderRuler(): void {
    const rulerGroup = this.rulerSvg.select('.ruler-group');
    rulerGroup.selectAll('*').remove();

    const { rulerHeight, width, labelWidth } = this.config;
    const trackWidth = width - labelWidth;

    // Background
    rulerGroup
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', trackWidth)
      .attr('height', rulerHeight)
      .attr('fill', '#f5f5f5');

    // Generate ticks
    const ticks = this.generateRulerTicks();

    // Render ticks
    const tickGroup = rulerGroup.append('g').attr('class', 'ticks');

    ticks.forEach((tick) => {
      // Tick line
      tickGroup
        .append('line')
        .attr('x1', tick.x)
        .attr('x2', tick.x)
        .attr('y1', rulerHeight - (tick.major ? 15 : 8))
        .attr('y2', rulerHeight)
        .attr('stroke', '#666')
        .attr('stroke-width', tick.major ? 1.5 : 1);

      // Label for major ticks
      if (tick.major) {
        tickGroup
          .append('text')
          .attr('x', tick.x)
          .attr('y', rulerHeight - 20)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('fill', '#333')
          .text(tick.label);
      }
    });

    // Region label
    rulerGroup
      .append('text')
      .attr('x', 5)
      .attr('y', 15)
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text(
        `${this.region.chromosome}:${this.region.start.toLocaleString()}-${this.region.end.toLocaleString()}`
      );

    // Span info
    const span = this.region.end - this.region.start;
    const spanText =
      span >= 1000000
        ? `${(span / 1000000).toFixed(2)} Mb`
        : span >= 1000
          ? `${(span / 1000).toFixed(1)} kb`
          : `${span} bp`;

    rulerGroup
      .append('text')
      .attr('x', trackWidth - 5)
      .attr('y', 15)
      .attr('text-anchor', 'end')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text(spanText);
  }

  private generateRulerTicks(): RulerTick[] {
    const ticks: RulerTick[] = [];
    const span = this.region.end - this.region.start;

    // Determine appropriate tick interval
    const targetTicks = 10;
    const roughInterval = span / targetTicks;

    // Round to nice numbers
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughInterval)));
    let interval = magnitude;

    if (roughInterval / magnitude > 5) {
      interval = magnitude * 5;
    } else if (roughInterval / magnitude > 2) {
      interval = magnitude * 2;
    }

    const minorInterval = interval / 5;

    // Generate major ticks
    const start = Math.ceil(this.region.start / interval) * interval;
    for (let pos = start; pos <= this.region.end; pos += interval) {
      ticks.push({
        position: pos,
        x: this.xScale(pos),
        label: this.formatPosition(pos),
        major: true,
      });
    }

    // Generate minor ticks
    const minorStart = Math.ceil(this.region.start / minorInterval) * minorInterval;
    for (let pos = minorStart; pos <= this.region.end; pos += minorInterval) {
      if (pos % interval !== 0) {
        ticks.push({
          position: pos,
          x: this.xScale(pos),
          label: '',
          major: false,
        });
      }
    }

    return ticks;
  }

  private formatPosition(pos: number): string {
    if (pos >= 1000000) {
      return `${(pos / 1000000).toFixed(2)}M`;
    } else if (pos >= 1000) {
      return `${(pos / 1000).toFixed(1)}k`;
    }
    return pos.toString();
  }

  private renderTracks(): void {
    this.trackContainer.selectAll('*').remove();

    let currentY = 0;
    const trackWidth = this.config.width - this.config.labelWidth;

    for (const trackId of this.trackOrder) {
      const track = this.tracks.get(trackId);
      if (!track || !track.visible) continue;

      const trackHeight = track.height;

      // Track label
      this.svg
        .append('text')
        .attr('class', 'track-label')
        .attr('x', 5)
        .attr('y', currentY + trackHeight / 2)
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text(track.name);

      // Track group
      const trackGroup = this.trackContainer
        .append('g')
        .attr('class', `track track-${track.type}`)
        .attr('transform', `translate(0, ${currentY})`);

      const context: TrackRenderContext = {
        svg: trackGroup,
        region: this.region,
        width: trackWidth,
        height: trackHeight,
        xScale: this.xScale,
      };

      track.render(context);

      currentY += trackHeight + 5;
    }
  }

  private showTooltip(track: Track<unknown>, feature: unknown, event: MouseEvent): void {
    if (!this.tooltip) {
      this.tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'browser-tooltip')
        .style('position', 'absolute')
        .style('background', 'white')
        .style('border', '1px solid #ccc')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('font-size', '12px')
        .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
    }

    const content = track.getTooltipContent(feature);
    if (this.tooltip) {
      this.tooltip
        .html(content)
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
        .style('opacity', 1);
    }
  }

  hideTooltip(): void {
    this.tooltip?.style('opacity', 0);
  }

  // Public callbacks
  setRegionChangeCallback(callback: (region: GenomicRegion) => void): void {
    this.onRegionChange = callback;
  }

  setFeatureSelectCallback(callback: (feature: unknown) => void): void {
    this.onFeatureSelect = callback;
  }

  // Track management
  getTrackList(): { id: string; name: string; type: TrackType; visible: boolean }[] {
    return this.trackOrder.map((id) => {
      const track = this.tracks.get(id)!;
      return {
        id: track.id,
        name: track.name,
        type: track.type as TrackType,
        visible: track.visible,
      };
    });
  }

  toggleTrackVisibility(trackId: string): void {
    const track = this.tracks.get(trackId);
    if (track) {
      track.setVisible(!track.visible);
      this.updateTrackLayout();
      this.render();
    }
  }

  setTrackOrder(order: string[]): void {
    this.trackOrder = order.filter((id) => this.tracks.has(id));
    this.render();
  }
}
