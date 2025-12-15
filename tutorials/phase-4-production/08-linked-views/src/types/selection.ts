/**
 * Selection state types for cross-view coordination
 */

export interface SelectionState {
  sampleIds: Set<string>;
  mutationIds: Set<string>;
  source: SelectionSource;
  type: SelectionType;
  timestamp: number;
}

export type SelectionSource =
  | 'expression-plot'
  | 'mutation-panel'
  | 'sample-table'
  | 'external'
  | 'keyboard';

export type SelectionType =
  | 'click' // single item selection
  | 'brush' // range selection
  | 'lasso' // freeform selection
  | 'hover' // temporary highlight
  | 'filter'; // filtered selection

export interface HighlightState {
  sampleIds: Set<string>;
  mutationIds: Set<string>;
  source: SelectionSource;
}

export interface LinkingConfig {
  enableSampleLinking: boolean;
  enableMutationLinking: boolean;
  highlightOnHover: boolean;
  syncFilters: boolean;
  highlightDelay: number; // ms delay before highlighting
}

export const DEFAULT_LINKING_CONFIG: LinkingConfig = {
  enableSampleLinking: true,
  enableMutationLinking: true,
  highlightOnHover: true,
  syncFilters: false,
  highlightDelay: 50,
};
