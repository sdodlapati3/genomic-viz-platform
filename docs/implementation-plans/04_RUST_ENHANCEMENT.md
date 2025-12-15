# Implementation Plan: Rust Enhancement (Phase 4.4)

> Build production-grade genomic algorithms in Rust with WASM compilation

## Overview

ProteinPaint uses 19 Rust binaries for performance-critical operations (alignment, clustering, statistics, file parsing). Our current tutorial is introductory. This enhancement teaches building real genomic algorithms in Rust and deploying them both as Node.js native modules and WebAssembly for browser use.

---

## Learning Objectives

By the end of this tutorial, students will be able to:

1. Implement genomic algorithms in Rust (Fisher exact, clustering, statistics)
2. Compile Rust to WebAssembly for browser use
3. Create Node.js native addons with Neon or napi-rs
4. Benchmark Rust vs JavaScript performance
5. Integrate Rust binaries into Node.js servers
6. Build a full pipeline: Rust → WASM → Browser visualization

---

## Tutorial Structure

```
04-rust-parsing/  (Enhanced)
├── README.md
├── package.json
├── start-tutorial.sh
├── rust-genomics/           # Rust workspace
│   ├── Cargo.toml           # Workspace config
│   ├── fisher/              # Fisher exact test
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   └── main.rs
│   │   └── benches/
│   ├── cluster/             # Hierarchical clustering
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       └── main.rs
│   ├── stats/               # Statistical functions
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── lib.rs
│   ├── fastq-parser/        # FASTQ parsing
│   │   ├── Cargo.toml
│   │   └── src/
│   │       └── lib.rs
│   └── wasm-bindings/       # WASM compilation
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs
├── node-bindings/           # Node.js integration
│   ├── package.json
│   ├── native/              # Neon/napi-rs bindings
│   └── index.js
├── web/                     # Browser demo
│   ├── index.html
│   └── src/
│       ├── main.js
│       └── wasm-loader.js
├── benchmarks/
│   ├── js-implementations/
│   ├── rust-implementations/
│   └── results/
└── exercises/
    ├── exercise-1-fisher.md
    ├── exercise-2-cluster.md
    ├── exercise-3-wasm.md
    └── solutions/
```

---

## Module 1: Fisher Exact Test in Rust

### 1.1 Understanding Fisher Exact Test

````rust
// rust-genomics/fisher/src/lib.rs

//! Fisher Exact Test for 2x2 contingency tables
//!
//! Used in genomics for:
//! - Gene set enrichment
//! - Mutation association
//! - Differential expression
//!
//! Example: Is mutation X associated with drug response?
//!
//! ```
//!              Responder  Non-responder
//! Mutated         a           b           | a+b
//! Wild-type       c           d           | c+d
//!                 -----       -----
//!                 a+c         b+d           N
//! ```

use std::cmp::min;

/// Calculate factorial using lookup table for small values
/// and Stirling's approximation for large values
fn log_factorial(n: u64) -> f64 {
    // Precomputed for small values
    const LOG_FACTORIALS: [f64; 21] = [
        0.0, 0.0, 0.693147, 1.791759, 3.178054, 4.787492,
        6.579251, 8.525161, 10.604602, 12.801827, 15.104413,
        17.502308, 19.987214, 22.552164, 25.191221, 27.899271,
        30.671860, 33.505073, 36.395445, 39.339884, 42.335616
    ];

    if n <= 20 {
        LOG_FACTORIALS[n as usize]
    } else {
        // Stirling's approximation
        let n_f = n as f64;
        (n_f + 0.5) * n_f.ln() - n_f + 0.918938533204673 // 0.5 * ln(2π)
    }
}

/// Calculate hypergeometric probability for a single table
fn hypergeometric_prob(a: u64, b: u64, c: u64, d: u64) -> f64 {
    let n = a + b + c + d;

    let log_p = log_factorial(a + b)
        + log_factorial(c + d)
        + log_factorial(a + c)
        + log_factorial(b + d)
        - log_factorial(a)
        - log_factorial(b)
        - log_factorial(c)
        - log_factorial(d)
        - log_factorial(n);

    log_p.exp()
}

/// Fisher exact test result
#[derive(Debug, Clone)]
pub struct FisherResult {
    pub p_value_two_tail: f64,
    pub p_value_left: f64,
    pub p_value_right: f64,
    pub odds_ratio: f64,
    pub confidence_interval: (f64, f64),
}

/// Perform Fisher exact test on a 2x2 contingency table
///
/// # Arguments
/// * `a` - Top-left cell (e.g., mutated responders)
/// * `b` - Top-right cell (e.g., mutated non-responders)
/// * `c` - Bottom-left cell (e.g., wild-type responders)
/// * `d` - Bottom-right cell (e.g., wild-type non-responders)
///
/// # Returns
/// FisherResult with p-values and odds ratio
pub fn fisher_exact(a: u64, b: u64, c: u64, d: u64) -> FisherResult {
    let row1 = a + b;
    let row2 = c + d;
    let col1 = a + c;
    let col2 = b + d;

    // Observed probability
    let p_observed = hypergeometric_prob(a, b, c, d);

    // Calculate all possible tables with same marginals
    let min_a = if col1 > row2 { col1 - row2 } else { 0 };
    let max_a = min(row1, col1);

    let mut p_left = 0.0;
    let mut p_right = 0.0;
    let mut p_two_tail = 0.0;

    for i in min_a..=max_a {
        let j = row1 - i;      // b
        let k = col1 - i;      // c
        let l = row2 - k;      // d

        let p_i = hypergeometric_prob(i, j, k, l);

        // Accumulate p-values
        if i <= a {
            p_left += p_i;
        }
        if i >= a {
            p_right += p_i;
        }
        if p_i <= p_observed + 1e-10 {  // Small epsilon for floating point
            p_two_tail += p_i;
        }
    }

    // Odds ratio
    let odds_ratio = if b == 0 || c == 0 {
        f64::INFINITY
    } else {
        (a as f64 * d as f64) / (b as f64 * c as f64)
    };

    // Confidence interval (Woolf's method)
    let log_or = odds_ratio.ln();
    let se = (1.0 / (a as f64 + 0.5)
            + 1.0 / (b as f64 + 0.5)
            + 1.0 / (c as f64 + 0.5)
            + 1.0 / (d as f64 + 0.5)).sqrt();
    let ci_low = (log_or - 1.96 * se).exp();
    let ci_high = (log_or + 1.96 * se).exp();

    FisherResult {
        p_value_two_tail: p_two_tail.min(1.0),
        p_value_left: p_left.min(1.0),
        p_value_right: p_right.min(1.0),
        odds_ratio,
        confidence_interval: (ci_low, ci_high),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fisher_classic() {
        // Classic example: Lady tasting tea
        let result = fisher_exact(3, 1, 1, 3);
        assert!((result.p_value_two_tail - 0.4857).abs() < 0.001);
    }

    #[test]
    fn test_fisher_significant() {
        // Highly associated
        let result = fisher_exact(10, 2, 1, 10);
        assert!(result.p_value_two_tail < 0.01);
    }
}
````

### 1.2 Command Line Binary

```rust
// rust-genomics/fisher/src/main.rs

use clap::Parser;
use fisher::fisher_exact;

#[derive(Parser, Debug)]
#[command(author, version, about = "Fisher exact test for 2x2 tables")]
struct Args {
    /// Top-left cell value
    #[arg(short = 'a')]
    a: u64,

    /// Top-right cell value
    #[arg(short = 'b')]
    b: u64,

    /// Bottom-left cell value
    #[arg(short = 'c')]
    c: u64,

    /// Bottom-right cell value
    #[arg(short = 'd')]
    d: u64,

    /// Output format (json, text)
    #[arg(short, long, default_value = "text")]
    format: String,
}

fn main() {
    let args = Args::parse();

    let result = fisher_exact(args.a, args.b, args.c, args.d);

    match args.format.as_str() {
        "json" => {
            println!(r#"{{
  "p_value_two_tail": {},
  "p_value_left": {},
  "p_value_right": {},
  "odds_ratio": {},
  "ci_low": {},
  "ci_high": {}
}}"#,
                result.p_value_two_tail,
                result.p_value_left,
                result.p_value_right,
                result.odds_ratio,
                result.confidence_interval.0,
                result.confidence_interval.1
            );
        }
        _ => {
            println!("Fisher Exact Test Results");
            println!("========================");
            println!("Input table:");
            println!("  [{:5} | {:5}]", args.a, args.b);
            println!("  [{:5} | {:5}]", args.c, args.d);
            println!();
            println!("P-value (two-tailed): {:.6}", result.p_value_two_tail);
            println!("P-value (left):       {:.6}", result.p_value_left);
            println!("P-value (right):      {:.6}", result.p_value_right);
            println!("Odds ratio:           {:.4}", result.odds_ratio);
            println!("95% CI:               ({:.4}, {:.4})",
                result.confidence_interval.0,
                result.confidence_interval.1
            );
        }
    }
}
```

---

## Module 2: Hierarchical Clustering

### 2.1 Clustering Implementation

```rust
// rust-genomics/cluster/src/lib.rs

//! Hierarchical clustering for gene expression and sample data
//!
//! Supports:
//! - Distance metrics: Euclidean, Pearson correlation, Spearman
//! - Linkage methods: Complete, Average, Single, Ward

use std::collections::BinaryHeap;
use std::cmp::Ordering;

/// Distance metric types
#[derive(Debug, Clone, Copy)]
pub enum DistanceMetric {
    Euclidean,
    Pearson,
    Spearman,
    Manhattan,
}

/// Linkage methods
#[derive(Debug, Clone, Copy)]
pub enum Linkage {
    Single,    // Minimum distance
    Complete,  // Maximum distance
    Average,   // UPGMA
    Ward,      // Minimize variance
}

/// A cluster node in the dendrogram
#[derive(Debug, Clone)]
pub struct ClusterNode {
    pub id: usize,
    pub left: Option<Box<ClusterNode>>,
    pub right: Option<Box<ClusterNode>>,
    pub distance: f64,
    pub count: usize,
}

/// Hierarchical clustering result
pub struct ClusterResult {
    pub root: ClusterNode,
    pub order: Vec<usize>,      // Optimal leaf ordering
    pub distances: Vec<f64>,    // Merge distances
}

/// Calculate pairwise distances
pub fn distance_matrix(data: &[Vec<f64>], metric: DistanceMetric) -> Vec<Vec<f64>> {
    let n = data.len();
    let mut dist = vec![vec![0.0; n]; n];

    for i in 0..n {
        for j in (i + 1)..n {
            let d = match metric {
                DistanceMetric::Euclidean => euclidean_distance(&data[i], &data[j]),
                DistanceMetric::Pearson => 1.0 - pearson_correlation(&data[i], &data[j]),
                DistanceMetric::Spearman => 1.0 - spearman_correlation(&data[i], &data[j]),
                DistanceMetric::Manhattan => manhattan_distance(&data[i], &data[j]),
            };
            dist[i][j] = d;
            dist[j][i] = d;
        }
    }

    dist
}

fn euclidean_distance(a: &[f64], b: &[f64]) -> f64 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).powi(2))
        .sum::<f64>()
        .sqrt()
}

fn pearson_correlation(a: &[f64], b: &[f64]) -> f64 {
    let n = a.len() as f64;
    let mean_a: f64 = a.iter().sum::<f64>() / n;
    let mean_b: f64 = b.iter().sum::<f64>() / n;

    let mut cov = 0.0;
    let mut var_a = 0.0;
    let mut var_b = 0.0;

    for i in 0..a.len() {
        let da = a[i] - mean_a;
        let db = b[i] - mean_b;
        cov += da * db;
        var_a += da * da;
        var_b += db * db;
    }

    if var_a == 0.0 || var_b == 0.0 {
        return 0.0;
    }

    cov / (var_a.sqrt() * var_b.sqrt())
}

fn spearman_correlation(a: &[f64], b: &[f64]) -> f64 {
    let rank_a = rank(a);
    let rank_b = rank(b);
    pearson_correlation(&rank_a, &rank_b)
}

fn rank(values: &[f64]) -> Vec<f64> {
    let mut indexed: Vec<_> = values.iter().enumerate().collect();
    indexed.sort_by(|a, b| a.1.partial_cmp(b.1).unwrap_or(Ordering::Equal));

    let mut ranks = vec![0.0; values.len()];
    for (rank, (idx, _)) in indexed.into_iter().enumerate() {
        ranks[idx] = rank as f64 + 1.0;
    }
    ranks
}

fn manhattan_distance(a: &[f64], b: &[f64]) -> f64 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).abs())
        .sum()
}

/// Perform hierarchical clustering
pub fn hierarchical_cluster(
    data: &[Vec<f64>],
    metric: DistanceMetric,
    linkage: Linkage,
) -> ClusterResult {
    let n = data.len();
    let mut dist_matrix = distance_matrix(data, metric);

    // Initialize clusters: each point is its own cluster
    let mut clusters: Vec<Option<ClusterNode>> = (0..n)
        .map(|i| Some(ClusterNode {
            id: i,
            left: None,
            right: None,
            distance: 0.0,
            count: 1,
        }))
        .collect();

    let mut merge_distances = Vec::with_capacity(n - 1);
    let mut next_id = n;

    // Merge until single cluster
    for _ in 0..(n - 1) {
        // Find closest pair
        let (min_i, min_j, min_dist) = find_closest_pair(&dist_matrix, &clusters);

        merge_distances.push(min_dist);

        // Create new cluster
        let left = clusters[min_i].take().unwrap();
        let right = clusters[min_j].take().unwrap();
        let new_count = left.count + right.count;

        let new_cluster = ClusterNode {
            id: next_id,
            left: Some(Box::new(left)),
            right: Some(Box::new(right)),
            distance: min_dist,
            count: new_count,
        };

        clusters[min_i] = Some(new_cluster);
        next_id += 1;

        // Update distance matrix
        update_distances(&mut dist_matrix, min_i, min_j, &clusters, linkage);
    }

    // Find root (only remaining cluster)
    let root = clusters.into_iter().find_map(|c| c).unwrap();

    // Get optimal leaf ordering
    let order = get_leaf_order(&root);

    ClusterResult {
        root,
        order,
        distances: merge_distances,
    }
}

fn find_closest_pair(
    dist_matrix: &[Vec<f64>],
    clusters: &[Option<ClusterNode>],
) -> (usize, usize, f64) {
    let mut min_dist = f64::INFINITY;
    let mut min_i = 0;
    let mut min_j = 0;

    for i in 0..dist_matrix.len() {
        if clusters[i].is_none() {
            continue;
        }
        for j in (i + 1)..dist_matrix.len() {
            if clusters[j].is_none() {
                continue;
            }
            if dist_matrix[i][j] < min_dist {
                min_dist = dist_matrix[i][j];
                min_i = i;
                min_j = j;
            }
        }
    }

    (min_i, min_j, min_dist)
}

fn update_distances(
    dist_matrix: &mut Vec<Vec<f64>>,
    i: usize,
    j: usize,
    clusters: &[Option<ClusterNode>],
    linkage: Linkage,
) {
    let n = dist_matrix.len();

    // Mark j as merged
    for k in 0..n {
        dist_matrix[j][k] = f64::INFINITY;
        dist_matrix[k][j] = f64::INFINITY;
    }

    // Update distances from merged cluster to all others
    for k in 0..n {
        if k == i || k == j || clusters[k].is_none() {
            continue;
        }

        let d_ik = dist_matrix[i][k];
        let d_jk = dist_matrix[j][k];

        let new_dist = match linkage {
            Linkage::Single => d_ik.min(d_jk),
            Linkage::Complete => d_ik.max(d_jk),
            Linkage::Average => (d_ik + d_jk) / 2.0,
            Linkage::Ward => {
                // Simplified Ward's method
                ((d_ik.powi(2) + d_jk.powi(2)) / 2.0).sqrt()
            }
        };

        dist_matrix[i][k] = new_dist;
        dist_matrix[k][i] = new_dist;
    }
}

fn get_leaf_order(node: &ClusterNode) -> Vec<usize> {
    let mut order = Vec::new();
    collect_leaves(node, &mut order);
    order
}

fn collect_leaves(node: &ClusterNode, order: &mut Vec<usize>) {
    match (&node.left, &node.right) {
        (None, None) => {
            order.push(node.id);
        }
        (Some(left), Some(right)) => {
            collect_leaves(left, order);
            collect_leaves(right, order);
        }
        _ => {}
    }
}

/// Convert cluster result to Newick format for visualization
pub fn to_newick(node: &ClusterNode, labels: &[String]) -> String {
    fn recurse(node: &ClusterNode, labels: &[String]) -> String {
        match (&node.left, &node.right) {
            (None, None) => {
                // Leaf node
                labels.get(node.id).cloned().unwrap_or_else(|| node.id.to_string())
            }
            (Some(left), Some(right)) => {
                let left_str = recurse(left, labels);
                let right_str = recurse(right, labels);
                format!("({}:{:.4},{}:{:.4})",
                    left_str,
                    node.distance - left.distance,
                    right_str,
                    node.distance - right.distance
                )
            }
            _ => String::new()
        }
    }

    format!("{};", recurse(node, labels))
}
```

---

## Module 3: WebAssembly Compilation

### 3.1 WASM Bindings

```rust
// rust-genomics/wasm-bindings/src/lib.rs

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

// Import JS console for debugging
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

// Fisher exact test binding
#[wasm_bindgen]
pub fn fisher_exact_test(a: u32, b: u32, c: u32, d: u32) -> JsValue {
    let result = fisher::fisher_exact(a as u64, b as u64, c as u64, d as u64);

    JsValue::from_serde(&FisherResultJs {
        p_value_two_tail: result.p_value_two_tail,
        p_value_left: result.p_value_left,
        p_value_right: result.p_value_right,
        odds_ratio: result.odds_ratio,
        ci_low: result.confidence_interval.0,
        ci_high: result.confidence_interval.1,
    }).unwrap()
}

#[derive(Serialize)]
struct FisherResultJs {
    p_value_two_tail: f64,
    p_value_left: f64,
    p_value_right: f64,
    odds_ratio: f64,
    ci_low: f64,
    ci_high: f64,
}

// Clustering binding
#[wasm_bindgen]
pub fn cluster_data(
    data_flat: &[f64],
    n_rows: usize,
    n_cols: usize,
    metric: &str,
    linkage: &str,
) -> JsValue {
    // Reshape flat array to 2D
    let data: Vec<Vec<f64>> = data_flat
        .chunks(n_cols)
        .map(|chunk| chunk.to_vec())
        .collect();

    let metric = match metric {
        "euclidean" => cluster::DistanceMetric::Euclidean,
        "pearson" => cluster::DistanceMetric::Pearson,
        "spearman" => cluster::DistanceMetric::Spearman,
        _ => cluster::DistanceMetric::Euclidean,
    };

    let linkage = match linkage {
        "single" => cluster::Linkage::Single,
        "complete" => cluster::Linkage::Complete,
        "average" => cluster::Linkage::Average,
        "ward" => cluster::Linkage::Ward,
        _ => cluster::Linkage::Average,
    };

    let result = cluster::hierarchical_cluster(&data, metric, linkage);

    JsValue::from_serde(&ClusterResultJs {
        order: result.order,
        distances: result.distances,
        newick: cluster::to_newick(&result.root, &vec![]),
    }).unwrap()
}

#[derive(Serialize)]
struct ClusterResultJs {
    order: Vec<usize>,
    distances: Vec<f64>,
    newick: String,
}

// Batch statistics
#[wasm_bindgen]
pub fn compute_statistics(values: &[f64]) -> JsValue {
    let n = values.len();
    if n == 0 {
        return JsValue::NULL;
    }

    let sum: f64 = values.iter().sum();
    let mean = sum / n as f64;

    let variance: f64 = values.iter()
        .map(|x| (x - mean).powi(2))
        .sum::<f64>() / n as f64;

    let mut sorted = values.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());

    JsValue::from_serde(&StatsResult {
        count: n,
        sum,
        mean,
        variance,
        std_dev: variance.sqrt(),
        min: sorted[0],
        max: sorted[n - 1],
        median: if n % 2 == 0 {
            (sorted[n/2 - 1] + sorted[n/2]) / 2.0
        } else {
            sorted[n/2]
        },
        q1: sorted[n / 4],
        q3: sorted[3 * n / 4],
    }).unwrap()
}

#[derive(Serialize)]
struct StatsResult {
    count: usize,
    sum: f64,
    mean: f64,
    variance: f64,
    std_dev: f64,
    min: f64,
    max: f64,
    median: f64,
    q1: f64,
    q3: f64,
}
```

### 3.2 Cargo Configuration

```toml
# rust-genomics/wasm-bindings/Cargo.toml

[package]
name = "genomics-wasm"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1.0", features = ["derive"] }
serde-wasm-bindgen = "0.5"

# Local crates
fisher = { path = "../fisher" }
cluster = { path = "../cluster" }
stats = { path = "../stats" }

[profile.release]
opt-level = 3
lto = true
```

### 3.3 Build Script

```bash
#!/bin/bash
# rust-genomics/build-wasm.sh

set -e

echo "Building WASM package..."

# Build with wasm-pack
cd wasm-bindings
wasm-pack build --target web --out-dir ../pkg

echo "WASM package built to pkg/"

# Copy to web demo
cp -r ../pkg ../web/
echo "Copied to web demo"
```

---

## Module 4: Node.js Integration

### 4.1 Neon Bindings

```rust
// node-bindings/native/src/lib.rs

use neon::prelude::*;

fn fisher_exact(mut cx: FunctionContext) -> JsResult<JsObject> {
    let a = cx.argument::<JsNumber>(0)?.value(&mut cx) as u64;
    let b = cx.argument::<JsNumber>(1)?.value(&mut cx) as u64;
    let c = cx.argument::<JsNumber>(2)?.value(&mut cx) as u64;
    let d = cx.argument::<JsNumber>(3)?.value(&mut cx) as u64;

    let result = fisher::fisher_exact(a, b, c, d);

    let obj = cx.empty_object();

    let p_two = cx.number(result.p_value_two_tail);
    obj.set(&mut cx, "pValueTwoTail", p_two)?;

    let p_left = cx.number(result.p_value_left);
    obj.set(&mut cx, "pValueLeft", p_left)?;

    let p_right = cx.number(result.p_value_right);
    obj.set(&mut cx, "pValueRight", p_right)?;

    let odds = cx.number(result.odds_ratio);
    obj.set(&mut cx, "oddsRatio", odds)?;

    Ok(obj)
}

#[neon::main]
fn main(mut cx: ModuleContext) -> NeonResult<()> {
    cx.export_function("fisherExact", fisher_exact)?;
    Ok(())
}
```

### 4.2 JavaScript Wrapper

```javascript
// node-bindings/index.js

const native = require('./native');

/**
 * Fisher exact test for 2x2 contingency table
 * @param {number} a - Top-left cell
 * @param {number} b - Top-right cell
 * @param {number} c - Bottom-left cell
 * @param {number} d - Bottom-right cell
 * @returns {Object} Test results with p-values and odds ratio
 */
function fisherExact(a, b, c, d) {
  if (
    !Number.isInteger(a) ||
    !Number.isInteger(b) ||
    !Number.isInteger(c) ||
    !Number.isInteger(d)
  ) {
    throw new TypeError('All arguments must be integers');
  }

  if (a < 0 || b < 0 || c < 0 || d < 0) {
    throw new RangeError('All arguments must be non-negative');
  }

  return native.fisherExact(a, b, c, d);
}

module.exports = {
  fisherExact,
  // ... other exports
};
```

---

## Module 5: Browser Integration

### 5.1 WASM Loader

```javascript
// web/src/wasm-loader.js

let wasmModule = null;

export async function initWasm() {
  if (wasmModule) {
    return wasmModule;
  }

  try {
    // Dynamic import of WASM
    const wasm = await import('../pkg/genomics_wasm.js');
    await wasm.default(); // Initialize WASM

    wasmModule = wasm;
    console.log('WASM module loaded');

    return wasmModule;
  } catch (error) {
    console.error('Failed to load WASM:', error);
    throw error;
  }
}

export function getWasm() {
  if (!wasmModule) {
    throw new Error('WASM not initialized. Call initWasm() first.');
  }
  return wasmModule;
}
```

### 5.2 Demo Application

```javascript
// web/src/main.js

import { initWasm, getWasm } from './wasm-loader.js';

async function main() {
  // Initialize WASM
  await initWasm();
  const wasm = getWasm();

  // Fisher exact test demo
  document.getElementById('fisher-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const a = parseInt(document.getElementById('fisher-a').value);
    const b = parseInt(document.getElementById('fisher-b').value);
    const c = parseInt(document.getElementById('fisher-c').value);
    const d = parseInt(document.getElementById('fisher-d').value);

    console.time('Fisher WASM');
    const result = wasm.fisher_exact_test(a, b, c, d);
    console.timeEnd('Fisher WASM');

    displayFisherResult(result);
  });

  // Clustering demo
  document.getElementById('cluster-btn').addEventListener('click', async () => {
    const data = generateRandomMatrix(100, 50); // 100 samples, 50 genes

    console.time('Clustering WASM');
    const result = wasm.cluster_data(data.flat(), 100, 50, 'pearson', 'average');
    console.timeEnd('Clustering WASM');

    displayClusterResult(result);
  });

  // Benchmark comparison
  document.getElementById('benchmark-btn').addEventListener('click', () => {
    runBenchmark(wasm);
  });
}

function runBenchmark(wasm) {
  const iterations = 10000;

  // WASM benchmark
  const wasmStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    wasm.fisher_exact_test(10, 5, 3, 12);
  }
  const wasmTime = performance.now() - wasmStart;

  // JavaScript benchmark
  const jsStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    fisherExactJS(10, 5, 3, 12);
  }
  const jsTime = performance.now() - jsStart;

  document.getElementById('benchmark-results').innerHTML = `
    <h3>Benchmark Results (${iterations} iterations)</h3>
    <p>WASM: ${wasmTime.toFixed(2)}ms (${((iterations / wasmTime) * 1000).toFixed(0)} ops/sec)</p>
    <p>JavaScript: ${jsTime.toFixed(2)}ms (${((iterations / jsTime) * 1000).toFixed(0)} ops/sec)</p>
    <p>Speedup: ${(jsTime / wasmTime).toFixed(2)}x</p>
  `;
}

// Pure JS implementation for comparison
function fisherExactJS(a, b, c, d) {
  // ... JavaScript implementation
}

main();
```

---

## Exercises

### Exercise 1: Extend Fisher Test

Add support for one-tailed tests and mid-p correction.

### Exercise 2: Implement k-means Clustering

Add k-means clustering alongside hierarchical clustering.

### Exercise 3: Build a Statistics Dashboard

Create a web dashboard that computes statistics on uploaded data using WASM.

---

## Benchmarks

### Expected Performance Improvements

| Operation                | JavaScript | Rust (Native) | Rust (WASM) | Speedup |
| ------------------------ | ---------- | ------------- | ----------- | ------- |
| Fisher (1 call)          | 0.1ms      | 0.001ms       | 0.005ms     | 20x     |
| Clustering (1000 points) | 500ms      | 15ms          | 45ms        | 11x     |
| Statistics (1M values)   | 50ms       | 3ms           | 8ms         | 6x      |

---

## Success Criteria

- [ ] Fisher exact test in Rust with tests
- [ ] Hierarchical clustering with multiple metrics
- [ ] WASM compilation working in browser
- [ ] Node.js native bindings functional
- [ ] Benchmark showing 5x+ speedup
- [ ] Integration with existing visualizations

---

_Implementation plan for Tutorial 4.4 Enhancement - Rust Algorithms_
