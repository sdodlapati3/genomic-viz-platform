/**
 * Tutorial 3.1: Main Application Entry Point
 * UMAP/t-SNE Scatter Plot for Single-Cell Data
 */

import { ScatterPlot } from './components/ScatterPlot.js';
import { generateSingleCellData, CELL_TYPES, MARKER_GENES } from './data/singleCellData.js';

// Application state
let scatterPlot = null;
let cellData = [];

// Initialize application
function init() {
  console.log('Initializing UMAP/t-SNE Scatter Plot...');
  
  // Generate sample data
  cellData = generateSingleCellData(1000);
  console.log(`Generated ${cellData.length} cells`);
  
  // Calculate cell type counts
  const cellTypeCounts = {};
  for (const cell of cellData) {
    cellTypeCounts[cell.cellType] = (cellTypeCounts[cell.cellType] || 0) + 1;
  }
  
  // Add counts to cell type info
  const cellTypeInfo = {};
  for (const [type, info] of Object.entries(CELL_TYPES)) {
    cellTypeInfo[type] = {
      ...info,
      count: cellTypeCounts[type] || 0
    };
  }
  
  // Create scatter plot
  scatterPlot = new ScatterPlot('#scatter-container', {
    width: 950,
    height: 700,
    pointSize: 8,
    pointOpacity: 0.85,
    useWebGL: false  // Use Canvas 2D for better compatibility
  });
  
  // Set data
  scatterPlot.setData(cellData, cellTypeInfo);
  
  // Setup gene selector
  setupGeneSelector();
  
  // Setup cell count slider
  setupCellCountSlider();
  
  // Setup event listeners
  setupEventListeners();
  
  // Update stats
  updateStats();
  
  console.log('Scatter plot initialized successfully');
}

// Setup gene expression color selector
function setupGeneSelector() {
  const selector = document.getElementById('gene-selector');
  if (!selector) return;
  
  // Add cell type option
  const cellTypeOption = document.createElement('option');
  cellTypeOption.value = 'cellType';
  cellTypeOption.textContent = 'Cell Type';
  cellTypeOption.selected = true;
  selector.appendChild(cellTypeOption);
  
  // Add separator
  const separator = document.createElement('option');
  separator.disabled = true;
  separator.textContent = '── Gene Expression ──';
  selector.appendChild(separator);
  
  // Add gene options
  for (const gene of MARKER_GENES) {
    const option = document.createElement('option');
    option.value = gene;
    option.textContent = gene;
    selector.appendChild(option);
  }
  
  // Handle selection change
  selector.addEventListener('change', (e) => {
    const value = e.target.value;
    if (value === 'cellType') {
      scatterPlot.colorByCellType();
    } else {
      scatterPlot.colorByGene(value);
    }
  });
}

// Setup cell count slider for regenerating data
function setupCellCountSlider() {
  const slider = document.getElementById('cell-count');
  const display = document.getElementById('cell-count-display');
  
  if (!slider || !display) return;
  
  slider.addEventListener('input', (e) => {
    display.textContent = parseInt(e.target.value).toLocaleString();
  });
  
  slider.addEventListener('change', (e) => {
    regenerateData(parseInt(e.target.value));
  });
}

// Regenerate data with new cell count
function regenerateData(count) {
  console.log(`Regenerating data with ${count} cells...`);
  
  cellData = generateSingleCellData(count);
  
  // Calculate cell type counts
  const cellTypeCounts = {};
  for (const cell of cellData) {
    cellTypeCounts[cell.cellType] = (cellTypeCounts[cell.cellType] || 0) + 1;
  }
  
  const cellTypeInfo = {};
  for (const [type, info] of Object.entries(CELL_TYPES)) {
    cellTypeInfo[type] = {
      ...info,
      count: cellTypeCounts[type] || 0
    };
  }
  
  scatterPlot.setData(cellData, cellTypeInfo);
  updateStats();
  
  // Reset gene selector to cell type
  const selector = document.getElementById('gene-selector');
  if (selector) selector.value = 'cellType';
}

// Setup event listeners
function setupEventListeners() {
  // Listen for cell click events
  const container = document.getElementById('scatter-container');
  container.addEventListener('cellClick', (e) => {
    displayCellDetails(e.detail);
  });
}

// Display selected cell details
function displayCellDetails(cell) {
  const panel = document.getElementById('cell-details');
  if (!panel) return;
  
  const geneExpression = Object.entries(cell.geneExpression)
    .sort((a, b) => b[1] - a[1])
    .map(([gene, value]) => `
      <div class="gene-row">
        <span class="gene-name">${gene}</span>
        <span class="gene-value">${value.toFixed(3)}</span>
        <div class="gene-bar" style="width: ${value * 20}%"></div>
      </div>
    `)
    .join('');
  
  panel.innerHTML = `
    <h3>Selected Cell</h3>
    <div class="cell-info">
      <p><strong>Cell ID:</strong> ${cell.cellId}</p>
      <p><strong>Type:</strong> <span class="cell-type-badge" style="background: ${CELL_TYPES[cell.cellType].color}">${cell.cellType}</span></p>
      <p><strong>Sample:</strong> ${cell.sample}</p>
      <p><strong>UMAP Coordinates:</strong> (${cell.umap1.toFixed(3)}, ${cell.umap2.toFixed(3)})</p>
    </div>
    <h4>Gene Expression</h4>
    <div class="gene-expression">
      ${geneExpression}
    </div>
  `;
  
  panel.style.display = 'block';
}

// Update statistics display
function updateStats() {
  const statsEl = document.getElementById('stats');
  if (!statsEl) return;
  
  const cellTypeCounts = {};
  for (const cell of cellData) {
    cellTypeCounts[cell.cellType] = (cellTypeCounts[cell.cellType] || 0) + 1;
  }
  
  const stats = Object.entries(cellTypeCounts)
    .map(([type, count]) => `${type}: ${count}`)
    .join(' | ');
  
  statsEl.textContent = stats;
}

// Export for global access
window.regenerateData = regenerateData;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
