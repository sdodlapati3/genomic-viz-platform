/**
 * Event Types
 *
 * EventBus event definitions for cross-component communication
 */

export type EventCallback<T = unknown> = (data: T) => void;

export interface EventSubscription {
  unsubscribe: () => void;
}

/**
 * Selection change event
 * Emitted when user selects samples/mutations via click, brush, or lasso
 */
export interface SelectionChangeEvent {
  sampleIds: string[];
  mutationIds: string[];
  source: string; // Component that emitted the event
  type: 'click' | 'brush' | 'lasso';
  additive?: boolean; // True = add to existing selection
}

/**
 * Selection clear event
 */
export interface SelectionClearEvent {
  source: string;
}

/**
 * Highlight event (hover)
 */
export interface HighlightEvent {
  sampleIds: string[];
  mutationIds: string[];
  source: string;
}

/**
 * Filter application event
 */
export interface FilterEvent {
  filters: FilterState;
  source: string;
}

/**
 * Filter clear event
 */
export interface FilterClearEvent {
  source: string;
}

/**
 * Cohort update event (after filters applied)
 */
export interface CohortUpdateEvent {
  sampleCount: number;
  mutationCount: number;
  source: string;
}

/**
 * Zoom/pan event for coordinated views
 */
export interface ZoomEvent {
  domain: [number, number];
  source: string;
}

/**
 * Filter state definition
 * Uses optional fields for flexible partial filtering
 */
export interface FilterState {
  disease?: string[];
  stage?: string[];
  mutationType?: string[];
  positionRange?: [number, number];
  minMutationCount?: number;
}

export const DEFAULT_FILTER_STATE: FilterState = {};

/**
 * All event types mapped to their payloads
 */
export interface LinkedViewEvents {
  'selection:change': SelectionChangeEvent;
  'selection:clear': SelectionClearEvent;
  'highlight:show': HighlightEvent;
  'highlight:hide': HighlightEvent;
  'filter:apply': FilterEvent;
  'filter:clear': FilterClearEvent;
  'cohort:update': CohortUpdateEvent;
  'zoom:change': ZoomEvent;
}
