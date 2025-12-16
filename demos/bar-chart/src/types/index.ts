/**
 * Bar Chart Types
 * Type definitions for bar chart visualization
 */

export interface BarDataPoint {
  category: string;
  value: number;
  group?: string;
  color?: string;
  metadata?: Record<string, unknown>;
}

export interface GroupedBarData {
  category: string;
  values: { group: string; value: number }[];
}

export interface StackedBarData {
  category: string;
  values: { group: string; value: number; start?: number; end?: number }[];
  total?: number;
}

export interface BarChartConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  chartType: 'simple' | 'grouped' | 'stacked';
  orientation: 'vertical' | 'horizontal';
  colorScheme: readonly string[];
  showGrid: boolean;
  showValues: boolean;
  animationDuration: number;
}

export interface BarChartDataset {
  id: string;
  name: string;
  data: BarDataPoint[];
  groups?: string[];
}

export type SortType = 'value-desc' | 'value-asc' | 'alpha' | 'original';
