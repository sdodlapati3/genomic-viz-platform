/**
 * MutationTrack - Renders mutations as lollipops or bars
 */

import * as d3 from 'd3';
import { Track, TrackRenderContext } from './Track';
import type { TrackConfig, MutationFeature, MutationTrackData, ConsequenceType } from './types';

export interface MutationTrackConfig extends TrackConfig {
  type: 'mutation';
  minRadius: number;
  maxRadius: number;
  showLabels: boolean;
}

const MUTATION_COLORS: Record<ConsequenceType, string> = {
  missense: '#E64A19',
  nonsense: '#D32F2F',
  frameshift: '#7B1FA2',
  splice: '#1976D2',
  inframe_indel: '#388E3C',
  synonymous: '#757575',
  intron: '#9E9E9E',
  utr: '#78909C',
  other: '#607D8B',
};

export class MutationTrack extends Track<MutationTrackData, MutationTrackConfig> {
  private radiusScale!: d3.ScaleLinear<number, number>;

  constructor(config: Partial<MutationTrackConfig> & { id: string; name: string }) {
    super({
      type: 'mutation',
      height: 100,
      visible: true,
      collapsed: false,
      minRadius: 4,
      maxRadius: 15,
      showLabels: true,
      ...config,
    });
  }

  protected renderContent(context: TrackRenderContext): void {
    if (!this.data?.mutations.length) {
      this.renderEmpty(context);
      return;
    }

    const { svg, xScale, height } = context;
    const { minRadius, maxRadius } = this.config;

    // Create radius scale based on sample count
    const maxCount = d3.max(this.data.mutations, (m) => m.sampleCount) || 1;
    this.radiusScale = d3.scaleLinear().domain([1, maxCount]).range([minRadius, maxRadius]);

    // Group mutations that are too close together
    const groupedMutations = this.groupOverlappingMutations(this.data.mutations, xScale);

    // Baseline
    const baselineY = height - 20;
    svg
      .append('line')
      .attr('class', 'baseline')
      .attr('x1', 0)
      .attr('x2', xScale.range()[1])
      .attr('y1', baselineY)
      .attr('y2', baselineY)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1);

    // Render each mutation or group
    groupedMutations.forEach((group) => {
      if (group.length === 1) {
        this.renderMutation(svg, group[0], xScale, baselineY);
      } else {
        this.renderMutationGroup(svg, group, xScale, baselineY);
      }
    });
  }

  private groupOverlappingMutations(
    mutations: MutationFeature[],
    xScale: d3.ScaleLinear<number, number>
  ): MutationFeature[][] {
    const groups: MutationFeature[][] = [];
    const minGap = 20; // Minimum pixels between mutation centers

    const sorted = [...mutations].sort((a, b) => a.position - b.position);

    for (const mutation of sorted) {
      const x = xScale(mutation.position);

      // Check if this mutation overlaps with the last group
      if (groups.length > 0) {
        const lastGroup = groups[groups.length - 1];
        const lastX = xScale(lastGroup[lastGroup.length - 1].position);

        if (x - lastX < minGap) {
          lastGroup.push(mutation);
          continue;
        }
      }

      groups.push([mutation]);
    }

    return groups;
  }

  private renderMutation(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    mutation: MutationFeature,
    xScale: d3.ScaleLinear<number, number>,
    baselineY: number
  ): void {
    const x = xScale(mutation.position);
    const radius = this.radiusScale(mutation.sampleCount);
    const stemHeight = 30 + Math.random() * 30; // Vary stem heights
    const circleY = baselineY - stemHeight - radius;

    const group = svg.append('g').attr('class', 'mutation').attr('data-mutation-id', mutation.id);

    // Stem
    group
      .append('line')
      .attr('class', 'mutation-stem')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', baselineY)
      .attr('y2', circleY + radius)
      .attr('stroke', MUTATION_COLORS[mutation.consequence])
      .attr('stroke-width', 1.5);

    // Circle
    const circle = group
      .append('circle')
      .attr('class', 'mutation-head')
      .attr('cx', x)
      .attr('cy', circleY)
      .attr('r', radius)
      .attr('fill', MUTATION_COLORS[mutation.consequence])
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer');

    // Label for significant mutations
    if (mutation.sampleCount > 10 && mutation.aaChange) {
      group
        .append('text')
        .attr('class', 'mutation-label')
        .attr('x', x)
        .attr('y', circleY - radius - 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#333')
        .text(mutation.aaChange);
    }

    // Hover handlers
    circle.on('mouseover', (event) => {
      circle.attr('stroke', '#333').attr('stroke-width', 2);
      d3.select(circle.node()?.parentNode as SVGGElement)
        .raise()
        .select('.mutation-stem')
        .attr('stroke-width', 3);
      this.onFeatureHover?.(mutation, event as unknown as MouseEvent);
    });

    circle.on('mouseout', () => {
      circle.attr('stroke', '#fff').attr('stroke-width', 1);
      d3.select(circle.node()?.parentNode as SVGGElement)
        .select('.mutation-stem')
        .attr('stroke-width', 1.5);
    });

    circle.on('click', (event) => {
      this.onFeatureClick?.(mutation, event as unknown as MouseEvent);
    });
  }

  private renderMutationGroup(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    mutations: MutationFeature[],
    xScale: d3.ScaleLinear<number, number>,
    baselineY: number
  ): void {
    // For grouped mutations, render as stacked or fanned out
    const centerX = d3.mean(mutations, (m) => xScale(m.position)) || 0;
    const totalCount = d3.sum(mutations, (m) => m.sampleCount);
    const radius = this.radiusScale(totalCount);
    const stemHeight = 50;
    const circleY = baselineY - stemHeight - radius;

    const group = svg.append('g').attr('class', 'mutation-group');

    // Single stem
    group
      .append('line')
      .attr('class', 'mutation-stem')
      .attr('x1', centerX)
      .attr('x2', centerX)
      .attr('y1', baselineY)
      .attr('y2', circleY + radius)
      .attr('stroke', '#666')
      .attr('stroke-width', 2);

    // Pie chart for mutation types
    const pieData = d3.pie<MutationFeature>().value((d) => d.sampleCount)(mutations);

    const arc = d3.arc<d3.PieArcDatum<MutationFeature>>().innerRadius(0).outerRadius(radius);

    const pieGroup = group.append('g').attr('transform', `translate(${centerX}, ${circleY})`);

    pieGroup
      .selectAll('path')
      .data(pieData)
      .join('path')
      .attr('d', arc)
      .attr('fill', (d) => MUTATION_COLORS[d.data.consequence])
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        this.onFeatureHover?.(d.data, event as unknown as MouseEvent);
      })
      .on('click', (event, d) => {
        this.onFeatureClick?.(d.data, event as unknown as MouseEvent);
      });

    // Count label
    group
      .append('text')
      .attr('x', centerX)
      .attr('y', circleY)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text(mutations.length);
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
      .text('No mutations in this region');
  }

  getTooltipContent(feature: unknown): string {
    const mutation = feature as MutationFeature;

    return `
      <strong>${mutation.gene || 'Unknown Gene'}</strong><br>
      ${mutation.aaChange || `${mutation.ref}>${mutation.alt}`}<br>
      <br>
      <strong>Position:</strong> ${mutation.chromosome}:${mutation.position.toLocaleString()}<br>
      <strong>Type:</strong> ${mutation.consequence.replace('_', ' ')}<br>
      <strong>Samples:</strong> ${mutation.sampleCount}<br>
      ${mutation.vaf ? `<strong>VAF:</strong> ${(mutation.vaf * 100).toFixed(1)}%` : ''}
    `;
  }
}
