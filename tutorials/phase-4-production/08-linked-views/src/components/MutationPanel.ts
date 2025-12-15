/**
 * MutationPanel - Simplified mutation list with selection support
 *
 * Displays mutations with their consequence types and sample counts,
 * supporting linked selection/highlighting with other views.
 */

import * as d3 from 'd3';
import { Mutation, ConsequenceType } from '../types';
import { EventBus } from '../state';

export interface MutationPanelConfig {
  width: number;
  height: number;
  showSampleCount: boolean;
}

const DEFAULT_CONFIG: MutationPanelConfig = {
  width: 300,
  height: 400,
  showSampleCount: true,
};

const CONSEQUENCE_COLORS: Record<ConsequenceType, string> = {
  missense: '#3498db',
  nonsense: '#e74c3c',
  frameshift: '#9b59b6',
  inframe_deletion: '#f39c12',
  inframe_insertion: '#1abc9c',
  splice: '#e67e22',
  synonymous: '#95a5a6',
};

export class MutationPanel {
  private container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private config: MutationPanelConfig;
  private mutations: Mutation[] = [];
  private selectedMutations: Set<string> = new Set();
  private selectedSamples: Set<string> = new Set();
  private highlightedMutations: Set<string> = new Set();
  private highlightedSamples: Set<string> = new Set();

  constructor(parentSelector: string, config: Partial<MutationPanelConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    const parent = d3.select(parentSelector);
    parent.selectAll('*').remove();

    this.container = parent
      .append('div')
      .attr('class', 'mutation-panel')
      .style('width', `${this.config.width}px`)
      .style('height', `${this.config.height}px`)
      .style('overflow-y', 'auto')
      .style('border', '1px solid #ddd')
      .style('border-radius', '4px')
      .style('font-family', 'system-ui, -apple-system, sans-serif');

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    EventBus.on('selection:change', (event) => {
      if (event.source !== 'mutation-panel') {
        this.selectedMutations = new Set(event.mutationIds);
        this.selectedSamples = new Set(event.sampleIds);
        this.updateSelection();
      }
    });

    EventBus.on('selection:clear', (event) => {
      if (event.source !== 'mutation-panel') {
        this.selectedMutations.clear();
        this.selectedSamples.clear();
        this.updateSelection();
      }
    });

    EventBus.on('highlight:show', (event) => {
      if (event.source !== 'mutation-panel') {
        this.highlightedMutations = new Set(event.mutationIds);
        this.highlightedSamples = new Set(event.sampleIds);
        this.updateHighlight();
      }
    });

    EventBus.on('highlight:hide', () => {
      this.highlightedMutations.clear();
      this.highlightedSamples.clear();
      this.updateHighlight();
    });
  }

  /**
   * Set mutation data
   */
  setData(mutations: Mutation[]): void {
    this.mutations = mutations;
    this.render();
  }

  private render(): void {
    this.container.selectAll('*').remove();

    // Header
    this.container
      .append('div')
      .attr('class', 'panel-header')
      .style('padding', '12px')
      .style('background', '#f8f9fa')
      .style('border-bottom', '1px solid #ddd')
      .style('font-weight', 'bold')
      .style('font-size', '14px')
      .style('position', 'sticky')
      .style('top', '0')
      .style('z-index', '1')
      .text(`Mutations (${this.mutations.length})`);

    // Mutation list
    const list = this.container
      .append('div')
      .attr('class', 'mutation-list')
      .style('padding', '8px');

    const items = list
      .selectAll('.mutation-item')
      .data(this.mutations)
      .join('div')
      .attr('class', 'mutation-item')
      .attr('data-mutation-id', (d) => d.id)
      .style('padding', '10px 12px')
      .style('margin', '4px 0')
      .style('border-radius', '4px')
      .style('background', '#fff')
      .style('border', '1px solid #e0e0e0')
      .style('cursor', 'pointer')
      .style('transition', 'all 0.2s ease');

    // Mutation content
    items.each((d, i, nodes) => {
      const item = d3.select(nodes[i]);

      // Top row: position and change
      const topRow = item
        .append('div')
        .style('display', 'flex')
        .style('justify-content', 'space-between')
        .style('align-items', 'center');

      topRow
        .append('span')
        .style('font-weight', '600')
        .style('font-size', '13px')
        .text(`${d.gene} ${d.aaChange}`);

      if (d.hotspot) {
        topRow
          .append('span')
          .style('background', '#e74c3c')
          .style('color', 'white')
          .style('padding', '2px 6px')
          .style('border-radius', '3px')
          .style('font-size', '10px')
          .text('Hotspot');
      }

      // Middle row: consequence badge
      const middleRow = item.append('div').style('margin-top', '6px');

      middleRow
        .append('span')
        .style('background', CONSEQUENCE_COLORS[d.consequence])
        .style('color', 'white')
        .style('padding', '2px 8px')
        .style('border-radius', '3px')
        .style('font-size', '11px')
        .text(d.consequence.replace('_', ' '));

      middleRow
        .append('span')
        .style('margin-left', '8px')
        .style('color', '#666')
        .style('font-size', '12px')
        .text(`Position: ${d.position}`);

      // Bottom row: sample count
      if (this.config.showSampleCount) {
        item
          .append('div')
          .style('margin-top', '6px')
          .style('font-size', '11px')
          .style('color', '#888')
          .text(`${d.sampleIds.length} sample${d.sampleIds.length !== 1 ? 's' : ''}`);
      }
    });

    // Add event handlers
    items
      .on('mouseover', (event, d) => this.handleMouseOver(event, d))
      .on('mouseout', () => this.handleMouseOut())
      .on('click', (event, d) => this.handleClick(event, d));
  }

  private handleMouseOver(event: MouseEvent, d: Mutation): void {
    d3.select(event.currentTarget as HTMLElement)
      .style('background', '#f0f7ff')
      .style('border-color', '#2196f3');

    EventBus.emit('highlight:show', {
      sampleIds: d.sampleIds,
      mutationIds: [d.id],
      source: 'mutation-panel',
    });
  }

  private handleMouseOut(): void {
    this.container
      .selectAll('.mutation-item')
      .style('background', '#fff')
      .style('border-color', '#e0e0e0');

    // Restore selection styling
    this.updateSelection();

    EventBus.emit('highlight:hide', {
      sampleIds: [],
      mutationIds: [],
      source: 'mutation-panel',
    });
  }

  private handleClick(event: MouseEvent, d: Mutation): void {
    const additive = event.shiftKey || event.ctrlKey || event.metaKey;

    if (additive) {
      if (this.selectedMutations.has(d.id)) {
        this.selectedMutations.delete(d.id);
        d.sampleIds.forEach((id) => this.selectedSamples.delete(id));
      } else {
        this.selectedMutations.add(d.id);
        d.sampleIds.forEach((id) => this.selectedSamples.add(id));
      }
    } else {
      this.selectedMutations = new Set([d.id]);
      this.selectedSamples = new Set(d.sampleIds);
    }

    EventBus.emit('selection:change', {
      sampleIds: Array.from(this.selectedSamples),
      mutationIds: Array.from(this.selectedMutations),
      source: 'mutation-panel',
      type: 'click',
      additive,
    });
  }

  private updateSelection(): void {
    this.container
      .selectAll<HTMLDivElement, Mutation>('.mutation-item')
      .style('background', (d) => {
        if (this.selectedMutations.has(d.id)) return '#e3f2fd';
        // Highlight if any of mutation's samples are selected
        if (d.sampleIds.some((id) => this.selectedSamples.has(id))) return '#fff8e1';
        return '#fff';
      })
      .style('border-color', (d) => {
        if (this.selectedMutations.has(d.id)) return '#2196f3';
        if (d.sampleIds.some((id) => this.selectedSamples.has(id))) return '#ffc107';
        return '#e0e0e0';
      })
      .style('border-width', (d) => {
        if (this.selectedMutations.has(d.id)) return '2px';
        return '1px';
      });
  }

  private updateHighlight(): void {
    this.container.selectAll<HTMLDivElement, Mutation>('.mutation-item').style('opacity', (d) => {
      if (this.highlightedMutations.size === 0 && this.highlightedSamples.size === 0) {
        return 1;
      }
      if (this.highlightedMutations.has(d.id)) return 1;
      if (d.sampleIds.some((id) => this.highlightedSamples.has(id))) return 1;
      return 0.4;
    });
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedMutations.clear();
    this.selectedSamples.clear();
    this.updateSelection();

    EventBus.emit('selection:clear', { source: 'mutation-panel' });
  }

  /**
   * Get selected mutation IDs
   */
  getSelectedMutations(): string[] {
    return Array.from(this.selectedMutations);
  }

  /**
   * Get samples affected by selected mutations
   */
  getSelectedSamples(): string[] {
    return Array.from(this.selectedSamples);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container.remove();
  }
}
