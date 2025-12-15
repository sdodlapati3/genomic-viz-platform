/**
 * Main Application - Multi-View Coordination Demo
 *
 * Demonstrates coordinated visualizations with:
 * - Linked selection between scatter, heatmap, and table
 * - Synchronized filtering
 * - Hover highlighting across views
 */

import * as d3 from 'd3';
import { eventBus, Events } from './state/EventBus.js';
import { store } from './state/Store.js';
import { selections } from './state/Selections.js';
import { ScatterPlot, DataTable, Heatmap, FilterPanel } from './components/index.js';

// Generate sample data
function generateSampleData(nSamples = 50, nGenes = 20) {
  const samples = [];
  const genes = [];
  const sampleGroups = ['Group A', 'Group B', 'Control'];
  const geneTypes = ['oncogene', 'tumor suppressor', 'other'];

  // Create samples
  for (let i = 0; i < nSamples; i++) {
    const group = sampleGroups[i % sampleGroups.length];
    samples.push({
      id: `SAMPLE_${i.toString().padStart(3, '0')}`,
      name: `Sample ${i + 1}`,
      group,
      age: 30 + Math.floor(Math.random() * 50),
      // UMAP coordinates
      x: (group === 'Group A' ? -3 : group === 'Group B' ? 3 : 0) + (Math.random() - 0.5) * 4,
      y: (group === 'Control' ? 3 : 0) + (Math.random() - 0.5) * 4,
    });
  }

  // Create genes
  for (let i = 0; i < nGenes; i++) {
    genes.push({
      id: `GENE_${i.toString().padStart(3, '0')}`,
      symbol: `GENE${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) || ''}`,
      type: geneTypes[Math.floor(Math.random() * geneTypes.length)],
      chromosome: `chr${(i % 22) + 1}`,
    });
  }

  // Create expression matrix
  const expressionData = [];
  samples.forEach((sample) => {
    genes.forEach((gene) => {
      // Generate correlated expression based on groups
      let baseExpr = Math.random() * 5 + 2;
      if (sample.group === 'Group A' && gene.type === 'oncogene') {
        baseExpr += 3;
      }
      if (sample.group === 'Group B' && gene.type === 'tumor suppressor') {
        baseExpr -= 2;
      }

      expressionData.push({
        sampleId: sample.id,
        geneId: gene.id,
        expression: Math.max(0, baseExpr + (Math.random() - 0.5) * 2),
      });
    });
  });

  return { samples, genes, expressionData };
}

// Main application
class App {
  constructor() {
    this.views = {};
    this.data = null;
  }

  async init() {
    console.log('Initializing Multi-View Coordination Demo...');

    // Generate sample data
    this.data = generateSampleData(50, 20);

    // Setup layout
    this._createLayout();

    // Initialize views
    this._initFilterPanel();
    this._initScatterPlot();
    this._initHeatmap();
    this._initDataTable();

    // Setup global event handlers
    this._setupGlobalHandlers();

    // Initialize selection from URL if present
    this._loadStateFromURL();

    console.log('Application initialized');
    eventBus.emit(Events.VIEW_READY, { source: 'app' });
  }

  _createLayout() {
    const app = d3.select('#app');

    // Header
    app.append('header').attr('class', 'app-header').html(`
        <h1>Multi-View Coordination Demo</h1>
        <p>Select, brush, hover, and filter - all views stay synchronized!</p>
      `);

    // Main content
    const main = app.append('main').attr('class', 'app-main');

    // Sidebar for filters
    main.append('aside').attr('class', 'sidebar').attr('id', 'filter-container');

    // View grid
    const grid = main.append('div').attr('class', 'view-grid');

    // Scatter plot container
    grid
      .append('div')
      .attr('class', 'view-container')
      .attr('id', 'scatter-container')
      .append('h3')
      .text('Sample Distribution (UMAP)');

    // Heatmap container
    grid
      .append('div')
      .attr('class', 'view-container')
      .attr('id', 'heatmap-container')
      .append('h3')
      .text('Expression Heatmap');

    // Table container (spans full width)
    grid
      .append('div')
      .attr('class', 'view-container full-width')
      .attr('id', 'table-container')
      .append('h3')
      .text('Sample Data');

    // Selection info bar
    app.append('div').attr('class', 'selection-bar').attr('id', 'selection-info');
  }

  _initFilterPanel() {
    this.views.filter = new FilterPanel('#filter-container', {
      expressionRange: [0, 12],
      vafRange: [0, 1],
      geneTypes: ['all', 'oncogene', 'tumor suppressor', 'other'],
      sampleGroups: ['Group A', 'Group B', 'Control'],
    });
  }

  _initScatterPlot() {
    const container = d3
      .select('#scatter-container')
      .append('div')
      .attr('class', 'chart-area')
      .node();

    this.views.scatter = new ScatterPlot(container, {
      width: 450,
      height: 350,
      xField: 'x',
      yField: 'y',
      colorField: 'group',
      idField: 'id',
      selectionType: 'sample',
    });

    this.views.scatter.setData(this.data.samples);
  }

  _initHeatmap() {
    const container = d3
      .select('#heatmap-container')
      .append('div')
      .attr('class', 'chart-area')
      .node();

    // Use subset for heatmap (first 15 samples, all genes)
    const sampleSubset = this.data.samples.slice(0, 15).map((s) => s.id);
    const geneIds = this.data.genes.map((g) => g.id);

    const heatmapData = this.data.expressionData.filter((d) => sampleSubset.includes(d.sampleId));

    this.views.heatmap = new Heatmap(container, {
      width: 450,
      height: 350,
      rowIdField: 'sampleId',
      colIdField: 'geneId',
      valueField: 'expression',
    });

    this.views.heatmap.setData(heatmapData, sampleSubset, geneIds);
  }

  _initDataTable() {
    const container = d3
      .select('#table-container')
      .append('div')
      .attr('class', 'table-area')
      .node();

    // Prepare table data with expression summary
    const tableData = this.data.samples.map((sample) => {
      const expressions = this.data.expressionData.filter((e) => e.sampleId === sample.id);
      const avgExpr = d3.mean(expressions, (d) => d.expression);

      return {
        ...sample,
        expression: avgExpr,
        expressionStr: avgExpr.toFixed(2),
      };
    });

    this.views.table = new DataTable(container, {
      columns: [
        { key: 'name', label: 'Sample', sortable: true },
        { key: 'group', label: 'Group', sortable: true },
        { key: 'age', label: 'Age', sortable: true },
        { key: 'expressionStr', label: 'Avg Expression', sortable: true },
      ],
      idField: 'id',
      selectionType: 'sample',
      pageSize: 10,
      sortField: 'name',
      sortDirection: 'asc',
    });

    this.views.table.setData(tableData);
  }

  _setupGlobalHandlers() {
    // Update selection info bar
    eventBus.on(Events.SELECTION_CHANGE, () => {
      this._updateSelectionInfo();
    });

    eventBus.on(Events.SELECTION_CLEAR, () => {
      this._updateSelectionInfo();
    });

    // Handle keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape clears selection
      if (e.key === 'Escape') {
        selections.clear('all');
      }

      // Ctrl/Cmd + Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (store.canUndo()) {
          store.undo();
        }
      }

      // Ctrl/Cmd + Shift + Z for redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        if (store.canRedo()) {
          store.redo();
        }
      }
    });

    // Save state to URL on selection change
    eventBus.on(Events.SELECTION_CHANGE, () => {
      this._saveStateToURL();
    });
  }

  _updateSelectionInfo() {
    const sampleCount = selections.getCount('sample');
    const geneCount = selections.getCount('gene');

    let message = '';
    if (sampleCount > 0 || geneCount > 0) {
      const parts = [];
      if (sampleCount > 0) parts.push(`${sampleCount} sample${sampleCount > 1 ? 's' : ''}`);
      if (geneCount > 0) parts.push(`${geneCount} gene${geneCount > 1 ? 's' : ''}`);
      message = `Selected: ${parts.join(', ')}`;

      // Add clear button
      message += ' <button class="clear-selection">Clear</button>';
    } else {
      message = 'No selection. Click items or brush to select. Hold Shift for multi-select.';
    }

    const bar = d3.select('#selection-info').html(message);

    bar.select('.clear-selection').on('click', () => selections.clear('all'));
  }

  _saveStateToURL() {
    const params = selections.toURLParams();
    const url = new URL(window.location.href);

    if (params) {
      url.search = params;
    } else {
      url.search = '';
    }

    // Update URL without reloading
    window.history.replaceState({}, '', url);
  }

  _loadStateFromURL() {
    const params = window.location.search;
    if (params) {
      selections.fromURLParams(params);
    }
  }

  destroy() {
    Object.values(this.views).forEach((view) => {
      if (view.destroy) {
        view.destroy();
      }
    });
  }
}

// Initialize app
const app = new App();
app.init();

// Export for debugging
window.app = app;
window.eventBus = eventBus;
window.store = store;
window.selections = selections;
