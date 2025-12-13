/**
 * Mini-ProteinPaint Main Application Entry
 * 
 * Initializes the application and coordinates all modules
 */

import { App } from './components/App.js';

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🧬 Mini-ProteinPaint initializing...');
  
  const app = new App();
  app.init();
  
  // Expose app instance for debugging
  window.miniProteinPaint = app;
  
  console.log('✅ Mini-ProteinPaint ready!');
});
