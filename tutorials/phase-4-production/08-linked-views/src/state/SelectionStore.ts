/**
 * SelectionStore - Centralized state management for selection coordination
 *
 * Manages selected and highlighted items across all views.
 * Implements reactive pattern with subscription support.
 */

import { EventBus, SelectionChangeEvent, HighlightEvent } from './EventBus';
import {
  SelectionState,
  HighlightState,
  SelectionSource,
  SelectionType,
  LinkingConfig,
  DEFAULT_LINKING_CONFIG,
} from '../types';

export interface SelectionStoreState {
  selection: SelectionState;
  highlight: HighlightState;
  config: LinkingConfig;
}

type SelectionListener = (state: SelectionStoreState) => void;

class SelectionStoreImpl {
  private selection: SelectionState = {
    sampleIds: new Set(),
    mutationIds: new Set(),
    source: 'external',
    type: 'click',
    timestamp: Date.now(),
  };

  private highlight: HighlightState = {
    sampleIds: new Set(),
    mutationIds: new Set(),
    source: 'external',
  };

  private config: LinkingConfig = { ...DEFAULT_LINKING_CONFIG };
  private listeners: Set<SelectionListener> = new Set();
  private highlightTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Subscribe to EventBus events
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    EventBus.on('selection:change', (event: SelectionChangeEvent) => {
      this.handleSelectionChange(event);
    });

    EventBus.on('selection:clear', () => {
      this.clearSelection();
    });

    EventBus.on('highlight:show', (event: HighlightEvent) => {
      this.handleHighlight(event, true);
    });

    EventBus.on('highlight:hide', (event: HighlightEvent) => {
      this.handleHighlight(event, false);
    });
  }

  /**
   * Handle selection change from EventBus
   */
  private handleSelectionChange(event: SelectionChangeEvent): void {
    const newSampleIds = new Set(event.sampleIds);
    const newMutationIds = new Set(event.mutationIds);

    if (event.additive) {
      // Add to existing selection
      event.sampleIds.forEach((id) => this.selection.sampleIds.add(id));
      event.mutationIds.forEach((id) => this.selection.mutationIds.add(id));
    } else {
      // Replace selection
      this.selection.sampleIds = newSampleIds;
      this.selection.mutationIds = newMutationIds;
    }

    this.selection.source = event.source as SelectionSource;
    this.selection.type = event.type as SelectionType;
    this.selection.timestamp = Date.now();

    this.notifyListeners();
  }

  /**
   * Handle highlight events
   */
  private handleHighlight(event: HighlightEvent, show: boolean): void {
    if (!this.config.highlightOnHover) return;

    if (this.highlightTimeout) {
      clearTimeout(this.highlightTimeout);
      this.highlightTimeout = null;
    }

    if (show) {
      this.highlightTimeout = setTimeout(() => {
        this.highlight.sampleIds = new Set(event.sampleIds);
        this.highlight.mutationIds = new Set(event.mutationIds);
        this.highlight.source = event.source as SelectionSource;
        this.notifyListeners();
      }, this.config.highlightDelay);
    } else {
      this.highlight.sampleIds = new Set();
      this.highlight.mutationIds = new Set();
      this.notifyListeners();
    }
  }

  /**
   * Select samples programmatically
   */
  selectSamples(sampleIds: string[], source: SelectionSource = 'external', additive = false): void {
    EventBus.emit('selection:change', {
      sampleIds,
      mutationIds: [],
      source,
      type: 'click',
      additive,
    });
  }

  /**
   * Select mutations programmatically
   */
  selectMutations(
    mutationIds: string[],
    source: SelectionSource = 'external',
    additive = false
  ): void {
    EventBus.emit('selection:change', {
      sampleIds: [],
      mutationIds,
      source,
      type: 'click',
      additive,
    });
  }

  /**
   * Select both samples and mutations
   */
  select(
    sampleIds: string[],
    mutationIds: string[],
    source: SelectionSource = 'external',
    type: 'click' | 'brush' | 'lasso' = 'click',
    additive = false
  ): void {
    EventBus.emit('selection:change', {
      sampleIds,
      mutationIds,
      source,
      type,
      additive,
    });
  }

  /**
   * Clear all selection
   */
  clearSelection(source: SelectionSource = 'external'): void {
    this.selection.sampleIds = new Set();
    this.selection.mutationIds = new Set();
    this.selection.source = source;
    this.selection.timestamp = Date.now();
    this.notifyListeners();
  }

  /**
   * Highlight samples on hover
   */
  highlightSamples(sampleIds: string[], source: SelectionSource = 'external'): void {
    EventBus.emit('highlight:show', {
      sampleIds,
      mutationIds: [],
      source,
    });
  }

  /**
   * Clear highlight
   */
  clearHighlight(source: SelectionSource = 'external'): void {
    EventBus.emit('highlight:hide', {
      sampleIds: [],
      mutationIds: [],
      source,
    });
  }

  /**
   * Check if a sample is selected
   */
  isSampleSelected(sampleId: string): boolean {
    return this.selection.sampleIds.has(sampleId);
  }

  /**
   * Check if a sample is highlighted
   */
  isSampleHighlighted(sampleId: string): boolean {
    return this.highlight.sampleIds.has(sampleId);
  }

  /**
   * Check if a mutation is selected
   */
  isMutationSelected(mutationId: string): boolean {
    return this.selection.mutationIds.has(mutationId);
  }

  /**
   * Get current selection state
   */
  getSelection(): SelectionState {
    return {
      ...this.selection,
      sampleIds: new Set(this.selection.sampleIds),
      mutationIds: new Set(this.selection.mutationIds),
    };
  }

  /**
   * Get current highlight state
   */
  getHighlight(): HighlightState {
    return {
      ...this.highlight,
      sampleIds: new Set(this.highlight.sampleIds),
      mutationIds: new Set(this.highlight.mutationIds),
    };
  }

  /**
   * Get selected sample IDs as array
   */
  getSelectedSampleIds(): string[] {
    return Array.from(this.selection.sampleIds);
  }

  /**
   * Get selected mutation IDs as array
   */
  getSelectedMutationIds(): string[] {
    return Array.from(this.selection.mutationIds);
  }

  /**
   * Get full state
   */
  getState(): SelectionStoreState {
    return {
      selection: this.getSelection(),
      highlight: this.getHighlight(),
      config: { ...this.config },
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<LinkingConfig>): void {
    this.config = { ...this.config, ...config };
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: SelectionListener): () => void {
    this.listeners.add(listener);
    // Immediately call with current state
    listener(this.getState());

    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (error) {
        console.error('[SelectionStore] Listener error:', error);
      }
    });
  }

  /**
   * Toggle sample selection
   */
  toggleSampleSelection(sampleId: string, source: SelectionSource = 'external'): void {
    if (this.selection.sampleIds.has(sampleId)) {
      this.selection.sampleIds.delete(sampleId);
    } else {
      this.selection.sampleIds.add(sampleId);
    }
    this.selection.source = source;
    this.selection.timestamp = Date.now();
    this.notifyListeners();
  }

  /**
   * Get selection summary for display
   */
  getSelectionSummary(): string {
    const sampleCount = this.selection.sampleIds.size;
    const mutationCount = this.selection.mutationIds.size;

    if (sampleCount === 0 && mutationCount === 0) {
      return 'No selection';
    }

    const parts: string[] = [];
    if (sampleCount > 0) {
      parts.push(`${sampleCount} sample${sampleCount !== 1 ? 's' : ''}`);
    }
    if (mutationCount > 0) {
      parts.push(`${mutationCount} mutation${mutationCount !== 1 ? 's' : ''}`);
    }

    return parts.join(', ') + ' selected';
  }
}

// Singleton instance
export const SelectionStore = new SelectionStoreImpl();

// Export type for testing/mocking
export type { SelectionStoreImpl };
