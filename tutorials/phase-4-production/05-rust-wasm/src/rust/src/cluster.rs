//! K-Means Clustering Implementation
//!
//! Efficient clustering algorithm for gene expression data,
//! single-cell analysis, and dimensionality reduction results.

use wasm_bindgen::prelude::*;
use js_sys::Math;

/// Result of K-means clustering
#[wasm_bindgen]
pub struct KMeansResult {
    assignments: Vec<u32>,
    centroids: Vec<f64>,
    iterations: u32,
    converged: bool,
    inertia: f64,
}

#[wasm_bindgen]
impl KMeansResult {
    /// Get cluster assignments for each point
    pub fn assignments(&self) -> Vec<u32> {
        self.assignments.clone()
    }
    
    /// Get centroid coordinates (flattened: [x1,y1,x2,y2,...])
    pub fn centroids(&self) -> Vec<f64> {
        self.centroids.clone()
    }
    
    /// Number of iterations until convergence
    pub fn iterations(&self) -> u32 {
        self.iterations
    }
    
    /// Whether the algorithm converged
    pub fn converged(&self) -> bool {
        self.converged
    }
    
    /// Within-cluster sum of squares (inertia)
    pub fn inertia(&self) -> f64 {
        self.inertia
    }
}

/// K-means++ initialization for better starting centroids
fn kmeans_plus_plus(data: &[f64], k: usize, dims: usize) -> Vec<f64> {
    let n_points = data.len() / dims;
    let mut centroids = Vec::with_capacity(k * dims);
    
    // First centroid: random point
    let first_idx = (Math::random() * n_points as f64) as usize;
    centroids.extend_from_slice(&data[first_idx * dims..(first_idx + 1) * dims]);
    
    // Remaining centroids: weighted by distance squared
    for _ in 1..k {
        let mut distances = vec![f64::MAX; n_points];
        
        // Calculate min distance to existing centroids
        for (i, point) in data.chunks(dims).enumerate() {
            for centroid in centroids.chunks(dims) {
                let dist = euclidean_distance_sq(point, centroid);
                distances[i] = distances[i].min(dist);
            }
        }
        
        // Select next centroid with probability proportional to distance^2
        let total: f64 = distances.iter().sum();
        let threshold = Math::random() * total;
        let mut cumsum = 0.0;
        
        for (i, &dist) in distances.iter().enumerate() {
            cumsum += dist;
            if cumsum >= threshold {
                centroids.extend_from_slice(&data[i * dims..(i + 1) * dims]);
                break;
            }
        }
    }
    
    // Handle edge case where we didn't add enough centroids
    while centroids.len() < k * dims {
        let idx = (Math::random() * n_points as f64) as usize;
        centroids.extend_from_slice(&data[idx * dims..(idx + 1) * dims]);
    }
    
    centroids
}

/// Squared Euclidean distance
#[inline]
fn euclidean_distance_sq(a: &[f64], b: &[f64]) -> f64 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| (x - y).powi(2))
        .sum()
}

/// Assign each point to nearest centroid
fn assign_points(
    data: &[f64],
    centroids: &[f64],
    assignments: &mut [u32],
    dims: usize,
) -> bool {
    let k = centroids.len() / dims;
    let mut changed = false;
    
    for (i, point) in data.chunks(dims).enumerate() {
        let mut min_dist = f64::MAX;
        let mut min_cluster = 0u32;
        
        for (j, centroid) in centroids.chunks(dims).enumerate() {
            let dist = euclidean_distance_sq(point, centroid);
            if dist < min_dist {
                min_dist = dist;
                min_cluster = j as u32;
            }
        }
        
        if assignments[i] != min_cluster {
            assignments[i] = min_cluster;
            changed = true;
        }
    }
    
    changed
}

/// Update centroid positions
fn update_centroids(
    data: &[f64],
    assignments: &[u32],
    centroids: &mut [f64],
    k: usize,
    dims: usize,
) {
    let mut counts = vec![0usize; k];
    let mut sums = vec![0.0; k * dims];
    
    // Sum points per cluster
    for (i, point) in data.chunks(dims).enumerate() {
        let cluster = assignments[i] as usize;
        counts[cluster] += 1;
        
        for (j, &val) in point.iter().enumerate() {
            sums[cluster * dims + j] += val;
        }
    }
    
    // Calculate means
    for (i, count) in counts.iter().enumerate() {
        if *count > 0 {
            for j in 0..dims {
                centroids[i * dims + j] = sums[i * dims + j] / *count as f64;
            }
        }
    }
}

/// Calculate within-cluster sum of squares
fn calculate_inertia(
    data: &[f64],
    centroids: &[f64],
    assignments: &[u32],
    dims: usize,
) -> f64 {
    data.chunks(dims)
        .enumerate()
        .map(|(i, point)| {
            let cluster = assignments[i] as usize;
            let centroid = &centroids[cluster * dims..(cluster + 1) * dims];
            euclidean_distance_sq(point, centroid)
        })
        .sum()
}

/// K-means clustering
/// 
/// # Arguments
/// * `data` - Flattened array of points [x1,y1,x2,y2,...]
/// * `k` - Number of clusters
/// * `dims` - Dimensions per point (default: 2)
/// * `max_iter` - Maximum iterations
/// * `tolerance` - Convergence tolerance
/// 
/// # Returns
/// KMeansResult with assignments, centroids, and metadata
#[wasm_bindgen]
pub fn kmeans(
    data: &[f64],
    k: usize,
    dims: usize,
    max_iter: u32,
) -> KMeansResult {
    kmeans_with_tolerance(data, k, dims, max_iter, 1e-4)
}

/// K-means with custom tolerance
#[wasm_bindgen]
pub fn kmeans_with_tolerance(
    data: &[f64],
    k: usize,
    dims: usize,
    max_iter: u32,
    tolerance: f64,
) -> KMeansResult {
    let n_points = data.len() / dims;
    
    if n_points == 0 || k == 0 || k > n_points {
        return KMeansResult {
            assignments: vec![],
            centroids: vec![],
            iterations: 0,
            converged: false,
            inertia: 0.0,
        };
    }
    
    // Initialize with k-means++
    let mut centroids = kmeans_plus_plus(data, k, dims);
    let mut assignments = vec![0u32; n_points];
    let mut prev_inertia = f64::MAX;
    
    for iteration in 0..max_iter {
        // Assign points to clusters
        let changed = assign_points(data, &centroids, &mut assignments, dims);
        
        // Update centroids
        update_centroids(data, &assignments, &mut centroids, k, dims);
        
        // Check convergence
        let inertia = calculate_inertia(data, &centroids, &assignments, dims);
        
        if !changed || (prev_inertia - inertia).abs() < tolerance {
            return KMeansResult {
                assignments,
                centroids,
                iterations: iteration + 1,
                converged: true,
                inertia,
            };
        }
        
        prev_inertia = inertia;
    }
    
    let inertia = calculate_inertia(data, &centroids, &assignments, dims);
    
    KMeansResult {
        assignments,
        centroids,
        iterations: max_iter,
        converged: false,
        inertia,
    }
}

/// Run k-means multiple times and return best result
#[wasm_bindgen]
pub fn kmeans_best(
    data: &[f64],
    k: usize,
    dims: usize,
    max_iter: u32,
    n_init: u32,
) -> KMeansResult {
    let mut best_result: Option<KMeansResult> = None;
    let mut best_inertia = f64::MAX;
    
    for _ in 0..n_init {
        let result = kmeans(data, k, dims, max_iter);
        
        if result.inertia < best_inertia {
            best_inertia = result.inertia;
            best_result = Some(result);
        }
    }
    
    best_result.unwrap_or_else(|| KMeansResult {
        assignments: vec![],
        centroids: vec![],
        iterations: 0,
        converged: false,
        inertia: 0.0,
    })
}

/// Elbow method: calculate inertia for different k values
#[wasm_bindgen]
pub fn elbow_analysis(
    data: &[f64],
    dims: usize,
    max_k: usize,
    max_iter: u32,
) -> Vec<f64> {
    (1..=max_k)
        .map(|k| {
            let result = kmeans_best(data, k, dims, max_iter, 3);
            result.inertia
        })
        .collect()
}

/// Silhouette score for clustering quality
#[wasm_bindgen]
pub fn silhouette_score(
    data: &[f64],
    assignments: &[u32],
    dims: usize,
) -> f64 {
    let n_points = data.len() / dims;
    
    if n_points < 2 {
        return 0.0;
    }
    
    let mut total_score = 0.0;
    
    for i in 0..n_points {
        let point = &data[i * dims..(i + 1) * dims];
        let cluster = assignments[i];
        
        // a(i): mean distance to same cluster
        let mut same_cluster_dist = 0.0;
        let mut same_count = 0;
        
        // b(i): min mean distance to other clusters
        let mut other_cluster_dists: std::collections::HashMap<u32, (f64, usize)> =
            std::collections::HashMap::new();
        
        for j in 0..n_points {
            if i == j {
                continue;
            }
            
            let other_point = &data[j * dims..(j + 1) * dims];
            let dist = euclidean_distance_sq(point, other_point).sqrt();
            
            if assignments[j] == cluster {
                same_cluster_dist += dist;
                same_count += 1;
            } else {
                let entry = other_cluster_dists
                    .entry(assignments[j])
                    .or_insert((0.0, 0));
                entry.0 += dist;
                entry.1 += 1;
            }
        }
        
        let a = if same_count > 0 {
            same_cluster_dist / same_count as f64
        } else {
            0.0
        };
        
        let b = other_cluster_dists
            .values()
            .map(|(sum, count)| sum / *count as f64)
            .fold(f64::MAX, f64::min);
        
        if a.max(b) > 0.0 {
            total_score += (b - a) / a.max(b);
        }
    }
    
    total_score / n_points as f64
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_kmeans_simple() {
        // Two clear clusters
        let data = vec![
            0.0, 0.0,
            0.1, 0.1,
            0.0, 0.1,
            10.0, 10.0,
            10.1, 10.1,
            10.0, 10.1,
        ];
        
        let result = kmeans(&data, 2, 2, 100);
        
        assert_eq!(result.assignments.len(), 3);
        assert!(result.converged);
        
        // Points should be in different clusters
        assert_ne!(result.assignments[0], result.assignments[3]);
    }
    
    #[test]
    fn test_elbow() {
        let data: Vec<f64> = (0..100)
            .flat_map(|i| vec![(i % 3) as f64 * 10.0 + Math::random(), Math::random()])
            .collect();
        
        let inertias = elbow_analysis(&data, 2, 5, 50);
        
        assert_eq!(inertias.len(), 5);
        // Inertia should generally decrease with more clusters
        assert!(inertias[0] >= inertias[4]);
    }
}
