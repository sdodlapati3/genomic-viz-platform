# Exercise 1: Implementing Chi-Square Test in Rust

## Overview

In this exercise, you'll implement a Chi-Square test for genomic variant analysis in Rust. This statistical test is commonly used in GWAS studies to assess associations between genetic variants and phenotypes.

## Learning Objectives

- Write Rust functions that compile to WebAssembly
- Use wasm-bindgen to expose functions to JavaScript
- Handle floating-point computations efficiently
- Implement statistical algorithms with proper numerical stability

## Background

The Chi-Square (χ²) test compares observed frequencies in a contingency table against expected frequencies under the null hypothesis of independence. It's widely used in:

- GWAS studies to test SNP-phenotype associations
- Mutation burden analysis
- Hardy-Weinberg equilibrium testing

### Formula

For a 2x2 contingency table:

```
χ² = Σ (O - E)² / E
```

Where:

- O = Observed frequency
- E = Expected frequency under null hypothesis

Degrees of freedom = (rows - 1) × (cols - 1) = 1 for 2x2 tables

## Task

### Part 1: Implement `chi_square_2x2` in Rust

Create a new file `src/rust/src/chi_square.rs`:

```rust
// TODO: Implement the Chi-Square test
//
// Function signature:
// pub fn chi_square_2x2(a: u32, b: u32, c: u32, d: u32) -> ChiSquareResult
//
// Input: 2x2 contingency table
//   | Group1 | Group2 |
// --+--------+--------|
// A |   a    |   b    |
// B |   c    |   d    |
//
// Output: ChiSquareResult struct containing:
// - statistic: the χ² value
// - p_value: two-tailed p-value
// - cramers_v: effect size measure

use wasm_bindgen::prelude::*;
use serde::{Serialize, Deserialize};

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
pub struct ChiSquareResult {
    pub statistic: f64,
    pub p_value: f64,
    pub cramers_v: f64,
}

// Hints:
// 1. Calculate expected values: E_ij = (row_i_total × col_j_total) / grand_total
// 2. Apply Yates' correction for small samples: |O - E| - 0.5
// 3. Use chi-square CDF for p-value (you can approximate or use numerical integration)
```

### Part 2: Implement Chi-Square CDF

The p-value requires computing the cumulative distribution function of the chi-square distribution. For 1 degree of freedom:

```rust
// Chi-square CDF for df=1 can be computed using the error function
// P(X ≤ x) = 2 × Φ(√x) - 1, where Φ is the standard normal CDF
//
// Or use the incomplete gamma function:
// P(X ≤ x) = γ(df/2, x/2) / Γ(df/2)
```

### Part 3: Add Batch Processing

Implement a batch function for testing multiple variants:

```rust
#[wasm_bindgen]
pub fn chi_square_batch(
    tables: &[u32],  // Flattened: [a1, b1, c1, d1, a2, b2, c2, d2, ...]
) -> JsValue {
    // Return array of ChiSquareResult
}
```

### Part 4: JavaScript Integration

Create `src/js/chiSquare.js`:

```javascript
// TODO: Implement JavaScript wrapper
//
// export async function chiSquareTest(a, b, c, d) {
//   // Call WASM function
//   // Return formatted result
// }
//
// export async function chiSquareBatch(tables) {
//   // Process multiple 2x2 tables
//   // Apply multiple testing correction (Bonferroni, FDR)
// }
```

## Expected Output

```javascript
const result = await chiSquareTest(45, 15, 20, 60);
console.log(result);
// {
//   statistic: 25.71,
//   pValue: 3.98e-7,
//   cramersV: 0.43,
//   significant: true
// }
```

## Hints

1. **Numerical stability**: Use log-space calculations for very small p-values
2. **Yates' correction**: Apply for any cell with expected < 5
3. **Effect size**: Cramér's V = √(χ² / (n × min(r-1, c-1)))
4. **Multiple testing**: Consider implementing Benjamini-Hochberg FDR correction

## Testing

Create test data from known results:

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chi_square_known() {
        // Known example: a=10, b=20, c=30, d=40
        // Expected χ² ≈ 0.38, p ≈ 0.54
        let result = chi_square_2x2(10, 20, 30, 40);
        assert!((result.statistic - 0.38).abs() < 0.1);
    }
}
```

## Bonus Challenges

1. **Implement likelihood ratio test** (G-test) as an alternative
2. **Add exact test** for small samples (similar to Fisher's)
3. **Support larger contingency tables** (generalize beyond 2x2)
4. **Implement Hardy-Weinberg test** for genotype frequencies

## Solution

See `solutions/exercise-1-solution.md` for the complete implementation.
