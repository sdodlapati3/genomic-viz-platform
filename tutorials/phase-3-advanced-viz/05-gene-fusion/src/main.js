/**
 * Gene Fusion Viewer - Main Application
 *
 * Interactive visualization for gene fusion data
 * with multiple view types and clinical annotations.
 */

import * as d3 from 'd3';
import {
  ArcDiagram,
  DualGeneView,
  GeneStructure,
  FusionDetail,
  ChromosomeRing,
} from './components/index.js';
import { FusionParser } from './utils/fusionParser.js';
import { sampleFusions, geneStructures } from './data/sampleFusions.js';
import './styles.css';

// Application state
const state = {
  fusions: [],
  selectedFusion: null,
  currentView: 'arc',
  filters: {
    minReads: 0,
    type: 'all',
    confidence: 'all',
  },
};

// Component instances
let arcDiagram = null;
let dualGeneView = null;
let geneStructure5 = null;
let geneStructure3 = null;
let fusionDetail = null;
let chromosomeRing = null;

/**
 * Initialize the application
 */
function init() {
  console.log('Initializing Gene Fusion Viewer...');

  // Load sample data
  state.fusions = sampleFusions;

  // Initialize components
  initializeComponents();

  // Setup event listeners
  setupEventListeners();

  // Initial render
  render();

  // Update stats
  updateStats();

  console.log(`Loaded ${state.fusions.length} fusions`);
}

/**
 * Initialize all visualization components
 */
function initializeComponents() {
  // Arc Diagram (main overview)
  arcDiagram = new ArcDiagram('#arc-viz', {
    width: document.querySelector('#arc-viz').clientWidth || 800,
    height: 400,
  });

  // Dual Gene View (selected fusion detail)
  dualGeneView = new DualGeneView('#dual-gene-viz', {
    width: document.querySelector('#dual-gene-viz')?.clientWidth || 800,
    height: 250,
  });

  // Gene Structure views (5' and 3' partners)
  geneStructure5 = new GeneStructure('#gene-structure-5', {
    width: 700,
    height: 150,
  });

  geneStructure3 = new GeneStructure('#gene-structure-3', {
    width: 700,
    height: 150,
  });

  // Fusion Detail panel
  fusionDetail = new FusionDetail('#fusion-detail', {
    width: 350,
  });

  // Chromosome Ring (Circos view)
  chromosomeRing = new ChromosomeRing('#circos-viz', {
    size: 450,
  });
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // View mode tabs
  document.querySelectorAll('.view-tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const view = e.target.dataset.view;
      switchView(view);
    });
  });

  // Filter controls
  const readFilter = document.getElementById('read-filter');
  if (readFilter) {
    readFilter.addEventListener('input', (e) => {
      state.filters.minReads = parseInt(e.target.value) || 0;
      document.getElementById('read-filter-value').textContent = state.filters.minReads;
      applyFilters();
    });
  }

  const typeFilter = document.getElementById('type-filter');
  if (typeFilter) {
    typeFilter.addEventListener('change', (e) => {
      state.filters.type = e.target.value;
      applyFilters();
    });
  }

  const confidenceFilter = document.getElementById('confidence-filter');
  if (confidenceFilter) {
    confidenceFilter.addEventListener('change', (e) => {
      state.filters.confidence = e.target.value;
      applyFilters();
    });
  }

  // File upload
  const fileInput = document.getElementById('fusion-file');
  if (fileInput) {
    fileInput.addEventListener('change', handleFileUpload);
  }

  // Load sample data button
  const loadSampleBtn = document.getElementById('load-sample');
  if (loadSampleBtn) {
    loadSampleBtn.addEventListener('click', () => {
      state.fusions = sampleFusions;
      render();
      updateStats();
    });
  }

  // Export button
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', exportData);
  }

  // Listen for fusion selection from components
  document.addEventListener('fusionselect', (e) => {
    selectFusion(e.detail.fusion);
  });

  // Arc diagram fusion selection
  document.getElementById('arc-viz')?.addEventListener('fusionselect', (e) => {
    selectFusion(e.detail.fusion);
  });

  // Circos fusion selection
  document.getElementById('circos-viz')?.addEventListener('fusionselect', (e) => {
    selectFusion(e.detail.fusion);
  });

  // Window resize
  window.addEventListener(
    'resize',
    debounce(() => {
      resizeComponents();
    }, 250)
  );
}

/**
 * Switch between view modes
 */
function switchView(view) {
  state.currentView = view;

  // Update tab active state
  document.querySelectorAll('.view-tab').forEach((tab) => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });

  // Show/hide view containers
  document.querySelectorAll('.view-container').forEach((container) => {
    container.classList.toggle('hidden', container.id !== `${view}-view`);
  });

  // Re-render active view
  render();
}

/**
 * Main render function
 */
function render() {
  const filteredFusions = getFilteredFusions();

  switch (state.currentView) {
    case 'arc':
      arcDiagram?.setData(filteredFusions);
      break;
    case 'circos':
      chromosomeRing?.setData(filteredFusions);
      break;
    case 'dual':
      if (state.selectedFusion) {
        renderDualView(state.selectedFusion);
      }
      break;
  }

  // Always update detail panel
  fusionDetail?.setFusion(state.selectedFusion);
}

/**
 * Apply filters to fusion data
 */
function applyFilters() {
  render();
  updateStats();
}

/**
 * Get filtered fusions based on current filter settings
 */
function getFilteredFusions() {
  return state.fusions.filter((f) => {
    // Read count filter
    if (f.reads < state.filters.minReads) return false;

    // Type filter
    if (state.filters.type !== 'all' && f.type !== state.filters.type) return false;

    // Confidence filter
    if (state.filters.confidence !== 'all' && f.confidence !== state.filters.confidence)
      return false;

    return true;
  });
}

/**
 * Select a fusion for detailed view
 */
function selectFusion(fusion) {
  state.selectedFusion = fusion;

  // Update detail panel
  fusionDetail?.setFusion(fusion);

  // Update dual gene view
  if (fusion) {
    const gene5Name = fusion.gene5?.name || fusion.gene5;
    const gene3Name = fusion.gene3?.name || fusion.gene3;

    const gene5Data = geneStructures[gene5Name] || null;
    const gene3Data = geneStructures[gene3Name] || null;

    dualGeneView?.setFusion(fusion, gene5Data, gene3Data);

    // Update gene structure views
    if (gene5Data) {
      geneStructure5?.setGene(gene5Data);
    }
    if (gene3Data) {
      geneStructure3?.setGene(gene3Data);
    }
  }

  // Highlight in overview
  arcDiagram?.highlightFusion?.(fusion);

  // Show selected fusion info
  showSelectionInfo(fusion);
}

/**
 * Render dual gene view
 */
function renderDualView(fusion) {
  if (!fusion) return;

  const gene5Name = fusion.gene5?.name || fusion.gene5;
  const gene3Name = fusion.gene3?.name || fusion.gene3;

  const gene5Data = geneStructures[gene5Name];
  const gene3Data = geneStructures[gene3Name];

  dualGeneView?.setFusion(fusion, gene5Data, gene3Data);

  if (gene5Data) {
    geneStructure5?.setGene(gene5Data);
  }

  if (gene3Data) {
    geneStructure3?.setGene(gene3Data);
  }
}

/**
 * Show selection info banner
 */
function showSelectionInfo(fusion) {
  const banner = document.getElementById('selection-banner');
  if (!banner) return;

  if (fusion) {
    const name = `${fusion.gene5?.name || fusion.gene5}-${fusion.gene3?.name || fusion.gene3}`;
    banner.innerHTML = `
      <span>Selected: <strong>${name}</strong></span>
      <span class="reads">${fusion.reads} reads</span>
      <span class="type">${fusion.type}</span>
      <button onclick="clearSelection()" class="clear-btn">✕</button>
    `;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

/**
 * Clear current selection
 */
window.clearSelection = function () {
  state.selectedFusion = null;
  fusionDetail?.setFusion(null);
  arcDiagram?.clearHighlight?.();

  document.getElementById('selection-banner')?.classList.add('hidden');
};

/**
 * Handle file upload
 */
async function handleFileUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const content = await file.text();
    const fusions = FusionParser.parse(content, file.name);

    // Validate
    const validation = FusionParser.validate(fusions);

    if (validation.errors.length > 0) {
      console.warn('Validation errors:', validation.errors);
      alert(`Warning: ${validation.errors.length} validation errors. Check console.`);
    }

    if (fusions.length === 0) {
      alert('No fusions found in file. Check format.');
      return;
    }

    state.fusions = fusions;
    state.selectedFusion = null;

    render();
    updateStats();

    console.log(`Loaded ${fusions.length} fusions from ${file.name}`);
  } catch (error) {
    console.error('Error loading file:', error);
    alert('Error loading file. Check format and try again.');
  }
}

/**
 * Export data to TSV
 */
function exportData() {
  const filteredFusions = getFilteredFusions();
  const tsv = FusionParser.exportToTsv(filteredFusions);

  const blob = new Blob([tsv], { type: 'text/tab-separated-values' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'fusion_export.tsv';
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Update statistics display
 */
function updateStats() {
  const total = state.fusions.length;
  const filtered = getFilteredFusions().length;
  const inter = state.fusions.filter((f) => f.type === 'interchromosomal').length;
  const intra = state.fusions.filter((f) => f.type === 'intrachromosomal').length;

  const statsEl = document.getElementById('fusion-stats');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="stat">
        <span class="stat-value">${filtered}</span>
        <span class="stat-label">Displayed</span>
      </div>
      <div class="stat">
        <span class="stat-value">${total}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat">
        <span class="stat-value">${inter}</span>
        <span class="stat-label">Interchrom</span>
      </div>
      <div class="stat">
        <span class="stat-value">${intra}</span>
        <span class="stat-label">Intrachrom</span>
      </div>
    `;
  }
}

/**
 * Resize components on window resize
 */
function resizeComponents() {
  const arcContainer = document.querySelector('#arc-viz');
  if (arcContainer && arcDiagram) {
    arcDiagram.resize?.(arcContainer.clientWidth, 400);
  }

  const circosContainer = document.querySelector('#circos-viz');
  if (circosContainer && chromosomeRing) {
    const size = Math.min(circosContainer.clientWidth, 450);
    chromosomeRing.resize?.(size);
  }
}

/**
 * Debounce utility
 */
function debounce(fn, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Export for external use
export { state, selectFusion, applyFilters };
