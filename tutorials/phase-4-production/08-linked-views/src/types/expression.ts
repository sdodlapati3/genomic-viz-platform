/**
 * Expression data type definitions
 * Gene expression values with outlier detection
 */

export interface GeneExpression {
  geneId: string;
  geneName: string;
  sampleId: string;
  value: number;
  rank?: number;
  zScore?: number;
  isOutlier?: boolean;
  outlierDirection?: 'high' | 'low';
}

export interface ExpressionRankData {
  geneId: string;
  geneName: string;
  samples: ExpressionSample[];
  statistics: ExpressionStatistics;
}

export interface ExpressionSample {
  sampleId: string;
  value: number;
  rank: number;
  percentile: number;
  zScore: number;
  isOutlier: boolean;
  outlierType?: OutlierType;
}

export type OutlierType = 'extreme_high' | 'high' | 'normal' | 'low' | 'extreme_low';

export interface ExpressionStatistics {
  mean: number;
  median: number;
  standardDeviation: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  outlierThresholdHigh: number;
  outlierThresholdLow: number;
}

export interface ExpressionMatrix {
  genes: string[];
  samples: string[];
  values: number[][]; // genes x samples matrix
}

export interface GeneExpressionFilter {
  minValue?: number;
  maxValue?: number;
  outlierOnly?: boolean;
  geneIds?: string[];
}

export interface OutlierConfig {
  method: 'iqr' | 'zscore' | 'mad';
  threshold: number; // multiplier for IQR or z-score cutoff
  minSamples?: number; // minimum samples to calculate outliers
}

export const DEFAULT_OUTLIER_CONFIG: OutlierConfig = {
  method: 'iqr',
  threshold: 1.5,
  minSamples: 3,
};
