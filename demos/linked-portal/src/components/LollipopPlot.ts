/**
 * LollipopPlot - Mutation lollipop visualization with zoom, pan, and brush selection
 *
 * Features:
 * - Protein backbone with domain annotations
 * - Mutations as lollipops (position, count as height)
 * - D3 brush for range selection
 * - Zoom and pan with mouse wheel / drag
 * - Mini-map navigation
 * - Linked highlighting with other views
 * - Smooth transitions
 */

import * as d3 from 'd3';
import { EventBus, CohortStore, type CohortState } from '../state';
import type { Mutation, ProteinDomain, ConsequenceType, GeneData } from '../types';
import { MUTATION_COLORS, MUTATION_LABELS } from '../types';

export interface LollipopConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  enableZoom: boolean;
  enableMiniMap: boolean;
  transitionDuration: number;
  clusterThreshold: number; // Minimum pixel distance to cluster mutations
}

const DEFAULT_CONFIG: LollipopConfig = {
  width: 900,
  height: 350,
  margin: { top: 40, right: 40, bottom: 60, left: 60 },
  enableZoom: true,
  enableMiniMap: true,
  transitionDuration: 300,
  clusterThreshold: 10,
};

interface MutationCluster {
  position: number;
  mutations: Mutation[];
  totalCount: number;
  xPos?: number; // Cached x position for clustering
}

export class LollipopPlot {
  private container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private svg!: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private mainGroup!: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private config: LollipopConfig;

  // Scales
  private xScale!: d3.ScaleLinear<number, number>;
  private xScaleOriginal!: d3.ScaleLinear<number, number>; // For zoom reference
  private yScale!: d3.ScaleLinear<number, number>;

  // Data
  private geneData: GeneData | null = null;
  private mutations: Mutation[] = [];
  private clusters: MutationCluster[] = [];

  // State
  private selectedMutationIds: Set<string> = new Set();
  private highlightedMutationIds: Set<string> = new Set();
  private currentTransform: d3.ZoomTransform = d3.zoomIdentity;

  // Zoom
  private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;

  // Brush
  private brush!: d3.BrushBehavior<unknown>;
  private brushGroup!: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;

  // Mini-map
  private miniMapSvg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown> | null = null;
  private miniMapWidth = 200;
  private miniMapHeight = 40;

  constructor(selector: string, config: Partial<LollipopConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Clear and create container
    const parent = d3.select(selector);
    parent.selectAll('*').remove();

    this.container = parent
      .append('div')
      .attr('class', 'lollipop-container')
      .style('position', 'relative');

    this.createSVG();
    this.setupEventListeners();
    this.setupStoreSubscription();
  }

  private createSVG(): void {
    const { width, height, margin } = this.config;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    this.svg = this.container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('font-family', 'system-ui, -apple-system, sans-serif');

    // Create clip path for zooming
    const defs = this.svg.append('defs');
    defs
      .append('clipPath')
      .attr('id', 'lollipop-clip')
      .append('rect')
      .attr('width', plotWidth)
      .attr('height', plotHeight + 60); // Include domain area

    // Create main group that will be clipped
    this.mainGroup = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .attr('clip-path', 'url(#lollipop-clip)');

    // Setup zoom if enabled
    if (this.config.enableZoom) {
      this.setupZoom();
    }
  }

  private setupZoom(): void {
    const { width, height, margin } = this.config;
    const plotWidth = width - margin.left - margin.right;

    this.zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 20])
      .translateExtent([
        [0, 0],
        [plotWidth, height],
      ])
      .extent([
        [0, 0],
        [plotWidth, height],
      ])
      .on('zoom', (event) => this.handleZoom(event));

    this.svg.call(this.zoom);

    // Add zoom controls
    this.addZoomControls();
  }

  private addZoomControls(): void {
    const { margin } = this.config;

    const controls = this.container
      .append('div')
      .attr('class', 'zoom-controls')
      .style('position', 'absolute')
      .style('top', `${margin.top}px`)
      .style('right', `${margin.right + 10}px`)
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('gap', '4px');

    const buttonStyle = `
      width: 28px;
      height: 28px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: white;
      cursor: pointer;
      font-size: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    controls
      .append('button')
      .attr('title', 'Zoom In')
      .attr('style', buttonStyle)
      .html('+')
      .on('click', () => this.zoomBy(1.5));

    controls
      .append('button')
      .attr('title', 'Zoom Out')
      .attr('style', buttonStyle)
      .html('−')
      .on('click', () => this.zoomBy(0.67));

    controls
      .append('button')
      .attr('title', 'Reset Zoom')
      .attr('style', buttonStyle)
      .html('⌂')
      .on('click', () => this.resetZoom());
  }

  private handleZoom(event: d3.D3ZoomEvent<SVGSVGElement, unknown>): void {
    this.currentTransform = event.transform;

    // Update x scale based on zoom
    this.xScale = this.currentTransform.rescaleX(this.xScaleOriginal);

    // Re-render with animation
    this.updateVisualization();

    // Update mini-map viewport
    if (this.config.enableMiniMap) {
      this.updateMiniMapViewport();
    }
  }

  private zoomBy(factor: number): void {
    this.svg.transition().duration(this.config.transitionDuration).call(this.zoom.scaleBy, factor);
  }

  private resetZoom(): void {
    this.svg
      .transition()
      .duration(this.config.transitionDuration)
      .call(this.zoom.transform, d3.zoomIdentity);
  }

  /**
   * Zoom to a specific amino acid range (public API)
   */
  zoomToRange(start: number, end: number): void {
    const { width, margin } = this.config;
    const plotWidth = width - margin.left - margin.right;

    const x0 = this.xScaleOriginal(start);
    const x1 = this.xScaleOriginal(end);
    const rangeWidth = x1 - x0;

    const scale = plotWidth / rangeWidth;
    const tx = -x0 * scale;

    this.svg
      .transition()
      .duration(this.config.transitionDuration)
      .call(this.zoom.transform, d3.zoomIdentity.scale(scale).translate(tx / scale, 0));
  }

  private setupEventListeners(): void {
    EventBus.on('selection:change', (event) => {
      if (event.source !== 'lollipop') {
        this.selectedMutationIds = new Set(event.mutationIds);
        this.updateSelectionHighlight();
      }
    });

    EventBus.on('selection:clear', (event) => {
      if (event.source !== 'lollipop') {
        this.selectedMutationIds.clear();
        this.updateSelectionHighlight();
      }
    });

    EventBus.on('highlight:show', (event) => {
      if (event.source !== 'lollipop') {
        this.highlightedMutationIds = new Set(event.mutationIds);
        this.updateHighlight();
      }
    });

    EventBus.on('highlight:hide', () => {
      this.highlightedMutationIds.clear();
      this.updateHighlight();
    });
  }

  private setupStoreSubscription(): void {
    CohortStore.subscribe((state: CohortState) => {
      if (state.geneData && state.filteredMutations) {
        this.geneData = state.geneData;
        this.mutations = state.filteredMutations;
        this.render();
      }
    });
  }

  setData(geneData: GeneData, mutations: Mutation[]): void {
    this.geneData = geneData;
    this.mutations = mutations;
    this.render();
  }

  render(): void {
    if (!this.geneData) return;

    // Clear previous content but keep zoom controls
    this.svg.selectAll('g').remove();
    this.svg.selectAll('text.title').remove();

    const { width, height, margin } = this.config;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Recreate clip path
    this.svg.select('defs').remove();
    const defs = this.svg.append('defs');
    defs
      .append('clipPath')
      .attr('id', 'lollipop-clip')
      .append('rect')
      .attr('width', plotWidth)
      .attr('height', plotHeight + 60);

    // Main group with clip path
    this.mainGroup = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .attr('clip-path', 'url(#lollipop-clip)');

    // Axes group (outside clip for axis labels)
    const axesGroup = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Setup scales
    this.xScaleOriginal = d3
      .scaleLinear()
      .domain([1, this.geneData.proteinLength])
      .range([0, plotWidth]);

    // Apply current zoom transform to x scale
    this.xScale = this.currentTransform.rescaleX(this.xScaleOriginal);

    // Cluster mutations by position
    this.clusters = this.clusterMutations(this.mutations);

    const maxCount = d3.max(this.clusters, (d) => d.totalCount) || 100;

    this.yScale = d3
      .scaleLinear()
      .domain([0, maxCount * 1.1])
      .range([plotHeight - 60, 0]);

    // Render components
    this.renderTitle();
    this.renderAxes(axesGroup, plotWidth, plotHeight);
    this.renderDomains(this.mainGroup, plotHeight);
    this.renderBackbone(this.mainGroup, plotWidth, plotHeight);
    this.renderLollipops(this.mainGroup, plotHeight);
    this.renderBrush(this.mainGroup, plotWidth, plotHeight);
    this.renderLegend(axesGroup, plotWidth);

    // Render mini-map if enabled
    if (this.config.enableMiniMap) {
      this.renderMiniMap();
    }
  }

  /**
   * Update visualization without full re-render (for zoom/pan)
   */
  private updateVisualization(): void {
    if (!this.geneData) return;

    const t = d3.transition().duration(0); // No animation for smooth zoom

    // Update domains
    this.mainGroup
      .selectAll('rect.domain')
      .transition(t as any)
      .attr('x', (d: unknown) => {
        const domain = d as ProteinDomain;
        return this.xScale(domain.start);
      })
      .attr('width', (d: unknown) => {
        const domain = d as ProteinDomain;
        return Math.max(0, this.xScale(domain.end) - this.xScale(domain.start));
      });

    this.mainGroup
      .selectAll('text.domain-label')
      .transition(t as any)
      .attr('x', (d: unknown) => {
        const domain = d as ProteinDomain;
        return (this.xScale(domain.start) + this.xScale(domain.end)) / 2;
      })
      .style('opacity', (d: unknown) => {
        const domain = d as ProteinDomain;
        const width = this.xScale(domain.end) - this.xScale(domain.start);
        return width > 40 ? 1 : 0;
      });

    // Update lollipop stems
    this.mainGroup
      .selectAll('line.stem')
      .transition(t as any)
      .attr('x1', (d: unknown) => this.xScale((d as MutationCluster).position))
      .attr('x2', (d: unknown) => this.xScale((d as MutationCluster).position));

    // Update lollipop heads
    this.mainGroup
      .selectAll('circle.head')
      .transition(t as any)
      .attr('cx', (d: unknown) => this.xScale((d as MutationCluster).position));

    // Update x-axis
    const xAxis = d3.axisBottom(this.xScale).ticks(10);
    this.svg.select<SVGGElement>('.x-axis').call(xAxis);
  }

  private clusterMutations(mutations: Mutation[]): MutationCluster[] {
    const byPosition = new Map<number, Mutation[]>();

    for (const mut of mutations) {
      if (!byPosition.has(mut.position)) {
        byPosition.set(mut.position, []);
      }
      byPosition.get(mut.position)!.push(mut);
    }

    return Array.from(byPosition.entries()).map(([position, muts]) => ({
      position,
      mutations: muts,
      totalCount: d3.sum(muts, (m) => m.count),
    }));
  }

  private renderTitle(): void {
    const { width, margin } = this.config;

    this.svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .attr('font-size', 16)
      .attr('font-weight', 600)
      .attr('fill', '#1a1a2e')
      .text(`${this.geneData?.gene || 'Gene'} Mutations (${this.mutations.length} shown)`);
  }

  private renderAxes(
    g: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
    plotWidth: number,
    plotHeight: number
  ): void {
    const xAxis = d3.axisBottom(this.xScale).ticks(10);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${plotHeight})`)
      .call(xAxis)
      .append('text')
      .attr('x', plotWidth / 2)
      .attr('y', 35)
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text('Amino Acid Position');

    const yAxis = d3.axisLeft(this.yScale).ticks(5);

    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(plotHeight - 60) / 2)
      .attr('y', -40)
      .attr('fill', '#666')
      .attr('text-anchor', 'middle')
      .text('Mutation Count');
  }

  private renderDomains(
    g: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
    plotHeight: number
  ): void {
    if (!this.geneData?.domains) return;

    const domainHeight = 25;
    const domainY = plotHeight - 40;

    const domainGroup = g.append('g').attr('class', 'domains');

    domainGroup
      .selectAll('rect.domain')
      .data(this.geneData.domains)
      .join('rect')
      .attr('class', 'domain')
      .attr('x', (d) => this.xScale(d.start))
      .attr('y', domainY)
      .attr('width', (d) => this.xScale(d.end) - this.xScale(d.start))
      .attr('height', domainHeight)
      .attr('fill', (d) => d.color)
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .attr('rx', 3)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => this.showDomainTooltip(event, d))
      .on('mouseout', () => this.hideTooltip());

    domainGroup
      .selectAll('text.domain-label')
      .data(this.geneData.domains.filter((d) => this.xScale(d.end) - this.xScale(d.start) > 40))
      .join('text')
      .attr('class', 'domain-label')
      .attr('x', (d) => (this.xScale(d.start) + this.xScale(d.end)) / 2)
      .attr('y', domainY + domainHeight / 2 + 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('font-weight', 500)
      .attr('fill', '#fff')
      .attr('pointer-events', 'none')
      .text((d) => d.name);
  }

  private renderBackbone(
    g: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
    plotWidth: number,
    plotHeight: number
  ): void {
    const backboneY = plotHeight - 28;

    g.append('line')
      .attr('class', 'backbone')
      .attr('x1', 0)
      .attr('y1', backboneY)
      .attr('x2', plotWidth)
      .attr('y2', backboneY)
      .attr('stroke', '#333')
      .attr('stroke-width', 2);
  }

  private renderLollipops(
    g: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
    plotHeight: number
  ): void {
    const backboneY = plotHeight - 28;

    const lollipopGroup = g.append('g').attr('class', 'lollipops');

    // Stems
    lollipopGroup
      .selectAll('line.stem')
      .data(this.clusters)
      .join('line')
      .attr('class', 'stem')
      .attr('x1', (d) => this.xScale(d.position))
      .attr('y1', backboneY)
      .attr('x2', (d) => this.xScale(d.position))
      .attr('y2', (d) => this.yScale(d.totalCount))
      .attr('stroke', '#666')
      .attr('stroke-width', 1.5);

    // Circles (heads)
    lollipopGroup
      .selectAll('circle.head')
      .data(this.clusters)
      .join('circle')
      .attr('class', 'head')
      .attr('cx', (d) => this.xScale(d.position))
      .attr('cy', (d) => this.yScale(d.totalCount))
      .attr('r', (d) => Math.min(8, 4 + Math.log(d.totalCount + 1)))
      .attr('fill', (d) => this.getMutationColor(d.mutations[0]))
      .attr('stroke', '#333')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('click', (event, d) => this.handleMutationClick(event, d))
      .on('mouseover', (event, d) => this.handleMutationHover(event, d))
      .on('mouseout', () => this.handleMutationMouseout());
  }

  private renderBrush(
    g: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
    plotWidth: number,
    plotHeight: number
  ): void {
    this.brush = d3
      .brushX()
      .extent([
        [0, 0],
        [plotWidth, plotHeight - 60],
      ])
      .on('end', (event) => this.handleBrushEnd(event));

    this.brushGroup = g.append('g').attr('class', 'brush').call(this.brush);

    this.brushGroup
      .selectAll('.selection')
      .attr('fill', '#4facfe')
      .attr('fill-opacity', 0.2)
      .attr('stroke', '#4facfe')
      .attr('stroke-width', 1);
  }

  private renderLegend(
    g: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
    plotWidth: number
  ): void {
    const mutationTypes = new Set(this.mutations.map((m) => m.type));
    const legendItems = Array.from(mutationTypes);

    const legend = g
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${plotWidth - 150}, 0)`);

    legend
      .selectAll('g.legend-item')
      .data(legendItems)
      .join('g')
      .attr('class', 'legend-item')
      .attr('transform', (_, i) => `translate(0, ${i * 18})`)
      .each(function (type) {
        const item = d3.select(this);

        item
          .append('circle')
          .attr('cx', 6)
          .attr('cy', 6)
          .attr('r', 5)
          .attr('fill', MUTATION_COLORS[type as ConsequenceType] || '#999');

        item
          .append('text')
          .attr('x', 16)
          .attr('y', 10)
          .attr('font-size', 11)
          .attr('fill', '#666')
          .text(MUTATION_LABELS[type as ConsequenceType] || type);
      });
  }

  private getMutationColor(mutation: Mutation): string {
    return MUTATION_COLORS[mutation.type] || '#999';
  }

  private handleMutationClick(event: MouseEvent, cluster: MutationCluster): void {
    event.stopPropagation();

    const mutationIds = cluster.mutations.map((m) => m.id);
    const sampleIds = cluster.mutations.flatMap((m) => m.sampleIds);

    EventBus.emit('selection:change', {
      sampleIds: [...new Set(sampleIds)],
      mutationIds,
      source: 'lollipop',
      type: 'click',
    });
  }

  private handleMutationHover(event: MouseEvent, cluster: MutationCluster): void {
    const mutationIds = cluster.mutations.map((m) => m.id);
    const sampleIds = cluster.mutations.flatMap((m) => m.sampleIds);

    EventBus.emit('highlight:show', {
      sampleIds: [...new Set(sampleIds)],
      mutationIds,
      source: 'lollipop',
    });

    this.showMutationTooltip(event, cluster);
  }

  private handleMutationMouseout(): void {
    EventBus.emit('highlight:hide', {
      sampleIds: [],
      mutationIds: [],
      source: 'lollipop',
    });

    this.hideTooltip();
  }

  private handleBrushEnd(event: d3.D3BrushEvent<unknown>): void {
    if (!event.selection) {
      EventBus.emit('selection:clear', { source: 'lollipop' });
      return;
    }

    const [x0, x1] = event.selection as [number, number];
    const pos0 = Math.round(this.xScale.invert(x0));
    const pos1 = Math.round(this.xScale.invert(x1));

    const selectedClusters = this.clusters.filter((c) => c.position >= pos0 && c.position <= pos1);

    const mutationIds = selectedClusters.flatMap((c) => c.mutations.map((m) => m.id));
    const sampleIds = selectedClusters.flatMap((c) => c.mutations.flatMap((m) => m.sampleIds));

    EventBus.emit('selection:change', {
      sampleIds: [...new Set(sampleIds)],
      mutationIds,
      source: 'lollipop',
      type: 'brush',
    });
  }

  private updateSelectionHighlight(): void {
    this.svg
      .selectAll('circle.head')
      .attr('stroke', (d: unknown) => {
        const cluster = d as MutationCluster;
        const isSelected = cluster.mutations.some((m) => this.selectedMutationIds.has(m.id));
        return isSelected ? '#e74c3c' : '#333';
      })
      .attr('stroke-width', (d: unknown) => {
        const cluster = d as MutationCluster;
        const isSelected = cluster.mutations.some((m) => this.selectedMutationIds.has(m.id));
        return isSelected ? 3 : 1;
      });
  }

  private updateHighlight(): void {
    this.svg.selectAll('circle.head').attr('opacity', (d: unknown) => {
      if (this.highlightedMutationIds.size === 0) return 1;
      const cluster = d as MutationCluster;
      const isHighlighted = cluster.mutations.some((m) => this.highlightedMutationIds.has(m.id));
      return isHighlighted ? 1 : 0.3;
    });
  }

  private showMutationTooltip(event: MouseEvent, cluster: MutationCluster): void {
    const tooltip = this.getOrCreateTooltip();
    const mutation = cluster.mutations[0];

    let html = `
      <div style="font-weight: 600; margin-bottom: 4px;">
        ${mutation.aaChange}
      </div>
      <div style="font-size: 12px; color: #666;">
        Position: ${mutation.position}<br>
        Type: ${MUTATION_LABELS[mutation.type] || mutation.type}<br>
        Count: ${cluster.totalCount}<br>
        Samples: ${cluster.mutations.flatMap((m) => m.sampleIds).length}
      </div>
    `;

    if (cluster.mutations.length > 1) {
      html += `<div style="font-size: 11px; color: #999; margin-top: 4px;">
        +${cluster.mutations.length - 1} more variants at this position
      </div>`;
    }

    tooltip
      .html(html)
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .style('opacity', 1);
  }

  private showDomainTooltip(event: MouseEvent, domain: ProteinDomain): void {
    const tooltip = this.getOrCreateTooltip();

    tooltip
      .html(
        `
        <div style="font-weight: 600; margin-bottom: 4px;">
          ${domain.name}
        </div>
        <div style="font-size: 12px; color: #666;">
          ${domain.description}<br>
          Position: ${domain.start}-${domain.end}
        </div>
      `
      )
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .style('opacity', 1);
  }

  private hideTooltip(): void {
    d3.select('.lollipop-tooltip').style('opacity', 0);
  }

  private getOrCreateTooltip(): d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown> {
    let tooltip = d3.select<HTMLDivElement, unknown>('.lollipop-tooltip');

    if (tooltip.empty()) {
      tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'lollipop-tooltip')
        .style('position', 'absolute')
        .style('background', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '8px 12px')
        .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', '1000')
        .style('font-family', 'system-ui, -apple-system, sans-serif')
        .style('font-size', '13px');
    }

    return tooltip;
  }

  clearBrush(): void {
    if (this.brushGroup) {
      this.brushGroup.call(this.brush.move, null);
    }
  }

  /**
   * Render mini-map navigation overview
   */
  private renderMiniMap(): void {
    if (!this.geneData) return;

    // Remove existing mini-map
    this.container.select('.mini-map-container').remove();

    const { margin } = this.config;
    const miniMapContainer = this.container
      .append('div')
      .attr('class', 'mini-map-container')
      .style('position', 'absolute')
      .style('bottom', '5px')
      .style('left', `${margin.left}px`)
      .style('background', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('padding', '4px')
      .style('box-shadow', '0 1px 3px rgba(0,0,0,0.1)');

    this.miniMapSvg = miniMapContainer
      .append('svg')
      .attr('width', this.miniMapWidth)
      .attr('height', this.miniMapHeight);

    const miniXScale = d3
      .scaleLinear()
      .domain([1, this.geneData.proteinLength])
      .range([0, this.miniMapWidth]);

    // Draw domains in mini-map
    if (this.geneData.domains) {
      this.miniMapSvg
        .selectAll('rect.mini-domain')
        .data(this.geneData.domains)
        .join('rect')
        .attr('class', 'mini-domain')
        .attr('x', (d) => miniXScale(d.start))
        .attr('y', this.miniMapHeight / 2 - 5)
        .attr('width', (d) => miniXScale(d.end) - miniXScale(d.start))
        .attr('height', 10)
        .attr('fill', (d) => d.color)
        .attr('opacity', 0.7);
    }

    // Draw mutations as small marks
    const positions = [...new Set(this.mutations.map((m) => m.position))];
    this.miniMapSvg
      .selectAll('line.mini-mutation')
      .data(positions)
      .join('line')
      .attr('class', 'mini-mutation')
      .attr('x1', (d) => miniXScale(d))
      .attr('x2', (d) => miniXScale(d))
      .attr('y1', 2)
      .attr('y2', this.miniMapHeight / 2 - 5)
      .attr('stroke', '#e74c3c')
      .attr('stroke-width', 1)
      .attr('opacity', 0.5);

    // Draw viewport rectangle
    this.miniMapSvg
      .append('rect')
      .attr('class', 'viewport-rect')
      .attr('fill', '#4facfe')
      .attr('fill-opacity', 0.2)
      .attr('stroke', '#4facfe')
      .attr('stroke-width', 1);

    this.updateMiniMapViewport();

    // Make mini-map interactive - drag to navigate
    const drag = d3.drag<SVGSVGElement, unknown>().on('drag', (event) => {
      const x = Math.max(0, Math.min(this.miniMapWidth, event.x));
      const position = miniXScale.invert(x);
      const domain = this.xScale.domain();
      const range = domain[1] - domain[0];
      const newStart = position - range / 2;

      // Convert to zoom transform
      const scale = this.currentTransform.k;
      const tx = -this.xScaleOriginal(newStart) * scale;

      this.svg.call(this.zoom.transform, d3.zoomIdentity.scale(scale).translate(tx / scale, 0));
    });

    this.miniMapSvg.call(drag as any);
  }

  private updateMiniMapViewport(): void {
    if (!this.miniMapSvg || !this.geneData) return;

    const miniXScale = d3
      .scaleLinear()
      .domain([1, this.geneData.proteinLength])
      .range([0, this.miniMapWidth]);

    const domain = this.xScale.domain();
    const x = miniXScale(domain[0]);
    const width = miniXScale(domain[1]) - miniXScale(domain[0]);

    this.miniMapSvg
      .select('rect.viewport-rect')
      .attr('x', Math.max(0, x))
      .attr('y', 0)
      .attr('width', Math.min(this.miniMapWidth - x, width))
      .attr('height', this.miniMapHeight);
  }

  destroy(): void {
    this.container.remove();
    d3.select('.lollipop-tooltip').remove();
  }
}
