/**
 * WASM Loader Utility
 *
 * Handles WebAssembly module initialization and provides
 * a clean JavaScript API for genomic computations.
 */

let wasmModule = null;
let initPromise = null;

/**
 * Initialize the WASM module
 * @returns {Promise<Object>} The initialized WASM module
 */
export async function initWasm() {
  // Return cached module if available
  if (wasmModule) {
    return wasmModule;
  }

  // Return existing init promise if in progress
  if (initPromise) {
    return initPromise;
  }

  // Start initialization
  initPromise = (async () => {
    try {
      // Dynamic import of the generated WASM bindings
      const wasm = await import('../wasm/genomic_wasm.js');
      await wasm.default();

      wasmModule = wasm;
      console.log(`WASM loaded: genomic-wasm v${wasm.version()}`);

      return wasmModule;
    } catch (error) {
      console.error('Failed to load WASM:', error);
      initPromise = null;
      throw error;
    }
  })();

  return initPromise;
}

/**
 * Check if WASM is supported
 */
export function isWasmSupported() {
  return typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
}

/**
 * Get the loaded WASM module (throws if not initialized)
 */
export function getWasm() {
  if (!wasmModule) {
    throw new Error('WASM not initialized. Call initWasm() first.');
  }
  return wasmModule;
}

// ============================================
// Statistical Functions
// ============================================

/**
 * Fisher's exact test for 2x2 contingency table
 * @param {number} a - Count (1,1)
 * @param {number} b - Count (1,2)
 * @param {number} c - Count (2,1)
 * @param {number} d - Count (2,2)
 * @returns {Promise<number>} Two-tailed p-value
 */
export async function fisherTest(a, b, c, d) {
  const wasm = await initWasm();
  return wasm.fisher_exact(a, b, c, d);
}

/**
 * Batch Fisher's exact test
 * @param {Array<{a,b,c,d}>} tables - Array of contingency tables
 * @returns {Promise<number[]>} Array of p-values
 */
export async function fisherTestBatch(tables) {
  const wasm = await initWasm();
  const flatTables = tables.flatMap((t) => [t.a, t.b, t.c, t.d]);
  return Array.from(wasm.fisher_exact_batch(new Uint32Array(flatTables)));
}

/**
 * Calculate odds ratio with confidence interval
 * @param {number} a - Count (1,1)
 * @param {number} b - Count (1,2)
 * @param {number} c - Count (2,1)
 * @param {number} d - Count (2,2)
 * @param {number} confidence - Confidence level (default 0.95)
 * @returns {Promise<Object>} Odds ratio result
 */
export async function oddsRatio(a, b, c, d, confidence = 0.95) {
  const wasm = await initWasm();
  const result = wasm.odds_ratio_ci(a, b, c, d, confidence);

  return {
    oddsRatio: result.odds_ratio(),
    ciLower: result.ci_lower(),
    ciUpper: result.ci_upper(),
    pValue: result.p_value(),
  };
}

// ============================================
// Clustering Functions
// ============================================

/**
 * K-means clustering
 * @param {number[]} data - Flattened array of points
 * @param {number} k - Number of clusters
 * @param {number} dims - Dimensions per point (default 2)
 * @param {number} maxIter - Maximum iterations (default 100)
 * @returns {Promise<Object>} Clustering result
 */
export async function kmeans(data, k, dims = 2, maxIter = 100) {
  const wasm = await initWasm();
  const result = wasm.kmeans(new Float64Array(data), k, dims, maxIter);

  return {
    assignments: Array.from(result.assignments()),
    centroids: Array.from(result.centroids()),
    iterations: result.iterations(),
    converged: result.converged(),
    inertia: result.inertia(),
  };
}

/**
 * K-means with multiple initializations
 * @param {number[]} data - Flattened array of points
 * @param {number} k - Number of clusters
 * @param {number} dims - Dimensions per point
 * @param {number} maxIter - Maximum iterations
 * @param {number} nInit - Number of initializations (default 10)
 * @returns {Promise<Object>} Best clustering result
 */
export async function kmeansBest(data, k, dims = 2, maxIter = 100, nInit = 10) {
  const wasm = await initWasm();
  const result = wasm.kmeans_best(new Float64Array(data), k, dims, maxIter, nInit);

  return {
    assignments: Array.from(result.assignments()),
    centroids: Array.from(result.centroids()),
    iterations: result.iterations(),
    converged: result.converged(),
    inertia: result.inertia(),
  };
}

/**
 * Elbow method analysis
 * @param {number[]} data - Flattened array of points
 * @param {number} dims - Dimensions per point
 * @param {number} maxK - Maximum K to test
 * @returns {Promise<number[]>} Inertia values for k=1 to maxK
 */
export async function elbowAnalysis(data, dims = 2, maxK = 10) {
  const wasm = await initWasm();
  return Array.from(wasm.elbow_analysis(new Float64Array(data), dims, maxK, 100));
}

/**
 * Calculate silhouette score
 * @param {number[]} data - Flattened array of points
 * @param {number[]} assignments - Cluster assignments
 * @param {number} dims - Dimensions per point
 * @returns {Promise<number>} Silhouette score (-1 to 1)
 */
export async function silhouetteScore(data, assignments, dims = 2) {
  const wasm = await initWasm();
  return wasm.silhouette_score(new Float64Array(data), new Uint32Array(assignments), dims);
}

// ============================================
// Sequence Functions
// ============================================

/**
 * Calculate GC content
 * @param {string} sequence - DNA sequence
 * @returns {Promise<number>} GC content (0-1)
 */
export async function gcContent(sequence) {
  const wasm = await initWasm();
  return wasm.gc_content(sequence);
}

/**
 * GC content in sliding windows
 * @param {string} sequence - DNA sequence
 * @param {number} windowSize - Window size
 * @param {number} step - Step size
 * @returns {Promise<number[]>} GC content per window
 */
export async function gcContentWindows(sequence, windowSize, step) {
  const wasm = await initWasm();
  return Array.from(wasm.gc_content_windows(sequence, windowSize, step));
}

/**
 * Count k-mers in sequence
 * @param {string} sequence - DNA sequence
 * @param {number} k - K-mer length
 * @returns {Promise<Object>} K-mer counts
 */
export async function countKmers(sequence, k) {
  const wasm = await initWasm();
  const result = wasm.count_kmers_detailed(sequence, k);

  const kmers = result.kmers();
  const counts = result.counts();

  const kmerCounts = {};
  for (let i = 0; i < kmers.length; i++) {
    kmerCounts[kmers[i]] = counts[i];
  }

  return {
    counts: kmerCounts,
    total: result.total(),
    unique: result.unique_count(),
  };
}

/**
 * Reverse complement of DNA sequence
 * @param {string} sequence - DNA sequence
 * @returns {Promise<string>} Reverse complement
 */
export async function reverseComplement(sequence) {
  const wasm = await initWasm();
  return wasm.reverse_complement(sequence);
}

/**
 * Transcribe DNA to RNA
 * @param {string} sequence - DNA sequence
 * @returns {Promise<string>} RNA sequence
 */
export async function transcribe(sequence) {
  const wasm = await initWasm();
  return wasm.transcribe(sequence);
}

/**
 * Translate RNA to protein
 * @param {string} sequence - RNA sequence
 * @returns {Promise<string>} Protein sequence
 */
export async function translate(sequence) {
  const wasm = await initWasm();
  return wasm.translate(sequence);
}

/**
 * Find pattern occurrences
 * @param {string} text - Text to search
 * @param {string} pattern - Pattern to find
 * @returns {Promise<number[]>} Starting positions
 */
export async function findPattern(text, pattern) {
  const wasm = await initWasm();
  return Array.from(wasm.find_pattern(text, pattern));
}

// ============================================
// Matrix Functions
// ============================================

/**
 * Matrix multiplication
 * @param {number[]} a - First matrix (flattened)
 * @param {number[]} b - Second matrix (flattened)
 * @param {number} m - Rows in A
 * @param {number} k - Cols in A / Rows in B
 * @param {number} n - Cols in B
 * @returns {Promise<Object>} Result matrix
 */
export async function matmul(a, b, m, k, n) {
  const wasm = await initWasm();
  const result = wasm.matmul(new Float64Array(a), new Float64Array(b), m, k, n);

  return {
    data: Array.from(result.data()),
    rows: result.rows(),
    cols: result.cols(),
  };
}

/**
 * Pearson correlation between two vectors
 * @param {number[]} x - First vector
 * @param {number[]} y - Second vector
 * @returns {Promise<number>} Correlation coefficient
 */
export async function pearsonCorrelation(x, y) {
  const wasm = await initWasm();
  return wasm.pearson_correlation(new Float64Array(x), new Float64Array(y));
}

/**
 * Spearman correlation between two vectors
 * @param {number[]} x - First vector
 * @param {number[]} y - Second vector
 * @returns {Promise<number>} Correlation coefficient
 */
export async function spearmanCorrelation(x, y) {
  const wasm = await initWasm();
  return wasm.spearman_correlation(new Float64Array(x), new Float64Array(y));
}

/**
 * Calculate correlation matrix
 * @param {number[]} matrix - Flattened matrix (genes x samples)
 * @param {number} rows - Number of rows (genes)
 * @param {number} cols - Number of columns (samples)
 * @returns {Promise<Object>} Correlation matrix
 */
export async function correlationMatrix(matrix, rows, cols) {
  const wasm = await initWasm();
  const result = wasm.correlation_matrix(new Float64Array(matrix), rows, cols);

  return {
    data: Array.from(result.data()),
    rows: result.rows(),
    cols: result.cols(),
  };
}

/**
 * Z-score normalize matrix (row-wise)
 * @param {number[]} matrix - Flattened matrix
 * @param {number} rows - Number of rows
 * @param {number} cols - Number of columns
 * @returns {Promise<Object>} Normalized matrix
 */
export async function zscoreNormalize(matrix, rows, cols) {
  const wasm = await initWasm();
  const result = wasm.zscore_normalize(new Float64Array(matrix), rows, cols);

  return {
    data: Array.from(result.data()),
    rows: result.rows(),
    cols: result.cols(),
  };
}

// ============================================
// Benchmarking Utilities
// ============================================

/**
 * Run performance benchmark
 * @param {string} name - Benchmark name
 * @param {Function} fn - Function to benchmark
 * @param {number} iterations - Number of iterations
 * @returns {Object} Benchmark results
 */
export async function benchmark(name, fn, iterations = 100) {
  // Warmup
  for (let i = 0; i < 5; i++) {
    await fn();
  }

  // Measure
  const times = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);

  return {
    name,
    iterations,
    mean: times.reduce((a, b) => a + b) / times.length,
    median: times[Math.floor(times.length / 2)],
    min: times[0],
    max: times[times.length - 1],
    p95: times[Math.floor(times.length * 0.95)],
  };
}

export default {
  initWasm,
  isWasmSupported,
  fisherTest,
  fisherTestBatch,
  oddsRatio,
  kmeans,
  kmeansBest,
  elbowAnalysis,
  silhouetteScore,
  gcContent,
  gcContentWindows,
  countKmers,
  reverseComplement,
  transcribe,
  translate,
  findPattern,
  matmul,
  pearsonCorrelation,
  spearmanCorrelation,
  correlationMatrix,
  zscoreNormalize,
  benchmark,
};
