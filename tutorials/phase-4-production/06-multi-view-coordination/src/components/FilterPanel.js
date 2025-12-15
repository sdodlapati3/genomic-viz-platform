/**
 * Filter Panel Component - Coordinates filters across all views
 *
 * Demonstrates:
 * - Centralized filter state
 * - Real-time filter updates
 * - Filter persistence
 */

import * as d3 from 'd3';
import { eventBus, Events } from '../state/EventBus.js';
import { store } from '../state/Store.js';

export class FilterPanel {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    this.options = {
      expressionRange: [0, 10],
      vafRange: [0, 1],
      geneTypes: ['all', 'oncogene', 'tumor suppressor', 'other'],
      sampleGroups: [],
      ...options,
    };

    this._unsubscribers = [];

    this._init();
    this._setupEventListeners();
  }

  _init() {
    const panel = d3.select(this.container).append('div').attr('class', 'filter-panel');

    // Header
    panel.append('h3').text('Filters').attr('class', 'filter-header');

    // Expression range filter
    this._createRangeFilter(panel, {
      label: 'Expression Level',
      id: 'expression',
      range: this.options.expressionRange,
      step: 0.1,
      onUpdate: (min, max) => this._updateFilter('minExpression', min, 'maxExpression', max),
    });

    // VAF filter
    this._createRangeFilter(panel, {
      label: 'VAF Range',
      id: 'vaf',
      range: this.options.vafRange,
      step: 0.01,
      format: (v) => `${(v * 100).toFixed(0)}%`,
      onUpdate: (min, max) => this._updateFilter('minVAF', min, 'maxVAF', max),
    });

    // Gene type filter
    this._createSelectFilter(panel, {
      label: 'Gene Type',
      id: 'geneType',
      options: this.options.geneTypes,
      onUpdate: (value) => this._updateFilter('geneType', value),
    });

    // Sample groups (checkboxes)
    if (this.options.sampleGroups.length > 0) {
      this._createCheckboxFilter(panel, {
        label: 'Sample Groups',
        id: 'sampleGroups',
        options: this.options.sampleGroups,
        onUpdate: (selected) => this._updateFilter('sampleGroups', selected),
      });
    }

    // Reset button
    panel
      .append('button')
      .attr('class', 'filter-reset')
      .text('Reset Filters')
      .on('click', () => this._resetFilters());

    // Active filters display
    this.activeFiltersContainer = panel.append('div').attr('class', 'active-filters');
  }

  _createRangeFilter(parent, config) {
    const { label, id, range, step, format = (v) => v.toFixed(1), onUpdate } = config;

    const group = parent.append('div').attr('class', 'filter-group range-filter');

    group.append('label').text(label);

    const row = group.append('div').attr('class', 'range-row');

    // Min input
    const minInput = row
      .append('input')
      .attr('type', 'number')
      .attr('class', 'range-min')
      .attr('min', range[0])
      .attr('max', range[1])
      .attr('step', step)
      .attr('value', range[0])
      .on('change', function () {
        const min = parseFloat(this.value);
        const max = parseFloat(maxInput.property('value'));
        onUpdate(min, max);
      });

    row.append('span').text(' — ');

    // Max input
    const maxInput = row
      .append('input')
      .attr('type', 'number')
      .attr('class', 'range-max')
      .attr('min', range[0])
      .attr('max', range[1])
      .attr('step', step)
      .attr('value', range[1])
      .on('change', function () {
        const min = parseFloat(minInput.property('value'));
        const max = parseFloat(this.value);
        onUpdate(min, max);
      });

    // Slider (optional enhanced UX)
    const sliderContainer = group.append('div').attr('class', 'range-slider-container');

    // Using two range inputs for min/max slider
    const minSlider = sliderContainer
      .append('input')
      .attr('type', 'range')
      .attr('class', 'range-slider min-slider')
      .attr('min', range[0])
      .attr('max', range[1])
      .attr('step', step)
      .attr('value', range[0])
      .on('input', function () {
        const min = parseFloat(this.value);
        const max = parseFloat(maxSlider.property('value'));
        if (min <= max) {
          minInput.property('value', min);
          onUpdate(min, max);
        }
      });

    const maxSlider = sliderContainer
      .append('input')
      .attr('type', 'range')
      .attr('class', 'range-slider max-slider')
      .attr('min', range[0])
      .attr('max', range[1])
      .attr('step', step)
      .attr('value', range[1])
      .on('input', function () {
        const min = parseFloat(minSlider.property('value'));
        const max = parseFloat(this.value);
        if (max >= min) {
          maxInput.property('value', max);
          onUpdate(min, max);
        }
      });

    // Store references for updates
    this[`${id}Filter`] = { minInput, maxInput, minSlider, maxSlider };
  }

  _createSelectFilter(parent, config) {
    const { label, id, options, onUpdate } = config;

    const group = parent.append('div').attr('class', 'filter-group select-filter');

    group.append('label').attr('for', `filter-${id}`).text(label);

    const select = group
      .append('select')
      .attr('id', `filter-${id}`)
      .attr('class', 'filter-select')
      .on('change', function () {
        onUpdate(this.value);
      });

    select
      .selectAll('option')
      .data(options)
      .join('option')
      .attr('value', (d) => d)
      .text((d) => d.charAt(0).toUpperCase() + d.slice(1));

    this[`${id}Filter`] = select;
  }

  _createCheckboxFilter(parent, config) {
    const { label, id, options, onUpdate } = config;

    const group = parent.append('div').attr('class', 'filter-group checkbox-filter');

    group.append('label').text(label);

    const checkboxContainer = group.append('div').attr('class', 'checkbox-container');

    const checkboxes = [];

    options.forEach((option) => {
      const row = checkboxContainer.append('div').attr('class', 'checkbox-row');

      const checkbox = row
        .append('input')
        .attr('type', 'checkbox')
        .attr('id', `filter-${id}-${option}`)
        .attr('value', option)
        .property('checked', true)
        .on('change', () => {
          const selected = checkboxes
            .filter((cb) => cb.property('checked'))
            .map((cb) => cb.property('value'));
          onUpdate(selected);
        });

      checkboxes.push(checkbox);

      row.append('label').attr('for', `filter-${id}-${option}`).text(option);
    });

    this[`${id}Filter`] = checkboxes;
  }

  _setupEventListeners() {
    // Watch for external filter changes
    const unwatch = store.watch('filters', (filters) => {
      this._updateActiveFiltersDisplay(filters);
    });
    this._unsubscribers.push(unwatch);
  }

  _updateFilter(key1, value1, key2 = null, value2 = null) {
    const currentFilters = store.get('filters');
    const updates = { ...currentFilters, [key1]: value1 };

    if (key2) {
      updates[key2] = value2;
    }

    store.set('filters', updates);

    eventBus.emit(Events.FILTER_CHANGE, {
      filters: updates,
      source: 'filter-panel',
    });
  }

  _resetFilters() {
    const defaults = {
      minExpression: this.options.expressionRange[0],
      maxExpression: this.options.expressionRange[1],
      minVAF: this.options.vafRange[0],
      maxVAF: this.options.vafRange[1],
      geneType: 'all',
      sampleGroups: [...this.options.sampleGroups],
    };

    store.set('filters', defaults);

    // Reset UI
    if (this.expressionFilter) {
      this.expressionFilter.minInput.property('value', defaults.minExpression);
      this.expressionFilter.maxInput.property('value', defaults.maxExpression);
      this.expressionFilter.minSlider.property('value', defaults.minExpression);
      this.expressionFilter.maxSlider.property('value', defaults.maxExpression);
    }

    if (this.vafFilter) {
      this.vafFilter.minInput.property('value', defaults.minVAF);
      this.vafFilter.maxInput.property('value', defaults.maxVAF);
      this.vafFilter.minSlider.property('value', defaults.minVAF);
      this.vafFilter.maxSlider.property('value', defaults.maxVAF);
    }

    if (this.geneTypeFilter) {
      this.geneTypeFilter.property('value', 'all');
    }

    if (this.sampleGroupsFilter) {
      this.sampleGroupsFilter.forEach((cb) => cb.property('checked', true));
    }

    eventBus.emit(Events.FILTER_RESET, {
      filters: defaults,
      source: 'filter-panel',
    });
  }

  _updateActiveFiltersDisplay(filters) {
    const activeTags = [];

    if (filters.minExpression > this.options.expressionRange[0]) {
      activeTags.push(`Expr ≥ ${filters.minExpression.toFixed(1)}`);
    }
    if (filters.maxExpression < this.options.expressionRange[1]) {
      activeTags.push(`Expr ≤ ${filters.maxExpression.toFixed(1)}`);
    }
    if (filters.minVAF > this.options.vafRange[0]) {
      activeTags.push(`VAF ≥ ${(filters.minVAF * 100).toFixed(0)}%`);
    }
    if (filters.maxVAF < this.options.vafRange[1]) {
      activeTags.push(`VAF ≤ ${(filters.maxVAF * 100).toFixed(0)}%`);
    }
    if (filters.geneType !== 'all') {
      activeTags.push(`Type: ${filters.geneType}`);
    }

    const tags = this.activeFiltersContainer.selectAll('.filter-tag').data(activeTags);

    tags.exit().remove();

    tags
      .enter()
      .append('span')
      .attr('class', 'filter-tag')
      .merge(tags)
      .text((d) => d);
  }

  /**
   * Destroy the component
   */
  destroy() {
    this._unsubscribers.forEach((unsub) => unsub());
    d3.select(this.container).select('.filter-panel').remove();
  }
}
