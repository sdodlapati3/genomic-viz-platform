/**
 * LollipopPlot - Mutation lollipop visualization with brush selection
 *
 * Features:
 * - Protein backbone with domain annotations
 * - Mutations as lollipops (position, count as height)
 * - D3 brush for range selection
 * - Linked highlighting with other views
 */

import * as d3 from 'd3';
import { EventBus, CohortStore, type CohortState } from '../state';
import type { Mutation, ProteinDomain, ConsequenceType, GeneData } from '../types';
import { MUTATION_COLORS, MUTATION_LABELS } from '../types';

export interface LollipopConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
}

const DEFAULT_CONFIG: LollipopConfig = {
  width: 900,
  height: 350,
  margin: { top: 40, right: 40, bottom: 60, left: 60 },
};

interface MutationCluster {
  position: number;
  mutations: Mutation[];
  totalCount: number;
}

export class LollipopPlot {
  private container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private svg!: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private config: LollipopConfig;

  // Scales
  private xScale!: d3.ScaleLinear<number, number>;
  private yScale!: d3.ScaleLinear<number, number>;

  // Data
  private geneData: GeneData | null = null;
  private mutations: Mutation[] = [];
  private clusters: MutationCluster[] = [];

  // State
  private selectedMutationIds: Set<string> = new Set();
  private highlightedMutationIds: Set<string> = new Set();

  // Brush
  private brush!: d3.BrushBehavior<unknown>;
  private brushGroup!: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;

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
    const { width, height } = this.config;

    this.svg = this.container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('font-family', 'system-ui, -apple-system, sans-serif');
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

    this.svg.selectAll('*').remove();

    const { width, height, margin } = this.config;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const g = this.svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Setup scales
    this.xScale = d3.scaleLinear().domain([1, this.geneData.proteinLength]).range([0, plotWidth]);

    // Cluster mutations by position
    this.clusters = this.clusterMutations(this.mutations);

    const maxCount = d3.max(this.clusters, (d) => d.totalCount) || 100;

    this.yScale = d3
      .scaleLinear()
      .domain([0, maxCount * 1.1])
      .range([plotHeight - 60, 0]);

    // Render components
    this.renderTitle();
    this.renderAxes(g, plotWidth, plotHeight);
    this.renderDomains(g, plotHeight);
    this.renderBackbone(g, plotWidth, plotHeight);
    this.renderLollipops(g, plotHeight);
    this.renderBrush(g, plotWidth, plotHeight);
    this.renderLegend(g, plotWidth);
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

  destroy(): void {
    this.container.remove();
    d3.select('.lollipop-tooltip').remove();
  }
}
