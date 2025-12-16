/**
 * Violin Plot Demo - Main Entry Point
 */
import { ViolinPlot } from './components/ViolinPlot';
import { getDataset } from './data/datasets';

// Initialize the chart
const chart = new ViolinPlot('violin-chart');

// Initial data load
const initialDataset = getDataset('gene-expression');
chart.setData(initialDataset.data, initialDataset.yLabel);

// Event handlers for controls
document.getElementById('dataset-select')?.addEventListener('change', (e) => {
  const datasetId = (e.target as HTMLSelectElement).value;
  const dataset = getDataset(datasetId);
  chart.setData(dataset.data, dataset.yLabel);
});

document.getElementById('show-box')?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  chart.setShowBox(checked);
});

document.getElementById('show-points')?.addEventListener('change', (e) => {
  const checked = (e.target as HTMLInputElement).checked;
  chart.setShowPoints(checked);
});

const bandwidthSlider = document.getElementById('bandwidth') as HTMLInputElement;
const bandwidthValue = document.getElementById('bandwidth-value');

bandwidthSlider?.addEventListener('input', (e) => {
  const value = parseFloat((e.target as HTMLInputElement).value);
  if (bandwidthValue) bandwidthValue.textContent = value.toFixed(1);
  chart.setBandwidth(value);
});

// Handle window resize
let resizeTimeout: number;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    chart.resize();
  }, 250);
});

console.log('Violin Plot Demo initialized - Port 5188');
