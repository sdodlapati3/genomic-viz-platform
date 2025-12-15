/**
 * Domain Track Component
 *
 * Renders protein functional domains as colored rectangles
 */

import * as d3 from 'd3';
import type { ProteinDomain } from '../types';
import { ProteinScale } from '../scales/proteinScale';

export interface DomainTrackConfig {
  /** Container element */
  container: SVGGElement;
  /** Protein scale */
  scale: ProteinScale;
  /** Domain data */
  domains: ProteinDomain[];
  /** Track height */
  height?: number;
  /** Show domain labels */
  showLabels?: boolean;
  /** Label position */
  labelPosition?: 'inside' | 'above' | 'below';
  /** Click handler */
  onDomainClick?: (domain: ProteinDomain) => void;
  /** Hover handler */
  onDomainHover?: (domain: ProteinDomain | null) => void;
}

export class DomainTrack {
  private container: d3.Selection<SVGGElement, unknown, null, undefined>;
  private scale: ProteinScale;
  private domains: ProteinDomain[];
  private height: number;
  private showLabels: boolean;
  private labelPosition: 'inside' | 'above' | 'below';
  private onDomainClick?: (domain: ProteinDomain) => void;
  private onDomainHover?: (domain: ProteinDomain | null) => void;

  private trackGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private tooltip: d3.Selection<HTMLDivElement, unknown, null, undefined> | null = null;

  constructor(config: DomainTrackConfig) {
    this.container = d3.select(config.container);
    this.scale = config.scale;
    this.domains = config.domains;
    this.height = config.height || 30;
    this.showLabels = config.showLabels !== false;
    this.labelPosition = config.labelPosition || 'inside';
    this.onDomainClick = config.onDomainClick;
    this.onDomainHover = config.onDomainHover;

    this.createTooltip();
    this.render();
  }

  private createTooltip(): void {
    // Remove any existing tooltip
    d3.select('body').selectAll('.domain-tooltip').remove();

    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'domain-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'white')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('padding', '8px 12px')
      .style('font-size', '12px')
      .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
      .style('pointer-events', 'none')
      .style('z-index', '1000');
  }

  render(): void {
    this.container.selectAll('*').remove();

    // Background track (protein backbone)
    const [rangeStart, rangeEnd] = this.scale.getRange();

    this.trackGroup = this.container.append('g').attr('class', 'domain-track');

    // Protein backbone line
    this.trackGroup
      .append('rect')
      .attr('class', 'protein-backbone')
      .attr('x', rangeStart)
      .attr('y', this.height / 2 - 3)
      .attr('width', rangeEnd - rangeStart)
      .attr('height', 6)
      .attr('fill', '#E8E8E8')
      .attr('rx', 2);

    // Render domains
    const domainGroups = this.trackGroup
      .selectAll('.domain')
      .data(this.domains)
      .enter()
      .append('g')
      .attr('class', 'domain')
      .style('cursor', 'pointer');

    // Domain rectangles
    domainGroups
      .append('rect')
      .attr('class', 'domain-rect')
      .attr('x', (d) => this.scale.toPixel(d.start))
      .attr('y', 0)
      .attr('width', (d) => this.scale.rangeWidth(d.start, d.end))
      .attr('height', this.height)
      .attr('fill', (d) => d.color)
      .attr('rx', 3)
      .attr('ry', 3)
      .style('opacity', 0.9)
      .on('mouseenter', (event, d) => this.handleMouseEnter(event, d))
      .on('mousemove', (event) => this.handleMouseMove(event))
      .on('mouseleave', () => this.handleMouseLeave())
      .on('click', (_, d) => this.handleClick(d));

    // Domain labels
    if (this.showLabels) {
      this.renderLabels(domainGroups);
    }
  }

  private renderLabels(
    domainGroups: d3.Selection<SVGGElement, ProteinDomain, SVGGElement, unknown>
  ): void {
    const minWidthForLabel = 40;

    domainGroups.each((d, i, nodes) => {
      const width = this.scale.rangeWidth(d.start, d.end);
      const group = d3.select(nodes[i]);

      if (width < minWidthForLabel) return;

      const labelText = d.shortName || d.name;
      const x = this.scale.toPixel(d.start) + width / 2;

      let y: number;
      let textAnchor = 'middle';

      switch (this.labelPosition) {
        case 'above':
          y = -5;
          break;
        case 'below':
          y = this.height + 12;
          break;
        case 'inside':
        default:
          y = this.height / 2 + 4;
          break;
      }

      group
        .append('text')
        .attr('class', 'domain-label')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', textAnchor)
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .attr('fill', this.labelPosition === 'inside' ? '#fff' : '#333')
        .style('pointer-events', 'none')
        .text(labelText.length > 10 ? labelText.substring(0, 10) + '…' : labelText);
    });
  }

  private handleMouseEnter(event: MouseEvent, domain: ProteinDomain): void {
    // Highlight domain
    d3.select(event.target as Element)
      .style('opacity', 1)
      .attr('stroke', '#333')
      .attr('stroke-width', 2);

    // Show tooltip
    this.showTooltip(domain);

    // Callback
    this.onDomainHover?.(domain);
  }

  private handleMouseMove(event: MouseEvent): void {
    this.tooltip?.style('left', event.pageX + 10 + 'px').style('top', event.pageY - 10 + 'px');
  }

  private handleMouseLeave(): void {
    // Reset domain style
    this.trackGroup?.selectAll('.domain-rect').style('opacity', 0.9).attr('stroke', 'none');

    // Hide tooltip
    this.tooltip?.style('visibility', 'hidden');

    // Callback
    this.onDomainHover?.(null);
  }

  private handleClick(domain: ProteinDomain): void {
    this.onDomainClick?.(domain);
  }

  private showTooltip(domain: ProteinDomain): void {
    const content = `
      <strong>${domain.name}</strong><br/>
      <span style="color: #666;">
        Position: ${domain.start} - ${domain.end}<br/>
        Length: ${domain.end - domain.start + 1} aa
        ${domain.description ? `<br/><em>${domain.description}</em>` : ''}
        ${domain.externalId ? `<br/>ID: ${domain.externalId}` : ''}
      </span>
    `;

    this.tooltip
      ?.html(content)
      .style('visibility', 'visible')
      .style('border-left', `3px solid ${domain.color}`);
  }

  /**
   * Update domains
   */
  update(domains: ProteinDomain[]): void {
    this.domains = domains;
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
   * Highlight specific domain
   */
  highlightDomain(domainId: string): void {
    this.trackGroup
      ?.selectAll('.domain-rect')
      .style('opacity', (d: any) => (d.id === domainId ? 1 : 0.4));
  }

  /**
   * Clear all highlights
   */
  clearHighlights(): void {
    this.trackGroup?.selectAll('.domain-rect').style('opacity', 0.9);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.tooltip?.remove();
    this.container.selectAll('*').remove();
  }
}
