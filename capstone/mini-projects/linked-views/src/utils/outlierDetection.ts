/**
 * Outlier Detection Utilities
 *
 * Statistical methods for identifying outliers in expression data.
 * Supports IQR, Z-score, and MAD methods.
 */

import {
  ExpressionStatistics,
  ExpressionSample,
  OutlierType,
  OutlierConfig,
  DEFAULT_OUTLIER_CONFIG,
} from '../types';

/**
 * Calculate basic statistics for a numeric array
 */
export function calculateStatistics(values: number[]): ExpressionStatistics {
  if (values.length === 0) {
    throw new Error('Cannot calculate statistics for empty array');
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;

  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / n;
  const standardDeviation = Math.sqrt(variance);

  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  const q1Index = Math.floor(n / 4);
  const q3Index = Math.floor((3 * n) / 4);
  const q1 = sorted[q1Index];
  const q3 = sorted[q3Index];
  const iqr = q3 - q1;

  const outlierThresholdLow = q1 - 1.5 * iqr;
  const outlierThresholdHigh = q3 + 1.5 * iqr;

  return {
    mean,
    median,
    standardDeviation,
    min: sorted[0],
    max: sorted[n - 1],
    q1,
    q3,
    iqr,
    outlierThresholdLow,
    outlierThresholdHigh,
  };
}

/**
 * Calculate percentile for a value given sorted array
 */
export function calculatePercentile(value: number, sortedValues: number[]): number {
  let count = 0;
  for (const v of sortedValues) {
    if (v <= value) count++;
    else break;
  }
  return (count / sortedValues.length) * 100;
}

/**
 * Calculate z-score for a value
 */
export function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Calculate Median Absolute Deviation (MAD)
 */
export function calculateMAD(values: number[]): { median: number; mad: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];

  const absoluteDeviations = values.map((v) => Math.abs(v - median));
  const sortedDeviations = absoluteDeviations.sort((a, b) => a - b);
  const mad =
    n % 2 === 0
      ? (sortedDeviations[n / 2 - 1] + sortedDeviations[n / 2]) / 2
      : sortedDeviations[Math.floor(n / 2)];

  return { median, mad };
}

/**
 * Detect outliers using IQR method
 */
export function detectOutliersIQR(
  values: number[],
  threshold: number = 1.5
): { isOutlier: boolean; type: OutlierType }[] {
  const stats = calculateStatistics(values);
  const lowerBound = stats.q1 - threshold * stats.iqr;
  const upperBound = stats.q3 + threshold * stats.iqr;
  const extremeLower = stats.q1 - 3 * stats.iqr;
  const extremeUpper = stats.q3 + 3 * stats.iqr;

  return values.map((v) => {
    if (v < extremeLower) return { isOutlier: true, type: 'extreme_low' as OutlierType };
    if (v > extremeUpper) return { isOutlier: true, type: 'extreme_high' as OutlierType };
    if (v < lowerBound) return { isOutlier: true, type: 'low' as OutlierType };
    if (v > upperBound) return { isOutlier: true, type: 'high' as OutlierType };
    return { isOutlier: false, type: 'normal' as OutlierType };
  });
}

/**
 * Detect outliers using Z-score method
 */
export function detectOutliersZScore(
  values: number[],
  threshold: number = 2.5
): { isOutlier: boolean; type: OutlierType }[] {
  const stats = calculateStatistics(values);

  return values.map((v) => {
    const zScore = calculateZScore(v, stats.mean, stats.standardDeviation);
    const absZ = Math.abs(zScore);

    if (absZ > 3) {
      return {
        isOutlier: true,
        type: zScore > 0 ? 'extreme_high' : ('extreme_low' as OutlierType),
      };
    }
    if (absZ > threshold) {
      return { isOutlier: true, type: zScore > 0 ? 'high' : ('low' as OutlierType) };
    }
    return { isOutlier: false, type: 'normal' as OutlierType };
  });
}

/**
 * Detect outliers using MAD method (robust to outliers)
 */
export function detectOutliersMAD(
  values: number[],
  threshold: number = 3.5
): { isOutlier: boolean; type: OutlierType }[] {
  const { median, mad } = calculateMAD(values);
  // Modified z-score using MAD
  const k = 0.6745; // constant for normal distribution

  return values.map((v) => {
    const modifiedZ = mad === 0 ? 0 : (k * (v - median)) / mad;
    const absZ = Math.abs(modifiedZ);

    if (absZ > 5) {
      return {
        isOutlier: true,
        type: modifiedZ > 0 ? 'extreme_high' : ('extreme_low' as OutlierType),
      };
    }
    if (absZ > threshold) {
      return { isOutlier: true, type: modifiedZ > 0 ? 'high' : ('low' as OutlierType) };
    }
    return { isOutlier: false, type: 'normal' as OutlierType };
  });
}

/**
 * Main outlier detection function
 */
export function detectOutliers(
  values: number[],
  config: OutlierConfig = DEFAULT_OUTLIER_CONFIG
): { isOutlier: boolean; type: OutlierType }[] {
  if (values.length < (config.minSamples ?? 3)) {
    return values.map(() => ({ isOutlier: false, type: 'normal' as OutlierType }));
  }

  switch (config.method) {
    case 'iqr':
      return detectOutliersIQR(values, config.threshold);
    case 'zscore':
      return detectOutliersZScore(values, config.threshold);
    case 'mad':
      return detectOutliersMAD(values, config.threshold);
    default:
      return detectOutliersIQR(values, config.threshold);
  }
}

/**
 * Process expression values into ranked samples with outlier detection
 */
export function processExpressionData(
  sampleIds: string[],
  values: number[],
  config: OutlierConfig = DEFAULT_OUTLIER_CONFIG
): ExpressionSample[] {
  if (sampleIds.length !== values.length) {
    throw new Error('Sample IDs and values must have same length');
  }

  const stats = calculateStatistics(values);
  const outlierResults = detectOutliers(values, config);
  const sortedValues = [...values].sort((a, b) => a - b);

  // Create paired data for ranking
  const paired = sampleIds.map((id, i) => ({
    sampleId: id,
    value: values[i],
    originalIndex: i,
  }));

  // Sort by value to assign ranks
  paired.sort((a, b) => a.value - b.value);

  // Assign ranks (1-based)
  const samples: ExpressionSample[] = paired.map((item, rank) => ({
    sampleId: item.sampleId,
    value: item.value,
    rank: rank + 1,
    percentile: calculatePercentile(item.value, sortedValues),
    zScore: calculateZScore(item.value, stats.mean, stats.standardDeviation),
    isOutlier: outlierResults[item.originalIndex].isOutlier,
    outlierType: outlierResults[item.originalIndex].type,
  }));

  return samples;
}

/**
 * Get outlier color based on type
 */
export function getOutlierColor(type: OutlierType): string {
  switch (type) {
    case 'extreme_high':
      return '#d32f2f';
    case 'high':
      return '#f57c00';
    case 'extreme_low':
      return '#1565c0';
    case 'low':
      return '#42a5f5';
    default:
      return '#757575';
  }
}

/**
 * Format outlier type for display
 */
export function formatOutlierType(type: OutlierType): string {
  switch (type) {
    case 'extreme_high':
      return 'Extreme High';
    case 'high':
      return 'High';
    case 'extreme_low':
      return 'Extreme Low';
    case 'low':
      return 'Low';
    default:
      return 'Normal';
  }
}
