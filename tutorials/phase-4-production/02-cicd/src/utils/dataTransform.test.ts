/**
 * Tests for Data Transform Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  validateData,
  processGeneData,
  filterByExpression,
  groupByCategory,
  calculateStats,
  type GeneData,
} from './dataTransform';

describe('validateData', () => {
  it('should validate correct data', () => {
    const input = [
      { gene: 'TP53', expression: 100 },
      { gene: 'BRCA1', expression: 50 },
    ];
    const result = validateData(input);
    expect(result).toHaveLength(2);
    expect(result[0].gene).toBe('TP53');
  });

  it('should throw error for non-array input', () => {
    expect(() => validateData('not an array')).toThrow('Data must be an array');
    expect(() => validateData(null)).toThrow('Data must be an array');
  });

  it('should filter out invalid items', () => {
    const input = [
      { gene: 'TP53', expression: 100 },
      { gene: '', expression: 50 }, // invalid: empty gene
      { gene: 'BRCA1', expression: -10 }, // invalid: negative expression
      { expression: 75 }, // invalid: missing gene
      { gene: 'KRAS' }, // invalid: missing expression
    ];
    const result = validateData(input);
    expect(result).toHaveLength(1);
    expect(result[0].gene).toBe('TP53');
  });

  it('should trim gene names', () => {
    const input = [{ gene: '  TP53  ', expression: 100 }];
    const result = validateData(input);
    expect(result[0].gene).toBe('TP53');
  });

  it('should include optional category', () => {
    const input = [{ gene: 'TP53', expression: 100, category: 'tumor-suppressor' }];
    const result = validateData(input);
    expect(result[0].category).toBe('tumor-suppressor');
  });
});

describe('processGeneData', () => {
  it('should process and sort data by expression', () => {
    const input: GeneData[] = [
      { gene: 'TP53', expression: 50 },
      { gene: 'BRCA1', expression: 100 },
      { gene: 'KRAS', expression: 75 },
    ];
    const result = processGeneData(input);

    expect(result).toHaveLength(3);
    expect(result[0].gene).toBe('BRCA1'); // highest expression
    expect(result[0].rank).toBe(1);
    expect(result[2].gene).toBe('TP53'); // lowest expression
    expect(result[2].rank).toBe(3);
  });

  it('should calculate normalized values', () => {
    const input: GeneData[] = [
      { gene: 'A', expression: 100 },
      { gene: 'B', expression: 50 },
    ];
    const result = processGeneData(input);

    expect(result[0].normalized).toBe(1); // max = 100/100
    expect(result[1].normalized).toBe(0.5); // 50/100
  });

  it('should handle empty array', () => {
    const result = processGeneData([]);
    expect(result).toEqual([]);
  });

  it('should handle all zero expressions', () => {
    const input: GeneData[] = [
      { gene: 'A', expression: 0 },
      { gene: 'B', expression: 0 },
    ];
    const result = processGeneData(input);

    expect(result[0].normalized).toBe(0);
    expect(result[1].normalized).toBe(0);
  });
});

describe('filterByExpression', () => {
  const testData: GeneData[] = [
    { gene: 'A', expression: 10 },
    { gene: 'B', expression: 50 },
    { gene: 'C', expression: 100 },
    { gene: 'D', expression: 150 },
  ];

  it('should filter by minimum expression', () => {
    const result = filterByExpression(testData, 50);
    expect(result).toHaveLength(3);
    expect(result.map((d) => d.gene)).toEqual(['B', 'C', 'D']);
  });

  it('should filter by min and max expression', () => {
    const result = filterByExpression(testData, 25, 100);
    expect(result).toHaveLength(2);
    expect(result.map((d) => d.gene)).toEqual(['B', 'C']);
  });

  it('should return empty array if no matches', () => {
    const result = filterByExpression(testData, 200);
    expect(result).toEqual([]);
  });
});

describe('groupByCategory', () => {
  it('should group data by category', () => {
    const input: GeneData[] = [
      { gene: 'TP53', expression: 100, category: 'tumor-suppressor' },
      { gene: 'BRCA1', expression: 50, category: 'tumor-suppressor' },
      { gene: 'KRAS', expression: 75, category: 'oncogene' },
    ];
    const result = groupByCategory(input);

    expect(result.size).toBe(2);
    expect(result.get('tumor-suppressor')).toHaveLength(2);
    expect(result.get('oncogene')).toHaveLength(1);
  });

  it('should use "uncategorized" for items without category', () => {
    const input: GeneData[] = [
      { gene: 'A', expression: 100 },
      { gene: 'B', expression: 50 },
    ];
    const result = groupByCategory(input);

    expect(result.size).toBe(1);
    expect(result.get('uncategorized')).toHaveLength(2);
  });
});

describe('calculateStats', () => {
  it('should calculate correct statistics', () => {
    const input: GeneData[] = [
      { gene: 'A', expression: 10 },
      { gene: 'B', expression: 20 },
      { gene: 'C', expression: 30 },
      { gene: 'D', expression: 40 },
      { gene: 'E', expression: 50 },
    ];
    const stats = calculateStats(input);

    expect(stats.count).toBe(5);
    expect(stats.mean).toBe(30);
    expect(stats.median).toBe(30);
    expect(stats.min).toBe(10);
    expect(stats.max).toBe(50);
    expect(stats.stdDev).toBeCloseTo(14.14, 1);
  });

  it('should handle even number of items for median', () => {
    const input: GeneData[] = [
      { gene: 'A', expression: 10 },
      { gene: 'B', expression: 20 },
      { gene: 'C', expression: 30 },
      { gene: 'D', expression: 40 },
    ];
    const stats = calculateStats(input);

    expect(stats.median).toBe(25); // (20 + 30) / 2
  });

  it('should handle empty array', () => {
    const stats = calculateStats([]);

    expect(stats.count).toBe(0);
    expect(stats.mean).toBe(0);
    expect(stats.median).toBe(0);
    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.stdDev).toBe(0);
  });

  it('should handle single item', () => {
    const input: GeneData[] = [{ gene: 'A', expression: 100 }];
    const stats = calculateStats(input);

    expect(stats.count).toBe(1);
    expect(stats.mean).toBe(100);
    expect(stats.median).toBe(100);
    expect(stats.min).toBe(100);
    expect(stats.max).toBe(100);
    expect(stats.stdDev).toBe(0);
  });
});
