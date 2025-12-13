/**
 * Survival Data Generator
 * Simulates clinical survival data for Kaplan-Meier analysis
 */

// Treatment groups with different survival characteristics
export const TREATMENT_GROUPS = {
  'Control': {
    color: '#4a90d9',
    medianSurvival: 24,  // months
    hazardRatio: 1.0
  },
  'Treatment A': {
    color: '#e74c3c',
    medianSurvival: 36,
    hazardRatio: 0.65
  },
  'Treatment B': {
    color: '#2ecc71',
    medianSurvival: 30,
    hazardRatio: 0.78
  }
};

// Mutation status groups
export const MUTATION_GROUPS = {
  'TP53 Wild-type': {
    color: '#3498db',
    medianSurvival: 32,
    hazardRatio: 1.0
  },
  'TP53 Mutant': {
    color: '#e67e22',
    medianSurvival: 18,
    hazardRatio: 1.8
  }
};

// Expression-based groups
export const EXPRESSION_GROUPS = {
  'Low Expression': {
    color: '#9b59b6',
    medianSurvival: 20,
    hazardRatio: 1.5
  },
  'High Expression': {
    color: '#1abc9c',
    medianSurvival: 38,
    hazardRatio: 0.55
  }
};

/**
 * Generate exponential survival time
 * Uses inverse transform sampling
 */
function generateSurvivalTime(medianSurvival) {
  // Convert median to rate parameter (lambda)
  // For exponential: median = ln(2) / lambda
  const lambda = Math.log(2) / medianSurvival;
  
  // Inverse transform: T = -ln(U) / lambda
  const u = Math.random();
  return -Math.log(u) / lambda;
}

/**
 * Generate survival data for a cohort
 * @param {number} n - Number of patients
 * @param {Object} groups - Group definitions with survival parameters
 * @param {number} maxFollowUp - Maximum follow-up time in months
 * @returns {Array} Array of patient survival data
 */
export function generateSurvivalData(n = 100, groups = TREATMENT_GROUPS, maxFollowUp = 60) {
  const data = [];
  const groupNames = Object.keys(groups);
  const patientsPerGroup = Math.floor(n / groupNames.length);
  
  let patientId = 1;
  
  for (const [groupName, groupInfo] of Object.entries(groups)) {
    const groupSize = groupName === groupNames[groupNames.length - 1] 
      ? n - data.length  // Last group gets remaining patients
      : patientsPerGroup;
    
    for (let i = 0; i < groupSize; i++) {
      // Generate true survival time
      const trueSurvivalTime = generateSurvivalTime(groupInfo.medianSurvival);
      
      // Determine if censored (patient still alive at follow-up)
      // Add some random censoring for patients who dropped out
      const dropoutTime = Math.random() < 0.15 
        ? Math.random() * maxFollowUp 
        : maxFollowUp;
      
      const censorTime = Math.min(dropoutTime, maxFollowUp);
      const event = trueSurvivalTime <= censorTime ? 1 : 0;
      const time = event ? trueSurvivalTime : censorTime;
      
      data.push({
        id: `P${String(patientId++).padStart(3, '0')}`,
        group: groupName,
        time: Math.round(time * 10) / 10,  // Round to 1 decimal
        event: event,  // 1 = death/event, 0 = censored
        color: groupInfo.color,
        // Additional clinical variables
        age: Math.floor(Math.random() * 40) + 40,  // 40-80
        stage: ['I', 'II', 'III', 'IV'][Math.floor(Math.random() * 4)],
        gender: Math.random() < 0.5 ? 'M' : 'F'
      });
    }
  }
  
  // Sort by time
  data.sort((a, b) => a.time - b.time);
  
  return data;
}

/**
 * Calculate Kaplan-Meier survival estimates
 * @param {Array} data - Survival data with time and event fields
 * @returns {Array} KM estimates with time, survival, and confidence intervals
 */
export function kaplanMeier(data) {
  // Sort by time
  const sorted = [...data].sort((a, b) => a.time - b.time);
  
  const n = sorted.length;
  let atRisk = n;
  let survival = 1.0;
  let varianceSum = 0;
  
  const estimates = [{
    time: 0,
    survival: 1.0,
    atRisk: n,
    events: 0,
    censored: 0,
    standardError: 0,
    ciLower: 1.0,
    ciUpper: 1.0
  }];
  
  // Group events by time
  const timePoints = new Map();
  for (const patient of sorted) {
    const t = patient.time;
    if (!timePoints.has(t)) {
      timePoints.set(t, { events: 0, censored: 0 });
    }
    if (patient.event === 1) {
      timePoints.get(t).events++;
    } else {
      timePoints.get(t).censored++;
    }
  }
  
  // Calculate KM estimates at each time point
  const times = [...timePoints.keys()].sort((a, b) => a - b);
  
  for (const t of times) {
    const { events, censored } = timePoints.get(t);
    
    if (events > 0) {
      // Update survival probability
      survival *= (atRisk - events) / atRisk;
      
      // Greenwood's formula for variance
      if (atRisk > events) {
        varianceSum += events / (atRisk * (atRisk - events));
      }
      
      // Standard error
      const se = survival * Math.sqrt(varianceSum);
      
      // 95% confidence interval (log-log transform for better coverage)
      const z = 1.96;
      const logSurvival = Math.log(-Math.log(Math.max(survival, 0.001)));
      const seLogLog = se / (survival * Math.abs(Math.log(Math.max(survival, 0.001))));
      
      let ciLower = Math.exp(-Math.exp(logSurvival + z * seLogLog));
      let ciUpper = Math.exp(-Math.exp(logSurvival - z * seLogLog));
      
      // Bound confidence intervals
      ciLower = Math.max(0, Math.min(1, ciLower));
      ciUpper = Math.max(0, Math.min(1, ciUpper));
      
      estimates.push({
        time: t,
        survival: survival,
        atRisk: atRisk,
        events: events,
        censored: censored,
        standardError: se,
        ciLower: ciLower,
        ciUpper: ciUpper
      });
    }
    
    // Update at-risk count
    atRisk -= (events + censored);
  }
  
  return estimates;
}

/**
 * Calculate Kaplan-Meier for multiple groups
 * @param {Array} data - Survival data
 * @param {string} groupField - Field name for grouping
 * @returns {Object} KM estimates by group
 */
export function kaplanMeierByGroup(data, groupField = 'group') {
  const groups = {};
  
  // Split data by group
  for (const patient of data) {
    const group = patient[groupField];
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(patient);
  }
  
  // Calculate KM for each group
  const results = {};
  for (const [groupName, groupData] of Object.entries(groups)) {
    results[groupName] = {
      data: groupData,
      km: kaplanMeier(groupData),
      n: groupData.length,
      events: groupData.filter(d => d.event === 1).length,
      medianSurvival: calculateMedianSurvival(kaplanMeier(groupData)),
      color: groupData[0]?.color || '#666'
    };
  }
  
  return results;
}

/**
 * Calculate median survival from KM estimates
 */
function calculateMedianSurvival(km) {
  for (let i = 0; i < km.length; i++) {
    if (km[i].survival <= 0.5) {
      return km[i].time;
    }
  }
  return null;  // Median not reached
}

/**
 * Log-rank test for comparing survival curves
 * @param {Array} data - Survival data with group field
 * @returns {Object} Test statistics and p-value
 */
export function logRankTest(data) {
  const groups = [...new Set(data.map(d => d.group))];
  if (groups.length < 2) {
    return { chiSquare: 0, pValue: 1, df: 0 };
  }
  
  // Get all unique event times
  const eventTimes = [...new Set(data.filter(d => d.event === 1).map(d => d.time))].sort((a, b) => a - b);
  
  // Calculate observed and expected for each group
  const groupStats = {};
  for (const g of groups) {
    groupStats[g] = { observed: 0, expected: 0, variance: 0 };
  }
  
  for (const t of eventTimes) {
    // At-risk counts for each group at time t
    const atRisk = {};
    const events = {};
    let totalAtRisk = 0;
    let totalEvents = 0;
    
    for (const g of groups) {
      const groupData = data.filter(d => d.group === g);
      atRisk[g] = groupData.filter(d => d.time >= t).length;
      events[g] = groupData.filter(d => d.time === t && d.event === 1).length;
      totalAtRisk += atRisk[g];
      totalEvents += events[g];
    }
    
    if (totalAtRisk === 0 || totalEvents === 0) continue;
    
    // Expected events under null hypothesis
    for (const g of groups) {
      const expected = (atRisk[g] / totalAtRisk) * totalEvents;
      groupStats[g].observed += events[g];
      groupStats[g].expected += expected;
      
      // Variance term
      if (totalAtRisk > 1) {
        const variance = (atRisk[g] / totalAtRisk) * (1 - atRisk[g] / totalAtRisk) * 
                        totalEvents * (totalAtRisk - totalEvents) / (totalAtRisk - 1);
        groupStats[g].variance += variance;
      }
    }
  }
  
  // Calculate chi-square statistic
  let chiSquare = 0;
  for (const g of groups) {
    const { observed, expected, variance } = groupStats[g];
    if (variance > 0) {
      chiSquare += Math.pow(observed - expected, 2) / variance;
    }
  }
  
  // Degrees of freedom = number of groups - 1
  const df = groups.length - 1;
  
  // Calculate p-value (chi-square distribution)
  const pValue = 1 - chiSquareCDF(chiSquare, df);
  
  return {
    chiSquare: Math.round(chiSquare * 100) / 100,
    pValue: pValue,
    df: df,
    groupStats: groupStats
  };
}

/**
 * Chi-square CDF approximation
 */
function chiSquareCDF(x, df) {
  if (x <= 0) return 0;
  
  // Use gamma function approximation
  const k = df / 2;
  const theta = 2;
  
  // Incomplete gamma function approximation
  let sum = 0;
  let term = 1 / k;
  sum = term;
  
  for (let n = 1; n < 100; n++) {
    term *= x / (2 * (k + n));
    sum += term;
    if (Math.abs(term) < 1e-10) break;
  }
  
  const result = Math.pow(x / 2, k) * Math.exp(-x / 2) * sum / gamma(k);
  return Math.min(1, Math.max(0, result));
}

/**
 * Gamma function approximation (Lanczos)
 */
function gamma(z) {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7
  ];
  
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

export default {
  generateSurvivalData,
  kaplanMeier,
  kaplanMeierByGroup,
  logRankTest,
  TREATMENT_GROUPS,
  MUTATION_GROUPS,
  EXPRESSION_GROUPS
};
