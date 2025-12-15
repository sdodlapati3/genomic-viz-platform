/**
 * Lollipop Track Component
 *
 * Renders mutations as lollipop markers with stems and heads
 */

import * as d3 from 'd3';
import type { Mutation, MutationStack, FusionBreakpoint } from '../types';
import {
  CONSEQUENCE_COLORS,
  CONSEQUENCE_LABELS,
  stackMutations,
  formatMutation,
  getMutationColor,
} from '../types/mutation';
import { ProteinScale, createCountScale, createRadiusScale } from '../scales/proteinScale';

export interface LollipopTrackConfig {
  /** Container element */
  container: SVGGElement;
  /** Protein scale */
  scale: ProteinScale;
  /** Mutation data */
  mutations: Mutation[];
  /** Fusion breakpoints */
  fusions?: FusionBreakpoint[];
  /** Maximum height for lollipops */
  maxHeight?: number;
  /** Minimum height for lollipops */
  minHeight?: number;
  /** Maximum marker radius */
  maxRadius?: number;
  /** Minimum marker radius */
  minRadius?: number;
  /** Show germline indicators */
  showOriginIndicator?: boolean;
  /** Click handler */
  onMutationClick?: (mutation: Mutation) => void;
  /** Hover handler */
  onMutationHover?: (mutation: Mutation | null) => void;
  /** Brush selection handler */
  onBrushSelect?: (range: [number, number] | null) => void;
}

export class LollipopTrack {
  private container: d3.Selection<SVGGElement, unknown, null, undefined>;
  private scale: ProteinScale;
  private mutations: Mutation[];
  private fusions: FusionBreakpoint[];
  private stacks: MutationStack[];
  private maxHeight: number;
  private minHeight: number;
  private maxRadius: number;
  private minRadius: number;
  private showOriginIndicator: boolean;
  private onMutationClick?: (mutation: Mutation) => void;
  private onMutationHover?: (mutation: Mutation | null) => void;
  private onBrushSelect?: (range: [number, number] | null) => void;

  private trackGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null = null;
  private heightScale!: d3.ScaleLinear<number, number>;
  private radiusScale!: d3.ScaleSqrt<number, number>;

  constructor(config: LollipopTrackConfig) {
    this.container = d3.select(config.container);
    this.scale = config.scale;
    this.mutations = config.mutations;
    this.fusions = config.fusions || [];
    this.stacks = stackMutations(this.mutations);
    this.maxHeight = config.maxHeight || 100;
    this.minHeight = config.minHeight || 30;
    this.maxRadius = config.maxRadius || 12;
    this.minRadius = config.minRadius || 4;
    this.showOriginIndicator = config.showOriginIndicator !== false;
    this.onMutationClick = config.onMutationClick;
    this.onMutationHover = config.onMutationHover;
    this.onBrushSelect = config.onBrushSelect;

    this.setupScales();
    this.createTooltip();
    this.render();
  }

  private setupScales(): void {
    const maxCount = Math.max(...this.stacks.map((s) => s.totalCount), 1);
    this.heightScale = createCountScale(maxCount, this.maxHeight, this.minHeight);
    this.radiusScale = createRadiusScale(maxCount, this.maxRadius, this.minRadius);
  }

  private createTooltip(): void {
    d3.select('body').selectAll('.lollipop-tooltip').remove();

    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'lollipop-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('padding', '10px')
      .style('font-size', '12px')
      .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
      .style('pointer-events', 'none')
      .style('z-index', '1000')
      .style('max-width', '300px');
  }

  render(): void {
    this.container.selectAll('*').remove();

    this.trackGroup = this.container.append('g').attr('class', 'lollipop-track');

    // Render lollipops for mutation stacks
    this.renderLollipops();

    // Render fusion breakpoints
    if (this.fusions.length > 0) {
      this.renderFusions();
    }
  }

  private renderLollipops(): void {
    const lollipopGroups = this.trackGroup!.selectAll('.lollipop')
      .data(this.stacks)
      .enter()
      .append('g')
      .attr('class', 'lollipop')
      .attr('transform', (d) => `translate(${this.scale.toPixel(d.position)}, 0)`)
      .style('cursor', 'pointer');

    // Stems
    lollipopGroups
      .append('line')
      .attr('class', 'lollipop-stem')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', (d) => -this.heightScale(d.totalCount))
      .attr('stroke', (d) => getMutationColor(d.mutations[0].consequence))
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.7);

    // Heads (circles for main mutation)
    lollipopGroups
      .append('circle')
      .attr('class', 'lollipop-head')
      .attr('cx', 0)
      .attr('cy', (d) => -this.heightScale(d.totalCount))
      .attr('r', (d) => this.radiusScale(d.totalCount))
      .attr('fill', (d) => getMutationColor(d.mutations[0].consequence))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .on('mouseenter', (event, d) => this.handleMouseEnter(event, d))
      .on('mousemove', (event) => this.handleMouseMove(event))
      .on('mouseleave', () => this.handleMouseLeave())
      .on('click', (_, d) => this.handleClick(d));

    // Germline/somatic indicators
    if (this.showOriginIndicator) {
      this.renderOriginIndicators(lollipopGroups);
    }

    // Count labels for high-count mutations
    lollipopGroups
      .filter((d) => d.totalCount >= 10)
      .append('text')
      .attr('class', 'count-label')
      .attr('x', 0)
      .attr('y', (d) => -this.heightScale(d.totalCount) + 4)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#fff')
      .attr('font-weight', 'bold')
      .style('pointer-events', 'none')
      .text((d) => d.totalCount);
  }

  private renderOriginIndicators(
    groups: d3.Selection<SVGGElement, MutationStack, SVGGElement, unknown>
  ): void {
    // Germline indicator (arc on top)
    groups
      .filter((d) => d.hasGermline)
      .append('path')
      .attr('class', 'germline-indicator')
      .attr('d', (d) => {
        const y = -this.heightScale(d.totalCount);
        const r = this.radiusScale(d.totalCount) + 3;
        return `M ${-r} ${y} A ${r} ${r} 0 0 1 ${r} ${y}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#27AE60')
      .attr('stroke-width', 2.5);

    // Somatic indicator (arc on bottom) - only if mixed
    groups
      .filter((d) => d.hasGermline && d.hasSomatic)
      .append('path')
      .attr('class', 'somatic-indicator')
      .attr('d', (d) => {
        const y = -this.heightScale(d.totalCount);
        const r = this.radiusScale(d.totalCount) + 3;
        return `M ${-r} ${y} A ${r} ${r} 0 0 0 ${r} ${y}`;
      })
      .attr('fill', 'none')
      .attr('stroke', '#E74C3C')
      .attr('stroke-width', 2.5);
  }

  private renderFusions(): void {
    const fusionGroup = this.trackGroup!.append('g').attr('class', 'fusions');

    const fusionMarkers = fusionGroup
      .selectAll('.fusion')
      .data(this.fusions)
      .enter()
      .append('g')
      .attr('class', 'fusion')
      .attr('transform', (d) => `translate(${this.scale.toPixel(d.position)}, 0)`)
      .style('cursor', 'pointer');

    // Half-disc shape for fusion
    fusionMarkers
      .append('path')
      .attr('class', 'fusion-glyph')
      .attr('d', (d) => {
        const r = 10;
        const y = -this.minHeight - 20;
        // Half-disc: left half for 5', right half for 3'
        if (d.orientation === '5prime') {
          return `M 0 ${y - r} A ${r} ${r} 0 0 0 0 ${y + r} Z`;
        } else {
          return `M 0 ${y - r} A ${r} ${r} 0 0 1 0 ${y + r} Z`;
        }
      })
      .attr('fill', (d) => (d.inFrame ? '#9B59B6' : '#7F8C8D'))
      .attr('stroke', '#333')
      .attr('stroke-width', 1);

    // Fusion stem
    fusionMarkers
      .append('line')
      .attr('class', 'fusion-stem')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', -this.minHeight - 10)
      .attr('stroke', '#666')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3,2');

    // Partner gene label
    fusionMarkers
      .append('text')
      .attr('class', 'fusion-label')
      .attr('x', 5)
      .attr('y', -this.minHeight - 25)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text((d) => `→${d.partnerGene}`);
  }

  private handleMouseEnter(event: MouseEvent, stack: MutationStack): void {
    // Highlight
    d3.select(event.target as Element)
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    // Show tooltip
    this.showTooltip(stack);

    // Callback with first mutation
    this.onMutationHover?.(stack.mutations[0]);
  }

  private handleMouseMove(event: MouseEvent): void {
    this.tooltip?.style('left', event.pageX + 15 + 'px').style('top', event.pageY - 10 + 'px');
  }

  private handleMouseLeave(): void {
    this.trackGroup?.selectAll('.lollipop-head').attr('stroke', '#fff').attr('stroke-width', 1.5);

    this.tooltip?.style('visibility', 'hidden');
    this.onMutationHover?.(null);
  }

  private handleClick(stack: MutationStack): void {
    this.onMutationClick?.(stack.mutations[0]);
  }

  private showTooltip(stack: MutationStack): void {
    const mutation = stack.mutations[0];

    let content = `
      <div style="margin-bottom: 8px;">
        <strong style="font-size: 14px;">${formatMutation(mutation)}</strong>
      </div>
      <div style="color: #666; line-height: 1.5;">
        <div>Position: ${stack.position}</div>
        <div>Type: 
          <span style="color: ${getMutationColor(mutation.consequence)}; font-weight: 500;">
            ${CONSEQUENCE_LABELS[mutation.consequence]}
          </span>
        </div>
        <div>Samples: <strong>${stack.totalCount}</strong></div>
    `;

    if (stack.hasGermline && stack.hasSomatic) {
      content += `<div>Origin: <span style="color: #27AE60;">Germline</span> + <span style="color: #E74C3C;">Somatic</span></div>`;
    } else if (stack.hasGermline) {
      content += `<div>Origin: <span style="color: #27AE60;">Germline</span></div>`;
    } else {
      content += `<div>Origin: <span style="color: #E74C3C;">Somatic</span></div>`;
    }

    if (mutation.clinicalSignificance) {
      content += `<div>Clinical: ${mutation.clinicalSignificance}</div>`;
    }

    if (mutation.cosmicId) {
      content += `<div>COSMIC: ${mutation.cosmicId}</div>`;
    }

    // Show additional mutations at same position
    if (stack.mutations.length > 1) {
      content += `<hr style="margin: 8px 0; border: none; border-top: 1px solid #eee;"/>`;
      content += `<div style="font-style: italic;">${stack.mutations.length} mutations at this position</div>`;
    }

    content += `</div>`;

    this.tooltip?.html(content).style('visibility', 'visible');
  }

  /**
   * Update mutations
   */
  update(mutations: Mutation[]): void {
    this.mutations = mutations;
    this.stacks = stackMutations(mutations);
    this.setupScales();
    this.render();
  }

  /**
   * Update scale (for zooming)
   */
  updateScale(scale: ProteinScale): void {
    this.scale = scale;
    this.render();
  }

  /**
   * Highlight specific mutation
   */
  highlightMutation(mutationId: string): void {
    this.trackGroup?.selectAll('.lollipop-head').attr('opacity', (d: any) => {
      return d.mutations.some((m: Mutation) => m.id === mutationId) ? 1 : 0.3;
    });
  }

  /**
   * Clear highlights
   */
  clearHighlights(): void {
    this.trackGroup?.selectAll('.lollipop-head').attr('opacity', 1);
  }

  /**
   * Filter by consequence types
   */
  filterByConsequence(types: string[]): void {
    const filtered = this.mutations.filter(
      (m) => types.length === 0 || types.includes(m.consequence)
    );
    this.stacks = stackMutations(filtered);
    this.render();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.tooltip?.remove();
    this.container.selectAll('*').remove();
  }
}
