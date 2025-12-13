/**
 * Data Transformation Utilities
 * Functions for validating and processing genomic data
 */

export interface GeneData {
  gene: string;
  expression: number;
  category?: string;
}

export interface ProcessedGeneData extends GeneData {
  normalized: number;
  rank: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  data: GeneData[];
}

/**
 * Validate gene expression data
 */
export function validateData(data: unknown): GeneData[] {
  if (!Array.isArray(data)) {
    throw new Error('Data must be an array');
  }

  const errors: string[] = [];
  const validData: GeneData[] = [];

  data.forEach((item, index) => {
    if (!item || typeof item !== 'object') {
      errors.push(`Item ${index}: Invalid object`);
      return;
    }

    const record = item as Record<string, unknown>;

    if (typeof record.gene !== 'string' || record.gene.trim() === '') {
      errors.push(`Item ${index}: Missing or invalid gene name`);
      return;
    }

    if (typeof record.expression !== 'number' || isNaN(record.expression)) {
      errors.push(`Item ${index}: Missing or invalid expression value`);
      return;
    }

    if (record.expression < 0) {
      errors.push(`Item ${index}: Expression value cannot be negative`);
      return;
    }

    validData.push({
      gene: record.gene.trim(),
      expression: record.expression,
      category: typeof record.category === 'string' ? record.category : undefined,
    });
  });

  if (errors.length > 0) {
    console.warn('Data validation warnings:', errors);
  }

  return validData;
}

/**
 * Process and transform gene data
 */
export function processGeneData(data: GeneData[]): ProcessedGeneData[] {
  if (data.length === 0) {
    return [];
  }

  // Find max expression for normalization
  const maxExpression = Math.max(...data.map((d) => d.expression));

  // Sort by expression (descending) and add computed fields
  const sorted = [...data].sort((a, b) => b.expression - a.expression);

  return sorted.map((item, index) => ({
    ...item,
    normalized: maxExpression > 0 ? item.expression / maxExpression : 0,
    rank: index + 1,
  }));
}

/**
 * Filter data by expression threshold
 */
export function filterByExpression(
  data: GeneData[],
  minExpression: number,
  maxExpression?: number
): GeneData[] {
  return data.filter((item) => {
    if (item.expression < minExpression) return false;
    if (maxExpression !== undefined && item.expression > maxExpression) return false;
    return true;
  });
}

/**
 * Group data by category
 */
export function groupByCategory(data: GeneData[]): Map<string, GeneData[]> {
  const groups = new Map<string, GeneData[]>();

  data.forEach((item) => {
    const category = item.category || 'uncategorized';
    const existing = groups.get(category) || [];
    existing.push(item);
    groups.set(category, existing);
  });

  return groups;
}

/**
 * Calculate summary statistics
 */
export function calculateStats(data: GeneData[]): {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
} {
  if (data.length === 0) {
    return { count: 0, mean: 0, median: 0, min: 0, max: 0, stdDev: 0 };
  }

  const values = data.map((d) => d.expression);
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / count;

  const sorted = [...values].sort((a, b) => a - b);
  const median =
    count % 2 === 0 ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2 : sorted[Math.floor(count / 2)];

  const min = Math.min(...values);
  const max = Math.max(...values);

  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / count;
  const stdDev = Math.sqrt(avgSquaredDiff);

  return { count, mean, median, min, max, stdDev };
}
