/**
 * CohortStore - Centralized state management for filtered cohort data
 *
 * Manages the application state including:
 * - Raw mutation and sample data
 * - Active filters
 * - Computed filtered data
 * - Selection state
 */

import { EventBus } from './EventBus';
import type { Mutation, GeneData, Sample, FilterState, ConsequenceType } from '../types';

export interface CohortState {
  // Raw data
  geneData: GeneData | null;
  allSamples: Sample[];

  // Computed (derived from filters)
  filteredMutations: Mutation[];
  filteredSamples: Sample[];

  // Active filters
  filters: FilterState;

  // Selection state
  selectedSampleIds: Set<string>;
  selectedMutationIds: Set<string>;

  // Loading state
  isLoading: boolean;
  error: string | null;
}

export interface FilterOptions {
  diseases: string[];
  stages: string[];
  mutationTypes: ConsequenceType[];
  positionRange: [number, number];
}

type StateSubscriber = (state: CohortState) => void;

class CohortStoreImpl {
  private state: CohortState = {
    geneData: null,
    allSamples: [],
    filteredMutations: [],
    filteredSamples: [],
    filters: {},
    selectedSampleIds: new Set(),
    selectedMutationIds: new Set(),
    isLoading: false,
    error: null,
  };

  private subscribers: Set<StateSubscriber> = new Set();

  /**
   * Subscribe to state changes
   */
  subscribe(callback: StateSubscriber): () => void {
    this.subscribers.add(callback);
    // Immediately call with current state
    callback(this.state);

    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of state change
   */
  private notify(): void {
    for (const callback of this.subscribers) {
      callback(this.state);
    }
  }

  /**
   * Load data directly (used by App after fetching)
   */
  loadData(geneData: GeneData, samples: Sample[]): void {
    // Add IDs to mutations if not present
    geneData.mutations = geneData.mutations.map((m, i) => ({
      ...m,
      id: m.id || `mut_${i}_${m.position}_${m.aaChange}`,
      sampleIds: m.sampleIds || [],
    }));

    this.state.geneData = geneData;
    this.state.allSamples = samples;
    this.state.filters = {};
    this.state.isLoading = false;
    this.state.error = null;

    // Initial filter application
    this.applyFiltersInternal();
    this.notify();

    // Emit cohort update event
    EventBus.emit('cohort:update', {
      sampleCount: this.state.filteredSamples.length,
      mutationCount: this.state.filteredMutations.length,
      source: 'CohortStore',
    });
  }

  /**
   * Apply filters and update computed state
   */
  applyFilters(filters: FilterState): void {
    this.state.filters = { ...filters };

    this.applyFiltersInternal();
    this.notify();

    // Emit events
    EventBus.emit('filter:apply', {
      filters: this.state.filters,
      source: 'CohortStore',
    });

    EventBus.emit('cohort:update', {
      sampleCount: this.state.filteredSamples.length,
      mutationCount: this.state.filteredMutations.length,
      source: 'CohortStore',
    });
  }

  /**
   * Internal filter application
   */
  private applyFiltersInternal(): void {
    if (!this.state.geneData) return;

    const { filters, allSamples } = this.state;
    const allMutations = this.state.geneData.mutations;

    // Filter mutations
    let filteredMutations = allMutations.filter((mut) => {
      // Position filter
      if (filters.positionRange) {
        if (mut.position < filters.positionRange[0] || mut.position > filters.positionRange[1]) {
          return false;
        }
      }

      // Mutation type filter
      if (filters.mutationType && filters.mutationType.length > 0) {
        if (!filters.mutationType.includes(mut.type)) {
          return false;
        }
      }

      // Minimum count filter
      if (filters.minMutationCount && mut.count < filters.minMutationCount) {
        return false;
      }

      return true;
    });

    // Get sample IDs from filtered mutations
    const sampleIdsWithMutations = new Set<string>();
    for (const mut of filteredMutations) {
      for (const sampleId of mut.sampleIds) {
        sampleIdsWithMutations.add(sampleId);
      }
    }

    // Filter samples
    let filteredSamples = allSamples.filter((sample) => {
      // Disease filter
      if (filters.disease && filters.disease.length > 0) {
        if (!filters.disease.includes(sample.disease)) {
          return false;
        }
      }

      // Stage filter
      if (filters.stage && filters.stage.length > 0) {
        if (!sample.stage || !filters.stage.includes(sample.stage)) {
          return false;
        }
      }

      // Must have at least one mutation in filtered set (if we have mutations)
      if (sampleIdsWithMutations.size > 0 && !sampleIdsWithMutations.has(sample.sampleId)) {
        return false;
      }

      return true;
    });

    // If disease filter is applied, also filter mutations to only those samples
    if (filters.disease && filters.disease.length > 0) {
      const filteredSampleIds = new Set(filteredSamples.map((s) => s.sampleId));
      filteredMutations = filteredMutations.filter((mut) =>
        mut.sampleIds.some((id) => filteredSampleIds.has(id))
      );
    }

    this.state.filteredMutations = filteredMutations;
    this.state.filteredSamples = filteredSamples;
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.state.filters = {};
    this.applyFiltersInternal();
    this.notify();

    EventBus.emit('filter:clear', { source: 'CohortStore' });

    EventBus.emit('cohort:update', {
      sampleCount: this.state.filteredSamples.length,
      mutationCount: this.state.filteredMutations.length,
      source: 'CohortStore',
    });
  }

  /**
   * Set selection state
   */
  setSelection(sampleIds: string[], mutationIds: string[]): void {
    this.state.selectedSampleIds = new Set(sampleIds);
    this.state.selectedMutationIds = new Set(mutationIds);
    this.notify();
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.state.selectedSampleIds.clear();
    this.state.selectedMutationIds.clear();
    this.notify();

    EventBus.emit('selection:clear', { source: 'CohortStore' });
  }

  /**
   * Get current filters
   */
  get filters(): FilterState {
    return this.state.filters;
  }

  /**
   * Get available filter options based on data
   */
  getFilterOptions(): FilterOptions {
    if (!this.state.geneData) {
      return {
        diseases: [],
        stages: [],
        mutationTypes: [],
        positionRange: [0, 100],
      };
    }

    // Unique diseases
    const diseases = [...new Set(this.state.allSamples.map((s) => s.disease))].sort();

    // Unique stages
    const stages = [
      ...new Set(this.state.allSamples.map((s) => s.stage).filter((s): s is string => !!s)),
    ].sort();

    // Unique mutation types
    const mutationTypes = [
      ...new Set(this.state.geneData.mutations.map((m) => m.type)),
    ] as ConsequenceType[];

    // Position range
    const positions = this.state.geneData.mutations.map((m) => m.position);
    const minPos = Math.min(...positions, 1);
    const maxPos = Math.max(...positions, this.state.geneData.proteinLength);

    return {
      diseases,
      stages,
      mutationTypes,
      positionRange: [minPos, maxPos],
    };
  }

  /**
   * Get current state (read-only)
   */
  getState(): Readonly<CohortState> {
    return this.state;
  }
}

// Export singleton instance
export const CohortStore = new CohortStoreImpl();
