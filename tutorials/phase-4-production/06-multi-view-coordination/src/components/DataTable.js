/**
 * Data Table Component - Sortable, filterable table with linked selection
 *
 * Demonstrates:
 * - Row selection synced with visualizations
 * - Filtering coordination
 * - Sort state management
 */

import * as d3 from 'd3';
import { eventBus, Events } from '../state/EventBus.js';
import { store } from '../state/Store.js';
import { selections } from '../state/Selections.js';

export class DataTable {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    this.options = {
      columns: [], // { key, label, sortable, formatter }
      idField: 'id',
      selectionType: 'sample',
      pageSize: 20,
      sortField: null,
      sortDirection: 'asc',
      ...options,
    };

    this.data = [];
    this.filteredData = [];
    this.currentPage = 0;
    this._unsubscribers = [];

    this._init();
    this._setupEventListeners();
  }

  _init() {
    // Create table structure
    this.tableContainer = d3
      .select(this.container)
      .append('div')
      .attr('class', 'data-table-container');

    // Controls
    this.controls = this.tableContainer.append('div').attr('class', 'table-controls');

    // Search input
    this.searchInput = this.controls
      .append('input')
      .attr('type', 'text')
      .attr('placeholder', 'Search...')
      .attr('class', 'table-search')
      .on('input', () => this._onSearch());

    // Selection info
    this.selectionInfo = this.controls.append('span').attr('class', 'selection-info');

    // Table wrapper
    this.tableWrapper = this.tableContainer.append('div').attr('class', 'table-wrapper');

    // Table
    this.table = this.tableWrapper.append('table').attr('class', 'data-table');

    this.thead = this.table.append('thead');
    this.tbody = this.table.append('tbody');

    // Pagination
    this.pagination = this.tableContainer.append('div').attr('class', 'table-pagination');

    this._renderHeader();
  }

  _setupEventListeners() {
    // Listen for selection changes from other views
    const unsubSelection = eventBus.on(Events.SELECTION_CHANGE, (data) => {
      if (data.source !== 'data-table' && data.type === this.options.selectionType) {
        this._updateRowHighlights();
        this._updateSelectionInfo();
      }
    });
    this._unsubscribers.push(unsubSelection);

    // Listen for selection clear
    const unsubClear = eventBus.on(Events.SELECTION_CLEAR, (data) => {
      if (data.type === this.options.selectionType || data.type === 'all') {
        this._updateRowHighlights();
        this._updateSelectionInfo();
      }
    });
    this._unsubscribers.push(unsubClear);

    // Listen for hover events
    const unsubHover = eventBus.on(Events.HOVER_START, (data) => {
      if (data.source !== 'data-table') {
        this._highlightRow(data.id);
      }
    });
    this._unsubscribers.push(unsubHover);

    const unsubHoverEnd = eventBus.on(Events.HOVER_END, () => {
      this._clearRowHighlight();
    });
    this._unsubscribers.push(unsubHoverEnd);

    // Listen for filter changes
    const unsubFilter = eventBus.on(Events.FILTER_CHANGE, () => {
      this._applyFilters();
    });
    this._unsubscribers.push(unsubFilter);
  }

  _renderHeader() {
    const { columns, sortField, sortDirection } = this.options;

    const headerRow = this.thead.selectAll('tr').data([columns]).join('tr');

    // Selection checkbox column
    headerRow
      .selectAll('th.select-col')
      .data([1])
      .join('th')
      .attr('class', 'select-col')
      .append('input')
      .attr('type', 'checkbox')
      .on('change', (event) => this._onSelectAll(event));

    // Data columns
    headerRow
      .selectAll('th.data-col')
      .data(columns)
      .join('th')
      .attr('class', (d) => `data-col ${d.sortable ? 'sortable' : ''}`)
      .html((d) => {
        let html = d.label;
        if (d.sortable) {
          const sortClass = d.key === sortField ? `sort-${sortDirection}` : '';
          html += ` <span class="sort-indicator ${sortClass}"></span>`;
        }
        return html;
      })
      .on('click', (event, d) => {
        if (d.sortable) {
          this._onSort(d.key);
        }
      });
  }

  /**
   * Set table data
   * @param {Array} data - Array of row data
   */
  setData(data) {
    this.data = data;
    this.filteredData = [...data];
    this.currentPage = 0;

    this._sortData();
    this._render();
    this._updateSelectionInfo();
  }

  _sortData() {
    const { sortField, sortDirection } = this.options;

    if (!sortField) return;

    this.filteredData.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      // Handle null/undefined
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Numeric comparison
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // String comparison
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();

      if (sortDirection === 'asc') {
        return aVal.localeCompare(bVal);
      } else {
        return bVal.localeCompare(aVal);
      }
    });
  }

  _render() {
    const { columns, idField, pageSize } = this.options;
    const selectedIds = selections.getSelected(this.options.selectionType);
    const selectedSet = new Set(selectedIds);

    // Get current page data
    const start = this.currentPage * pageSize;
    const pageData = this.filteredData.slice(start, start + pageSize);

    // Data rows
    const rows = this.tbody.selectAll('tr').data(pageData, (d) => d[idField]);

    rows.exit().remove();

    const rowsEnter = rows
      .enter()
      .append('tr')
      .attr('class', (d) => (selectedSet.has(d[idField]) ? 'selected' : ''));

    // Selection checkbox
    rowsEnter.append('td').attr('class', 'select-col').append('input').attr('type', 'checkbox');

    // Data cells
    columns.forEach((col) => {
      rowsEnter.append('td').attr('class', `data-col col-${col.key}`);
    });

    // Update all rows
    const allRows = rowsEnter.merge(rows);

    allRows
      .attr('class', (d) => (selectedSet.has(d[idField]) ? 'selected' : ''))
      .on('click', (event, d) => this._onRowClick(event, d))
      .on('mouseenter', (event, d) => this._onRowHover(event, d))
      .on('mouseleave', () => this._onRowLeave());

    // Update checkboxes
    allRows.select('td.select-col input').property('checked', (d) => selectedSet.has(d[idField]));

    // Update data cells
    columns.forEach((col) => {
      allRows
        .select(`td.col-${col.key}`)
        .text((d) => (col.formatter ? col.formatter(d[col.key], d) : d[col.key]));
    });

    // Update pagination
    this._renderPagination();
  }

  _renderPagination() {
    const { pageSize } = this.options;
    const totalPages = Math.ceil(this.filteredData.length / pageSize);

    this.pagination.html('');

    if (totalPages <= 1) return;

    // Previous button
    this.pagination
      .append('button')
      .text('← Prev')
      .attr('disabled', this.currentPage === 0 ? true : null)
      .on('click', () => this._changePage(this.currentPage - 1));

    // Page info
    this.pagination
      .append('span')
      .attr('class', 'page-info')
      .text(`Page ${this.currentPage + 1} of ${totalPages}`);

    // Next button
    this.pagination
      .append('button')
      .text('Next →')
      .attr('disabled', this.currentPage >= totalPages - 1 ? true : null)
      .on('click', () => this._changePage(this.currentPage + 1));
  }

  _changePage(page) {
    const { pageSize } = this.options;
    const totalPages = Math.ceil(this.filteredData.length / pageSize);

    this.currentPage = Math.max(0, Math.min(page, totalPages - 1));
    this._render();
  }

  _updateRowHighlights() {
    const selectedIds = selections.getSelected(this.options.selectionType);
    const selectedSet = new Set(selectedIds);
    const { idField } = this.options;

    this.tbody
      .selectAll('tr')
      .attr('class', (d) => (selectedSet.has(d[idField]) ? 'selected' : ''))
      .select('td.select-col input')
      .property('checked', (d) => selectedSet.has(d[idField]));
  }

  _highlightRow(id) {
    const { idField } = this.options;

    this.tbody.selectAll('tr').classed('hovered', (d) => d[idField] === id);

    // Scroll into view if not visible
    const row = this.tbody
      .selectAll('tr')
      .filter((d) => d[idField] === id)
      .node();

    if (row) {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  _clearRowHighlight() {
    this.tbody.selectAll('tr').classed('hovered', false);
  }

  _updateSelectionInfo() {
    const count = selections.getCount(this.options.selectionType);
    const total = this.filteredData.length;

    if (count > 0) {
      this.selectionInfo.text(`${count} of ${total} selected`);
    } else {
      this.selectionInfo.text(`${total} rows`);
    }
  }

  _onRowClick(event, d) {
    // Ignore if clicking checkbox directly
    if (event.target.type === 'checkbox') return;

    const { idField, selectionType } = this.options;
    const additive = event.shiftKey || event.metaKey;

    if (additive) {
      selections.toggle(selectionType, d[idField], { source: 'data-table' });
    } else {
      selections.select(selectionType, [d[idField]], { source: 'data-table' });
    }
  }

  _onRowHover(event, d) {
    const { idField, selectionType } = this.options;

    store.set('hoveredItem', d[idField]);
    store.set('hoveredType', selectionType);

    eventBus.emit(Events.HOVER_START, {
      id: d[idField],
      type: selectionType,
      data: d,
      source: 'data-table',
    });
  }

  _onRowLeave() {
    store.set('hoveredItem', null);
    store.set('hoveredType', null);

    eventBus.emit(Events.HOVER_END, { source: 'data-table' });
  }

  _onSort(field) {
    if (this.options.sortField === field) {
      // Toggle direction
      this.options.sortDirection = this.options.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.options.sortField = field;
      this.options.sortDirection = 'asc';
    }

    this._sortData();
    this._renderHeader();
    this._render();
  }

  _onSearch() {
    const query = this.searchInput.property('value').toLowerCase();
    const { columns, idField } = this.options;

    if (!query) {
      this.filteredData = [...this.data];
    } else {
      this.filteredData = this.data.filter((d) => {
        // Search in all columns
        return columns.some((col) => {
          const value = d[col.key];
          if (value == null) return false;
          return String(value).toLowerCase().includes(query);
        });
      });
    }

    this.currentPage = 0;
    this._sortData();
    this._render();
    this._updateSelectionInfo();
  }

  _onSelectAll(event) {
    const { idField, selectionType } = this.options;
    const checked = event.target.checked;

    if (checked) {
      const allIds = this.filteredData.map((d) => d[idField]);
      selections.select(selectionType, allIds, { source: 'data-table' });
    } else {
      selections.clear(selectionType, { source: 'data-table' });
    }
  }

  _applyFilters() {
    const filters = store.get('filters');

    this.filteredData = this.data.filter((d) => {
      if (filters.minExpression !== undefined && d.expression < filters.minExpression) {
        return false;
      }
      if (filters.maxExpression !== undefined && d.expression > filters.maxExpression) {
        return false;
      }
      if (filters.geneType !== 'all' && d.geneType !== filters.geneType) {
        return false;
      }
      return true;
    });

    this.currentPage = 0;
    this._sortData();
    this._render();
    this._updateSelectionInfo();
  }

  /**
   * Scroll to show selected items
   */
  scrollToSelection() {
    const selectedIds = selections.getSelected(this.options.selectionType);
    if (selectedIds.length === 0) return;

    // Find page with first selected item
    const { idField, pageSize } = this.options;
    const firstSelectedId = selectedIds[0];
    const index = this.filteredData.findIndex((d) => d[idField] === firstSelectedId);

    if (index >= 0) {
      this.currentPage = Math.floor(index / pageSize);
      this._render();
    }
  }

  /**
   * Export visible data to CSV
   */
  exportCSV() {
    const { columns } = this.options;

    const header = columns.map((c) => c.label).join(',');
    const rows = this.filteredData.map((d) =>
      columns
        .map((c) => {
          let val = d[c.key];
          if (typeof val === 'string' && val.includes(',')) {
            val = `"${val}"`;
          }
          return val;
        })
        .join(',')
    );

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.csv';
    a.click();

    URL.revokeObjectURL(url);
  }

  /**
   * Destroy the component
   */
  destroy() {
    this._unsubscribers.forEach((unsub) => unsub());
    this.tableContainer.remove();

    eventBus.emit(Events.VIEW_DESTROY, { source: 'data-table' });
  }
}
