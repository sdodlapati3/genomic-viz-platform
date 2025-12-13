/**
 * JavaScript-based Statistical Analysis
 * Fallback when R is not available
 * Implements common statistical methods in pure JavaScript
 */

/**
 * Calculate mean of an array
 */
export function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calculate standard deviation
 */
export function std(arr) {
  const m = mean(arr);
  const squaredDiffs = arr.map(x => Math.pow(x - m, 2));
  return Math.sqrt(mean(squaredDiffs));
}

/**
 * Calculate variance
 */
export function variance(arr) {
  const m = mean(arr);
  return arr.reduce((acc, val) => acc + Math.pow(val - m, 2), 0) / (arr.length - 1);
}

/**
 * Two-sample t-test
 */
export function tTest(group1, group2) {
  const n1 = group1.length;
  const n2 = group2.length;
  const m1 = mean(group1);
  const m2 = mean(group2);
  const v1 = variance(group1);
  const v2 = variance(group2);
  
  // Pooled variance
  const pooledVar = ((n1 - 1) * v1 + (n2 - 1) * v2) / (n1 + n2 - 2);
  const se = Math.sqrt(pooledVar * (1/n1 + 1/n2));
  
  // t-statistic
  const t = (m1 - m2) / se;
  const df = n1 + n2 - 2;
  
  // Approximate p-value using normal distribution for large samples
  const pvalue = 2 * (1 - normalCDF(Math.abs(t)));
  
  return {
    statistic: t,
    df,
    pvalue,
    mean1: m1,
    mean2: m2
  };
}

/**
 * Normal CDF approximation
 */
function normalCDF(x) {
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);
  
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  
  return 0.5 * (1.0 + sign * y);
}

/**
 * Chi-square test
 */
export function chiSquareTest(observed, expected = null) {
  const n = observed.length;
  
  if (!expected) {
    const total = observed.reduce((a, b) => a + b, 0);
    expected = observed.map(() => total / n);
  }
  
  let chiSquare = 0;
  for (let i = 0; i < n; i++) {
    chiSquare += Math.pow(observed[i] - expected[i], 2) / expected[i];
  }
  
  const df = n - 1;
  
  // Approximate p-value using chi-square distribution
  const pvalue = 1 - chiSquareCDF(chiSquare, df);
  
  return {
    statistic: chiSquare,
    df,
    pvalue
  };
}

/**
 * Chi-square CDF approximation
 */
function chiSquareCDF(x, df) {
  if (x <= 0) return 0;
  
  // Use incomplete gamma function approximation
  const k = df / 2;
  const theta = 2;
  
  return gammaCDF(x / theta, k);
}

/**
 * Gamma CDF approximation
 */
function gammaCDF(x, k) {
  if (x <= 0) return 0;
  
  // Simple approximation for small k
  let sum = 0;
  let term = 1;
  
  for (let i = 0; i < 100; i++) {
    sum += term;
    term *= x / (k + i + 1);
    if (Math.abs(term) < 1e-10) break;
  }
  
  return Math.pow(x, k) * Math.exp(-x) * sum / gamma(k + 1);
}

/**
 * Gamma function approximation (Stirling)
 */
function gamma(n) {
  if (n === 1) return 1;
  if (n < 1) return gamma(n + 1) / n;
  
  // Stirling approximation
  return Math.sqrt(2 * Math.PI / n) * Math.pow(n / Math.E, n);
}

/**
 * Pearson correlation coefficient
 */
export function correlation(x, y) {
  const n = x.length;
  const mx = mean(x);
  const my = mean(y);
  
  let num = 0;
  let den1 = 0;
  let den2 = 0;
  
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    den1 += dx * dx;
    den2 += dy * dy;
  }
  
  return num / Math.sqrt(den1 * den2);
}

/**
 * Benjamini-Hochberg p-value adjustment
 */
export function adjustPValues(pvalues) {
  const n = pvalues.length;
  
  // Create array with original indices
  const indexed = pvalues.map((p, i) => ({ p, i }));
  
  // Sort by p-value
  indexed.sort((a, b) => a.p - b.p);
  
  // Calculate adjusted p-values
  const adjusted = new Array(n);
  let cumMin = 1;
  
  for (let i = n - 1; i >= 0; i--) {
    const rank = i + 1;
    const adj = Math.min(indexed[i].p * n / rank, cumMin);
    cumMin = Math.min(adj, cumMin);
    adjusted[indexed[i].i] = Math.min(adj, 1);
  }
  
  return adjusted;
}

/**
 * Simple Kaplan-Meier survival calculation
 */
export function kaplanMeier(times, events) {
  // Sort by time
  const data = times.map((t, i) => ({ time: t, event: events[i] }))
    .sort((a, b) => a.time - b.time);
  
  const uniqueTimes = [...new Set(data.map(d => d.time))].sort((a, b) => a - b);
  
  let nRisk = data.length;
  let survival = 1.0;
  
  const curve = [{ time: 0, survival: 1.0, nRisk: data.length }];
  
  for (const t of uniqueTimes) {
    const events = data.filter(d => d.time === t && d.event === 1).length;
    const censored = data.filter(d => d.time === t && d.event === 0).length;
    
    if (events > 0) {
      survival *= (nRisk - events) / nRisk;
      curve.push({ time: t, survival, nRisk, nEvents: events });
    }
    
    nRisk -= (events + censored);
  }
  
  return curve;
}

/**
 * Log-rank test for survival comparison
 */
export function logRankTest(times1, events1, times2, events2) {
  const km1 = kaplanMeier(times1, events1);
  const km2 = kaplanMeier(times2, events2);
  
  // Simplified log-rank calculation
  // This is an approximation
  const e1 = events1.reduce((a, b) => a + b, 0);
  const e2 = events2.reduce((a, b) => a + b, 0);
  const n1 = times1.length;
  const n2 = times2.length;
  const total = n1 + n2;
  
  const expected1 = (e1 + e2) * n1 / total;
  const expected2 = (e1 + e2) * n2 / total;
  
  const chiSq = Math.pow(e1 - expected1, 2) / expected1 + 
                Math.pow(e2 - expected2, 2) / expected2;
  
  const pvalue = 1 - chiSquareCDF(chiSq, 1);
  
  return {
    chiSquare: chiSq,
    pvalue,
    curves: { group1: km1, group2: km2 }
  };
}

/**
 * Differential expression analysis (JavaScript version)
 */
export function differentialExpression(expressionMatrix, conditions) {
  const genes = Object.keys(expressionMatrix[0]).filter(k => 
    k !== 'sample_id' && k !== 'condition'
  );
  
  const tumor = expressionMatrix.filter(r => r.condition === 'tumor');
  const normal = expressionMatrix.filter(r => r.condition === 'normal');
  
  const results = genes.map(gene => {
    const tumorExpr = tumor.map(r => r[gene]);
    const normalExpr = normal.map(r => r[gene]);
    
    const tResult = tTest(tumorExpr, normalExpr);
    const log2fc = tResult.mean1 - tResult.mean2;
    
    return {
      gene,
      tumor_mean: parseFloat(tResult.mean1.toFixed(3)),
      normal_mean: parseFloat(tResult.mean2.toFixed(3)),
      log2_fold_change: parseFloat(log2fc.toFixed(3)),
      pvalue: tResult.pvalue
    };
  });
  
  // Adjust p-values
  const pvalues = results.map(r => r.pvalue);
  const adjusted = adjustPValues(pvalues);
  
  results.forEach((r, i) => {
    r.adjusted_pvalue = adjusted[i];
    r.significant = adjusted[i] < 0.05;
    r.direction = r.log2_fold_change > 0 ? 'up' : 'down';
  });
  
  return {
    analysis_type: 'differential_expression_js',
    n_tumor: tumor.length,
    n_normal: normal.length,
    n_genes: genes.length,
    n_significant: results.filter(r => r.significant).length,
    results: results.sort((a, b) => a.adjusted_pvalue - b.adjusted_pvalue)
  };
}

export default {
  mean,
  std,
  variance,
  tTest,
  chiSquareTest,
  correlation,
  adjustPValues,
  kaplanMeier,
  logRankTest,
  differentialExpression
};
