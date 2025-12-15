/**
 * App Controller
 *
 * Main application controller for dataset selection and view navigation
 */

import type { Dataset, ViewType, DatasetCategory } from './types';
import { CATEGORY_CONFIG, searchDatasets, getDatasetsByCategory, VIEWS } from './data';
import { DatasetCard } from './DatasetCard';
import { ViewSelector } from './ViewSelector';

export class AppController {
  private datasetCards: DatasetCard[] = [];
  private viewSelector: ViewSelector;
  private selectedDataset: Dataset | null = null;
  private selectedView: ViewType | null = null;
  private currentCategory: DatasetCategory | 'all' = 'all';
  private searchQuery: string = '';

  constructor() {
    // Initialize view selector
    this.viewSelector = new ViewSelector(
      '#view-panel',
      (view) => this.handleViewSelect(view),
      (view, dataset) => this.handleLaunch(view, dataset)
    );

    this.setupFilters();
    this.setupSearch();
    this.setupLaunchButton();
    this.renderDatasets();
  }

  private setupFilters(): void {
    const filterContainer = document.querySelector('.category-filters');
    if (!filterContainer) return;

    // Clear existing
    filterContainer.innerHTML = '';

    // Add "All" filter
    const categories = ['all', 'cancer', 'pediatric', 'germline', 'custom'] as const;

    categories.forEach((cat) => {
      const config = CATEGORY_CONFIG[cat];
      const btn = document.createElement('button');
      btn.className = `filter-btn ${cat === this.currentCategory ? 'active' : ''}`;
      btn.style.setProperty('--filter-color', config.color);
      btn.textContent = config.label;
      btn.addEventListener('click', () => this.handleCategoryFilter(cat));
      filterContainer.appendChild(btn);
    });
  }

  private setupSearch(): void {
    const searchInput = document.querySelector('#dataset-search') as HTMLInputElement;
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value;
      this.renderDatasets();
    });
  }

  private setupLaunchButton(): void {
    const launchBtn = document.querySelector('#launch-btn') as HTMLButtonElement;
    if (!launchBtn) return;

    launchBtn.addEventListener('click', () => {
      if (this.selectedDataset && this.selectedView) {
        this.handleLaunch(this.selectedView, this.selectedDataset);
      }
    });

    this.updateLaunchButton();
  }

  private handleCategoryFilter(category: DatasetCategory | 'all'): void {
    this.currentCategory = category;

    // Update active state
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.classList.remove('active');
    });
    document
      .querySelectorAll('.filter-btn')
      [
        ['all', 'cancer', 'pediatric', 'germline', 'custom'].indexOf(category)
      ]?.classList.add('active');

    this.renderDatasets();
  }

  private renderDatasets(): void {
    const container = document.querySelector('#dataset-grid');
    if (!container) return;

    // Clear existing cards
    this.datasetCards.forEach((card) => card.destroy());
    this.datasetCards = [];
    container.innerHTML = '';

    // Get filtered datasets
    let datasets = getDatasetsByCategory(this.currentCategory);
    if (this.searchQuery) {
      const searchResults = searchDatasets(this.searchQuery);
      datasets = datasets.filter((d) => searchResults.includes(d));
    }

    // Create cards
    datasets.forEach((dataset) => {
      const card = new DatasetCard(container as HTMLElement, dataset, (d) =>
        this.handleDatasetSelect(d)
      );
      this.datasetCards.push(card);
    });

    // Show empty state if no results
    if (datasets.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>No datasets found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      `;
    }
  }

  private handleDatasetSelect(dataset: Dataset): void {
    this.selectedDataset = dataset;

    // Update card selection
    this.datasetCards.forEach((card) => {
      card.setSelected(false);
    });
    // Find and select the right card
    this.datasetCards.forEach((card, i) => {
      const datasets = this.getFilteredDatasets();
      if (datasets[i]?.id === dataset.id) {
        card.setSelected(true);
      }
    });

    // Update view selector
    this.viewSelector.setDataset(dataset);

    // Update status
    this.updateStatus(`Selected: ${dataset.name}`);
    this.updateLaunchButton();
  }

  private getFilteredDatasets(): Dataset[] {
    let datasets = getDatasetsByCategory(this.currentCategory);
    if (this.searchQuery) {
      const searchResults = searchDatasets(this.searchQuery);
      datasets = datasets.filter((d) => searchResults.includes(d));
    }
    return datasets;
  }

  private handleViewSelect(view: ViewType): void {
    this.selectedView = view;
    this.updateLaunchButton();

    const viewConfig = VIEWS.find((v) => v.id === view);
    if (viewConfig) {
      this.updateStatus(`View selected: ${viewConfig.name}`);
    }
  }

  private handleLaunch(view: ViewType, dataset: Dataset): void {
    const viewConfig = VIEWS.find((v) => v.id === view);

    if (viewConfig?.demoUrl) {
      // Open demo in new tab
      window.open(viewConfig.demoUrl, '_blank');
      this.updateStatus(`Launched ${viewConfig.name} demo`);
    } else {
      // Show coming soon message
      this.showLaunchModal(view, dataset);
    }
  }

  private showLaunchModal(view: ViewType, dataset: Dataset): void {
    const viewConfig = VIEWS.find((v) => v.id === view);

    const modal = document.createElement('div');
    modal.className = 'launch-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-icon">${viewConfig?.icon || '🚀'}</div>
        <h2>Launching ${viewConfig?.name}</h2>
        <p>Dataset: <strong>${dataset.name}</strong></p>
        <div class="modal-status">
          <div class="spinner"></div>
          <span>This view is coming soon!</span>
        </div>
        <p class="modal-hint">Demo versions are available for Lollipop Plot, Oncoprint, and Genome Browser.</p>
        <button class="modal-close">Close</button>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('.modal-close')?.addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  private updateLaunchButton(): void {
    const launchBtn = document.querySelector('#launch-btn') as HTMLButtonElement;
    if (!launchBtn) return;

    const canLaunch = this.selectedDataset && this.selectedView;
    launchBtn.disabled = !canLaunch;

    if (canLaunch) {
      const viewConfig = VIEWS.find((v) => v.id === this.selectedView);
      launchBtn.textContent = `Launch ${viewConfig?.name || 'View'}`;
    } else if (this.selectedDataset) {
      launchBtn.textContent = 'Select a View';
    } else {
      launchBtn.textContent = 'Select Dataset & View';
    }
  }

  private updateStatus(message: string): void {
    const status = document.querySelector('#status-message');
    if (status) {
      status.textContent = message;
    }
  }
}
