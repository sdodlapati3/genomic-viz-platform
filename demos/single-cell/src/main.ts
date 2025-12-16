import { SingleCellPlot } from './components/SingleCellPlot';
import { getDataset } from './data/datasets';
import { SingleCellConfig } from './types';

// Initial configuration
const config: SingleCellConfig = {
  container: '#scatter-plot',
  width: 800,
  height: 600,
  margin: { top: 20, right: 20, bottom: 50, left: 60 },
  reduction: 'umap',
  colorBy: 'cluster',
  gene: 'CD3D',
  pointSize: 3,
  opacity: 70,
  showAxes: true,
};

// Initialize with PBMC dataset
let currentDataset = getDataset('pbmc');
let plot = new SingleCellPlot(config, currentDataset);

// Dataset selector
const datasetSelect = document.getElementById('dataset-select') as HTMLSelectElement;
datasetSelect.addEventListener('change', () => {
  currentDataset = getDataset(datasetSelect.value);
  plot.updateDataset(currentDataset);

  // Update gene options based on dataset
  updateGeneOptions();
});

// Reduction selector
const reductionSelect = document.getElementById('reduction-select') as HTMLSelectElement;
reductionSelect.addEventListener('change', () => {
  config.reduction = reductionSelect.value as 'umap' | 'tsne' | 'pca';
  plot.updateConfig({ reduction: config.reduction });
});

// Color by selector
const colorSelect = document.getElementById('color-select') as HTMLSelectElement;
const geneControl = document.getElementById('gene-control') as HTMLDivElement;

colorSelect.addEventListener('change', () => {
  config.colorBy = colorSelect.value as 'cluster' | 'celltype' | 'expression';
  geneControl.style.display = config.colorBy === 'expression' ? 'flex' : 'none';
  plot.updateConfig({ colorBy: config.colorBy });
});

// Gene selector
const geneSelect = document.getElementById('gene-select') as HTMLSelectElement;
geneSelect.addEventListener('change', () => {
  config.gene = geneSelect.value;
  plot.updateConfig({ gene: config.gene });
});

function updateGeneOptions(): void {
  geneSelect.innerHTML = '';
  currentDataset.genes.forEach((gene) => {
    const option = document.createElement('option');
    option.value = gene;
    option.textContent = gene;
    geneSelect.appendChild(option);
  });
  config.gene = currentDataset.genes[0];
}

// Point size slider
const sizeSlider = document.getElementById('size-slider') as HTMLInputElement;
const sizeValue = document.getElementById('size-value') as HTMLSpanElement;

sizeSlider.addEventListener('input', () => {
  config.pointSize = parseInt(sizeSlider.value);
  sizeValue.textContent = sizeSlider.value;
  plot.updateConfig({ pointSize: config.pointSize });
});

// Opacity slider
const opacitySlider = document.getElementById('opacity-slider') as HTMLInputElement;
const opacityValue = document.getElementById('opacity-value') as HTMLSpanElement;

opacitySlider.addEventListener('input', () => {
  config.opacity = parseInt(opacitySlider.value);
  opacityValue.textContent = `${opacitySlider.value}%`;
  plot.updateConfig({ opacity: config.opacity });
});

// Clear selection button
const clearBtn = document.getElementById('clear-selection') as HTMLButtonElement;
clearBtn.addEventListener('click', () => {
  plot.clearSelection();
});

// Export selection button
const exportBtn = document.getElementById('export-selection') as HTMLButtonElement;
exportBtn.addEventListener('click', () => {
  const tsv = plot.exportSelection();
  if (tsv.split('\n').length <= 1) {
    alert('No cells selected. Use brush or click to select cells first.');
    return;
  }

  const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'selected_cells.tsv';
  a.click();
  URL.revokeObjectURL(url);
});

// Handle window resize
let resizeTimeout: number;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = window.setTimeout(() => {
    plot.updateDataset(currentDataset);
  }, 250);
});

console.log('🧬 Single Cell Visualization Demo loaded');
console.log('Dataset:', currentDataset.name, '-', currentDataset.metadata.nCells, 'cells');
