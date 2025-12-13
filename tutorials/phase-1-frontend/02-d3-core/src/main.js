// Main entry point for D3 Core Tutorial
import * as d3 from 'd3';
import { initSelections } from './01-selections.js';
import { initDataBinding } from './02-data-binding.js';
import { initScales } from './03-scales.js';
import { initTransitions } from './04-transitions.js';
import { initGenomicChart } from './05-genomic-chart.js';

// Make d3 available globally for demos
window.d3 = d3;

// Tab navigation
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    const sectionId = tab.dataset.section;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
  });
});

// Initialize all demos
initSelections();
initDataBinding();
initScales();
initTransitions();
initGenomicChart();

console.log('🧬 D3.js Core Tutorial loaded!');
