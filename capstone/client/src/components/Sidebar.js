/**
 * Sidebar Component
 * 
 * Handles dataset selection and filtering
 */

export class Sidebar {
  constructor(options = {}) {
    this.onDatasetSelect = options.onDatasetSelect || (() => {});
    this.onFilterChange = options.onFilterChange || (() => {});
    this.datasets = [];
    this.filters = {
      cancerType: '',
      variantTypes: ['missense', 'nonsense', 'frameshift', 'splice']
    };
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Dataset selection
    document.getElementById('datasetList')?.addEventListener('click', (e) => {
      const item = e.target.closest('.dataset-item');
      if (item) {
        this.selectDataset(item);
      }
    });

    // Cancer type filter
    document.getElementById('cancerTypeFilter')?.addEventListener('change', (e) => {
      this.filters.cancerType = e.target.value;
      this.notifyFilterChange();
    });

    // Variant type checkboxes
    document.querySelectorAll('.checkbox-group input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateVariantTypeFilters();
        this.notifyFilterChange();
      });
    });
  }

  selectDataset(item) {
    // Update UI
    document.querySelectorAll('.dataset-item').forEach(d => d.classList.remove('active'));
    item.classList.add('active');

    // Get dataset info
    const name = item.querySelector('.dataset-name').textContent;
    const count = item.querySelector('.dataset-count').textContent;

    this.onDatasetSelect({ name, count });
  }

  updateVariantTypeFilters() {
    this.filters.variantTypes = Array.from(
      document.querySelectorAll('.checkbox-group input[type="checkbox"]:checked')
    ).map(cb => cb.value);
  }

  notifyFilterChange() {
    this.onFilterChange({ ...this.filters });
  }

  refreshDatasets() {
    // Re-fetch and update dataset list
    // This would typically call the API
    console.log('Refreshing datasets...');
  }

  setDatasets(datasets) {
    this.datasets = datasets;
    this.renderDatasetList();
  }

  renderDatasetList() {
    const list = document.getElementById('datasetList');
    if (!list) return;

    list.innerHTML = this.datasets.map((dataset, index) => `
      <li class="dataset-item ${index === 0 ? 'active' : ''}">
        <span class="dataset-name">${dataset.name}</span>
        <span class="dataset-count">${dataset.count} variants</span>
      </li>
    `).join('');
  }
}
