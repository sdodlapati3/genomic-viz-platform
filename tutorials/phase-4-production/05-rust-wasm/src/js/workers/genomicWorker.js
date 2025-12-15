/**
 * Genomic WASM Worker
 *
 * Runs WASM computations in a separate thread to avoid
 * blocking the main UI.
 */

// Import WASM module (will be bundled by build process)
let wasm = null;
let initPromise = null;

/**
 * Initialize WASM in worker context
 */
async function initWasm() {
  if (wasm) return wasm;

  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      // Import the WASM module - path relative to worker location
      importScripts('../wasm/genomic_wasm.js');

      // Initialize
      await wasm_bindgen('../wasm/genomic_wasm_bg.wasm');
      wasm = wasm_bindgen;

      self.postMessage({ type: 'ready', version: wasm.version() });
      return wasm;
    } catch (error) {
      self.postMessage({ type: 'error', error: error.message });
      throw error;
    }
  })();

  return initPromise;
}

// Task handlers
const handlers = {
  /**
   * Fisher's exact test
   */
  async fisher({ a, b, c, d }) {
    const w = await initWasm();
    return w.fisher_exact(a, b, c, d);
  },

  /**
   * Batch Fisher's test
   */
  async fisherBatch({ tables }) {
    const w = await initWasm();
    const flat = tables.flatMap((t) => [t.a, t.b, t.c, t.d]);
    return Array.from(w.fisher_exact_batch(new Uint32Array(flat)));
  },

  /**
   * K-means clustering
   */
  async kmeans({ data, k, dims, maxIter }) {
    const w = await initWasm();
    const result = w.kmeans(new Float64Array(data), k, dims || 2, maxIter || 100);

    return {
      assignments: Array.from(result.assignments()),
      centroids: Array.from(result.centroids()),
      iterations: result.iterations(),
      converged: result.converged(),
      inertia: result.inertia(),
    };
  },

  /**
   * K-means with multiple initializations
   */
  async kmeansBest({ data, k, dims, maxIter, nInit }) {
    const w = await initWasm();
    const result = w.kmeans_best(new Float64Array(data), k, dims || 2, maxIter || 100, nInit || 10);

    return {
      assignments: Array.from(result.assignments()),
      centroids: Array.from(result.centroids()),
      iterations: result.iterations(),
      converged: result.converged(),
      inertia: result.inertia(),
    };
  },

  /**
   * Elbow analysis
   */
  async elbow({ data, dims, maxK }) {
    const w = await initWasm();
    return Array.from(w.elbow_analysis(new Float64Array(data), dims || 2, maxK || 10, 100));
  },

  /**
   * GC content
   */
  async gcContent({ sequence }) {
    const w = await initWasm();
    return w.gc_content(sequence);
  },

  /**
   * GC content windows
   */
  async gcWindows({ sequence, windowSize, step }) {
    const w = await initWasm();
    return Array.from(w.gc_content_windows(sequence, windowSize, step));
  },

  /**
   * K-mer counting
   */
  async kmers({ sequence, k }) {
    const w = await initWasm();
    const result = w.count_kmers_detailed(sequence, k);

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
  },

  /**
   * Correlation matrix
   */
  async correlation({ matrix, rows, cols }) {
    const w = await initWasm();
    const result = w.correlation_matrix(new Float64Array(matrix), rows, cols);

    return {
      data: Array.from(result.data()),
      rows: result.rows(),
      cols: result.cols(),
    };
  },

  /**
   * Matrix multiplication
   */
  async matmul({ a, b, m, k, n }) {
    const w = await initWasm();
    const result = w.matmul(new Float64Array(a), new Float64Array(b), m, k, n);

    return {
      data: Array.from(result.data()),
      rows: result.rows(),
      cols: result.cols(),
    };
  },

  /**
   * Z-score normalization
   */
  async zscore({ matrix, rows, cols }) {
    const w = await initWasm();
    const result = w.zscore_normalize(new Float64Array(matrix), rows, cols);

    return {
      data: Array.from(result.data()),
      rows: result.rows(),
      cols: result.cols(),
    };
  },
};

// Message handler
self.onmessage = async function (event) {
  const { type, data, id } = event.data;

  try {
    if (!handlers[type]) {
      throw new Error(`Unknown task type: ${type}`);
    }

    const result = await handlers[type](data);

    self.postMessage({
      type: 'result',
      id,
      result,
    });
  } catch (error) {
    self.postMessage({
      type: 'error',
      id,
      error: error.message,
    });
  }
};

// Initialize on load
initWasm().catch(console.error);
