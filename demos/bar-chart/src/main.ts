/**
 * Bar Chart Demo - Main Entry Point
 */
import { BarChart } from './components/BarChart';
import { getDataset } from './data/datasets';
import type { SortType } from './types';

// Initialize the chart
const chart = new BarChart('bar-chart');

// Initial data load
const initialDataset = getDataset('mutation-types');
chart.setData(initialDataset.data, initialDataset.groups);

// Event handlers for controls
document.getElementById('dataset-select')?.addEventListener('change', (e) => {
  const datasetId = (e.target as HTMLSelectElement).value;
  const dataset = getDataset(datasetId);
  chart.setData(dataset.data, dataset.groups);

  // Auto-switch to simple for non-grouped data
  const chartTypeSelect = document.getElementById('chart-type') as HTMLSelectElement;
  if (!dataset.groups || dataset.groups.length === 0) {
    chartTypeSelect.value = 'simple';
    chart.setChartType('simple');
  }
});

document.getElementById('chart-type')?.addEventListener('change', (e) => {
  const type = (e.target as HTMLSelectElement).value as 'simple' | 'grouped' | 'stacked';
  chart.setChartType(type);
});

document.getElementById('orientation')?.addEventListener('change', (e) => {
  const orientation = (e.target as HTMLSelectElement).value as 'vertical' | 'horizontal';
  chart.setOrientation(orientation);
});

document.getElementById('sort-by')?.addEventListener('change', (e) => {
  const sortType = (e.target as HTMLSelectElement).value as SortType;
  chart.setSortType(sortType);
});

// Handle window resize
let resizeTimeout: number;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    chart.resize();
  }, 250);
});

console.log('Bar Chart Demo initialized - Port 5187');
