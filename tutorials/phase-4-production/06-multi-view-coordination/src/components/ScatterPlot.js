/**
 * Scatter Plot Component - Gene expression visualization with brush selection
 *
 * Demonstrates:
 * - 2D brush for selection
 * - Linked highlighting
 * - Zoom synchronization
 */

import * as d3 from 'd3';
import { eventBus, Events } from '../state/EventBus.js';
import { store } from '../state/Store.js';
import { selections } from '../state/Selections.js';

export class ScatterPlot {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    this.options = {
      width: 500,
      height: 400,
      margin: { top: 20, right: 20, bottom: 40, left: 50 },
      xField: 'x',
      yField: 'y',
      colorField: null,
      idField: 'id',
      selectionType: 'sample',
      ...options,
    };

    this.data = [];
    this.scales = {};
    this.brush = null;
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
      .attr('class', 'scatter-plot');

    // Create main group
    this.g = this.svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Create layers
    this.pointsLayer = this.g.append('g').attr('class', 'points-layer');
    this.brushLayer = this.g.append('g').attr('class', 'brush-layer');
    this.axisLayer = this.g.append('g').attr('class', 'axis-layer');

    // Initialize scales
    this.scales.x = d3.scaleLinear().range([0, this.innerWidth]);
    this.scales.y = d3.scaleLinear().range([this.innerHeight, 0]);
    this.scales.color = d3.scaleOrdinal(d3.schemeCategory10);

    // Create axes
    this.axisLayer
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.innerHeight})`);

    this.axisLayer.append('g').attr('class', 'y-axis');

    // Create brush
    this._initBrush();
  }

  _initBrush() {
    this.brush = d3
      .brush()
      .extent([
        [0, 0],
        [this.innerWidth, this.innerHeight],
      ])
      .on('start', (event) => this._onBrushStart(event))
      .on('brush', (event) => this._onBrush(event))
      .on('end', (event) => this._onBrushEnd(event));

    this.brushLayer.call(this.brush);
  }

  _setupEventListeners() {
    // Listen for selection changes from other views
    const unsubSelection = eventBus.on(Events.SELECTION_CHANGE, (data) => {
      if (data.source !== 'scatter-plot' && data.type === this.options.selectionType) {
        this._updateHighlights();
      }
    });
    this._unsubscribers.push(unsubSelection);

    // Listen for hover events
    const unsubHover = eventBus.on(Events.HOVER_START, (data) => {
      if (data.source !== 'scatter-plot') {
        this._highlightPoint(data.id);
      }
    });
    this._unsubscribers.push(unsubHover);

    const unsubHoverEnd = eventBus.on(Events.HOVER_END, () => {
      this._clearHighlight();
    });
    this._unsubscribers.push(unsubHoverEnd);

    // Listen for filter changes
    const unsubFilter = eventBus.on(Events.FILTER_CHANGE, () => {
      this._applyFilters();
    });
    this._unsubscribers.push(unsubFilter);
  }

  /**
   * Update the visualization with new data
   * @param {Array} data - Array of data points
   */
  setData(data) {
    this.data = data;
    this._updateScales();
    this._render();
    this._updateAxes();
  }

  _updateScales() {
    const { xField, yField, colorField } = this.options;

    // Update x scale
    const xExtent = d3.extent(this.data, (d) => d[xField]);
    this.scales.x.domain([xExtent[0] * 0.95, xExtent[1] * 1.05]);

    // Update y scale
    const yExtent = d3.extent(this.data, (d) => d[yField]);
    this.scales.y.domain([yExtent[0] * 0.95, yExtent[1] * 1.05]);

    // Update color scale if needed
    if (colorField) {
      const colorDomain = [...new Set(this.data.map((d) => d[colorField]))];
      this.scales.color.domain(colorDomain);
    }
  }

  _render() {
    const { xField, yField, colorField, idField } = this.options;
    const selectedIds = selections.getSelected(this.options.selectionType);
    const selectedSet = new Set(selectedIds);

    // Data join
    const points = this.pointsLayer.selectAll('circle.point').data(this.data, (d) => d[idField]);

    // Exit
    points.exit().transition().duration(200).attr('r', 0).remove();

    // Enter + Update
    points
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('r', 0)
      .attr('cx', (d) => this.scales.x(d[xField]))
      .attr('cy', (d) => this.scales.y(d[yField]))
      .merge(points)
      .on('click', (event, d) => this._onPointClick(event, d))
      .on('mouseenter', (event, d) => this._onPointHover(event, d))
      .on('mouseleave', () => this._onPointLeave())
      .transition()
      .duration(300)
      .attr('cx', (d) => this.scales.x(d[xField]))
      .attr('cy', (d) => this.scales.y(d[yField]))
      .attr('r', (d) => (selectedSet.has(d[idField]) ? 6 : 4))
      .attr('fill', (d) => (colorField ? this.scales.color(d[colorField]) : '#3498db'))
      .attr('opacity', (d) => (selectedSet.has(d[idField]) ? 1 : 0.7))
      .attr('stroke', (d) => (selectedSet.has(d[idField]) ? '#000' : 'none'))
      .attr('stroke-width', (d) => (selectedSet.has(d[idField]) ? 2 : 0));
  }

  _updateAxes() {
    const xAxis = d3.axisBottom(this.scales.x).ticks(5);
    const yAxis = d3.axisLeft(this.scales.y).ticks(5);

    this.axisLayer.select('.x-axis').transition().duration(300).call(xAxis);

    this.axisLayer.select('.y-axis').transition().duration(300).call(yAxis);
  }

  _updateHighlights() {
    const selectedIds = selections.getSelected(this.options.selectionType);
    const selectedSet = new Set(selectedIds);
    const { idField } = this.options;

    this.pointsLayer
      .selectAll('circle.point')
      .transition()
      .duration(200)
      .attr('r', (d) => (selectedSet.has(d[idField]) ? 6 : 4))
      .attr('opacity', (d) => {
        if (selectedSet.size === 0) return 0.7;
        return selectedSet.has(d[idField]) ? 1 : 0.2;
      })
      .attr('stroke', (d) => (selectedSet.has(d[idField]) ? '#000' : 'none'))
      .attr('stroke-width', (d) => (selectedSet.has(d[idField]) ? 2 : 0));
  }

  _highlightPoint(id) {
    const { idField } = this.options;

    this.pointsLayer
      .selectAll('circle.point')
      .classed('hovered', (d) => d[idField] === id)
      .filter((d) => d[idField] === id)
      .raise()
      .transition()
      .duration(100)
      .attr('r', 8);
  }

  _clearHighlight() {
    const selectedIds = selections.getSelected(this.options.selectionType);
    const selectedSet = new Set(selectedIds);
    const { idField } = this.options;

    this.pointsLayer
      .selectAll('circle.point.hovered')
      .classed('hovered', false)
      .transition()
      .duration(100)
      .attr('r', (d) => (selectedSet.has(d[idField]) ? 6 : 4));
  }

  _onPointClick(event, d) {
    const { idField, selectionType } = this.options;
    const additive = event.shiftKey || event.metaKey;

    if (additive) {
      selections.toggle(selectionType, d[idField], { source: 'scatter-plot' });
    } else {
      selections.select(selectionType, [d[idField]], { source: 'scatter-plot' });
    }
  }

  _onPointHover(event, d) {
    const { idField, selectionType } = this.options;

    store.set('hoveredItem', d[idField]);
    store.set('hoveredType', selectionType);

    eventBus.emit(Events.HOVER_START, {
      id: d[idField],
      type: selectionType,
      data: d,
      source: 'scatter-plot',
      position: { x: event.clientX, y: event.clientY },
    });
  }

  _onPointLeave() {
    store.set('hoveredItem', null);
    store.set('hoveredType', null);

    eventBus.emit(Events.HOVER_END, { source: 'scatter-plot' });
  }

  _onBrushStart(event) {
    // Clear selection if starting a new brush without modifier key
    if (!event.sourceEvent?.shiftKey && !event.sourceEvent?.metaKey) {
      // Don't clear immediately, wait for brush to complete
    }
  }

  _onBrush(event) {
    if (!event.selection) return;

    const [[x0, y0], [x1, y1]] = event.selection;
    const { xField, yField, idField } = this.options;

    // Find points in brush
    const selectedIds = this.data
      .filter((d) => {
        const x = this.scales.x(d[xField]);
        const y = this.scales.y(d[yField]);
        return x >= x0 && x <= x1 && y >= y0 && y <= y1;
      })
      .map((d) => d[idField]);

    // Emit debounced brush event for preview
    eventBus.emitDebounced(Events.SELECTION_BRUSH, {
      source: 'scatter-plot',
      ids: selectedIds,
      bounds: { x0, y0, x1, y1 },
      preview: true,
    });
  }

  _onBrushEnd(event) {
    if (!event.selection) {
      // Brush was cleared
      if (!event.sourceEvent?.shiftKey) {
        selections.clear(this.options.selectionType, { source: 'scatter-plot' });
      }
      return;
    }

    const [[x0, y0], [x1, y1]] = event.selection;
    const { xField, yField, idField, selectionType } = this.options;
    const additive = event.sourceEvent?.shiftKey || event.sourceEvent?.metaKey;

    // Find points in brush
    const selectedIds = this.data
      .filter((d) => {
        const x = this.scales.x(d[xField]);
        const y = this.scales.y(d[yField]);
        return x >= x0 && x <= x1 && y >= y0 && y <= y1;
      })
      .map((d) => d[idField]);

    // Update selection
    selections.select(selectionType, selectedIds, {
      additive,
      source: 'scatter-plot',
    });

    // Clear the brush after selection
    this.brushLayer.call(this.brush.move, null);
  }

  _applyFilters() {
    const filters = store.get('filters');

    this.pointsLayer.selectAll('circle.point').style('display', (d) => {
      // Apply filters
      if (filters.minExpression !== undefined && d.expression < filters.minExpression) {
        return 'none';
      }
      if (filters.maxExpression !== undefined && d.expression > filters.maxExpression) {
        return 'none';
      }
      if (filters.geneType !== 'all' && d.geneType !== filters.geneType) {
        return 'none';
      }
      return null;
    });
  }

  /**
   * Clear brush selection
   */
  clearBrush() {
    this.brushLayer.call(this.brush.move, null);
  }

  /**
   * Resize the chart
   */
  resize(width, height) {
    this.options.width = width;
    this.options.height = height;

    const { margin } = this.options;
    this.innerWidth = width - margin.left - margin.right;
    this.innerHeight = height - margin.top - margin.bottom;

    this.svg.attr('width', width).attr('height', height);

    this.scales.x.range([0, this.innerWidth]);
    this.scales.y.range([this.innerHeight, 0]);

    this.brush.extent([
      [0, 0],
      [this.innerWidth, this.innerHeight],
    ]);
    this.brushLayer.call(this.brush);

    this.axisLayer.select('.x-axis').attr('transform', `translate(0,${this.innerHeight})`);

    this._render();
    this._updateAxes();
  }

  /**
   * Destroy the component
   */
  destroy() {
    // Unsubscribe from events
    this._unsubscribers.forEach((unsub) => unsub());

    // Remove SVG
    this.svg.remove();

    eventBus.emit(Events.VIEW_DESTROY, { source: 'scatter-plot' });
  }
}
