/**
 * Tests for Data Transformation Utilities
 * Demonstrates unit testing patterns for genomic data functions
 */

import { describe, it, expect, vi } from 'vitest';
import {
  negLog10,
  log2FoldChange,
  filterSignificantGenes,
  createHistogramBins,
  calculateStats,
  normalizeMinMax,
  zScoreNormalize,
  parseChromosomePosition,
  formatSIPrefix
} from '../utils/dataTransform.js';

describe('negLog10', () => {
  it('should calculate -log10 for valid p-values', () => {
    expect(negLog10(0.01)).toBeCloseTo(2, 5);
    expect(negLog10(0.001)).toBeCloseTo(3, 5);
    expect(negLog10(0.1)).toBeCloseTo(1, 5);
    expect(negLog10(1)).toBe(0);
  });
  
  it('should return Infinity for p-value of 0', () => {
    expect(negLog10(0)).toBe(Infinity);
  });
  
  it('should return 0 for p-value of 1', () => {
    expect(negLog10(1)).toBe(0);
  });
  
  it('should handle very small p-values', () => {
    expect(negLog10(1e-10)).toBeCloseTo(10, 5);
    expect(negLog10(1e-50)).toBeCloseTo(50, 5);
  });
  
  it('should return Infinity for negative p-values', () => {
    expect(negLog10(-0.1)).toBe(Infinity);
  });
});

describe('log2FoldChange', () => {
  it('should calculate log2 fold change correctly', () => {
    expect(log2FoldChange(2, 1)).toBeCloseTo(1, 5);
    expect(log2FoldChange(4, 1)).toBeCloseTo(2, 5);
    expect(log2FoldChange(1, 2)).toBeCloseTo(-1, 5);
    expect(log2FoldChange(8, 2)).toBeCloseTo(2, 5);
  });
  
  it('should handle equal values', () => {
    expect(log2FoldChange(5, 5)).toBe(0);
  });
  
  it('should return Infinity when control is 0', () => {
    expect(log2FoldChange(5, 0)).toBe(Infinity);
  });
  
  it('should return -Infinity when treatment is 0', () => {
    expect(log2FoldChange(0, 5)).toBe(-Infinity);
  });
  
  it('should return 0 when both are 0', () => {
    expect(log2FoldChange(0, 0)).toBe(0);
  });
});

describe('filterSignificantGenes', () => {
  const testData = [
    { gene: 'GENE1', pValue: 0.001, log2FC: 2.5 },  // Upregulated
    { gene: 'GENE2', pValue: 0.001, log2FC: -2.5 }, // Downregulated
    { gene: 'GENE3', pValue: 0.1, log2FC: 2.5 },    // Not significant (p > 0.05)
    { gene: 'GENE4', pValue: 0.001, log2FC: 0.5 },  // Not significant (|FC| < 1)
    { gene: 'GENE5', pValue: 0.01, log2FC: 1.5 },   // Upregulated
  ];
  
  it('should filter upregulated genes correctly', () => {
    const result = filterSignificantGenes(testData);
    expect(result.upregulated).toHaveLength(2);
    expect(result.upregulated.map(g => g.gene)).toContain('GENE1');
    expect(result.upregulated.map(g => g.gene)).toContain('GENE5');
  });
  
  it('should filter downregulated genes correctly', () => {
    const result = filterSignificantGenes(testData);
    expect(result.downregulated).toHaveLength(1);
    expect(result.downregulated[0].gene).toBe('GENE2');
  });
  
  it('should identify non-significant genes', () => {
    const result = filterSignificantGenes(testData);
    expect(result.notSignificant).toHaveLength(2);
  });
  
  it('should respect custom thresholds', () => {
    const result = filterSignificantGenes(testData, { pValue: 0.005, log2FC: 2 });
    expect(result.upregulated).toHaveLength(1);
    expect(result.upregulated[0].gene).toBe('GENE1');
  });
  
  it('should handle empty data', () => {
    const result = filterSignificantGenes([]);
    expect(result.upregulated).toHaveLength(0);
    expect(result.downregulated).toHaveLength(0);
    expect(result.notSignificant).toHaveLength(0);
  });
});

describe('createHistogramBins', () => {
  it('should create the correct number of bins', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const bins = createHistogramBins(values, 5);
    expect(bins).toHaveLength(5);
  });
  
  it('should count values in bins correctly', () => {
    const values = [1, 1, 1, 5, 5, 10];
    const bins = createHistogramBins(values, 3);
    
    // Verify total count equals input length
    const totalCount = bins.reduce((sum, b) => sum + b.count, 0);
    expect(totalCount).toBe(values.length);
  });
  
  it('should set bin ranges correctly', () => {
    const values = [0, 50, 100];
    const bins = createHistogramBins(values, 4);
    
    expect(bins[0].x0).toBe(0);
    expect(bins[3].x1).toBe(100);
  });
  
  it('should handle empty array', () => {
    const bins = createHistogramBins([]);
    expect(bins).toHaveLength(0);
  });
  
  it('should handle single value', () => {
    const bins = createHistogramBins([5], 10);
    expect(bins).toHaveLength(10);
  });
});

describe('calculateStats', () => {
  it('should calculate mean correctly', () => {
    const values = [1, 2, 3, 4, 5];
    const stats = calculateStats(values);
    expect(stats.mean).toBe(3);
  });
  
  it('should calculate median for odd length array', () => {
    const values = [1, 2, 3, 4, 5];
    const stats = calculateStats(values);
    expect(stats.median).toBe(3);
  });
  
  it('should calculate median for even length array', () => {
    const values = [1, 2, 3, 4];
    const stats = calculateStats(values);
    expect(stats.median).toBe(2.5);
  });
  
  it('should calculate standard deviation', () => {
    const values = [2, 4, 4, 4, 5, 5, 7, 9];
    const stats = calculateStats(values);
    expect(stats.std).toBeCloseTo(2, 1);
  });
  
  it('should find min and max', () => {
    const values = [3, 1, 4, 1, 5, 9, 2, 6];
    const stats = calculateStats(values);
    expect(stats.min).toBe(1);
    expect(stats.max).toBe(9);
  });
  
  it('should handle empty array', () => {
    const stats = calculateStats([]);
    expect(stats.mean).toBe(0);
    expect(stats.count).toBe(0);
  });
});

describe('normalizeMinMax', () => {
  it('should normalize values to 0-1 range', () => {
    const values = [0, 50, 100];
    const normalized = normalizeMinMax(values);
    
    expect(normalized[0]).toBe(0);
    expect(normalized[1]).toBe(0.5);
    expect(normalized[2]).toBe(1);
  });
  
  it('should handle negative values', () => {
    const values = [-10, 0, 10];
    const normalized = normalizeMinMax(values);
    
    expect(normalized[0]).toBe(0);
    expect(normalized[1]).toBe(0.5);
    expect(normalized[2]).toBe(1);
  });
  
  it('should handle all same values', () => {
    const values = [5, 5, 5];
    const normalized = normalizeMinMax(values);
    
    expect(normalized).toEqual([0.5, 0.5, 0.5]);
  });
  
  it('should handle empty array', () => {
    const normalized = normalizeMinMax([]);
    expect(normalized).toEqual([]);
  });
});

describe('zScoreNormalize', () => {
  it('should z-score normalize values', () => {
    const values = [1, 2, 3, 4, 5];
    const zScores = zScoreNormalize(values);
    
    // Mean of z-scores should be ~0
    const mean = zScores.reduce((s, v) => s + v, 0) / zScores.length;
    expect(mean).toBeCloseTo(0, 5);
  });
  
  it('should handle all same values', () => {
    const values = [5, 5, 5];
    const zScores = zScoreNormalize(values);
    expect(zScores).toEqual([0, 0, 0]);
  });
  
  it('should handle empty array', () => {
    const zScores = zScoreNormalize([]);
    expect(zScores).toEqual([]);
  });
});

describe('parseChromosomePosition', () => {
  it('should parse standard chromosome position', () => {
    const result = parseChromosomePosition('chr1:12345');
    expect(result.chromosome).toBe('1');
    expect(result.start).toBe(12345);
    expect(result.end).toBe(12345);
  });
  
  it('should parse position range', () => {
    const result = parseChromosomePosition('chr1:12345-67890');
    expect(result.chromosome).toBe('1');
    expect(result.start).toBe(12345);
    expect(result.end).toBe(67890);
  });
  
  it('should parse without chr prefix', () => {
    const result = parseChromosomePosition('1:12345');
    expect(result.chromosome).toBe('1');
  });
  
  it('should parse sex chromosomes', () => {
    expect(parseChromosomePosition('chrX:1000').chromosome).toBe('X');
    expect(parseChromosomePosition('chrY:1000').chromosome).toBe('Y');
  });
  
  it('should parse mitochondrial chromosome', () => {
    const result = parseChromosomePosition('chrM:500');
    expect(result.chromosome).toBe('M');
  });
  
  it('should throw on invalid format', () => {
    expect(() => parseChromosomePosition('invalid')).toThrow();
    expect(() => parseChromosomePosition('chr:123')).toThrow();
  });
});

describe('formatSIPrefix', () => {
  it('should format thousands', () => {
    expect(formatSIPrefix(1000)).toBe('1.0K');
    expect(formatSIPrefix(5500)).toBe('5.5K');
  });
  
  it('should format millions', () => {
    expect(formatSIPrefix(1000000)).toBe('1.0M');
    expect(formatSIPrefix(2500000)).toBe('2.5M');
  });
  
  it('should format billions', () => {
    expect(formatSIPrefix(1000000000)).toBe('1.0G');
  });
  
  it('should not format small numbers', () => {
    expect(formatSIPrefix(999)).toBe('999');
    expect(formatSIPrefix(0)).toBe('0');
  });
  
  it('should handle very large numbers', () => {
    const result = formatSIPrefix(1e18);
    expect(result).toMatch(/e\+/); // Scientific notation
  });
});
