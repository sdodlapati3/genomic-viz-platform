/**
 * Box Plot Demo - Main Entry Point
 */
import { BoxPlot } from './components/BoxPlot';
import { getDataset } from './data/datasets';

// Initialize the chart
const chart = new BoxPlot('box-chart');

// Initial data load
const initialDataset = getDataset('expression-by-subtype');
chart.setData(initialDataset.data, initialDataset.yLabel);

// Event handlers for controls
document.getElementById('dataset-select')?.addEventListener('change', (e) => {
  const datasetId = (e.target as HTMLSelectElement).value;
  const dataset = getDataset(datasetId);
  chart.setData(dataset.data, dataset.yLabel);
});

document.getElementById('show-outliers')?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  chart.setShowOutliers(checked);
});

document.getElementById('show-notch')?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  chart.setShowNotch(checked);
});

document.getElementById('show-mean')?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  chart.setShowMean(checked);
});

document.getElementById('orientation')?.addEventListener('change', (e) => {
  const orientation = (e.target as HTMLSelectElement).value as 'vertical' | 'horizontal';
  chart.setOrientation(orientation);
});

// Handle window resize
let resizeTimeout: number;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    chart.resize();
  }, 250);
});

console.log('Box Plot Demo initialized - Port 5189');
