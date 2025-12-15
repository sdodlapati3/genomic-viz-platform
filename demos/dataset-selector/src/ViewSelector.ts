/**
 * View Selector Component
 *
 * Panel showing available visualization views for a selected dataset
 */

import * as d3 from 'd3';
import type { ViewConfig, ViewType, Dataset } from './types';
import { getViewsForDataset } from './data';

export class ViewSelector {
  private container: d3.Selection<HTMLDivElement, unknown, null, undefined>;
  private selectedDataset: Dataset | null = null;
  private selectedView: ViewType | null = null;
  private onViewSelect: (view: ViewType) => void;
  private onLaunch: (view: ViewType, dataset: Dataset) => void;

  constructor(
    selector: string,
    onViewSelect: (view: ViewType) => void,
    onLaunch: (view: ViewType, dataset: Dataset) => void
  ) {
    this.onViewSelect = onViewSelect;
    this.onLaunch = onLaunch;

    const element = document.querySelector(selector);
    if (!element) {
      throw new Error(`Element not found: ${selector}`);
    }

    this.container = d3.select(element as HTMLDivElement);
    this.render();
  }

  setDataset(dataset: Dataset | null): void {
    this.selectedDataset = dataset;
    this.selectedView = null;
    this.render();
  }

  private render(): void {
    this.container.html('');

    if (!this.selectedDataset) {
      this.renderPlaceholder();
      return;
    }

    const availableViews = getViewsForDataset(this.selectedDataset.id);
    this.renderViewList(availableViews);
  }

  private renderPlaceholder(): void {
    this.container.html(`
      <div class="view-placeholder">
        <div class="placeholder-icon">👆</div>
        <h3>Select a Dataset</h3>
        <p>Choose a dataset from the left panel to see available visualizations</p>
      </div>
    `);
  }

  private renderViewList(views: ViewConfig[]): void {
    const dataset = this.selectedDataset!;

    this.container.html(`
      <div class="view-header">
        <h2>Visualizations for ${dataset.shortName}</h2>
        <p>Select a view to explore the data</p>
      </div>
      <div class="view-grid"></div>
    `);

    const grid = this.container.select('.view-grid');

    views.forEach((view) => {
      const card = grid.append('div').attr('class', 'view-card').attr('data-view-id', view.id);

      card.html(`
        <div class="view-icon">${view.icon}</div>
        <h3 class="view-name">${view.name}</h3>
        <p class="view-description">${view.description}</p>
        ${view.demoUrl ? '<span class="demo-badge">Demo Available</span>' : ''}
      `);

      card.on('click', () => this.handleViewClick(view));
      card.on('dblclick', () => this.handleLaunch(view));
    });
  }

  private handleViewClick(view: ViewConfig): void {
    this.selectedView = view.id;
    this.onViewSelect(view.id);

    // Update selection state
    this.container.selectAll('.view-card').classed('selected', false);

    this.container.select(`[data-view-id="${view.id}"]`).classed('selected', true);
  }

  private handleLaunch(view: ViewConfig): void {
    if (this.selectedDataset) {
      this.onLaunch(view.id, this.selectedDataset);
    }
  }

  getSelectedView(): ViewType | null {
    return this.selectedView;
  }
}
