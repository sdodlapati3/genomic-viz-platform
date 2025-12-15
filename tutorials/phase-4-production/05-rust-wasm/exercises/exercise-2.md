# Exercise 2: Pairwise Sequence Alignment in WASM

## Overview

Implement Smith-Waterman local sequence alignment in Rust/WASM. This algorithm is computationally intensive and showcases the performance benefits of WASM for genomic analysis.

## Learning Objectives

- Implement dynamic programming algorithms in Rust
- Handle 2D matrices efficiently in WebAssembly
- Optimize memory access patterns for performance
- Trace back through DP matrices

## Background

The Smith-Waterman algorithm finds the optimal local alignment between two sequences. It's used for:

- Finding conserved regions between genes
- Identifying protein domains
- Mapping short reads to references

### Algorithm

For sequences A (length m) and B (length n):

1. Initialize (m+1) × (n+1) scoring matrix with zeros
2. Fill matrix using recurrence:
   ```
   H[i,j] = max(0,
                H[i-1,j-1] + score(A[i], B[j]),  // match/mismatch
                H[i-1,j] + gap_penalty,           // gap in B
                H[i,j-1] + gap_penalty)           // gap in A
   ```
3. Find maximum value in matrix
4. Traceback from maximum to zero

### Scoring

- Match: +2
- Mismatch: -1
- Gap: -1

## Task

### Part 1: Implement Core Algorithm in Rust

Create `src/rust/src/alignment.rs`:

```rust
use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct AlignmentResult {
    pub score: i32,
    #[wasm_bindgen(skip)]
    pub aligned_seq1: String,
    #[wasm_bindgen(skip)]
    pub aligned_seq2: String,
    pub start_pos1: usize,
    pub start_pos2: usize,
    pub end_pos1: usize,
    pub end_pos2: usize,
    pub identity: f64,
}

// TODO: Implement the alignment function
#[wasm_bindgen]
pub fn smith_waterman(
    seq1: &str,
    seq2: &str,
    match_score: i32,
    mismatch_penalty: i32,
    gap_penalty: i32,
) -> AlignmentResult {
    // Your implementation here
}
```

### Part 2: Optimizations

Implement memory-efficient versions:

```rust
// Linear space alignment using Hirschberg's algorithm
pub fn smith_waterman_linear_space(
    seq1: &str,
    seq2: &str,
) -> AlignmentResult {
    // Only keep 2 rows at a time
}

// SIMD-accelerated scoring (optional, for advanced users)
#[cfg(target_arch = "wasm32")]
pub fn smith_waterman_simd(
    seq1: &str,
    seq2: &str,
) -> AlignmentResult {
    // Use WASM SIMD instructions
}
```

### Part 3: JavaScript Interface

Create `src/js/alignment.js`:

```javascript
// TODO: Implement the alignment interface

export async function align(seq1, seq2, options = {}) {
  const { matchScore = 2, mismatchPenalty = -1, gapPenalty = -1 } = options;

  // Call WASM function
  // Format and return result
}

export function formatAlignment(result) {
  // Create visual representation
  // Example:
  // seq1: ACGT--AGC
  //       |||  | |
  // seq2: ACGTACAGG
}
```

### Part 4: Visualization

Create a function to visualize the alignment matrix:

```javascript
export function visualizeMatrix(seq1, seq2, matrix, path) {
  // Generate SVG heatmap of the scoring matrix
  // Highlight the traceback path
}
```

## Expected Output

```javascript
const result = await align('ACGTACGTACGT', 'CGTACGACGT', {
  matchScore: 2,
  mismatchPenalty: -1,
  gapPenalty: -2,
});

console.log(result);
// {
//   score: 16,
//   alignment: {
//     seq1: 'CGTACGTACGT',
//     seq2: 'CGTACG-ACGT',
//     midline: '||||||  |||'
//   },
//   positions: {
//     start1: 1, end1: 12,
//     start2: 0, end2: 10
//   },
//   identity: 0.909
// }

console.log(formatAlignment(result));
// CGTACGTACGT
// ||||||x |||
// CGTACG-ACGT
```

## Performance Comparison

Benchmark against JavaScript implementation:

```javascript
// Compare performance for various sequence lengths
const lengths = [100, 500, 1000, 5000];
for (const len of lengths) {
  const seq1 = generateRandomSequence(len);
  const seq2 = generateRandomSequence(len);

  const jsTime = benchmark(() => alignJS(seq1, seq2));
  const wasmTime = benchmark(() => alignWASM(seq1, seq2));

  console.log(`Length ${len}: JS=${jsTime}ms, WASM=${wasmTime}ms, Speedup=${jsTime / wasmTime}x`);
}
```

Expected speedups: 20-50x for sequences > 500bp

## Hints

1. **Memory layout**: Use row-major order for cache efficiency
2. **Traceback**: Store direction pointers separately from scores
3. **Early termination**: For very dissimilar sequences, can skip cells
4. **Banded alignment**: For similar sequences, only fill a diagonal band

## Testing

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_perfect_match() {
        let result = smith_waterman("ACGT", "ACGT", 2, -1, -1);
        assert_eq!(result.score, 8);
        assert_eq!(result.identity, 1.0);
    }

    #[test]
    fn test_with_gaps() {
        let result = smith_waterman("AGTACGT", "ACGT", 2, -1, -2);
        // Score should reflect optimal local alignment
        assert!(result.score > 0);
    }

    #[test]
    fn test_no_similarity() {
        let result = smith_waterman("AAAA", "TTTT", 2, -1, -1);
        assert_eq!(result.score, 0);
    }
}
```

## Bonus Challenges

1. **Affine gap penalties**: Separate penalties for gap open and extend
2. **Multiple sequence alignment**: Progressive alignment of 3+ sequences
3. **BLAST-like seeding**: Use k-mer matches to seed alignments
4. **Protein alignment**: Support BLOSUM/PAM scoring matrices

## Real-World Applications

This implementation can be used for:

1. **Variant calling**: Align reads to reference to find SNPs/indels
2. **Fusion detection**: Find junction sequences in gene fusions
3. **Primer design**: Assess primer specificity
4. **Structural variant analysis**: Align breakpoint sequences

## Solution

See `solutions/exercise-2-solution.md` for the complete implementation.
