// Main entry point - imports all modules and sets up tab navigation
import { initSvgBasics } from './01-svg-basics.js';
import { initSvgPaths } from './02-svg-paths.js';
import { initCanvasBasics } from './03-canvas-basics.js';
import { initInteractivity } from './04-interactivity.js';
import { initComparison } from './05-comparison.js';

// Tab navigation
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // Update active tab
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Show corresponding section
    const sectionId = tab.dataset.section;
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
  });
});

// Initialize all demos
initSvgBasics();
initSvgPaths();
initCanvasBasics();
initInteractivity();
initComparison();

console.log('🧬 SVG & Canvas Tutorial loaded!');
