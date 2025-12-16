/**
 * Box Plot Types
 */

export interface BoxDataPoint {
  group: string;
  value: number;
  sampleId?: string;
}

export interface BoxGroup {
  name: string;
  values: number[];
  stats: BoxStats;
  outliers: number[];
  color: string;
}

export interface BoxStats {
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
  iqr: number;
  whiskerLow: number;
  whiskerHigh: number;
  mean: number;
  std: number;
  n: number;
}

export interface BoxPlotConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  orientation: 'vertical' | 'horizontal';
  showOutliers: boolean;
  showNotch: boolean;
  showMean: boolean;
  colorScheme: readonly string[];
  animationDuration: number;
}

export interface BoxDataset {
  id: string;
  name: string;
  yLabel: string;
  data: BoxDataPoint[];
}
