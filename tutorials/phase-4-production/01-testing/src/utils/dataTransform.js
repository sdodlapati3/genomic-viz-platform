/**
 * Data Transformation Utilities
 * Functions for processing genomic data
 */

/**
 * Calculate -log10(p-value) with protection against log(0)
 * @param {number} pValue - P-value (0-1)
 * @returns {number} -log10(p-value)
 */
export function negLog10(pValue) {
  if (pValue <= 0) return Infinity;
  if (pValue >= 1) return 0;
  return -Math.log10(pValue);
}

/**
 * Calculate log2 fold change
 * @param {number} treatment - Treatment value
 * @param {number} control - Control value
 * @returns {number} log2(treatment/control)
 */
export function log2FoldChange(treatment, control) {
  if (control === 0) return treatment > 0 ? Infinity : 0;
  if (treatment === 0) return -Infinity;
  return Math.log2(treatment / control);
}

/**
 * Filter significant genes from differential expression data
 * @param {Array} data - Array of gene objects
 * @param {Object} thresholds - Significance thresholds
 * @returns {Object} Categorized genes
 */
export function filterSignificantGenes(data, thresholds = {}) {
  const { pValue = 0.05, log2FC = 1 } = thresholds;
  
  const results = {
    upregulated: [],
    downregulated: [],
    notSignificant: []
  };
  
  for (const gene of data) {
    const isSignificantP = gene.pValue < pValue;
    const isUpregulated = gene.log2FC > log2FC;
    const isDownregulated = gene.log2FC < -log2FC;
    
    if (isSignificantP && isUpregulated) {
      results.upregulated.push(gene);
    } else if (isSignificantP && isDownregulated) {
      results.downregulated.push(gene);
    } else {
      results.notSignificant.push(gene);
    }
  }
  
  return results;
}

/**
 * Bin data into histogram buckets
 * @param {Array} values - Numeric values
 * @param {number} numBins - Number of bins
 * @returns {Array} Bin objects with count and range
 */
export function createHistogramBins(values, numBins = 20) {
  if (!values || values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Handle case where all values are the same
  if (min === max) {
    const bins = Array.from({ length: numBins }, (_, i) => ({
      x0: min,
      x1: min,
      count: i === 0 ? values.length : 0,
      values: i === 0 ? [...values] : []
    }));
    return bins;
  }
  
  const binWidth = (max - min) / numBins;
  
  const bins = Array.from({ length: numBins }, (_, i) => ({
    x0: min + i * binWidth,
    x1: min + (i + 1) * binWidth,
    count: 0,
    values: []
  }));
  
  for (const value of values) {
    let binIndex = Math.floor((value - min) / binWidth);
    // Handle edge case where value equals max
    if (binIndex >= numBins) binIndex = numBins - 1;
    bins[binIndex].count++;
    bins[binIndex].values.push(value);
  }
  
  return bins;
}

/**
 * Calculate summary statistics
 * @param {Array} values - Numeric values
 * @returns {Object} Summary statistics
 */
export function calculateStats(values) {
  if (!values || values.length === 0) {
    return { mean: 0, median: 0, std: 0, min: 0, max: 0, count: 0 };
  }
  
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((sum, v) => sum + v, 0) / n;
  
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];
  
  const variance = sorted.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  
  return {
    mean: Number(mean.toFixed(6)),
    median: Number(median.toFixed(6)),
    std: Number(std.toFixed(6)),
    min: sorted[0],
    max: sorted[n - 1],
    count: n
  };
}

/**
 * Normalize data to 0-1 range
 * @param {Array} values - Numeric values
 * @returns {Array} Normalized values
 */
export function normalizeMinMax(values) {
  if (!values || values.length === 0) return [];
  
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  if (range === 0) return values.map(() => 0.5);
  
  return values.map(v => (v - min) / range);
}

/**
 * Z-score normalization
 * @param {Array} values - Numeric values
 * @returns {Array} Z-score normalized values
 */
export function zScoreNormalize(values) {
  if (!values || values.length === 0) return [];
  
  const stats = calculateStats(values);
  if (stats.std === 0) return values.map(() => 0);
  
  return values.map(v => (v - stats.mean) / stats.std);
}

/**
 * Parse chromosome position string
 * @param {string} position - Position string like "chr1:12345-67890"
 * @returns {Object} Parsed position object
 */
export function parseChromosomePosition(position) {
  const match = position.match(/^(chr)?(\d+|[XYM]|MT):(\d+)(?:-(\d+))?$/i);
  
  if (!match) {
    throw new Error(`Invalid chromosome position: ${position}`);
  }
  
  return {
    chromosome: match[2].toUpperCase(),
    start: parseInt(match[3], 10),
    end: match[4] ? parseInt(match[4], 10) : parseInt(match[3], 10)
  };
}

/**
 * Format large numbers with SI prefixes
 * @param {number} value - Number to format
 * @returns {string} Formatted string
 */
export function formatSIPrefix(value) {
  if (value === 0) return '0';
  
  const prefixes = ['', 'K', 'M', 'G', 'T', 'P'];
  const tier = Math.floor(Math.log10(Math.abs(value)) / 3);
  
  if (tier === 0) return value.toString();
  if (tier >= prefixes.length) return value.toExponential(2);
  
  const scaled = value / Math.pow(10, tier * 3);
  return scaled.toFixed(1) + prefixes[tier];
}
