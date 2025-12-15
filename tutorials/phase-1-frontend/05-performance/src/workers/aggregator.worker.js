/**
 * Data Aggregation Worker
 *
 * Performs heavy computation off the main thread:
 * - Binning/aggregation
 * - Statistics calculation
 * - Filtering
 */

// Message handler
self.onmessage = function (e) {
  const { type, id, ...params } = e.data;

  let result;

  try {
    switch (type) {
      case 'aggregate':
        result = aggregateData(params);
        break;
      case 'filter':
        result = filterData(params);
        break;
      case 'statistics':
        result = calculateStatistics(params);
        break;
      case 'downsample':
        result = downsampleData(params);
        break;
      default:
        throw new Error(`Unknown message type: ${type}`);
    }

    self.postMessage({ id, success: true, result });
  } catch (error) {
    self.postMessage({ id, success: false, error: error.message });
  }
};

/**
 * Aggregate data into bins
 *
 * @param {Object} params
 * @param {Array} params.data - Input data points
 * @param {number} params.binSize - Size of each bin in bp
 * @param {number} params.start - Start of region
 * @param {number} params.end - End of region
 * @param {string} [params.aggregation='mean'] - Aggregation method
 */
function aggregateData({ data, binSize, start, end, aggregation = 'mean' }) {
  const numBins = Math.ceil((end - start) / binSize);
  const bins = new Array(numBins);

  // Initialize bins
  for (let i = 0; i < numBins; i++) {
    bins[i] = {
      start: start + i * binSize,
      end: start + (i + 1) * binSize,
      values: [],
      count: 0,
    };
  }

  // Assign data to bins
  for (const d of data) {
    const pos = d.position || d.x || 0;
    if (pos < start || pos >= end) continue;

    const binIndex = Math.floor((pos - start) / binSize);
    if (binIndex >= 0 && binIndex < numBins) {
      const value = d.value || d.y || 0;
      bins[binIndex].values.push(value);
      bins[binIndex].count++;
    }
  }

  // Calculate aggregated values
  const result = bins.map((bin) => {
    if (bin.count === 0) {
      return {
        start: bin.start,
        end: bin.end,
        value: null,
        count: 0,
      };
    }

    let value;
    switch (aggregation) {
      case 'sum':
        value = bin.values.reduce((a, b) => a + b, 0);
        break;
      case 'max':
        value = Math.max(...bin.values);
        break;
      case 'min':
        value = Math.min(...bin.values);
        break;
      case 'count':
        value = bin.count;
        break;
      case 'mean':
      default:
        value = bin.values.reduce((a, b) => a + b, 0) / bin.count;
        break;
    }

    return {
      start: bin.start,
      end: bin.end,
      value,
      count: bin.count,
      min: Math.min(...bin.values),
      max: Math.max(...bin.values),
    };
  });

  return {
    bins: result,
    totalPoints: data.length,
    binSize,
    numBins,
  };
}

/**
 * Filter data by various criteria
 *
 * @param {Object} params
 * @param {Array} params.data - Input data
 * @param {Object} params.filters - Filter criteria
 */
function filterData({ data, filters }) {
  let result = data;

  // Chromosome filter
  if (filters.chromosome) {
    result = result.filter((d) => (d.chromosome || d.chr) === filters.chromosome);
  }

  // Region filter
  if (filters.start !== undefined && filters.end !== undefined) {
    result = result.filter((d) => {
      const pos = d.position || d.x || 0;
      return pos >= filters.start && pos <= filters.end;
    });
  }

  // Value filter
  if (filters.minValue !== undefined) {
    result = result.filter((d) => (d.value || d.y || 0) >= filters.minValue);
  }
  if (filters.maxValue !== undefined) {
    result = result.filter((d) => (d.value || d.y || 0) <= filters.maxValue);
  }

  // Custom filter function (passed as string)
  if (filters.custom) {
    const filterFn = new Function('d', `return ${filters.custom}`);
    result = result.filter(filterFn);
  }

  return {
    data: result,
    originalCount: data.length,
    filteredCount: result.length,
  };
}

/**
 * Calculate statistics for a dataset
 *
 * @param {Object} params
 * @param {Array} params.data - Input data
 */
function calculateStatistics({ data }) {
  if (data.length === 0) {
    return {
      count: 0,
      min: null,
      max: null,
      mean: null,
      median: null,
      std: null,
      q1: null,
      q3: null,
    };
  }

  const values = data.map((d) => d.value || d.y || 0);
  const sorted = [...values].sort((a, b) => a - b);

  const n = values.length;
  const sum = values.reduce((a, b) => a + b, 0);
  const mean = sum / n;

  // Variance and std dev
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n;
  const std = Math.sqrt(variance);

  // Quartiles
  const q1Index = Math.floor(n * 0.25);
  const q2Index = Math.floor(n * 0.5);
  const q3Index = Math.floor(n * 0.75);

  return {
    count: n,
    min: sorted[0],
    max: sorted[n - 1],
    sum,
    mean,
    median: sorted[q2Index],
    std,
    q1: sorted[q1Index],
    q3: sorted[q3Index],
    iqr: sorted[q3Index] - sorted[q1Index],
  };
}

/**
 * Downsample data to a maximum number of points
 * Uses reservoir sampling for uniform distribution
 *
 * @param {Object} params
 * @param {Array} params.data - Input data
 * @param {number} params.maxPoints - Maximum points to return
 */
function downsampleData({ data, maxPoints }) {
  if (data.length <= maxPoints) {
    return { data, sampled: false };
  }

  // Reservoir sampling
  const reservoir = new Array(maxPoints);

  for (let i = 0; i < maxPoints; i++) {
    reservoir[i] = data[i];
  }

  for (let i = maxPoints; i < data.length; i++) {
    const j = Math.floor(Math.random() * (i + 1));
    if (j < maxPoints) {
      reservoir[j] = data[i];
    }
  }

  // Sort by position to maintain order
  reservoir.sort((a, b) => (a.position || a.x || 0) - (b.position || b.x || 0));

  return {
    data: reservoir,
    sampled: true,
    originalCount: data.length,
    sampledCount: maxPoints,
  };
}

// Report ready
self.postMessage({ type: 'ready' });
