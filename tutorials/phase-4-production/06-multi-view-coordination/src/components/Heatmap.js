/**
 * Heatmap Component - Gene expression heatmap with row/column selection
 *
 * Demonstrates:
 * - Row selection for samples
 * - Column selection for genes
 * - Linked highlighting with other views
 */

import * as d3 from 'd3';
import { eventBus, Events } from '../state/EventBus.js';
import { store } from '../state/Store.js';
import { selections } from '../state/Selections.js';

export class Heatmap {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    this.options = {
      width: 600,
      height: 400,
      margin: { top: 80, right: 20, bottom: 20, left: 100 },
      rowIdField: 'sampleId',
      colIdField: 'geneId',
      valueField: 'expression',
      colorScheme: 'interpolateRdBu',
      cellPadding: 1,
      ...options,
    };

    this.data = [];
    this.rows = [];
    this.cols = [];
    this.matrix = [];
    this._unsubscribers = [];

    this._init();
    this._setupEventListeners();
  }

  _init() {
    const { width, height, margin } = this.options;

    this.innerWidth = width - margin.left - margin.right;
    this.innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'heatmap');

    // Create main group
    this.g = this.svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Create layers
    this.cellsLayer = this.g.append('g').attr('class', 'cells-layer');
    this.rowLabelsLayer = this.g.append('g').attr('class', 'row-labels');
    this.colLabelsLayer = this.g.append('g').attr('class', 'col-labels');
    this.highlightLayer = this.g.append('g').attr('class', 'highlight-layer');

    // Initialize scales
    this.scales = {
      x: d3.scaleBand().range([0, this.innerWidth]).padding(0.05),
      y: d3.scaleBand().range([0, this.innerHeight]).padding(0.05),
      color: d3.scaleSequential(d3[this.options.colorScheme]).domain([-2, 2]),
    };
  }

  _setupEventListeners() {
    // Selection changes for samples
    const unsubSample = eventBus.on(Events.SELECTION_CHANGE, (data) => {
      if (data.source !== 'heatmap' && data.type === 'sample') {
        this._updateHighlights();
      }
    });
    this._unsubscribers.push(unsubSample);

    // Selection changes for genes
    const unsubGene = eventBus.on(Events.SELECTION_CHANGE, (data) => {
      if (data.source !== 'heatmap' && data.type === 'gene') {
        this._updateHighlights();
      }
    });
    this._unsubscribers.push(unsubGene);

    // Hover events
    const unsubHover = eventBus.on(Events.HOVER_START, (data) => {
      if (data.source !== 'heatmap') {
        if (data.type === 'sample') {
          this._highlightRow(data.id);
        } else if (data.type === 'gene') {
          this._highlightCol(data.id);
        }
      }
    });
    this._unsubscribers.push(unsubHover);

    const unsubHoverEnd = eventBus.on(Events.HOVER_END, () => {
      this._clearHighlights();
    });
    this._unsubscribers.push(unsubHoverEnd);
  }

  /**
   * Set heatmap data
   * @param {Array} data - Array of { sampleId, geneId, expression } objects
   * @param {Array} rows - Row identifiers (samples)
   * @param {Array} cols - Column identifiers (genes)
   */
  setData(data, rows = null, cols = null) {
    this.data = data;

    // Extract unique rows and columns if not provided
    this.rows = rows || [...new Set(data.map((d) => d[this.options.rowIdField]))];
    this.cols = cols || [...new Set(data.map((d) => d[this.options.colIdField]))];

    // Build matrix lookup
    this.matrixLookup = new Map();
    data.forEach((d) => {
      const key = `${d[this.options.rowIdField]}_${d[this.options.colIdField]}`;
      this.matrixLookup.set(key, d[this.options.valueField]);
    });

    this._updateScales();
    this._render();
  }

  _updateScales() {
    this.scales.x.domain(this.cols);
    this.scales.y.domain(this.rows);

    // Update color scale based on data
    const values = this.data.map((d) => d[this.options.valueField]);
    const extent = d3.extent(values);
    this.scales.color.domain([extent[0], extent[1]]);
  }

  _render() {
    this._renderCells();
    this._renderLabels();
    this._updateHighlights();
  }

  _renderCells() {
    const { rowIdField, colIdField, valueField, cellPadding } = this.options;

    const cellWidth = this.scales.x.bandwidth();
    const cellHeight = this.scales.y.bandwidth();

    // Create cells
    const cells = this.cellsLayer
      .selectAll('rect.cell')
      .data(this.data, (d) => `${d[rowIdField]}_${d[colIdField]}`);

    cells.exit().remove();

    cells
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', (d) => this.scales.x(d[colIdField]))
      .attr('y', (d) => this.scales.y(d[rowIdField]))
      .attr('width', cellWidth - cellPadding)
      .attr('height', cellHeight - cellPadding)
      .attr('fill', (d) => this.scales.color(d[valueField]))
      .on('click', (event, d) => this._onCellClick(event, d))
      .on('mouseenter', (event, d) => this._onCellHover(event, d))
      .on('mouseleave', () => this._onCellLeave())
      .merge(cells)
      .transition()
      .duration(300)
      .attr('x', (d) => this.scales.x(d[colIdField]))
      .attr('y', (d) => this.scales.y(d[rowIdField]))
      .attr('width', cellWidth - cellPadding)
      .attr('height', cellHeight - cellPadding)
      .attr('fill', (d) => this.scales.color(d[valueField]));
  }

  _renderLabels() {
    const cellHeight = this.scales.y.bandwidth();
    const cellWidth = this.scales.x.bandwidth();

    // Row labels
    const rowLabels = this.rowLabelsLayer.selectAll('text.row-label').data(this.rows);

    rowLabels.exit().remove();

    rowLabels
      .enter()
      .append('text')
      .attr('class', 'row-label')
      .merge(rowLabels)
      .attr('x', -5)
      .attr('y', (d) => this.scales.y(d) + cellHeight / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .style('font-size', Math.min(10, cellHeight - 2) + 'px')
      .text((d) => d)
      .on('click', (event, d) => this._onRowLabelClick(event, d))
      .on('mouseenter', (event, d) => this._onRowLabelHover(d))
      .on('mouseleave', () => this._onLabelLeave());

    // Column labels
    const colLabels = this.colLabelsLayer.selectAll('text.col-label').data(this.cols);

    colLabels.exit().remove();

    colLabels
      .enter()
      .append('text')
      .attr('class', 'col-label')
      .merge(colLabels)
      .attr('x', (d) => this.scales.x(d) + cellWidth / 2)
      .attr('y', -5)
      .attr('transform', (d) => {
        const x = this.scales.x(d) + cellWidth / 2;
        return `rotate(-45, ${x}, -5)`;
      })
      .attr('text-anchor', 'start')
      .style('font-size', Math.min(10, cellWidth - 2) + 'px')
      .text((d) => d)
      .on('click', (event, d) => this._onColLabelClick(event, d))
      .on('mouseenter', (event, d) => this._onColLabelHover(d))
      .on('mouseleave', () => this._onLabelLeave());
  }

  _updateHighlights() {
    const { rowIdField, colIdField } = this.options;

    const selectedSamples = new Set(selections.getSelected('sample'));
    const selectedGenes = new Set(selections.getSelected('gene'));

    // Update cell highlighting
    this.cellsLayer
      .selectAll('rect.cell')
      .classed(
        'selected',
        (d) => selectedSamples.has(d[rowIdField]) || selectedGenes.has(d[colIdField])
      )
      .classed('row-selected', (d) => selectedSamples.has(d[rowIdField]))
      .classed('col-selected', (d) => selectedGenes.has(d[colIdField]))
      .attr('stroke', (d) => {
        if (selectedSamples.has(d[rowIdField]) && selectedGenes.has(d[colIdField])) {
          return '#000';
        } else if (selectedSamples.has(d[rowIdField]) || selectedGenes.has(d[colIdField])) {
          return '#666';
        }
        return 'none';
      })
      .attr('stroke-width', (d) => {
        if (selectedSamples.has(d[rowIdField]) || selectedGenes.has(d[colIdField])) {
          return 1;
        }
        return 0;
      });

    // Update row labels
    this.rowLabelsLayer
      .selectAll('text.row-label')
      .classed('selected', (d) => selectedSamples.has(d))
      .attr('font-weight', (d) => (selectedSamples.has(d) ? 'bold' : 'normal'));

    // Update column labels
    this.colLabelsLayer
      .selectAll('text.col-label')
      .classed('selected', (d) => selectedGenes.has(d))
      .attr('font-weight', (d) => (selectedGenes.has(d) ? 'bold' : 'normal'));
  }

  _highlightRow(rowId) {
    const { rowIdField } = this.options;

    this.cellsLayer.selectAll('rect.cell').classed('hovered-row', (d) => d[rowIdField] === rowId);

    this.rowLabelsLayer.selectAll('text.row-label').classed('hovered', (d) => d === rowId);
  }

  _highlightCol(colId) {
    const { colIdField } = this.options;

    this.cellsLayer.selectAll('rect.cell').classed('hovered-col', (d) => d[colIdField] === colId);

    this.colLabelsLayer.selectAll('text.col-label').classed('hovered', (d) => d === colId);
  }

  _clearHighlights() {
    this.cellsLayer
      .selectAll('rect.cell')
      .classed('hovered-row', false)
      .classed('hovered-col', false);

    this.rowLabelsLayer.selectAll('text.row-label').classed('hovered', false);

    this.colLabelsLayer.selectAll('text.col-label').classed('hovered', false);
  }

  _onCellClick(event, d) {
    const { rowIdField, colIdField } = this.options;
    const additive = event.shiftKey || event.metaKey;

    // Select both sample and gene
    if (additive) {
      selections.toggle('sample', d[rowIdField], { source: 'heatmap' });
      selections.toggle('gene', d[colIdField], { source: 'heatmap' });
    } else {
      selections.select('sample', [d[rowIdField]], { source: 'heatmap' });
      selections.select('gene', [d[colIdField]], { source: 'heatmap' });
    }
  }

  _onCellHover(event, d) {
    const { rowIdField, colIdField, valueField } = this.options;

    this._highlightRow(d[rowIdField]);
    this._highlightCol(d[colIdField]);

    eventBus.emit(Events.HOVER_START, {
      type: 'cell',
      sampleId: d[rowIdField],
      geneId: d[colIdField],
      value: d[valueField],
      source: 'heatmap',
      position: { x: event.clientX, y: event.clientY },
    });
  }

  _onCellLeave() {
    this._clearHighlights();
    eventBus.emit(Events.HOVER_END, { source: 'heatmap' });
  }

  _onRowLabelClick(event, rowId) {
    const additive = event.shiftKey || event.metaKey;

    if (additive) {
      selections.toggle('sample', rowId, { source: 'heatmap' });
    } else {
      selections.select('sample', [rowId], { source: 'heatmap' });
    }
  }

  _onColLabelClick(event, colId) {
    const additive = event.shiftKey || event.metaKey;

    if (additive) {
      selections.toggle('gene', colId, { source: 'heatmap' });
    } else {
      selections.select('gene', [colId], { source: 'heatmap' });
    }
  }

  _onRowLabelHover(rowId) {
    store.set('hoveredItem', rowId);
    store.set('hoveredType', 'sample');

    eventBus.emit(Events.HOVER_START, {
      id: rowId,
      type: 'sample',
      source: 'heatmap',
    });
  }

  _onColLabelHover(colId) {
    store.set('hoveredItem', colId);
    store.set('hoveredType', 'gene');

    eventBus.emit(Events.HOVER_START, {
      id: colId,
      type: 'gene',
      source: 'heatmap',
    });
  }

  _onLabelLeave() {
    store.set('hoveredItem', null);
    store.set('hoveredType', null);

    eventBus.emit(Events.HOVER_END, { source: 'heatmap' });
  }

  /**
   * Destroy the component
   */
  destroy() {
    this._unsubscribers.forEach((unsub) => unsub());
    this.svg.remove();

    eventBus.emit(Events.VIEW_DESTROY, { source: 'heatmap' });
  }
}
