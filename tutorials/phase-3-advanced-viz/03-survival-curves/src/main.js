/**
 * Tutorial 3.3: Kaplan-Meier Survival Curves
 * Main Application Entry Point
 */

import { SurvivalCurve } from './components/SurvivalCurve.js';
import {
  generateSurvivalData,
  kaplanMeierByGroup,
  logRankTest,
  TREATMENT_GROUPS,
  MUTATION_GROUPS,
  EXPRESSION_GROUPS
} from './data/survivalData.js';

// Color palette for groups
const COLORS = {
  treatment: {
    'Control': '#3498db',
    'Treatment A': '#e74c3c',
    'Treatment B': '#2ecc71'
  },
  mutation: {
    'TP53 Wild-type': '#3498db',
    'TP53 Mutant': '#e74c3c'
  },
  expression: {
    'Low Expression': '#3498db',
    'High Expression': '#e74c3c'
  }
};

// Global state
let survivalChart = null;
let currentAnalysisType = 'treatment';
let currentData = null;

// Initialize application
function init() {
  console.log('Initializing Survival Analysis...');
  
  // Generate initial data
  generateNewData();
  
  // Set up event listeners
  setupEventListeners();
  
  // Run initial analysis
  runAnalysis();
}
function generateNewData() {
  // Generate data for all analysis types
  // generateSurvivalData(n, groups, maxFollowUp)
  currentData = {
    treatment: generateSurvivalData(150, TREATMENT_GROUPS, 60),
    mutation: generateSurvivalData(120, MUTATION_GROUPS, 60),
    expression: generateSurvivalData(120, EXPRESSION_GROUPS, 60)
  };
  
  updateDataSummary();
}

function updateDataSummary() {
  const data = currentData[currentAnalysisType];
  const summaryEl = document.getElementById('dataSummary');
  
  // Count by group
  const groupCounts = {};
  data.forEach(d => {
    groupCounts[d.group] = groupCounts[d.group] || { total: 0, events: 0 };
    groupCounts[d.group].total++;
    if (d.event === 1) groupCounts[d.group].events++;
  });
  
  let html = '<strong>Current Dataset:</strong><br>';
  for (const [group, counts] of Object.entries(groupCounts)) {
    html += `${group}: n=${counts.total}, events=${counts.events}<br>`;
  }
  
  summaryEl.innerHTML = html;
}

function setupEventListeners() {
  // Analysis type selector
  document.getElementById('analysisType').addEventListener('change', (e) => {
    currentAnalysisType = e.target.value;
    updateDataSummary();
    runAnalysis();
  });
  
  // Display options
  document.getElementById('showCI').addEventListener('change', (e) => {
    if (survivalChart) survivalChart.setShowCI(e.target.checked);
  });
  
  document.getElementById('showCensored').addEventListener('change', (e) => {
    if (survivalChart) survivalChart.setShowCensored(e.target.checked);
  });
  
  document.getElementById('showMedian').addEventListener('change', (e) => {
    if (survivalChart) survivalChart.setShowMedian(e.target.checked);
  });
  
  document.getElementById('showAtRisk').addEventListener('change', (e) => {
    if (survivalChart) survivalChart.setShowAtRiskTable(e.target.checked);
  });
  
  // Generate new data button
  document.getElementById('regenerateData').addEventListener('click', () => {
    generateNewData();
    runAnalysis();
  });
}

function runAnalysis() {
  const data = currentData[currentAnalysisType];
  const colors = COLORS[currentAnalysisType];
  
  // Calculate KM curves by group (pass 'group' as field name)
  const groupResults = kaplanMeierByGroup(data, 'group');
  
  // Apply our color scheme to results
  for (const [groupName, groupData] of Object.entries(groupResults)) {
    groupData.color = colors[groupName] || groupData.color;
  }
  
  // Calculate log-rank test (pass flat array with group field)
  const logRankResult = logRankTest(data);
  
  // Get title based on analysis type
  const titles = {
    treatment: 'Survival by Treatment Group',
    mutation: 'Survival by TP53 Mutation Status',
    expression: 'Survival by Gene Expression Level'
  };
  
  // Create or update chart
  if (!survivalChart) {
    survivalChart = new SurvivalCurve('#chart', {
      width: 900,
      height: 480,
      title: titles[currentAnalysisType],
      showCI: document.getElementById('showCI').checked,
      showCensored: document.getElementById('showCensored').checked,
      showMedian: document.getElementById('showMedian').checked,
      showAtRiskTable: document.getElementById('showAtRisk').checked
    });
  } else {
    survivalChart.config.title = titles[currentAnalysisType];
  }
  
  survivalChart.setData(groupResults, logRankResult);
  
  // Update statistics panel
  updateStatisticsPanel(groupResults, logRankResult);
}

function updateStatisticsPanel(groupResults, logRankResult) {
  const panel = document.getElementById('statisticsPanel');
  
  let html = '<h3>Survival Analysis Results</h3>';
  
  // Group statistics
  html += '<table class="stats-table">';
  html += '<tr><th>Group</th><th>n</th><th>Events</th><th>Median (mo)</th><th>1-yr Surv</th></tr>';
  
  for (const [groupName, groupData] of Object.entries(groupResults)) {
    // Find 1-year survival
    const oneYearPoint = groupData.km.filter(d => d.time <= 12).pop();
    const oneYearSurvival = oneYearPoint ? (oneYearPoint.survival * 100).toFixed(1) : 'N/A';
    
    html += `<tr style="color: ${groupData.color}">
      <td><strong>${groupName}</strong></td>
      <td>${groupData.n}</td>
      <td>${groupData.events}</td>
      <td>${groupData.medianSurvival ? groupData.medianSurvival.toFixed(1) : 'NR'}</td>
      <td>${oneYearSurvival}%</td>
    </tr>`;
  }
  html += '</table>';
  
  // Log-rank test
  html += '<div class="test-results">';
  html += '<h4>Log-Rank Test</h4>';
  html += `<p>Chi-square statistic: <strong>${logRankResult.chiSquare}</strong></p>`;
  html += `<p>Degrees of freedom: <strong>${logRankResult.df}</strong></p>`;
  
  const pValueStr = logRankResult.pValue < 0.001 
    ? '< 0.001' 
    : logRankResult.pValue.toFixed(4);
  const significant = logRankResult.pValue < 0.05;
  
  html += `<p>P-value: <strong style="color: ${significant ? '#e74c3c' : '#666'}">${pValueStr}</strong></p>`;
  
  if (significant) {
    html += '<p class="interpretation">✓ Statistically significant difference in survival between groups (p < 0.05)</p>';
  } else {
    html += '<p class="interpretation">✗ No statistically significant difference in survival between groups (p ≥ 0.05)</p>';
  }
  html += '</div>';
  
  // Interpretation guidance
  html += '<div class="interpretation-guide">';
  html += '<h4>Interpretation Guide</h4>';
  html += '<ul>';
  html += '<li><strong>Median Survival:</strong> Time at which 50% of patients have experienced the event</li>';
  html += '<li><strong>NR (Not Reached):</strong> Less than 50% of patients have experienced the event</li>';
  html += '<li><strong>Tick marks (|):</strong> Censored observations (patient lost to follow-up or study ended)</li>';
  html += '<li><strong>Shaded area:</strong> 95% confidence interval</li>';
  html += '<li><strong>Log-rank test:</strong> Tests null hypothesis that survival curves are identical</li>';
  html += '</ul>';
  html += '</div>';
  
  panel.innerHTML = html;
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
