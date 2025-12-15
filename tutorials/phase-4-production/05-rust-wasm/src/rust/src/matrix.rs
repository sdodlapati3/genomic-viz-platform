//! Matrix Operations
//!
//! Fast matrix operations for gene expression analysis,
//! correlation calculations, and dimensionality reduction.

use wasm_bindgen::prelude::*;

/// Matrix multiplication result
#[wasm_bindgen]
pub struct MatrixResult {
    data: Vec<f64>,
    rows: usize,
    cols: usize,
}

#[wasm_bindgen]
impl MatrixResult {
    pub fn data(&self) -> Vec<f64> {
        self.data.clone()
    }
    
    pub fn rows(&self) -> usize {
        self.rows
    }
    
    pub fn cols(&self) -> usize {
        self.cols
    }
    
    pub fn get(&self, row: usize, col: usize) -> f64 {
        if row >= self.rows || col >= self.cols {
            return f64::NAN;
        }
        self.data[row * self.cols + col]
    }
}

/// Matrix-matrix multiplication
/// A (m x k) * B (k x n) = C (m x n)
#[wasm_bindgen]
pub fn matmul(a: &[f64], b: &[f64], m: usize, k: usize, n: usize) -> MatrixResult {
    if a.len() != m * k || b.len() != k * n {
        return MatrixResult {
            data: vec![],
            rows: 0,
            cols: 0,
        };
    }
    
    let mut result = vec![0.0; m * n];
    
    // Basic matrix multiplication with loop reordering for cache efficiency
    for i in 0..m {
        for p in 0..k {
            let a_ip = a[i * k + p];
            for j in 0..n {
                result[i * n + j] += a_ip * b[p * n + j];
            }
        }
    }
    
    MatrixResult {
        data: result,
        rows: m,
        cols: n,
    }
}

/// Matrix transpose
#[wasm_bindgen]
pub fn transpose(matrix: &[f64], rows: usize, cols: usize) -> MatrixResult {
    if matrix.len() != rows * cols {
        return MatrixResult {
            data: vec![],
            rows: 0,
            cols: 0,
        };
    }
    
    let mut result = vec![0.0; rows * cols];
    
    for i in 0..rows {
        for j in 0..cols {
            result[j * rows + i] = matrix[i * cols + j];
        }
    }
    
    MatrixResult {
        data: result,
        rows: cols,
        cols: rows,
    }
}

/// Calculate mean of each row
#[wasm_bindgen]
pub fn row_means(matrix: &[f64], rows: usize, cols: usize) -> Vec<f64> {
    if matrix.len() != rows * cols || cols == 0 {
        return vec![];
    }
    
    (0..rows)
        .map(|i| {
            let row_start = i * cols;
            let row_sum: f64 = matrix[row_start..row_start + cols].iter().sum();
            row_sum / cols as f64
        })
        .collect()
}

/// Calculate mean of each column
#[wasm_bindgen]
pub fn col_means(matrix: &[f64], rows: usize, cols: usize) -> Vec<f64> {
    if matrix.len() != rows * cols || rows == 0 {
        return vec![];
    }
    
    (0..cols)
        .map(|j| {
            let col_sum: f64 = (0..rows).map(|i| matrix[i * cols + j]).sum();
            col_sum / rows as f64
        })
        .collect()
}

/// Calculate standard deviation of each row
#[wasm_bindgen]
pub fn row_stds(matrix: &[f64], rows: usize, cols: usize) -> Vec<f64> {
    if matrix.len() != rows * cols || cols < 2 {
        return vec![];
    }
    
    let means = row_means(matrix, rows, cols);
    
    (0..rows)
        .map(|i| {
            let row_start = i * cols;
            let mean = means[i];
            let variance: f64 = matrix[row_start..row_start + cols]
                .iter()
                .map(|&x| (x - mean).powi(2))
                .sum::<f64>() / (cols - 1) as f64;
            variance.sqrt()
        })
        .collect()
}

/// Z-score normalize matrix (row-wise)
#[wasm_bindgen]
pub fn zscore_normalize(matrix: &[f64], rows: usize, cols: usize) -> MatrixResult {
    if matrix.len() != rows * cols {
        return MatrixResult {
            data: vec![],
            rows: 0,
            cols: 0,
        };
    }
    
    let means = row_means(matrix, rows, cols);
    let stds = row_stds(matrix, rows, cols);
    
    let data: Vec<f64> = (0..rows)
        .flat_map(|i| {
            let mean = means[i];
            let std = if stds[i] > 0.0 { stds[i] } else { 1.0 };
            
            (0..cols).map(move |j| {
                (matrix[i * cols + j] - mean) / std
            })
        })
        .collect();
    
    MatrixResult { data, rows, cols }
}

/// Calculate Pearson correlation between all row pairs
/// Returns correlation matrix (rows x rows)
#[wasm_bindgen]
pub fn correlation_matrix(matrix: &[f64], rows: usize, cols: usize) -> MatrixResult {
    if matrix.len() != rows * cols || cols < 2 {
        return MatrixResult {
            data: vec![],
            rows: 0,
            cols: 0,
        };
    }
    
    // First z-score normalize
    let normalized = zscore_normalize(matrix, rows, cols);
    let norm_data = &normalized.data;
    
    let mut corr = vec![0.0; rows * rows];
    
    for i in 0..rows {
        for j in i..rows {
            let correlation: f64 = (0..cols)
                .map(|k| norm_data[i * cols + k] * norm_data[j * cols + k])
                .sum::<f64>() / (cols - 1) as f64;
            
            corr[i * rows + j] = correlation;
            corr[j * rows + i] = correlation;
        }
    }
    
    MatrixResult {
        data: corr,
        rows,
        cols: rows,
    }
}

/// Pearson correlation between two vectors
#[wasm_bindgen]
pub fn pearson_correlation(x: &[f64], y: &[f64]) -> f64 {
    if x.len() != y.len() || x.is_empty() {
        return f64::NAN;
    }
    
    let n = x.len() as f64;
    
    let mean_x: f64 = x.iter().sum::<f64>() / n;
    let mean_y: f64 = y.iter().sum::<f64>() / n;
    
    let mut cov = 0.0;
    let mut var_x = 0.0;
    let mut var_y = 0.0;
    
    for (xi, yi) in x.iter().zip(y.iter()) {
        let dx = xi - mean_x;
        let dy = yi - mean_y;
        cov += dx * dy;
        var_x += dx * dx;
        var_y += dy * dy;
    }
    
    if var_x == 0.0 || var_y == 0.0 {
        return 0.0;
    }
    
    cov / (var_x * var_y).sqrt()
}

/// Spearman correlation (rank-based)
#[wasm_bindgen]
pub fn spearman_correlation(x: &[f64], y: &[f64]) -> f64 {
    if x.len() != y.len() || x.is_empty() {
        return f64::NAN;
    }
    
    let rank_x = rank(x);
    let rank_y = rank(y);
    
    pearson_correlation(&rank_x, &rank_y)
}

fn rank(values: &[f64]) -> Vec<f64> {
    let n = values.len();
    let mut indexed: Vec<_> = values.iter().enumerate().collect();
    indexed.sort_by(|a, b| a.1.partial_cmp(b.1).unwrap());
    
    let mut ranks = vec![0.0; n];
    
    let mut i = 0;
    while i < n {
        let mut j = i;
        // Find ties
        while j < n && indexed[j].1 == indexed[i].1 {
            j += 1;
        }
        // Average rank for ties
        let avg_rank = (i + j + 1) as f64 / 2.0;
        for k in i..j {
            ranks[indexed[k].0] = avg_rank;
        }
        i = j;
    }
    
    ranks
}

/// Calculate covariance matrix
#[wasm_bindgen]
pub fn covariance_matrix(matrix: &[f64], rows: usize, cols: usize) -> MatrixResult {
    if matrix.len() != rows * cols || cols < 2 {
        return MatrixResult {
            data: vec![],
            rows: 0,
            cols: 0,
        };
    }
    
    let means = row_means(matrix, rows, cols);
    let mut cov = vec![0.0; rows * rows];
    
    for i in 0..rows {
        for j in i..rows {
            let covariance: f64 = (0..cols)
                .map(|k| {
                    (matrix[i * cols + k] - means[i]) * (matrix[j * cols + k] - means[j])
                })
                .sum::<f64>() / (cols - 1) as f64;
            
            cov[i * rows + j] = covariance;
            cov[j * rows + i] = covariance;
        }
    }
    
    MatrixResult {
        data: cov,
        rows,
        cols: rows,
    }
}

/// Element-wise matrix addition
#[wasm_bindgen]
pub fn matrix_add(a: &[f64], b: &[f64]) -> Vec<f64> {
    if a.len() != b.len() {
        return vec![];
    }
    
    a.iter().zip(b.iter()).map(|(x, y)| x + y).collect()
}

/// Scalar multiplication
#[wasm_bindgen]
pub fn matrix_scale(matrix: &[f64], scalar: f64) -> Vec<f64> {
    matrix.iter().map(|x| x * scalar).collect()
}

/// Sum of all elements
#[wasm_bindgen]
pub fn matrix_sum(matrix: &[f64]) -> f64 {
    matrix.iter().sum()
}

/// Find min and max values
#[wasm_bindgen]
pub struct MinMax {
    min: f64,
    max: f64,
    min_idx: usize,
    max_idx: usize,
}

#[wasm_bindgen]
impl MinMax {
    pub fn min(&self) -> f64 { self.min }
    pub fn max(&self) -> f64 { self.max }
    pub fn min_index(&self) -> usize { self.min_idx }
    pub fn max_index(&self) -> usize { self.max_idx }
}

#[wasm_bindgen]
pub fn matrix_minmax(matrix: &[f64]) -> MinMax {
    if matrix.is_empty() {
        return MinMax {
            min: f64::NAN,
            max: f64::NAN,
            min_idx: 0,
            max_idx: 0,
        };
    }
    
    let mut min = matrix[0];
    let mut max = matrix[0];
    let mut min_idx = 0;
    let mut max_idx = 0;
    
    for (i, &val) in matrix.iter().enumerate() {
        if val < min {
            min = val;
            min_idx = i;
        }
        if val > max {
            max = val;
            max_idx = i;
        }
    }
    
    MinMax { min, max, min_idx, max_idx }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_matmul() {
        let a = vec![1.0, 2.0, 3.0, 4.0];
        let b = vec![5.0, 6.0, 7.0, 8.0];
        
        let result = matmul(&a, &b, 2, 2, 2);
        
        assert_eq!(result.rows, 2);
        assert_eq!(result.cols, 2);
        assert!((result.get(0, 0) - 19.0).abs() < 1e-10);
    }
    
    #[test]
    fn test_correlation() {
        let x = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let y = vec![2.0, 4.0, 6.0, 8.0, 10.0];
        
        let r = pearson_correlation(&x, &y);
        assert!((r - 1.0).abs() < 1e-10);
    }
    
    #[test]
    fn test_zscore() {
        let matrix = vec![1.0, 2.0, 3.0, 4.0, 5.0, 6.0];
        let result = zscore_normalize(&matrix, 2, 3);
        
        // Check that means are ~0 for each row
        for i in 0..2 {
            let row_mean: f64 = (0..3)
                .map(|j| result.get(i, j))
                .sum::<f64>() / 3.0;
            assert!(row_mean.abs() < 1e-10);
        }
    }
}
