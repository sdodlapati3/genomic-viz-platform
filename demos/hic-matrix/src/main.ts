/**
 * Hi-C Contact Matrix Demo
 *
 * Entry point for the chromatin interaction visualization
 */

import { HicMatrixPlot, Colorbar } from './components/HicMatrix';
import { generateHicMatrix, parseResolution } from './data/mockData';
import './styles.css';

// Initialize plot
let plot: HicMatrixPlot | null = null;
let colorbar: Colorbar | null = null;

function updatePlot(): void {
  const regionSelect = document.getElementById('region-select') as HTMLSelectElement;
  const resolutionSelect = document.getElementById('resolution-select') as HTMLSelectElement;
  const normalizationSelect = document.getElementById('normalization-select') as HTMLSelectElement;
  const colormapSelect = document.getElementById('colormap-select') as HTMLSelectElement;

  const region = regionSelect.value;
  const resolution = parseResolution(resolutionSelect.value);
  const normalization = normalizationSelect.value;
  const colormap = colormapSelect.value as 'red' | 'blue' | 'viridis';

  // Generate data
  const data = generateHicMatrix(region, resolution, normalization);

  // Update plot
  plot?.setColormap(colormap);
  plot?.update(data);

  // Update colorbar
  const colorScale = plot?.getColorScale();
  const range = plot?.getDataRange();
  if (colorScale && range && colorbar) {
    colorbar.update(colorScale, range, true);
  }
}

function init(): void {
  // Create plot
  plot = new HicMatrixPlot('hic-matrix', {
    width: 550,
    height: 550,
  });

  // Create colorbar
  colorbar = new Colorbar('colorbar');

  // Initial render
  updatePlot();

  // Event handlers
  document.getElementById('region-select')?.addEventListener('change', updatePlot);
  document.getElementById('resolution-select')?.addEventListener('change', updatePlot);
  document.getElementById('normalization-select')?.addEventListener('change', updatePlot);
  document.getElementById('colormap-select')?.addEventListener('change', updatePlot);
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
