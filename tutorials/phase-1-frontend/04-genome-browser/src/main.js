// Main entry point for Genome Browser Tutorial
import * as d3 from 'd3';
import { initCoordinates } from './01-coordinates.js';
import { initGeneTracks } from './02-tracks.js';
import { initNavigation } from './03-navigation.js';
import { initFeatureTracks } from './04-features.js';
import { initCompleteBrowser } from './05-complete.js';

// Make d3 available globally
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

// Initialize all modules
initCoordinates();
initGeneTracks();
initNavigation();
initFeatureTracks();
initCompleteBrowser();

console.log('🧬 Genome Browser Tutorial loaded!');
