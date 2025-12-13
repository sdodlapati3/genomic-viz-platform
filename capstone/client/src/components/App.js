/**
 * Main Application Component
 * 
 * Coordinates views, navigation, and global state
 */

import { Navigation } from './Navigation.js';
import { Sidebar } from './Sidebar.js';
import { Modal } from './Modal.js';
import { Toast } from './Toast.js';
import { DashboardView } from '../visualizations/DashboardView.js';
import { MutationsView } from '../visualizations/MutationsView.js';
import { ExpressionView } from '../visualizations/ExpressionView.js';
import { SurvivalView } from '../visualizations/SurvivalView.js';
import { ChatView } from '../visualizations/ChatView.js';
import { DataService } from '../services/DataService.js';

export class App {
  constructor() {
    this.currentView = 'dashboard';
    this.views = {};
    this.dataService = new DataService();
    this.toast = new Toast();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize components
      this.initNavigation();
      this.initSidebar();
      this.initModal();
      this.initViews();
      
      // Load initial data
      await this.loadInitialData();
      
      // Show dashboard
      this.showView('dashboard');
      
    } catch (error) {
      console.error('Failed to initialize app:', error);
      this.toast.show('Failed to initialize application', 'error');
    }
  }

  /**
   * Initialize navigation
   */
  initNavigation() {
    this.navigation = new Navigation({
      onViewChange: (viewName) => this.showView(viewName)
    });
    this.navigation.init();
  }

  /**
   * Initialize sidebar
   */
  initSidebar() {
    this.sidebar = new Sidebar({
      onDatasetSelect: (dataset) => this.handleDatasetSelect(dataset),
      onFilterChange: (filters) => this.handleFilterChange(filters)
    });
    this.sidebar.init();
  }

  /**
   * Initialize modal
   */
  initModal() {
    this.modal = new Modal({
      onUpload: (files) => this.handleFileUpload(files)
    });
    this.modal.init();
  }

  /**
   * Initialize all views
   */
  initViews() {
    this.views = {
      dashboard: new DashboardView({
        container: '#dashboardView',
        dataService: this.dataService
      }),
      mutations: new MutationsView({
        container: '#mutationsView',
        dataService: this.dataService
      }),
      expression: new ExpressionView({
        container: '#expressionView',
        dataService: this.dataService
      }),
      survival: new SurvivalView({
        container: '#survivalView',
        dataService: this.dataService
      }),
      'ai-chat': new ChatView({
        container: '#aiChatView',
        dataService: this.dataService
      })
    };

    // Initialize each view
    Object.values(this.views).forEach(view => view.init());
  }

  /**
   * Load initial data
   */
  async loadInitialData() {
    try {
      // Load sample data for demo
      await this.dataService.loadSampleData();
      
      // Update stats
      this.updateGlobalStats();
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
      throw error;
    }
  }

  /**
   * Show a specific view
   */
  showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });

    // Show selected view
    const viewId = `${viewName}View`;
    const viewElement = document.getElementById(viewId);
    
    if (viewElement) {
      viewElement.classList.add('active');
      this.currentView = viewName;
      
      // Trigger view render/refresh
      if (this.views[viewName]) {
        this.views[viewName].render();
      }
    }
  }

  /**
   * Handle dataset selection
   */
  handleDatasetSelect(dataset) {
    console.log('Dataset selected:', dataset);
    this.dataService.setActiveDataset(dataset);
    
    // Refresh current view
    if (this.views[this.currentView]) {
      this.views[this.currentView].render();
    }
    
    this.toast.show(`Loaded ${dataset.name}`, 'success');
  }

  /**
   * Handle filter changes
   */
  handleFilterChange(filters) {
    console.log('Filters changed:', filters);
    this.dataService.setFilters(filters);
    
    // Refresh current view
    if (this.views[this.currentView]) {
      this.views[this.currentView].render();
    }
  }

  /**
   * Handle file upload
   */
  async handleFileUpload(files) {
    try {
      this.toast.show('Uploading files...', 'info');
      
      for (const file of files) {
        await this.dataService.uploadFile(file);
      }
      
      this.toast.show('Files uploaded successfully', 'success');
      this.sidebar.refreshDatasets();
      this.updateGlobalStats();
      
    } catch (error) {
      console.error('Upload failed:', error);
      this.toast.show('Upload failed: ' + error.message, 'error');
    }
  }

  /**
   * Update global stats display
   */
  updateGlobalStats() {
    const stats = this.dataService.getGlobalStats();
    
    document.getElementById('totalVariants').textContent = stats.totalVariants.toLocaleString();
    document.getElementById('totalSamples').textContent = stats.totalSamples.toLocaleString();
    document.getElementById('totalGenes').textContent = stats.totalGenes.toLocaleString();
    document.getElementById('cohortSize').textContent = stats.cohortSize.toLocaleString();
  }
}
