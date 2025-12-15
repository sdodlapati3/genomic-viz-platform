//! Fisher's Exact Test Implementation
//! 
//! Computes exact p-values for 2x2 contingency tables,
//! commonly used in mutation significance analysis.

use wasm_bindgen::prelude::*;

/// Calculate log factorial using Stirling's approximation for large n
fn log_factorial(n: u32) -> f64 {
    if n <= 1 {
        return 0.0;
    }
    
    // Use lookup table for small values
    const LOOKUP: [f64; 21] = [
        0.0, 0.0, 0.693147, 1.791759, 3.178054, 4.787492,
        6.579251, 8.525161, 10.604603, 12.801827, 15.104413,
        17.502308, 19.987214, 22.552164, 25.191221, 27.899271,
        30.671860, 33.505073, 36.395445, 39.339884, 42.335616
    ];
    
    if n <= 20 {
        return LOOKUP[n as usize];
    }
    
    // Stirling's approximation for larger n
    let n = n as f64;
    (n + 0.5) * n.ln() - n + 0.918938533204673  // 0.5 * ln(2π)
}

/// Calculate hypergeometric probability for a 2x2 table
fn hypergeometric_prob(a: u32, b: u32, c: u32, d: u32) -> f64 {
    let n = a + b + c + d;
    
    let log_p = log_factorial(a + b) + log_factorial(c + d)
              + log_factorial(a + c) + log_factorial(b + d)
              - log_factorial(a) - log_factorial(b)
              - log_factorial(c) - log_factorial(d)
              - log_factorial(n);
    
    log_p.exp()
}

/// Fisher's Exact Test for 2x2 contingency table
/// 
/// Returns the two-tailed p-value.
/// 
/// # Arguments
/// * `a` - Count in cell (1,1): Group A with feature
/// * `b` - Count in cell (1,2): Group B with feature  
/// * `c` - Count in cell (2,1): Group A without feature
/// * `d` - Count in cell (2,2): Group B without feature
/// 
/// # Example (from JavaScript)
/// ```javascript
/// const pvalue = fisher_exact(10, 2, 3, 15);
/// console.log(`P-value: ${pvalue}`);
/// ```
#[wasm_bindgen]
pub fn fisher_exact(a: u32, b: u32, c: u32, d: u32) -> f64 {
    fisher_exact_two_tailed(a, b, c, d)
}

/// One-tailed Fisher's exact test (less than)
#[wasm_bindgen]
pub fn fisher_exact_left(a: u32, b: u32, c: u32, d: u32) -> f64 {
    let row1 = a + b;
    let col1 = a + c;
    let n = a + b + c + d;
    
    let min_a = if row1 + col1 > n { row1 + col1 - n } else { 0 };
    
    let mut p_sum = 0.0;
    for i in min_a..=a {
        let new_b = row1 - i;
        let new_c = col1 - i;
        let new_d = n - row1 - col1 + i;
        p_sum += hypergeometric_prob(i, new_b, new_c, new_d);
    }
    
    p_sum.min(1.0)
}

/// One-tailed Fisher's exact test (greater than)
#[wasm_bindgen]
pub fn fisher_exact_right(a: u32, b: u32, c: u32, d: u32) -> f64 {
    let row1 = a + b;
    let col1 = a + c;
    let n = a + b + c + d;
    
    let max_a = row1.min(col1);
    
    let mut p_sum = 0.0;
    for i in a..=max_a {
        let new_b = row1 - i;
        let new_c = col1 - i;
        let new_d = n - row1 - col1 + i;
        p_sum += hypergeometric_prob(i, new_b, new_c, new_d);
    }
    
    p_sum.min(1.0)
}

/// Two-tailed Fisher's exact test
#[wasm_bindgen]
pub fn fisher_exact_two_tailed(a: u32, b: u32, c: u32, d: u32) -> f64 {
    let row1 = a + b;
    let col1 = a + c;
    let n = a + b + c + d;
    
    let min_a = if row1 + col1 > n { row1 + col1 - n } else { 0 };
    let max_a = row1.min(col1);
    
    // Calculate observed probability
    let p_observed = hypergeometric_prob(a, b, c, d);
    
    // Sum probabilities of all tables as extreme or more extreme
    let mut p_sum = 0.0;
    
    for i in min_a..=max_a {
        let new_b = row1 - i;
        let new_c = col1 - i;
        let new_d = n - row1 - col1 + i;
        
        let p = hypergeometric_prob(i, new_b, new_c, new_d);
        
        // Include if probability is <= observed
        if p <= p_observed + 1e-10 {
            p_sum += p;
        }
    }
    
    p_sum.min(1.0)
}

/// Batch Fisher's exact test for multiple 2x2 tables
/// 
/// # Arguments
/// * `tables` - Flat array of [a, b, c, d, a, b, c, d, ...] values
/// 
/// # Returns
/// Array of p-values, one for each table
#[wasm_bindgen]
pub fn fisher_exact_batch(tables: &[u32]) -> Vec<f64> {
    if tables.len() % 4 != 0 {
        return vec![];
    }
    
    tables
        .chunks(4)
        .map(|chunk| fisher_exact(chunk[0], chunk[1], chunk[2], chunk[3]))
        .collect()
}

/// Odds ratio calculation for 2x2 table
#[wasm_bindgen]
pub fn odds_ratio(a: u32, b: u32, c: u32, d: u32) -> f64 {
    if b == 0 || c == 0 {
        return f64::INFINITY;
    }
    (a as f64 * d as f64) / (b as f64 * c as f64)
}

/// Odds ratio with confidence interval
#[wasm_bindgen]
pub struct OddsRatioResult {
    odds_ratio: f64,
    ci_lower: f64,
    ci_upper: f64,
    p_value: f64,
}

#[wasm_bindgen]
impl OddsRatioResult {
    pub fn odds_ratio(&self) -> f64 { self.odds_ratio }
    pub fn ci_lower(&self) -> f64 { self.ci_lower }
    pub fn ci_upper(&self) -> f64 { self.ci_upper }
    pub fn p_value(&self) -> f64 { self.p_value }
}

#[wasm_bindgen]
pub fn odds_ratio_ci(a: u32, b: u32, c: u32, d: u32, confidence: f64) -> OddsRatioResult {
    let or = odds_ratio(a, b, c, d);
    
    // Log odds ratio and standard error
    let log_or = or.ln();
    let se = (1.0 / a.max(1) as f64 + 1.0 / b.max(1) as f64 
            + 1.0 / c.max(1) as f64 + 1.0 / d.max(1) as f64).sqrt();
    
    // Z-score for confidence level (approximate)
    let z = match confidence {
        c if c >= 0.99 => 2.576,
        c if c >= 0.95 => 1.96,
        c if c >= 0.90 => 1.645,
        _ => 1.96,
    };
    
    let ci_lower = (log_or - z * se).exp();
    let ci_upper = (log_or + z * se).exp();
    let p_value = fisher_exact(a, b, c, d);
    
    OddsRatioResult {
        odds_ratio: or,
        ci_lower,
        ci_upper,
        p_value,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_fisher_exact() {
        // Known test case
        let p = fisher_exact(1, 9, 11, 3);
        assert!((p - 0.002759).abs() < 0.001);
    }
    
    #[test]
    fn test_odds_ratio() {
        let or = odds_ratio(10, 2, 3, 15);
        assert!((or - 25.0).abs() < 0.001);
    }
    
    #[test]
    fn test_batch() {
        let tables = vec![1, 9, 11, 3, 10, 2, 3, 15];
        let results = fisher_exact_batch(&tables);
        assert_eq!(results.len(), 2);
    }
}
