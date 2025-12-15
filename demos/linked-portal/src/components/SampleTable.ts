/**
 * SampleTable - Interactive sample table with linked selection
 *
 * Features:
 * - Sortable columns
 * - Row selection (click and multi-select)
 * - Linked highlighting with other views
 * - Mutation counts per sample
 * - Disease and status indicators
 */

import * as d3 from 'd3';
import { EventBus, CohortStore, type CohortState } from '../state';
import type { Sample, SampleWithMutations, Mutation } from '../types';
import { DISEASE_COLORS } from '../types';

export interface SampleTableConfig {
  width: number;
  maxHeight: number;
  pageSize: number;
}

const DEFAULT_CONFIG: SampleTableConfig = {
  width: 600,
  maxHeight: 400,
  pageSize: 50,
};

type SortColumn = 'sampleId' | 'disease' | 'stage' | 'mutationCount' | 'survivalTime' | 'age';
type SortDirection = 'asc' | 'desc';

export class SampleTable {
  private container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private config: SampleTableConfig;

  // Data
  private samples: SampleWithMutations[] = [];
  private sortedSamples: SampleWithMutations[] = [];

  // State
  private selectedSampleIds: Set<string> = new Set();
  private highlightedSampleIds: Set<string> = new Set();
  private sortColumn: SortColumn = 'sampleId';
  private sortDirection: SortDirection = 'asc';
  private currentPage: number = 0;

  constructor(selector: string, config: Partial<SampleTableConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Clear and create container
    const parent = d3.select(selector);
    parent.selectAll('*').remove();

    this.container = parent
      .append('div')
      .attr('class', 'sample-table-container')
      .style('width', `${this.config.width}px`);

    this.setupEventListeners();
    this.setupStoreSubscription();
  }

  private setupEventListeners(): void {
    // Listen for selection changes from other components
    EventBus.on('selection:change', (event) => {
      if (event.source !== 'table') {
        this.selectedSampleIds = new Set(event.sampleIds);
        this.updateRowStyles();
      }
    });

    EventBus.on('selection:clear', (event) => {
      if (event.source !== 'table') {
        this.selectedSampleIds.clear();
        this.updateRowStyles();
      }
    });

    EventBus.on('highlight:show', (event) => {
      if (event.source !== 'table') {
        this.highlightedSampleIds = new Set(event.sampleIds);
        this.updateRowStyles();
      }
    });

    EventBus.on('highlight:hide', () => {
      this.highlightedSampleIds.clear();
      this.updateRowStyles();
    });
  }

  private setupStoreSubscription(): void {
    CohortStore.subscribe((state: CohortState) => {
      if (state.filteredSamples) {
        this.setData(state.filteredSamples, state.filteredMutations);
      }
    });
  }

  /**
   * Set data directly
   */
  setData(samples: Sample[], mutations: Mutation[]): void {
    // Enrich samples with mutation counts
    const mutationsBySample = new Map<string, Mutation[]>();

    for (const mut of mutations) {
      for (const sampleId of mut.sampleIds) {
        if (!mutationsBySample.has(sampleId)) {
          mutationsBySample.set(sampleId, []);
        }
        mutationsBySample.get(sampleId)!.push(mut);
      }
    }

    this.samples = samples.map((s) => ({
      ...s,
      mutations: mutationsBySample.get(s.sampleId) || [],
      mutationCount: mutationsBySample.get(s.sampleId)?.length || 0,
    }));

    this.sortData();
    this.render();
  }

  private sortData(): void {
    const direction = this.sortDirection === 'asc' ? 1 : -1;

    this.sortedSamples = [...this.samples].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (this.sortColumn) {
        case 'sampleId':
          valueA = a.sampleId;
          valueB = b.sampleId;
          break;
        case 'disease':
          valueA = a.disease;
          valueB = b.disease;
          break;
        case 'stage':
          valueA = a.stage || '';
          valueB = b.stage || '';
          break;
        case 'mutationCount':
          valueA = a.mutationCount;
          valueB = b.mutationCount;
          break;
        case 'survivalTime':
          valueA = a.survivalMonths || a.survivalTime || 0;
          valueB = b.survivalMonths || b.survivalTime || 0;
          break;
        case 'age':
          valueA = a.age || a.ageAtDiagnosis || 0;
          valueB = b.age || b.ageAtDiagnosis || 0;
          break;
        default:
          return 0;
      }

      if (typeof valueA === 'string') {
        return direction * valueA.localeCompare(valueB);
      }
      return direction * (valueA - valueB);
    });
  }

  render(): void {
    this.container.selectAll('*').remove();

    this.renderHeader();
    this.renderTable();
    this.renderPagination();
  }

  private renderHeader(): void {
    const header = this.container
      .append('div')
      .attr('class', 'table-header')
      .style('display', 'flex')
      .style('justify-content', 'space-between')
      .style('align-items', 'center')
      .style('margin-bottom', '10px');

    header
      .append('h3')
      .style('margin', '0')
      .style('font-size', '16px')
      .style('font-weight', '600')
      .style('color', '#1a1a2e')
      .text(`Samples (${this.samples.length})`);

    const controls = header.append('div').style('display', 'flex').style('gap', '10px');

    if (this.selectedSampleIds.size > 0) {
      controls
        .append('span')
        .style('font-size', '13px')
        .style('color', '#4facfe')
        .text(`${this.selectedSampleIds.size} selected`);

      controls
        .append('button')
        .style('padding', '4px 8px')
        .style('font-size', '12px')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('background', '#fff')
        .style('cursor', 'pointer')
        .text('Clear Selection')
        .on('click', () => this.clearSelection());
    }
  }

  private renderTable(): void {
    const tableWrapper = this.container
      .append('div')
      .attr('class', 'table-wrapper')
      .style('max-height', `${this.config.maxHeight}px`)
      .style('overflow-y', 'auto')
      .style('border', '1px solid #e0e0e0')
      .style('border-radius', '8px');

    const table = tableWrapper
      .append('table')
      .style('width', '100%')
      .style('border-collapse', 'collapse')
      .style('font-size', '13px');

    // Header
    const thead = table
      .append('thead')
      .style('position', 'sticky')
      .style('top', '0')
      .style('background', '#f8f9fa')
      .style('z-index', '1');

    const columns: { key: SortColumn; label: string; width?: string }[] = [
      { key: 'sampleId', label: 'Sample ID', width: '120px' },
      { key: 'disease', label: 'Disease', width: '100px' },
      { key: 'stage', label: 'Stage', width: '60px' },
      { key: 'mutationCount', label: 'Mutations', width: '80px' },
      { key: 'age', label: 'Age', width: '50px' },
      { key: 'survivalTime', label: 'Survival (mo)', width: '90px' },
    ];

    const headerRow = thead.append('tr');

    columns.forEach((col) => {
      const th = headerRow
        .append('th')
        .style('padding', '10px 8px')
        .style('text-align', 'left')
        .style('font-weight', '600')
        .style('color', '#333')
        .style('border-bottom', '2px solid #e0e0e0')
        .style('cursor', 'pointer')
        .style('white-space', 'nowrap')
        .style('user-select', 'none');

      if (col.width) {
        th.style('width', col.width);
      }

      const sortIndicator =
        this.sortColumn === col.key ? (this.sortDirection === 'asc' ? ' ▲' : ' ▼') : '';

      th.text(col.label + sortIndicator).on('click', () => this.handleSort(col.key));
    });

    // Body
    const tbody = table.append('tbody');

    const startIdx = this.currentPage * this.config.pageSize;
    const endIdx = Math.min(startIdx + this.config.pageSize, this.sortedSamples.length);
    const pageData = this.sortedSamples.slice(startIdx, endIdx);

    const rows = tbody
      .selectAll('tr')
      .data(pageData)
      .join('tr')
      .attr('data-sample-id', (d) => d.sampleId)
      .style('cursor', 'pointer')
      .style('transition', 'background-color 0.15s')
      .on('click', (event, d) => this.handleRowClick(event, d))
      .on('mouseover', (event, d) => this.handleRowHover(event, d))
      .on('mouseout', () => this.handleRowMouseout());

    // Sample ID
    rows
      .append('td')
      .style('padding', '8px')
      .style('border-bottom', '1px solid #f0f0f0')
      .style('font-family', 'monospace')
      .style('font-size', '12px')
      .text((d) => d.sampleId);

    // Disease with color indicator
    rows
      .append('td')
      .style('padding', '8px')
      .style('border-bottom', '1px solid #f0f0f0')
      .html((d) => {
        const color = DISEASE_COLORS[d.disease] || '#999';
        return `<span style="display: inline-block; width: 8px; height: 8px; 
          border-radius: 50%; background: ${color}; margin-right: 6px;"></span>${d.disease}`;
      });

    // Stage
    rows
      .append('td')
      .style('padding', '8px')
      .style('border-bottom', '1px solid #f0f0f0')
      .text((d) => d.stage || '-');

    // Mutation count with bar
    rows
      .append('td')
      .style('padding', '8px')
      .style('border-bottom', '1px solid #f0f0f0')
      .html((d) => {
        const maxCount = Math.max(...this.samples.map((s) => s.mutationCount));
        const width = maxCount > 0 ? (d.mutationCount / maxCount) * 50 : 0;
        return `
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="width: 50px; height: 4px; background: #eee; border-radius: 2px;">
              <div style="width: ${width}px; height: 100%; background: #4facfe; border-radius: 2px;"></div>
            </div>
            <span>${d.mutationCount}</span>
          </div>
        `;
      });

    // Age
    rows
      .append('td')
      .style('padding', '8px')
      .style('border-bottom', '1px solid #f0f0f0')
      .text((d) => d.age || d.ageAtDiagnosis || '-');

    // Survival time with status indicator
    rows
      .append('td')
      .style('padding', '8px')
      .style('border-bottom', '1px solid #f0f0f0')
      .html((d) => {
        const vitalStatus = d.vitalStatus || (d.survivalEvent ? 'deceased' : 'alive');
        const statusIcon = vitalStatus === 'deceased' ? '●' : vitalStatus === 'alive' ? '○' : '';
        const statusColor = vitalStatus === 'deceased' ? '#e74c3c' : '#2ecc71';
        const survivalVal =
          d.survivalMonths || (d.survivalTime ? d.survivalTime / 30.44 : undefined);
        return `<span style="color: ${statusColor}; margin-right: 4px;">${statusIcon}</span>
          ${survivalVal?.toFixed(1) || '-'}`;
      });

    this.updateRowStyles();
  }

  private renderPagination(): void {
    if (this.sortedSamples.length <= this.config.pageSize) return;

    const totalPages = Math.ceil(this.sortedSamples.length / this.config.pageSize);

    const pagination = this.container
      .append('div')
      .attr('class', 'pagination')
      .style('display', 'flex')
      .style('justify-content', 'center')
      .style('align-items', 'center')
      .style('gap', '10px')
      .style('margin-top', '10px');

    pagination
      .append('button')
      .style('padding', '4px 8px')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('background', '#fff')
      .style('cursor', this.currentPage > 0 ? 'pointer' : 'not-allowed')
      .style('opacity', this.currentPage > 0 ? '1' : '0.5')
      .text('← Prev')
      .attr('disabled', this.currentPage === 0 ? true : null)
      .on('click', () => {
        if (this.currentPage > 0) {
          this.currentPage--;
          this.render();
        }
      });

    pagination
      .append('span')
      .style('font-size', '13px')
      .style('color', '#666')
      .text(`Page ${this.currentPage + 1} of ${totalPages}`);

    pagination
      .append('button')
      .style('padding', '4px 8px')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('background', '#fff')
      .style('cursor', this.currentPage < totalPages - 1 ? 'pointer' : 'not-allowed')
      .style('opacity', this.currentPage < totalPages - 1 ? '1' : '0.5')
      .text('Next →')
      .attr('disabled', this.currentPage >= totalPages - 1 ? true : null)
      .on('click', () => {
        if (this.currentPage < totalPages - 1) {
          this.currentPage++;
          this.render();
        }
      });
  }

  private handleSort(column: SortColumn): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.sortData();
    this.render();
  }

  private handleRowClick(event: MouseEvent, sample: SampleWithMutations): void {
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      // Multi-select
      if (this.selectedSampleIds.has(sample.sampleId)) {
        this.selectedSampleIds.delete(sample.sampleId);
      } else {
        this.selectedSampleIds.add(sample.sampleId);
      }
    } else {
      // Single select
      this.selectedSampleIds.clear();
      this.selectedSampleIds.add(sample.sampleId);
    }

    // Gather all mutation IDs for selected samples
    const allMutationIds = this.samples
      .filter((s) => this.selectedSampleIds.has(s.sampleId))
      .flatMap((s) => s.mutations.map((m) => m.id));

    EventBus.emit('selection:change', {
      sampleIds: Array.from(this.selectedSampleIds),
      mutationIds: [...new Set(allMutationIds)],
      source: 'table',
      type: 'click',
    });

    this.updateRowStyles();
  }

  private handleRowHover(_event: MouseEvent, sample: SampleWithMutations): void {
    const mutationIds = sample.mutations.map((m) => m.id);

    EventBus.emit('highlight:show', {
      sampleIds: [sample.sampleId],
      mutationIds,
      source: 'table',
    });
  }

  private handleRowMouseout(): void {
    EventBus.emit('highlight:hide', {
      sampleIds: [],
      mutationIds: [],
      source: 'table',
    });
  }

  private updateRowStyles(): void {
    // Update row styles using data binding
    this.container
      .selectAll('tbody tr')
      .style('background-color', (d: unknown) => {
        const sample = d as SampleWithMutations;
        if (this.selectedSampleIds.has(sample.sampleId)) {
          return '#e3f2fd';
        }
        if (this.highlightedSampleIds.has(sample.sampleId)) {
          return '#fff3e0';
        }
        return 'transparent';
      })
      .style('font-weight', (d: any) => {
        const sample = d as SampleWithMutations;
        return this.selectedSampleIds.has(sample.sampleId) ? '600' : 'normal';
      });
  }

  private clearSelection(): void {
    this.selectedSampleIds.clear();

    EventBus.emit('selection:clear', {
      source: 'table',
    });

    this.render();
  }

  /**
   * Programmatically select samples
   */
  selectSamples(sampleIds: string[]): void {
    this.selectedSampleIds = new Set(sampleIds);
    this.updateRowStyles();
  }

  /**
   * Scroll to a specific sample
   */
  scrollToSample(sampleId: string): void {
    const idx = this.sortedSamples.findIndex((s) => s.sampleId === sampleId);
    if (idx >= 0) {
      this.currentPage = Math.floor(idx / this.config.pageSize);
      this.render();

      // Scroll the row into view
      setTimeout(() => {
        const row = this.container.select(`tr[data-sample-id="${sampleId}"]`);
        const node = row.node() as HTMLElement;
        if (node) {
          node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    this.container.remove();
  }
}
