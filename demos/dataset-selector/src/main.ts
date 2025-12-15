/**
 * Dataset Selector Demo - Main Entry
 *
 * Landing page for selecting datasets and launching visualizations
 */

import { AppController } from './AppController';
import './styles.css';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🧬 Dataset Selector initializing...');

  try {
    new AppController();
    console.log('✅ Dataset Selector ready');
  } catch (error) {
    console.error('Failed to initialize Dataset Selector:', error);
  }
});
