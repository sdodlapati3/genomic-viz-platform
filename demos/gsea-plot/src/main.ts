/**
 * GSEA Running Sum Plot Demo
 *
 * Entry point for the Gene Set Enrichment Analysis visualization
 */

import { GseaPlot } from './components/GseaPlot';
import { generateGseaResult } from './data/mockData';
import './styles.css';

// Initialize plot
let plot: GseaPlot | null = null;

function updateStats(result: ReturnType<typeof generateGseaResult>): void {
  const statsPanel = document.getElementById('stats-panel');
  if (!statsPanel) return;

  const esClass = result.enrichmentScore >= 0 ? 'positive' : 'negative';

  statsPanel.innerHTML = `
    <div class="stat-item">
      <span class="stat-value ${esClass}">${result.enrichmentScore.toFixed(3)}</span>
      <span class="stat-label">ES</span>
    </div>
    <div class="stat-item">
      <span class="stat-value ${esClass}">${result.normalizedEnrichmentScore.toFixed(3)}</span>
      <span class="stat-label">NES</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">${result.nominalPValue.toExponential(2)}</span>
      <span class="stat-label">p-value</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">${result.fdrQValue.toExponential(2)}</span>
      <span class="stat-label">FDR q</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">${result.geneSetSize}</span>
      <span class="stat-label">Gene Set Size</span>
    </div>
    <div class="stat-item">
      <span class="stat-value">${result.leadingEdgeSize}</span>
      <span class="stat-label">Leading Edge</span>
    </div>
  `;
}

function init(): void {
  // Create plot
  plot = new GseaPlot('gsea-plot', {
    width: 900,
    height: 480,
  });

  // Initial data
  const geneSetSelect = document.getElementById('gene-set-select') as HTMLSelectElement;
  const initialGeneSet = geneSetSelect.value;
  const result = generateGseaResult(initialGeneSet);

  plot.update(result);
  updateStats(result);

  // Gene set change handler
  geneSetSelect.addEventListener('change', () => {
    const geneSetName = geneSetSelect.value;
    const newResult = generateGseaResult(geneSetName);
    plot?.update(newResult);
    updateStats(newResult);
  });
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);
