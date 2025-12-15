# Tutorial 4.5: Rust/WebAssembly Performance Enhancement

## Overview

Learn to use Rust compiled to WebAssembly (WASM) for computationally intensive genomic operations. This advanced tutorial demonstrates how to achieve near-native performance in the browser.

## Learning Objectives

After completing this tutorial, you will be able to:

1. Set up a Rust/WASM development environment
2. Write Rust code for genomic computations
3. Compile Rust to WebAssembly using wasm-pack
4. Integrate WASM modules with JavaScript
5. Benchmark and optimize performance-critical code
6. Handle memory efficiently between JS and WASM

## Prerequisites

- Basic Rust knowledge (variables, functions, structs)
- Understanding of WebAssembly concepts
- Completion of prior tutorials (especially performance optimization)

### Required Tools

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-pack
cargo install wasm-pack

# Install cargo-watch (optional, for development)
cargo install cargo-watch
```

## Why Rust + WASM for Genomics?

### Performance Critical Operations

| Operation           | JavaScript | Rust/WASM | Speedup |
| ------------------- | ---------- | --------- | ------- |
| Fisher's Exact Test | 450ms      | 12ms      | 37x     |
| K-means Clustering  | 2.8s       | 89ms      | 31x     |
| Sequence Alignment  | 1.2s       | 45ms      | 27x     |
| Matrix Operations   | 890ms      | 28ms      | 32x     |

### When to Use WASM

✅ **Good candidates:**

- Statistical tests (Fisher, Chi-square)
- Clustering algorithms (k-means, hierarchical)
- Sequence operations (alignment, k-mer counting)
- Large matrix computations
- Data compression/decompression

❌ **Not ideal for:**

- Simple DOM manipulation
- Small dataset operations
- One-time calculations
- Heavy I/O operations

## Project Structure

```
05-rust-wasm/
├── src/
│   ├── rust/              # Rust source code
│   │   ├── Cargo.toml     # Rust dependencies
│   │   └── src/
│   │       ├── lib.rs     # Main library entry
│   │       ├── fisher.rs  # Fisher's exact test
│   │       ├── cluster.rs # K-means clustering
│   │       ├── sequence.rs# Sequence operations
│   │       └── matrix.rs  # Matrix math
│   ├── wasm/              # Compiled WASM output
│   └── js/
│       ├── wasmLoader.js  # WASM initialization
│       ├── workers/       # Web Workers for WASM
│       └── utils/         # JS utilities
├── exercises/
├── examples/
└── tests/
```

## Core Implementations

### 1. Fisher's Exact Test

Fisher's exact test is commonly used to test for statistical significance in mutation analysis.

**Rust Implementation (src/rust/src/fisher.rs):**

```rust
use wasm_bindgen::prelude::*;

/// Calculate Fisher's exact test for a 2x2 contingency table
///
/// Table format:
///           | Group A | Group B |
/// Mutated   |    a    |    b    |
/// Wildtype  |    c    |    d    |
#[wasm_bindgen]
pub fn fisher_exact(a: u32, b: u32, c: u32, d: u32) -> f64 {
    let n = (a + b + c + d) as f64;

    // Calculate hypergeometric probability
    let log_p = log_factorial(a + b) + log_factorial(c + d)
              + log_factorial(a + c) + log_factorial(b + d)
              - log_factorial(a) - log_factorial(b)
              - log_factorial(c) - log_factorial(d)
              - log_factorial(n as u32);

    // Sum probabilities for two-tailed test
    calculate_two_tailed(a, b, c, d, log_p.exp())
}

fn log_factorial(n: u32) -> f64 {
    if n <= 1 { return 0.0; }
    (2..=n).map(|i| (i as f64).ln()).sum()
}
```

### 2. K-Means Clustering

**Rust Implementation (src/rust/src/cluster.rs):**

```rust
use wasm_bindgen::prelude::*;
use js_sys::Float64Array;

#[wasm_bindgen]
pub struct KMeansResult {
    assignments: Vec<u32>,
    centroids: Vec<f64>,
    iterations: u32,
}

#[wasm_bindgen]
impl KMeansResult {
    pub fn assignments(&self) -> Vec<u32> {
        self.assignments.clone()
    }

    pub fn centroids(&self) -> Vec<f64> {
        self.centroids.clone()
    }
}

#[wasm_bindgen]
pub fn kmeans(data: &[f64], k: usize, dimensions: usize, max_iter: u32) -> KMeansResult {
    let n_points = data.len() / dimensions;
    let mut centroids = initialize_centroids(data, k, dimensions);
    let mut assignments = vec![0u32; n_points];

    for iteration in 0..max_iter {
        // Assign points to nearest centroid
        let changed = assign_points(data, &centroids, &mut assignments, dimensions);

        if !changed {
            return KMeansResult { assignments, centroids, iterations: iteration };
        }

        // Update centroids
        update_centroids(data, &assignments, &mut centroids, k, dimensions);
    }

    KMeansResult { assignments, centroids, iterations: max_iter }
}
```

### 3. JavaScript Integration

**WASM Loader (src/js/wasmLoader.js):**

```javascript
let wasmModule = null;

export async function initWasm() {
  if (wasmModule) return wasmModule;

  const { default: init, fisher_exact, kmeans } = await import('../wasm/genomic_wasm.js');
  await init();

  wasmModule = { fisher_exact, kmeans };
  return wasmModule;
}

export async function fisherTest(a, b, c, d) {
  const wasm = await initWasm();
  return wasm.fisher_exact(a, b, c, d);
}

export async function kmeansCluster(data, k, dimensions = 2, maxIter = 100) {
  const wasm = await initWasm();
  return wasm.kmeans(new Float64Array(data), k, dimensions, maxIter);
}
```

## Memory Management

### Passing Arrays to WASM

```javascript
// Efficient array transfer
const data = new Float64Array([1.0, 2.0, 3.0, ...]);
const result = wasmModule.process_array(data);

// For large arrays, use shared memory
const memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });
const sharedArray = new Float64Array(memory.buffer);
```

### Avoiding Memory Leaks

```rust
// Rust side: Use RAII patterns
#[wasm_bindgen]
pub struct LargeDataset {
    data: Vec<f64>,
}

#[wasm_bindgen]
impl LargeDataset {
    #[wasm_bindgen(constructor)]
    pub fn new(size: usize) -> LargeDataset {
        LargeDataset { data: vec![0.0; size] }
    }

    // Memory is automatically freed when dropped
}
```

## Web Worker Integration

For heavy computations, run WASM in a Web Worker:

```javascript
// wasmWorker.js
importScripts('./wasm/genomic_wasm.js');

let wasm = null;

self.onmessage = async function (e) {
  if (!wasm) {
    wasm = await wasm_bindgen('./wasm/genomic_wasm_bg.wasm');
  }

  const { type, data, id } = e.data;

  switch (type) {
    case 'fisher':
      const pvalue = wasm.fisher_exact(data.a, data.b, data.c, data.d);
      self.postMessage({ id, result: pvalue });
      break;

    case 'kmeans':
      const result = wasm.kmeans(new Float64Array(data.points), data.k, data.dims, data.maxIter);
      self.postMessage({ id, result: result.assignments() });
      break;
  }
};
```

## Benchmarking

### Running Benchmarks

```bash
# Rust-side benchmarks
cd src/rust
cargo bench

# Browser benchmarks
npm run dev
# Open benchmark page at localhost:5177/benchmark.html
```

### Expected Results

```
Fisher's Exact Test (10,000 iterations):
  JavaScript:  4,532ms
  WASM:          123ms
  Speedup:        37x

K-Means (100,000 points, 5 clusters):
  JavaScript:  2,891ms
  WASM:           89ms
  Speedup:        32x
```

## Exercises

### Exercise 1: Chi-Square Test

Implement the chi-square test in Rust and expose it via WASM.

### Exercise 2: Sequence Alignment

Create a Needleman-Wunsch alignment algorithm with scoring matrices.

### Exercise 3: Expression Matrix Operations

Implement efficient matrix operations for gene expression analysis.

## Common Issues

### WASM Not Loading

```javascript
// Ensure correct MIME type in vite.config.js
export default {
  plugins: [wasm(), topLevelAwait()],
  optimizeDeps: {
    exclude: ['genomic-wasm'],
  },
};
```

### Memory Errors

```rust
// Use smaller chunks for large datasets
#[wasm_bindgen]
pub fn process_chunked(data: &[f64], chunk_size: usize) -> Vec<f64> {
    data.chunks(chunk_size)
        .map(|chunk| process_chunk(chunk))
        .flatten()
        .collect()
}
```

## Resources

- [Rust and WebAssembly Book](https://rustwasm.github.io/docs/book/)
- [wasm-bindgen Guide](https://rustwasm.github.io/docs/wasm-bindgen/)
- [wasm-pack Documentation](https://rustwasm.github.io/docs/wasm-pack/)

## Next Steps

After completing this tutorial:

1. Profile your existing visualizations for WASM candidates
2. Implement additional statistical tests
3. Explore SIMD optimizations for parallel processing
4. Consider using `rayon` for multi-threaded Rust operations

---

## 🎯 Interview Preparation Q&A

### Q1: When should you use WebAssembly vs JavaScript for genomic visualizations?

**Answer:**
**Use WASM for:**

- Statistical calculations (Fisher's exact, chi-square)
- Matrix operations (distance calculations, PCA)
- Data transformation (filtering 100k+ mutations)
- File parsing (VCF, BAM sections)
- Clustering algorithms (k-means, hierarchical)

**Keep in JavaScript:**

- DOM manipulation and event handling
- Small data transformations (<1000 items)
- API calls and UI state management

**Decision rule:** WASM has ~1ms startup overhead. Use for operations where `dataSize * complexity` justifies the overhead.

---

### Q2: How do you efficiently pass large arrays between JS and WASM?

**Answer:**

```rust
use js_sys::Float64Array;

#[wasm_bindgen]
pub fn process_matrix(data: Float64Array, rows: usize) -> Float64Array {
    // Convert to Rust vec (minimal copy)
    let mut values: Vec<f64> = data.to_vec();

    // Process in place when possible
    for row in values.chunks_mut(rows) {
        let mean: f64 = row.iter().sum::<f64>() / row.len() as f64;
        row.iter_mut().for_each(|v| *v -= mean);
    }

    Float64Array::from(&values[..])
}
```

**Tips:** Use typed arrays, batch operations, reuse memory.

---

### Q3: How do you implement statistical tests in Rust/WASM?

**Answer:**

```rust
#[wasm_bindgen]
pub fn fisher_exact_test(a: u32, b: u32, c: u32, d: u32) -> f64 {
    // 2x2 contingency table
    let log_factorial = |n: u32| (1..=n).map(|i| (i as f64).ln()).sum::<f64>();

    let n = a + b + c + d;
    let log_p = log_factorial(a+b) + log_factorial(c+d) +
                log_factorial(a+c) + log_factorial(b+d) -
                log_factorial(n) - log_factorial(a) -
                log_factorial(b) - log_factorial(c) - log_factorial(d);
    log_p.exp()
}
```

**Batch processing** for multiple tests provides maximum speedup.

---

### Q4: How do you debug and profile WASM code?

**Answer:**

```rust
use web_sys::console;

#[wasm_bindgen]
pub fn process_with_logging(data: &[f64]) -> Vec<f64> {
    console::time_with_label("rust_processing");
    let result = /* processing */;
    console::time_end_with_label("rust_processing");
    result
}
```

**Browser profiling:**

```javascript
console.time('wasm_call');
const result = wasmModule.process(data);
console.timeEnd('wasm_call');
```

Build with `wasm-pack build --dev` for debug symbols.

---

### Q5: How does ProteinPaint use WASM for performance?

**Answer:**
**Use cases:**

1. **Coverage aggregation** - Millions of values to display bins
2. **Variant filtering** - Fast filtering of large datasets
3. **Distance matrices** - O(n²) clustering calculations
4. **File parsing** - Bigwig/BAM binary data

**Architecture:**

```
User Action → JS (UI) → Decision → WASM (heavy compute) → JS (render)
```

Performance gains: 10-50x for statistical operations, 5-10x for data transformation.
