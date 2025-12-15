/**
 * Dataset Selector Types
 *
 * Type definitions for the dataset selector and launcher
 */

/** Dataset configuration */
export interface Dataset {
  id: string;
  name: string;
  shortName: string;
  description: string;
  category: DatasetCategory;
  sampleCount: number;
  geneCount?: number;
  mutationCount?: number;
  features: string[];
  thumbnail?: string;
  color: string;
  available: boolean;
}

/** Dataset categories */
export type DatasetCategory = 'cancer' | 'germline' | 'pediatric' | 'adult' | 'custom';

/** View types available in the application */
export type ViewType =
  | 'lollipop'
  | 'oncoprint'
  | 'genome-browser'
  | 'scatter'
  | 'heatmap'
  | 'survival'
  | 'volcano';

/** View configuration */
export interface ViewConfig {
  id: ViewType;
  name: string;
  description: string;
  icon: string;
  supportedDatasets: string[]; // 'all' or specific dataset IDs
  demoUrl?: string;
}

/** Application state */
export interface AppState {
  selectedDataset: Dataset | null;
  selectedView: ViewType | null;
  searchQuery: string;
  categoryFilter: DatasetCategory | 'all';
}

/** Navigation event */
export interface NavigationEvent {
  type: 'dataset-select' | 'view-select' | 'launch';
  dataset?: Dataset;
  view?: ViewType;
}
