/**
 * Solution: Exercise 1 - Filter Coordination
 *
 * Advanced filter system with histograms, presets, and cross-filter highlighting
 */

import * as d3 from 'd3';
import { eventBus } from '../state/EventBus.js';
import { store } from '../state/Store.js';

// ============================================
// Part 1: Filter Histogram
// ============================================

class FilterHistogram {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      width: 200,
      height: 40,
      bins: 20,
      margin: { top: 2, right: 5, bottom: 15, left: 5 },
      ...options,
    };

    this.data = [];
    this.filterRange = null;
    this.accessor = options.accessor || ((d) => d);

    this._setupSVG();
    this._setupBrush();
  }

  _setupSVG() {
    const { width, height, margin } = this.options;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    this.svg = d3.select(this.container).append('svg').attr('width', width).attr('height', height);

    this.g = this.svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    this.x = d3.scaleLinear().range([0, innerWidth]);
    this.y = d3.scaleLinear().range([innerHeight, 0]);

    // Bars group
    this.barsGroup = this.g.append('g').attr('class', 'bars');

    // Axis
    this.axisGroup = this.g
      .append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`);

    // Selection overlay
    this.selectionGroup = this.g.append('g').attr('class', 'selection');
  }

  _setupBrush() {
    const { width, height, margin } = this.options;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    this.brush = d3
      .brushX()
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ])
      .on('brush end', (event) => this._onBrush(event));

    this.brushGroup = this.g.append('g').attr('class', 'brush').call(this.brush);
  }

  _onBrush(event) {
    if (!event.selection) {
      this.filterRange = null;
    } else {
      const [x0, x1] = event.selection;
      this.filterRange = [this.x.invert(x0), this.x.invert(x1)];
    }

    this._updateHighlight();

    if (event.type === 'end' && this.options.onFilter) {
      this.options.onFilter(this.filterRange);
    }
  }

  update(data, domain = null) {
    this.data = data;

    // Calculate domain
    const values = data.map(this.accessor);
    const extent = domain || d3.extent(values);
    this.x.domain(extent);

    // Generate histogram
    const histogram = d3.histogram().domain(this.x.domain()).thresholds(this.options.bins);

    this.histogramData = histogram(values);

    // Update scales
    this.y.domain([0, d3.max(this.histogramData, (d) => d.length)]);

    // Update bars
    const bars = this.barsGroup.selectAll('.bar').data(this.histogramData);

    const innerHeight = this.options.height - this.options.margin.top - this.options.margin.bottom;

    bars
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .merge(bars)
      .transition()
      .duration(200)
      .attr('x', (d) => this.x(d.x0))
      .attr('y', (d) => this.y(d.length))
      .attr('width', (d) => Math.max(0, this.x(d.x1) - this.x(d.x0) - 1))
      .attr('height', (d) => innerHeight - this.y(d.length))
      .attr('fill', '#4a90d9')
      .attr('opacity', 0.7);

    bars.exit().remove();

    // Update axis
    this.axisGroup.call(d3.axisBottom(this.x).ticks(3).tickSize(3));

    this._updateHighlight();
  }

  _updateHighlight() {
    const bars = this.barsGroup.selectAll('.bar');

    if (!this.filterRange) {
      bars.attr('opacity', 0.7);
    } else {
      const [min, max] = this.filterRange;
      bars.attr('opacity', (d) => {
        return d.x0 >= min && d.x1 <= max ? 1 : 0.2;
      });
    }
  }

  setRange(range) {
    if (!range) {
      this.brush.move(this.brushGroup, null);
    } else {
      const [min, max] = range;
      this.brush.move(this.brushGroup, [this.x(min), this.x(max)]);
    }
  }
}

// ============================================
// Part 2: Filter Presets
// ============================================

class FilterPresets {
  constructor(storageKey = 'viz-filter-presets') {
    this.storageKey = storageKey;
    this.presets = this._loadFromStorage();
    this.listeners = new Set();
  }

  _loadFromStorage() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.warn('Failed to load presets:', e);
      return {};
    }
  }

  _saveToStorage() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.presets));
    } catch (e) {
      console.warn('Failed to save presets:', e);
    }
  }

  save(name, filters) {
    this.presets[name] = {
      filters: { ...filters },
      savedAt: new Date().toISOString(),
    };
    this._saveToStorage();
    this._notify('save', name);
    return this;
  }

  load(name) {
    const preset = this.presets[name];
    if (!preset) {
      throw new Error(`Preset not found: ${name}`);
    }
    this._notify('load', name, preset.filters);
    return preset.filters;
  }

  delete(name) {
    delete this.presets[name];
    this._saveToStorage();
    this._notify('delete', name);
    return this;
  }

  rename(oldName, newName) {
    if (!this.presets[oldName]) {
      throw new Error(`Preset not found: ${oldName}`);
    }
    this.presets[newName] = this.presets[oldName];
    delete this.presets[oldName];
    this._saveToStorage();
    this._notify('rename', { oldName, newName });
    return this;
  }

  list() {
    return Object.entries(this.presets).map(([name, data]) => ({
      name,
      savedAt: data.savedAt,
      filterCount: Object.keys(data.filters).length,
    }));
  }

  exists(name) {
    return name in this.presets;
  }

  export() {
    return JSON.stringify(this.presets, null, 2);
  }

  import(json) {
    const imported = JSON.parse(json);
    this.presets = { ...this.presets, ...imported };
    this._saveToStorage();
    this._notify('import', Object.keys(imported));
    return this;
  }

  onChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  _notify(action, ...args) {
    this.listeners.forEach((cb) => cb(action, ...args));
  }
}

// ============================================
// Part 3: Cross-Filter Highlighting
// ============================================

class CrossFilterManager {
  constructor(data, filters) {
    this.originalData = data;
    this.filters = filters;
    this.filterFunctions = {};
  }

  registerFilter(name, filterFn) {
    this.filterFunctions[name] = filterFn;
    return this;
  }

  applyAllFilters(data, excludeFilter = null) {
    return data.filter((d) => {
      return Object.entries(this.filters).every(([name, value]) => {
        if (name === excludeFilter) return true;
        if (value === null || value === undefined) return true;

        const filterFn = this.filterFunctions[name];
        return filterFn ? filterFn(d, value) : true;
      });
    });
  }

  getDistributions(field, accessor) {
    const results = {};

    // Full distribution (no filters)
    results.full = this._calculateDistribution(this.originalData, accessor);

    // Filtered distribution (all filters applied)
    results.filtered = this._calculateDistribution(
      this.applyAllFilters(this.originalData),
      accessor
    );

    // Cross-filter distributions (exclude each filter)
    Object.keys(this.filters).forEach((filterName) => {
      results[`without_${filterName}`] = this._calculateDistribution(
        this.applyAllFilters(this.originalData, filterName),
        accessor
      );
    });

    return results;
  }

  _calculateDistribution(data, accessor, bins = 20) {
    const values = data.map(accessor);
    const extent = d3.extent(values);

    const histogram = d3.histogram().domain(extent).thresholds(bins);

    return histogram(values);
  }

  getFilteredCounts() {
    const counts = {
      total: this.originalData.length,
      filtered: this.applyAllFilters(this.originalData).length,
    };

    // Count per filter
    Object.keys(this.filters).forEach((filterName) => {
      counts[filterName] = this.applyAllFilters(this.originalData, filterName).length;
    });

    return counts;
  }
}

// ============================================
// Part 4: Filter Pills
// ============================================

class FilterPills {
  constructor(container) {
    this.container = d3.select(container);
    this.activeFilters = {};
    this.formatters = {};

    this._setupContainer();
  }

  _setupContainer() {
    this.pillsContainer = this.container.append('div').attr('class', 'filter-pills');

    this.clearAllBtn = this.container
      .append('button')
      .attr('class', 'clear-all-btn')
      .style('display', 'none')
      .text('Clear All Filters')
      .on('click', () => this._clearAll());
  }

  registerFormatter(filterKey, formatter) {
    this.formatters[filterKey] = formatter;
    return this;
  }

  update(filters) {
    this.activeFilters = filters;

    // Filter out inactive filters
    const activeEntries = Object.entries(filters).filter(([key, value]) =>
      this._isActive(key, value)
    );

    // Update pills
    const pills = this.pillsContainer.selectAll('.filter-pill').data(activeEntries, (d) => d[0]);

    const enterPills = pills.enter().append('div').attr('class', 'filter-pill');

    enterPills.append('span').attr('class', 'pill-label');

    enterPills
      .append('button')
      .attr('class', 'pill-remove')
      .text('×')
      .on('click', (event, d) => {
        event.stopPropagation();
        this._removeFilter(d[0]);
      });

    pills
      .merge(enterPills)
      .select('.pill-label')
      .text((d) => this._formatFilter(d[0], d[1]));

    pills.exit().remove();

    // Show/hide clear all button
    this.clearAllBtn.style('display', activeEntries.length > 1 ? 'inline-block' : 'none');
  }

  _isActive(key, value) {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    if (typeof value === 'object' && Object.keys(value).length === 0) return false;
    return true;
  }

  _formatFilter(key, value) {
    if (this.formatters[key]) {
      return this.formatters[key](value);
    }

    // Default formatting
    if (Array.isArray(value)) {
      if (value.length === 2 && typeof value[0] === 'number') {
        return `${key}: ${value[0].toFixed(1)} - ${value[1].toFixed(1)}`;
      }
      return `${key}: ${value.length} selected`;
    }

    return `${key}: ${value}`;
  }

  _removeFilter(key) {
    eventBus.emit('filter:clear', { key });
  }

  _clearAll() {
    eventBus.emit('filter:clearAll');
  }
}

// ============================================
// Complete Enhanced Filter Panel
// ============================================

export class EnhancedFilterPanel {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.options = options;

    this.histograms = {};
    this.presets = new FilterPresets();
    this.pills = null;
    this.crossFilter = null;

    this._setup();
  }

  _setup() {
    // Create main structure
    this.element = document.createElement('div');
    this.element.className = 'enhanced-filter-panel';
    this.container.appendChild(this.element);

    // Pills section at top
    const pillsSection = document.createElement('div');
    pillsSection.className = 'pills-section';
    this.element.appendChild(pillsSection);
    this.pills = new FilterPills(pillsSection);

    // Presets section
    this._createPresetsSection();

    // Filters section
    this.filtersContainer = document.createElement('div');
    this.filtersContainer.className = 'filters-container';
    this.element.appendChild(this.filtersContainer);

    // Subscribe to events
    this._setupEventListeners();
  }

  _createPresetsSection() {
    const section = document.createElement('div');
    section.className = 'presets-section';
    section.innerHTML = `
      <div class="presets-header">
        <label>Presets:</label>
        <select class="preset-select">
          <option value="">Select preset...</option>
        </select>
        <button class="save-preset-btn" title="Save current filters">💾</button>
      </div>
    `;

    this.element.appendChild(section);

    // Wire up events
    const select = section.querySelector('.preset-select');
    const saveBtn = section.querySelector('.save-preset-btn');

    select.addEventListener('change', (e) => {
      if (e.target.value) {
        const filters = this.presets.load(e.target.value);
        eventBus.emit('filter:setAll', filters);
      }
    });

    saveBtn.addEventListener('click', () => {
      const name = prompt('Preset name:');
      if (name) {
        const filters = store.getState().filters;
        this.presets.save(name, filters);
        this._updatePresetDropdown();
      }
    });

    this.presetSelect = select;
    this._updatePresetDropdown();
  }

  _updatePresetDropdown() {
    const presets = this.presets.list();
    const options = presets.map((p) => `<option value="${p.name}">${p.name}</option>`).join('');

    this.presetSelect.innerHTML = `<option value="">Select preset...</option>${options}`;
  }

  addHistogramFilter(config) {
    const { id, label, data, accessor, domain } = config;

    const wrapper = document.createElement('div');
    wrapper.className = 'filter-item histogram-filter';
    wrapper.innerHTML = `<label>${label}</label>`;

    this.filtersContainer.appendChild(wrapper);

    const histogram = new FilterHistogram(wrapper, {
      accessor,
      onFilter: (range) => {
        eventBus.emit('filter:change', {
          key: id,
          value: range,
        });
      },
    });

    histogram.update(data, domain);
    this.histograms[id] = histogram;

    return this;
  }

  updateData(data) {
    Object.values(this.histograms).forEach((h) => h.update(data));

    // Update cross-filter
    if (this.crossFilter) {
      const counts = this.crossFilter.getFilteredCounts();
      this._updateFilterCounts(counts);
    }
  }

  _updateFilterCounts(counts) {
    const badge = this.element.querySelector('.filter-count');
    if (badge) {
      badge.textContent = `${counts.filtered} / ${counts.total}`;
    }
  }

  _setupEventListeners() {
    eventBus.on('filter:*', () => {
      const filters = store.getState().filters;
      this.pills.update(filters);
    });

    this.presets.onChange((action) => {
      if (action === 'save' || action === 'delete' || action === 'import') {
        this._updatePresetDropdown();
      }
    });
  }
}

// Export all components
export { FilterHistogram, FilterPresets, CrossFilterManager, FilterPills };
