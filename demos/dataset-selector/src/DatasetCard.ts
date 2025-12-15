/**
 * Dataset Card Component
 *
 * Interactive card displaying dataset information
 */

import * as d3 from 'd3';
import type { Dataset } from './types';
import { CATEGORY_CONFIG } from './data';

export class DatasetCard {
  private container: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private dataset: Dataset;
  private onSelect: (dataset: Dataset) => void;

  constructor(parent: HTMLElement, dataset: Dataset, onSelect: (dataset: Dataset) => void) {
    this.dataset = dataset;
    this.onSelect = onSelect;

    this.container = d3
      .select(parent)
      .append('div')
      .attr('class', `dataset-card ${dataset.available ? '' : 'disabled'}`)
      .style('border-left', `4px solid ${dataset.color}`);

    this.render();
    this.setupEvents();
  }

  private render(): void {
    const { dataset } = this;
    const categoryInfo = CATEGORY_CONFIG[dataset.category];

    this.container.html(`
      <div class="card-header">
        <span class="card-badge" style="background: ${categoryInfo.color}">${categoryInfo.label}</span>
        ${!dataset.available ? '<span class="card-badge coming-soon">Coming Soon</span>' : ''}
      </div>
      <h3 class="card-title">${dataset.name}</h3>
      <p class="card-shortname">${dataset.shortName}</p>
      <p class="card-description">${dataset.description}</p>
      <div class="card-stats">
        ${dataset.sampleCount > 0 ? `<span class="stat"><strong>${this.formatNumber(dataset.sampleCount)}</strong> samples</span>` : ''}
        ${dataset.mutationCount ? `<span class="stat"><strong>${this.formatNumber(dataset.mutationCount)}</strong> mutations</span>` : ''}
        ${dataset.geneCount ? `<span class="stat"><strong>${this.formatNumber(dataset.geneCount)}</strong> genes</span>` : ''}
      </div>
      <div class="card-features">
        ${dataset.features.map((f) => `<span class="feature-tag">${f}</span>`).join('')}
      </div>
    `);
  }

  private setupEvents(): void {
    if (!this.dataset.available) return;

    this.container
      .on('click', () => {
        this.onSelect(this.dataset);
      })
      .on('mouseenter', () => {
        this.container.classed('hover', true);
      })
      .on('mouseleave', () => {
        this.container.classed('hover', false);
      });
  }

  setSelected(selected: boolean): void {
    this.container.classed('selected', selected);
  }

  private formatNumber(n: number): string {
    if (n >= 1000000) {
      return (n / 1000000).toFixed(1) + 'M';
    }
    if (n >= 1000) {
      return (n / 1000).toFixed(1) + 'K';
    }
    return n.toString();
  }

  destroy(): void {
    this.container.remove();
  }
}
