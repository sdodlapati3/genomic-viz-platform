/**
 * Tutorial 3.2: Main Application Entry Point
 * Gene Expression Heatmap with Hierarchical Clustering
 */

import { Heatmap } from './components/Heatmap.js';
import { generateExpressionData, GENE_SETS, PATHWAY_COLORS } from './data/expressionData.js';

// Application state
let heatmap = null;
let expressionData = null;

// Initialize application
function init() {
  console.log('Initializing Gene Expression Heatmap...');
  
  // Generate expression data
  expressionData = generateExpressionData();
  console.log(`Generated data: ${expressionData.genes.length} genes × ${expressionData.samples.length} samples`);
  
  // Create heatmap
  heatmap = new Heatmap('#heatmap-container', {
    width: 1000,
    height: 650,
    margin: { top: 80, right: 150, bottom: 120, left: 100 },
    dendrogramWidth: 80,
    dendrogramHeight: 60,
    clusterRows: true,
    clusterCols: true,
    showRowDendrogram: true,
    showColDendrogram: true
  });
  
  // Set data
  heatmap.setData(expressionData);
  
  // Setup controls
  setupControls();
  
  // Render pathway legend
  renderPathwayLegend();
  
  // Render sample group legend
  renderSampleLegend();
  
  console.log('Heatmap initialized successfully');
}

// Setup interactive controls
function setupControls() {
  // Cluster rows checkbox
  const clusterRowsCheckbox = document.getElementById('cluster-rows');
  if (clusterRowsCheckbox) {
    clusterRowsCheckbox.addEventListener('change', (e) => {
      heatmap.setClusterRows(e.target.checked);
    });
  }
  
  // Cluster columns checkbox
  const clusterColsCheckbox = document.getElementById('cluster-cols');
  if (clusterColsCheckbox) {
    clusterColsCheckbox.addEventListener('change', (e) => {
      heatmap.setClusterCols(e.target.checked);
    });
  }
  
  // Show row dendrogram checkbox
  const showRowDendroCheckbox = document.getElementById('show-row-dendro');
  if (showRowDendroCheckbox) {
    showRowDendroCheckbox.addEventListener('change', (e) => {
      const showCol = document.getElementById('show-col-dendro')?.checked ?? true;
      heatmap.setShowDendrograms(e.target.checked, showCol);
    });
  }
  
  // Show column dendrogram checkbox
  const showColDendroCheckbox = document.getElementById('show-col-dendro');
  if (showColDendroCheckbox) {
    showColDendroCheckbox.addEventListener('change', (e) => {
      const showRow = document.getElementById('show-row-dendro')?.checked ?? true;
      heatmap.setShowDendrograms(showRow, e.target.checked);
    });
  }
  
  // Regenerate data button
  const regenerateBtn = document.getElementById('regenerate-data');
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', () => {
      expressionData = generateExpressionData();
      heatmap.setData(expressionData);
    });
  }
}

// Render pathway legend
function renderPathwayLegend() {
  const container = document.getElementById('pathway-legend');
  if (!container) return;
  
  let html = '<h4>Gene Pathways</h4>';
  
  for (const [pathway, color] of Object.entries(PATHWAY_COLORS)) {
    const geneCount = GENE_SETS[pathway]?.length || 0;
    html += `
      <div class="legend-item">
        <span class="legend-color" style="background: ${color}"></span>
        <span class="legend-label">${pathway} (${geneCount})</span>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// Render sample group legend
function renderSampleLegend() {
  const container = document.getElementById('sample-legend');
  if (!container) return;
  
  const groups = {};
  for (const condition of expressionData.conditions) {
    if (!groups[condition.group]) {
      groups[condition.group] = {
        color: condition.color,
        count: 0
      };
    }
    groups[condition.group].count++;
  }
  
  let html = '<h4>Sample Groups</h4>';
  
  for (const [group, info] of Object.entries(groups)) {
    html += `
      <div class="legend-item">
        <span class="legend-color" style="background: ${info.color}"></span>
        <span class="legend-label">${group} (n=${info.count})</span>
      </div>
    `;
  }
  
  container.innerHTML = html;
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
