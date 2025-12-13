/**
 * Tutorial 3.5: Oncoprint / Mutation Matrix
 * Main application entry point
 */

import { Oncoprint } from './components/Oncoprint.js';
import {
  generateOncoprintData,
  calculateGeneFrequencies,
  getSummaryStats,
  sortSamplesByMutationCount,
  sortSamplesByGenePriority,
  sortSamplesByClinical,
  sortGenesByFrequency,
  MUTATION_TYPES,
  CLINICAL_FEATURES
} from './data/mutationData.js';

// Application state
let oncoprint = null;
let currentData = null;
let currentFrequencies = null;

// Initialize application
function init() {
  // Generate initial data
  const cancerType = document.getElementById('cancerType').value;
  const sampleCount = parseInt(document.getElementById('sampleCount').value);
  
  currentData = generateOncoprintData(cancerType, sampleCount);
  currentFrequencies = calculateGeneFrequencies(currentData);
  
  // Create visualization
  oncoprint = new Oncoprint('#oncoprint', {
    cellWidth: 8,
    cellHeight: 18,
    cellPadding: 1,
    showClinical: document.getElementById('showClinical').checked
  });
  
  oncoprint.setData(currentData, currentFrequencies);
  
  // Apply initial sorting
  applySorting();
  
  // Update UI
  updateStats();
  updateLegend();
  
  // Setup event handlers
  setupEventHandlers();
  
  console.log('Oncoprint initialized:', {
    samples: currentData.samples.length,
    genes: currentData.genes.length,
    cancerType: currentData.cancerType
  });
}

// Apply current sorting options
function applySorting() {
  const sampleSort = document.getElementById('sortBy').value;
  const geneSort = document.getElementById('sortGenesBy').value;
  
  // Sort genes first
  if (geneSort === 'frequency') {
    oncoprint.sortGenes(genes => sortGenesByFrequency(genes, currentData.samples));
  } else {
    oncoprint.sortGenes(genes => [...genes].sort());
  }
  
  // Then sort samples
  switch (sampleSort) {
    case 'mutation':
      oncoprint.sortSamples(samples => sortSamplesByMutationCount(samples));
      break;
    case 'gene':
      oncoprint.sortSamples(samples => 
        sortSamplesByGenePriority(samples, oncoprint.sortedGenes)
      );
      break;
    case 'clinical':
      oncoprint.sortSamples(samples => sortSamplesByClinical(samples, 'stage'));
      break;
    default:
      oncoprint.sortSamples(() => [...currentData.samples]);
  }
}

// Update statistics display
function updateStats() {
  const stats = getSummaryStats(currentData);
  
  document.getElementById('totalSamples').textContent = stats.totalSamples;
  document.getElementById('totalGenes').textContent = stats.totalGenes;
  document.getElementById('totalMutations').textContent = stats.totalMutations;
  document.getElementById('avgMutations').textContent = stats.avgMutations;
}

// Update legend
function updateLegend() {
  const mutationLegend = document.getElementById('mutationLegend');
  mutationLegend.innerHTML = '';
  
  Object.entries(MUTATION_TYPES).forEach(([type, info]) => {
    const item = document.createElement('div');
    item.className = 'legend-item';
    item.innerHTML = `
      <span class="legend-color" style="background-color: ${info.color}; ${
        info.shape === 'rect-full' ? 'height: 16px;' : ''
      }"></span>
      <span>${info.label}</span>
    `;
    mutationLegend.appendChild(item);
  });
}

// Setup event handlers
function setupEventHandlers() {
  // Cancer type change
  document.getElementById('cancerType').addEventListener('change', () => {
    regenerateData();
  });
  
  // Sample count change
  document.getElementById('sampleCount').addEventListener('change', () => {
    regenerateData();
  });
  
  // Regenerate button
  document.getElementById('regenerateData').addEventListener('click', () => {
    regenerateData();
  });
  
  // Sorting options
  document.getElementById('sortBy').addEventListener('change', () => {
    applySorting();
  });
  
  document.getElementById('sortGenesBy').addEventListener('change', () => {
    applySorting();
  });
  
  // Clinical toggle
  document.getElementById('showClinical').addEventListener('change', (e) => {
    oncoprint.toggleClinical(e.target.checked);
  });
}

// Regenerate data with current settings
function regenerateData() {
  const cancerType = document.getElementById('cancerType').value;
  const sampleCount = parseInt(document.getElementById('sampleCount').value);
  
  currentData = generateOncoprintData(cancerType, sampleCount);
  currentFrequencies = calculateGeneFrequencies(currentData);
  
  oncoprint.setData(currentData, currentFrequencies);
  applySorting();
  updateStats();
  
  console.log('Data regenerated:', {
    samples: currentData.samples.length,
    genes: currentData.genes.length,
    cancerType: currentData.cancerType
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
