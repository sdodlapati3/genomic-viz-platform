import { ExpressionPlot } from './components/ExpressionPlot';
import { getDataset } from './data/datasets';
import { ExpressionConfig } from './types';

// Initial configuration
const config: ExpressionConfig = {
  container: '#expression-plot',
  width: 900,
  height: 650,
  margin: { top: 20, right: 50, bottom: 120, left: 80 },
  view: 'heatmap',
  colorScale: 'viridis',
  normalize: 'zscore',
  clusterRows: true,
  clusterCols: true,
  selectedGenes: [],
};

// Initialize with TCGA dataset
let currentDataset = getDataset('tcga');
let plot = new ExpressionPlot(config, currentDataset);

// Dataset selector
const datasetSelect = document.getElementById('dataset-select') as HTMLSelectElement;
datasetSelect.addEventListener('change', () => {
  currentDataset = getDataset(datasetSelect.value);
  plot.updateDataset(currentDataset);
});

// View selector
const viewSelect = document.getElementById('view-select') as HTMLSelectElement;
viewSelect.addEventListener('change', () => {
  config.view = viewSelect.value as 'heatmap' | 'profile' | 'comparison';
  plot.updateConfig({ view: config.view });
});

// Color scale selector
const colorscaleSelect = document.getElementById('colorscale-select') as HTMLSelectElement;
colorscaleSelect.addEventListener('change', () => {
  config.colorScale = colorscaleSelect.value as 'viridis' | 'redblue' | 'yellowred' | 'blues';
  plot.updateConfig({ colorScale: config.colorScale });
});

// Normalize selector
const normalizeSelect = document.getElementById('normalize-select') as HTMLSelectElement;
normalizeSelect.addEventListener('change', () => {
  config.normalize = normalizeSelect.value as 'zscore' | 'log2' | 'raw';
  plot.updateConfig({ normalize: config.normalize });
});

// Cluster checkboxes
const clusterRowsCheckbox = document.getElementById('cluster-rows') as HTMLInputElement;
clusterRowsCheckbox.addEventListener('change', () => {
  config.clusterRows = clusterRowsCheckbox.checked;
  plot.updateConfig({ clusterRows: config.clusterRows });
});

const clusterColsCheckbox = document.getElementById('cluster-cols') as HTMLInputElement;
clusterColsCheckbox.addEventListener('change', () => {
  config.clusterCols = clusterColsCheckbox.checked;
  plot.updateConfig({ clusterCols: config.clusterCols });
});

// Gene search
const geneSearch = document.getElementById('gene-search') as HTMLInputElement;
geneSearch.addEventListener('input', () => {
  const query = geneSearch.value.toLowerCase();
  const geneItems = document.querySelectorAll('.gene-item');

  geneItems.forEach((item) => {
    const symbol = item.querySelector('.gene-symbol')?.textContent?.toLowerCase() || '';
    const visible = symbol.includes(query);
    (item as HTMLElement).style.display = visible ? 'flex' : 'none';
  });
});

// Handle window resize
let resizeTimeout: number;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    plot.updateDataset(currentDataset);
  }, 250);
});

console.log('🧬 Gene Expression Visualization Demo loaded');
console.log('Dataset:', currentDataset.name);
console.log('Genes:', currentDataset.metadata.nGenes, 'Samples:', currentDataset.metadata.nSamples);
