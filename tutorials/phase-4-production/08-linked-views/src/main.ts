/**
 * Linked Views Demo - Main Application
 *
 * Demonstrates cross-view coordination between:
 * - Expression Rank Plot (gene expression with outliers)
 * - Mutation Panel (mutation list)
 * - Sample Table (sample details)
 *
 * Selecting/hovering in one view highlights related items in others.
 */

import './styles.css';
import { ExpressionRankPlot, MutationPanel, SampleTable } from './components';
import { EventBus, SelectionStore } from './state';
import { SAMPLES, MUTATIONS, EXPRESSIONS, getAvailableGenes } from './data/mockData';

// Enable debug mode for development
EventBus.setDebug(true);

// Initialize components
let expressionPlot: ExpressionRankPlot;
let mutationPanel: MutationPanel;
let sampleTable: SampleTable;
let currentGene = 'TP53';

function init(): void {
  setupLayout();
  setupControls();
  initializeComponents();
  setupSelectionStatus();
}

function setupLayout(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <header class="header">
      <h1>Linked Views Demo</h1>
      <p>Cross-view coordination: Mutation Panel ↔ Expression Plot ↔ Sample Table</p>
    </header>
    
    <div class="controls">
      <label for="gene-select">Select Gene:</label>
      <select id="gene-select"></select>
      <button id="clear-selection">Clear Selection</button>
      <span id="selection-status" class="selection-status">No selection</span>
    </div>
    
    <div class="main-content">
      <div class="panel mutation-panel-container">
        <div class="panel-title">Mutations</div>
        <div id="mutation-panel"></div>
      </div>
      
      <div class="panel expression-panel-container">
        <div class="panel-title">Expression Rank Plot</div>
        <div id="expression-plot"></div>
      </div>
      
      <div class="panel table-panel-container">
        <div class="panel-title">Sample Details</div>
        <div id="sample-table"></div>
      </div>
    </div>
    
    <div class="instructions">
      <h3>Instructions</h3>
      <ul>
        <li><strong>Click</strong> on any item to select it</li>
        <li><strong>Shift+Click</strong> to add to selection</li>
        <li><strong>Hover</strong> to highlight related items across views</li>
        <li><strong>Brush</strong> on the expression plot to select a range</li>
        <li>Orange/red dots in expression plot are outliers</li>
        <li>Selected mutations highlight their affected samples</li>
      </ul>
    </div>
    
    <div class="legend">
      <h3>Legend</h3>
      <div class="legend-items">
        <div class="legend-section">
          <strong>Outlier Types:</strong>
          <span class="legend-item"><span class="dot extreme-high"></span> Extreme High</span>
          <span class="legend-item"><span class="dot high"></span> High</span>
          <span class="legend-item"><span class="dot normal"></span> Normal</span>
          <span class="legend-item"><span class="dot low"></span> Low</span>
          <span class="legend-item"><span class="dot extreme-low"></span> Extreme Low</span>
        </div>
        <div class="legend-section">
          <strong>Sample Types:</strong>
          <span class="legend-item"><span class="dot tumor"></span> Tumor</span>
          <span class="legend-item"><span class="dot normal-sample"></span> Normal</span>
          <span class="legend-item"><span class="dot cell-line"></span> Cell Line</span>
          <span class="legend-item"><span class="dot xenograft"></span> Xenograft</span>
        </div>
      </div>
    </div>
  `;
}

function setupControls(): void {
  // Gene selector
  const geneSelect = document.getElementById('gene-select') as HTMLSelectElement;
  if (geneSelect) {
    const genes = getAvailableGenes();
    genes.forEach((gene) => {
      const option = document.createElement('option');
      option.value = gene;
      option.textContent = gene;
      if (gene === currentGene) option.selected = true;
      geneSelect.appendChild(option);
    });

    geneSelect.addEventListener('change', () => {
      currentGene = geneSelect.value;
      expressionPlot.setData(EXPRESSIONS, currentGene);
    });
  }

  // Clear selection button
  const clearBtn = document.getElementById('clear-selection');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      SelectionStore.clearSelection('keyboard');
    });
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      SelectionStore.clearSelection('keyboard');
    }
  });
}

function initializeComponents(): void {
  // Expression Rank Plot
  expressionPlot = new ExpressionRankPlot('#expression-plot', {
    width: 600,
    height: 350,
  });
  expressionPlot.setData(EXPRESSIONS, currentGene);

  // Mutation Panel
  mutationPanel = new MutationPanel('#mutation-panel', {
    width: 280,
    height: 350,
  });
  mutationPanel.setData(MUTATIONS);

  // Sample Table
  sampleTable = new SampleTable('#sample-table', {
    width: 500,
    height: 350,
  });
  sampleTable.setData(SAMPLES);
}

function setupSelectionStatus(): void {
  const statusEl = document.getElementById('selection-status');
  if (!statusEl) return;

  SelectionStore.subscribe(() => {
    statusEl.textContent = SelectionStore.getSelectionSummary();
  });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
