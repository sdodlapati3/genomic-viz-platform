/**
 * Violin Plot Types
 */

export interface ViolinDataPoint {
  group: string;
  value: number;
  sampleId?: string;
}

export interface ViolinGroup {
  name: string;
  values: number[];
  stats: GroupStats;
  density: { x: number; y: number }[];
  color: string;
}

export interface GroupStats {
  min: number;
  max: number;
  median: number;
  q1: number;
  q3: number;
  mean: number;
  std: number;
  n: number;
}

export interface ViolinChartConfig {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  showBox: boolean;
  showPoints: boolean;
  bandwidth: number;
  colorScheme: readonly string[];
  animationDuration: number;
}

export interface ViolinDataset {
  id: string;
  name: string;
  yLabel: string;
  data: ViolinDataPoint[];
}
