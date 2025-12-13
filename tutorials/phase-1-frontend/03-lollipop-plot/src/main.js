/**
 * Tutorial 1.3: Lollipop Plot - Main Entry Point
 * 
 * This tutorial teaches how to build the signature genomic mutation visualization
 */

import * as d3 from 'd3';
import { initBasicsModule, basicLollipopCode } from './01-basics.js';
import { initDomainsModule, domainsCode } from './02-domains.js';
import { initMutationsModule, mutationsCode } from './03-mutations.js';
import { initInteractiveModule, interactiveCode } from './04-interactive.js';
import { initCompleteModule } from './05-complete.js';

// Tab navigation
const tabs = document.querySelectorAll('.tab');
const sections = document.querySelectorAll('.section');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const targetSection = tab.dataset.section;
    
    // Update tabs
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    // Update sections
    sections.forEach(s => {
      s.classList.toggle('active', s.id === targetSection);
    });
    
    // Initialize section if needed
    initSection(targetSection);
  });
});

// Track initialized sections
const initializedSections = new Set();

function initSection(sectionId) {
  if (initializedSections.has(sectionId)) return;
  
  switch(sectionId) {
    case 'basics':
      initBasicsModule();
      displayCode('basic-code', basicLollipopCode);
      break;
    case 'domains':
      initDomainsModule();
      displayCode('domains-code', domainsCode);
      break;
    case 'mutations':
      initMutationsModule();
      displayCode('mutations-code', mutationsCode);
      break;
    case 'interactive':
      initInteractiveModule();
      displayCode('interactive-code', interactiveCode);
      break;
    case 'complete':
      initCompleteModule();
      break;
  }
  
  initializedSections.add(sectionId);
}

// Helper to display code snippets
function displayCode(elementId, code) {
  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = code;
  }
}

// Initialize first section on load
initSection('basics');

console.log('🧬 Tutorial 1.3: Lollipop Plot initialized');
