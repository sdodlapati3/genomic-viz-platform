/**
 * Legend Component
 *
 * Renders the mutation type legend for the oncoprint
 */

import * as d3 from 'd3';
import type { ConsequenceType } from './types';
import { MUTATION_COLORS, MUTATION_LABELS } from './types';

export interface LegendConfig {
  orientation: 'horizontal' | 'vertical';
  showCounts: boolean;
}

const DEFAULT_CONFIG: LegendConfig = {
  orientation: 'horizontal',
  showCounts: true,
};

export class Legend {
  private container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private config: LegendConfig;
  private counts: Map<ConsequenceType, number> = new Map();

  constructor(selector: string, config: Partial<LegendConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    const parent = d3.select(selector);
    parent.selectAll('*').remove();

    this.container = parent
      .append('div')
      .attr('class', 'oncoprint-legend')
      .style('display', 'flex')
      .style('flex-wrap', 'wrap')
      .style('gap', '16px')
      .style('padding', '12px')
      .style('background', '#f9f9f9')
      .style('border-radius', '8px')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .style('font-size', '13px');
  }

  /**
   * Set mutation counts for legend
   */
  setCounts(counts: Map<ConsequenceType, number>): void {
    this.counts = counts;
    this.render();
  }

  /**
   * Render the legend
   */
  render(): void {
    this.container.selectAll('*').remove();

    const types: ConsequenceType[] = [
      'missense',
      'nonsense',
      'frameshift',
      'splice',
      'inframe_indel',
      'silent',
      'other',
    ];

    for (const type of types) {
      const count = this.counts.get(type) || 0;
      if (count === 0 && !this.config.showCounts) continue;

      const item = this.container
        .append('div')
        .attr('class', 'legend-item')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '6px');

      item
        .append('div')
        .style('width', '16px')
        .style('height', '12px')
        .style('background', MUTATION_COLORS[type])
        .style('border-radius', '2px');

      let label = MUTATION_LABELS[type];
      if (this.config.showCounts && count > 0) {
        label += ` (${count})`;
      }

      item.append('span').style('color', '#333').text(label);
    }

    // Multi-mutation indicator
    this.container
      .append('div')
      .attr('class', 'legend-item')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '6px').html(`
        <div style="width: 16px; height: 12px; background: #ccc; position: relative; border-radius: 2px;">
          <div style="position: absolute; top: 0; right: 0; width: 0; height: 0; 
                      border-left: 5px solid transparent; border-top: 5px solid #333;"></div>
        </div>
        <span style="color: #666;">Multiple mutations</span>
      `);
  }
}
