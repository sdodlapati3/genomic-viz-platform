/**
 * LinkedPortal - Main Application
 *
 * Orchestrates all components:
 * - LollipopPlot (main visualization)
 * - FilterPanel (cohort filtering)
 * - SampleTable (sample browser)
 * - MutationSummary (statistics)
 */

import { EventBus, CohortStore, type CohortState } from './state';
import { LollipopPlot, FilterPanel, SampleTable, MutationSummary } from './components';
import { loadAllData } from './utils';
import './styles.css';

class LinkedPortalApp {
  private lollipopPlot: LollipopPlot | null = null;
  private filterPanel: FilterPanel | null = null;
  private sampleTable: SampleTable | null = null;
  private mutationSummary: MutationSummary | null = null;

  private loadingElement: HTMLElement | null = null;
  private errorElement: HTMLElement | null = null;

  async init(): Promise<void> {
    console.log('🧬 LinkedPortal initializing...');

    this.showLoading(true);

    try {
      // Load data
      const { geneData, samples } = await loadAllData();
      console.log(`Loaded ${geneData.mutations.length} mutations, ${samples.length} samples`);

      // Initialize store with data
      CohortStore.loadData(geneData, samples);

      // Initialize components
      this.initComponents();

      // Setup global event handlers
      this.setupGlobalHandlers();

      this.showLoading(false);
      console.log('✅ LinkedPortal ready!');
    } catch (error) {
      console.error('Failed to initialize:', error);
      this.showError('Failed to load data. Please refresh the page.');
    }
  }

  private initComponents(): void {
    // Main lollipop plot
    this.lollipopPlot = new LollipopPlot('#lollipop-container', {
      width: 900,
      height: 350,
    });

    // Filter panel
    this.filterPanel = new FilterPanel('#filter-container', {
      width: 280,
    });

    // Sample table
    this.sampleTable = new SampleTable('#table-container', {
      width: 600,
      maxHeight: 350,
      pageSize: 10,
    });

    // Mutation summary
    this.mutationSummary = new MutationSummary('#summary-container', {
      width: 300,
      chartHeight: 150,
    });
  }

  private setupGlobalHandlers(): void {
    // Log all events in debug mode
    if (import.meta.env.DEV) {
      EventBus.on('selection:change', (e) => console.log('📌 Selection:', e));
      EventBus.on('filter:apply', (e) => console.log('🔍 Filter:', e));
    }

    // Update page title with cohort info
    CohortStore.subscribe((state: CohortState) => {
      const mutCount = state.filteredMutations.length;
      const sampleCount = state.filteredSamples.length;
      document.title = `LinkedPortal - ${mutCount} mutations, ${sampleCount} samples`;
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape to clear selection
      if (e.key === 'Escape') {
        CohortStore.clearSelection();
        EventBus.emit('selection:clear', { source: 'keyboard' });
      }

      // Cmd/Ctrl+Shift+C to clear filters
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'C') {
        CohortStore.clearFilters();
      }
    });
  }

  private showLoading(show: boolean): void {
    if (!this.loadingElement) {
      this.loadingElement = document.getElementById('loading');
    }

    if (this.loadingElement) {
      this.loadingElement.style.display = show ? 'flex' : 'none';
    }

    // Show main content
    const main = document.getElementById('main-content');
    if (main) {
      main.style.display = show ? 'none' : 'block';
    }
  }

  private showError(message: string): void {
    this.showLoading(false);

    if (!this.errorElement) {
      this.errorElement = document.createElement('div');
      this.errorElement.className = 'error-message';
      document.body.appendChild(this.errorElement);
    }

    this.errorElement.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <span>${message}</span>
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
    this.errorElement.style.display = 'block';
  }

  /**
   * Destroy all components
   */
  destroy(): void {
    this.lollipopPlot?.destroy();
    this.filterPanel?.destroy();
    this.sampleTable?.destroy();
    this.mutationSummary?.destroy();
  }
}

// Initialize app when DOM is ready
const app = new LinkedPortalApp();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}

// Export for debugging
(window as any).LinkedPortal = {
  app,
  EventBus,
  CohortStore,
};
