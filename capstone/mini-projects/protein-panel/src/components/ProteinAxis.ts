/**
 * Protein Axis Component
 *
 * Renders the amino acid position axis with ticks and labels
 */

import * as d3 from 'd3';
import type { Protein } from '../types';
import { ProteinScale } from '../scales/proteinScale';

export interface ProteinAxisConfig {
  /** Container element or selector */
  container: SVGGElement;
  /** Protein scale */
  scale: ProteinScale;
  /** Protein data */
  protein: Protein;
  /** Height for axis area */
  height?: number;
  /** Show protein name label */
  showLabel?: boolean;
  /** Tick format function */
  tickFormat?: (d: number) => string;
}

export class ProteinAxis {
  private container: d3.Selection<SVGGElement, unknown, null, undefined>;
  private scale: ProteinScale;
  private protein: Protein;
  private height: number;
  private showLabel: boolean;
  private tickFormat: (d: number) => string;

  private axisGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private labelGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;

  constructor(config: ProteinAxisConfig) {
    this.container = d3.select(config.container);
    this.scale = config.scale;
    this.protein = config.protein;
    this.height = config.height || 30;
    this.showLabel = config.showLabel !== false;
    this.tickFormat = config.tickFormat || ((d: number) => `${d}`);

    this.render();
  }

  render(): void {
    this.container.selectAll('*').remove();

    // Axis group
    this.axisGroup = this.container.append('g').attr('class', 'protein-axis');

    const axis = d3
      .axisBottom(this.scale.getD3Scale())
      .ticks(10)
      .tickFormat((d) => this.tickFormat(d as number))
      .tickSize(6)
      .tickPadding(3);

    this.axisGroup.call(axis);

    // Style the axis
    this.axisGroup.select('.domain').attr('stroke', '#666').attr('stroke-width', 1.5);

    this.axisGroup.selectAll('.tick line').attr('stroke', '#999');

    this.axisGroup.selectAll('.tick text').attr('font-size', '11px').attr('fill', '#333');

    // Add protein length label at the end
    const [, rangeEnd] = this.scale.getRange();
    this.axisGroup
      .append('text')
      .attr('class', 'protein-length-label')
      .attr('x', rangeEnd + 5)
      .attr('y', 4)
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text(`${this.protein.length} aa`);

    // Protein name label
    if (this.showLabel) {
      this.labelGroup = this.container
        .append('g')
        .attr('class', 'protein-label')
        .attr('transform', `translate(0, -15)`);

      this.labelGroup
        .append('text')
        .attr('class', 'protein-symbol')
        .attr('x', this.scale.getRange()[0])
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text(this.protein.symbol);

      this.labelGroup
        .append('text')
        .attr('class', 'protein-name')
        .attr('x', this.scale.getRange()[0] + this.protein.symbol.length * 10 + 10)
        .attr('font-size', '12px')
        .attr('fill', '#666')
        .text(`- ${this.protein.name}`);
    }
  }

  /**
   * Update the axis with new scale
   */
  update(scale: ProteinScale): void {
    this.scale = scale;
    this.render();
  }

  /**
   * Highlight a position on the axis
   */
  highlight(position: number): void {
    // Remove existing highlight
    this.axisGroup?.selectAll('.position-highlight').remove();

    const x = this.scale.toPixel(position);

    this.axisGroup
      ?.append('line')
      .attr('class', 'position-highlight')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', -10)
      .attr('y2', 6)
      .attr('stroke', '#E74C3C')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '3,2');

    this.axisGroup
      ?.append('text')
      .attr('class', 'position-highlight')
      .attr('x', x)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#E74C3C')
      .text(position);
  }

  /**
   * Clear position highlight
   */
  clearHighlight(): void {
    this.axisGroup?.selectAll('.position-highlight').remove();
  }
}
