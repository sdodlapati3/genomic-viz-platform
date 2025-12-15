/**
 * SampleTable - Interactive table showing samples with selection support
 *
 * Displays sample information with sorting, filtering, and
 * linked selection/highlighting with other views.
 */

import * as d3 from 'd3';
import { Sample, SampleType } from '../types';
import { EventBus } from '../state';

export interface SampleTableConfig {
  width: number;
  height: number;
  pageSize: number;
  columns: SampleTableColumn[];
}

export interface SampleTableColumn {
  key: keyof Sample | 'mutationCount';
  label: string;
  width?: number;
  sortable?: boolean;
  formatter?: (value: unknown, sample: Sample) => string;
}

const DEFAULT_COLUMNS: SampleTableColumn[] = [
  { key: 'id', label: 'Sample ID', width: 80, sortable: true },
  { key: 'sampleType', label: 'Type', width: 80, sortable: true },
  { key: 'diagnosis', label: 'Diagnosis', width: 120, sortable: true },
  { key: 'age', label: 'Age', width: 50, sortable: true, formatter: (v) => (v ? String(v) : '-') },
  { key: 'sex', label: 'Sex', width: 50, sortable: true, formatter: (v) => (v as string) || '-' },
  {
    key: 'mutationCount',
    label: 'Mutations',
    width: 70,
    sortable: true,
    formatter: (_, s) => String(s.mutations.length),
  },
];

const DEFAULT_CONFIG: SampleTableConfig = {
  width: 500,
  height: 400,
  pageSize: 50,
  columns: DEFAULT_COLUMNS,
};

const SAMPLE_TYPE_COLORS: Record<SampleType, string> = {
  tumor: '#e74c3c',
  normal: '#2ecc71',
  cell_line: '#9b59b6',
  xenograft: '#3498db',
};

export class SampleTable {
  private container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private config: SampleTableConfig;
  private allSamples: Sample[] = [];
  private filteredSamples: Sample[] = [];
  private selectedSamples: Set<string> = new Set();
  private highlightedSamples: Set<string> = new Set();
  private sortKey: string = 'id';
  private sortDirection: 'asc' | 'desc' = 'asc';

  constructor(parentSelector: string, config: Partial<SampleTableConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    const parent = d3.select(parentSelector);
    parent.selectAll('*').remove();

    this.container = parent
      .append('div')
      .attr('class', 'sample-table-container')
      .style('width', `${this.config.width}px`)
      .style('height', `${this.config.height}px`)
      .style('display', 'flex')
      .style('flex-direction', 'column')
      .style('font-family', 'system-ui, -apple-system, sans-serif')
      .style('font-size', '12px');

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    EventBus.on('selection:change', (event) => {
      if (event.source !== 'sample-table') {
        this.selectedSamples = new Set(event.sampleIds);
        this.updateSelection();
      }
    });

    EventBus.on('selection:clear', (event) => {
      if (event.source !== 'sample-table') {
        this.selectedSamples.clear();
        this.updateSelection();
      }
    });

    EventBus.on('highlight:show', (event) => {
      if (event.source !== 'sample-table') {
        this.highlightedSamples = new Set(event.sampleIds);
        this.updateHighlight();
      }
    });

    EventBus.on('highlight:hide', () => {
      this.highlightedSamples.clear();
      this.updateHighlight();
    });
  }

  /**
   * Set sample data
   */
  setData(samples: Sample[]): void {
    this.allSamples = samples;
    this.filteredSamples = [...samples];
    this.applySort();
    this.render();
  }

  private render(): void {
    this.container.selectAll('*').remove();

    // Header with selection info
    this.renderHeader();

    // Table
    this.renderTable();

    // Footer with selection summary
    this.renderFooter();
  }

  private renderHeader(): void {
    const header = this.container
      .append('div')
      .attr('class', 'table-header')
      .style('padding', '8px 12px')
      .style('background', '#f8f9fa')
      .style('border-bottom', '1px solid #ddd')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('align-items', 'center');

    header
      .append('span')
      .style('font-weight', 'bold')
      .text(`Samples (${this.filteredSamples.length}/${this.allSamples.length})`);

    // Select all / Clear buttons
    const buttons = header.append('div');

    buttons
      .append('button')
      .style('margin-right', '8px')
      .style('padding', '4px 8px')
      .style('border', '1px solid #ddd')
      .style('border-radius', '3px')
      .style('background', '#fff')
      .style('cursor', 'pointer')
      .style('font-size', '11px')
      .text('Select All')
      .on('click', () => this.selectAll());

    buttons
      .append('button')
      .style('padding', '4px 8px')
      .style('border', '1px solid #ddd')
      .style('border-radius', '3px')
      .style('background', '#fff')
      .style('cursor', 'pointer')
      .style('font-size', '11px')
      .text('Clear')
      .on('click', () => this.clearSelection());
  }

  private renderTable(): void {
    const tableWrapper = this.container
      .append('div')
      .attr('class', 'table-wrapper')
      .style('flex', '1')
      .style('overflow', 'auto')
      .style('border', '1px solid #ddd');

    const table = tableWrapper
      .append('table')
      .style('width', '100%')
      .style('border-collapse', 'collapse');

    // Table header
    const thead = table
      .append('thead')
      .style('position', 'sticky')
      .style('top', '0')
      .style('background', '#f0f0f0')
      .style('z-index', '1');

    const headerRow = thead.append('tr');

    // Checkbox column
    headerRow
      .append('th')
      .style('width', '30px')
      .style('padding', '8px 4px')
      .style('border-bottom', '2px solid #ddd')
      .append('input')
      .attr('type', 'checkbox')
      .on('change', (event) => {
        if ((event.target as HTMLInputElement).checked) {
          this.selectAll();
        } else {
          this.clearSelection();
        }
      });

    // Data columns
    this.config.columns.forEach((col) => {
      const th = headerRow
        .append('th')
        .style('padding', '8px')
        .style('text-align', 'left')
        .style('border-bottom', '2px solid #ddd')
        .style('cursor', col.sortable ? 'pointer' : 'default')
        .style('user-select', 'none')
        .text(col.label);

      if (col.width) {
        th.style('width', `${col.width}px`);
      }

      if (col.sortable) {
        th.on('click', () => this.handleSort(col.key));

        if (this.sortKey === col.key) {
          th.append('span')
            .style('margin-left', '4px')
            .text(this.sortDirection === 'asc' ? '▲' : '▼');
        }
      }
    });

    // Table body
    const tbody = table.append('tbody');

    this.filteredSamples.forEach((sample) => {
      const row = tbody
        .append('tr')
        .attr('class', 'sample-row')
        .attr('data-sample-id', sample.id)
        .style('cursor', 'pointer')
        .style('transition', 'background 0.15s ease');

      // Checkbox
      row
        .append('td')
        .style('padding', '6px 4px')
        .style('border-bottom', '1px solid #eee')
        .append('input')
        .attr('type', 'checkbox')
        .property('checked', this.selectedSamples.has(sample.id))
        .on('click', (event) => event.stopPropagation())
        .on('change', (event) => {
          const checked = (event.target as HTMLInputElement).checked;
          this.toggleSampleSelection(sample.id, checked);
        });

      // Data cells
      this.config.columns.forEach((col) => {
        const cell = row
          .append('td')
          .style('padding', '6px 8px')
          .style('border-bottom', '1px solid #eee');

        let value: unknown;
        if (col.key === 'mutationCount') {
          value = sample.mutations.length;
        } else {
          value = sample[col.key];
        }

        const displayValue = col.formatter ? col.formatter(value, sample) : String(value ?? '-');

        // Special formatting for sample type
        if (col.key === 'sampleType') {
          cell
            .append('span')
            .style('display', 'inline-block')
            .style('width', '8px')
            .style('height', '8px')
            .style('border-radius', '50%')
            .style('background', SAMPLE_TYPE_COLORS[sample.sampleType])
            .style('margin-right', '6px');
        }

        cell.append('span').text(displayValue);
      });

      // Row events
      row
        .on('mouseover', () => this.handleRowMouseOver(sample))
        .on('mouseout', () => this.handleRowMouseOut())
        .on('click', (event) => this.handleRowClick(event, sample));
    });
  }

  private renderFooter(): void {
    const footer = this.container
      .append('div')
      .attr('class', 'table-footer')
      .style('padding', '8px 12px')
      .style('background', '#f8f9fa')
      .style('border-top', '1px solid #ddd')
      .style('font-size', '11px')
      .style('color', '#666');

    footer.text(this.getSelectionSummary());
  }

  private handleSort(key: string): void {
    if (this.sortKey === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = key;
      this.sortDirection = 'asc';
    }
    this.applySort();
    this.render();
  }

  private applySort(): void {
    const key = this.sortKey as keyof Sample | 'mutationCount';

    this.filteredSamples.sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;

      if (key === 'mutationCount') {
        aVal = a.mutations.length;
        bVal = b.mutations.length;
      } else {
        aVal = a[key];
        bVal = b[key];
      }

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      }

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  private handleRowMouseOver(sample: Sample): void {
    EventBus.emit('highlight:show', {
      sampleIds: [sample.id],
      mutationIds: sample.mutations,
      source: 'sample-table',
    });
  }

  private handleRowMouseOut(): void {
    EventBus.emit('highlight:hide', {
      sampleIds: [],
      mutationIds: [],
      source: 'sample-table',
    });
  }

  private handleRowClick(event: MouseEvent, sample: Sample): void {
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;

    if (additive) {
      this.toggleSampleSelection(sample.id, !this.selectedSamples.has(sample.id));
    } else {
      this.selectedSamples = new Set([sample.id]);
      EventBus.emit('selection:change', {
        sampleIds: [sample.id],
        mutationIds: sample.mutations,
        source: 'sample-table',
        type: 'click',
      });
    }
  }

  private toggleSampleSelection(sampleId: string, selected: boolean): void {
    if (selected) {
      this.selectedSamples.add(sampleId);
    } else {
      this.selectedSamples.delete(sampleId);
    }

    // Get mutations for selected samples
    const mutationIds = new Set<string>();
    this.allSamples
      .filter((s) => this.selectedSamples.has(s.id))
      .forEach((s) => s.mutations.forEach((m) => mutationIds.add(m)));

    EventBus.emit('selection:change', {
      sampleIds: Array.from(this.selectedSamples),
      mutationIds: Array.from(mutationIds),
      source: 'sample-table',
      type: 'click',
      additive: true,
    });
  }

  private selectAll(): void {
    this.selectedSamples = new Set(this.filteredSamples.map((s) => s.id));

    const mutationIds = new Set<string>();
    this.filteredSamples.forEach((s) => s.mutations.forEach((m) => mutationIds.add(m)));

    EventBus.emit('selection:change', {
      sampleIds: Array.from(this.selectedSamples),
      mutationIds: Array.from(mutationIds),
      source: 'sample-table',
      type: 'click',
    });
  }

  private clearSelection(): void {
    this.selectedSamples.clear();
    EventBus.emit('selection:clear', { source: 'sample-table' });
  }

  private updateSelection(): void {
    this.container.selectAll('.sample-row').style('background', (_d: unknown, i: number) => {
      const sample = this.filteredSamples[i];
      if (this.selectedSamples.has(sample.id)) return '#e3f2fd';
      return i % 2 === 0 ? '#fff' : '#fafafa';
    });

    // Update checkboxes
    this.container
      .selectAll('.sample-row input[type="checkbox"]')
      .property('checked', (_d: unknown, i: number) => {
        const sample = this.filteredSamples[i];
        return this.selectedSamples.has(sample.id);
      });

    // Update footer
    this.container.select('.table-footer').text(this.getSelectionSummary());
  }

  private updateHighlight(): void {
    this.container.selectAll('.sample-row').style('opacity', (_d: unknown, i: number) => {
      if (this.highlightedSamples.size === 0) return 1;
      const sample = this.filteredSamples[i];
      return this.highlightedSamples.has(sample.id) ? 1 : 0.4;
    });
  }

  private getSelectionSummary(): string {
    const count = this.selectedSamples.size;
    if (count === 0) return 'No samples selected';
    return `${count} sample${count !== 1 ? 's' : ''} selected`;
  }

  /**
   * Filter samples by criteria
   */
  filter(predicate: (sample: Sample) => boolean): void {
    this.filteredSamples = this.allSamples.filter(predicate);
    this.applySort();
    this.render();
  }

  /**
   * Reset filter
   */
  resetFilter(): void {
    this.filteredSamples = [...this.allSamples];
    this.applySort();
    this.render();
  }

  /**
   * Get selected samples
   */
  getSelectedSamples(): Sample[] {
    return this.allSamples.filter((s) => this.selectedSamples.has(s.id));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.remove();
  }
}
