/**
 * Oncoprint Demo - Main Entry Point
 */

import { Oncoprint } from './Oncoprint';
import { Legend } from './Legend';
import { generateDemoData, sortOncoprintData } from './data';
import type { ConsequenceType, SortConfig, OncoprintData } from './types';
import './styles.css';

class OncoprintApp {
  private oncoprint: Oncoprint | null = null;
  private legend: Legend | null = null;
  private data: OncoprintData | null = null;
  private sortConfig: SortConfig = { field: 'frequency', direction: 'desc' };

  async init(): Promise<void> {
    console.log('🧬 Oncoprint initializing...');

    this.showLoading(true);

    try {
      // Generate demo data
      this.data = generateDemoData();
      console.log(
        `Loaded ${this.data.totalMutations} mutations across ${this.data.genes.length} genes and ${this.data.samples.length} samples`
      );

      // Initialize components
      this.initOncoprint();
      this.initLegend();
      this.setupControls();

      this.showLoading(false);
      this.updateStatus(
        `Showing ${this.data.genes.length} genes × ${this.data.samples.length} samples`
      );

      console.log('✅ Oncoprint ready');
    } catch (error) {
      console.error('Failed to initialize:', error);
      this.showError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private initOncoprint(): void {
    if (!this.data) return;

    this.oncoprint = new Oncoprint('#oncoprint-container', {
      width: 1000,
      height: 400,
      cellWidth: 14,
      cellHeight: 22,
      showAnnotations: true,
      showFrequency: true,
      enableZoom: true,
    });

    // Set callbacks
    this.oncoprint.onSelection((genes, samples) => {
      console.log('Selection:', { genes, samples });
      this.updateStatus(`Selected: ${genes.length} genes, ${samples.length} samples`);
    });

    this.oncoprint.onHoverCell((cell) => {
      if (cell) {
        this.updateStatus(
          `Hovering: ${cell.gene} - ${cell.sampleId} (${cell.mutations.length} mutations)`
        );
      }
    });

    // Sort and render
    const sortedData = sortOncoprintData(this.data, this.sortConfig);
    this.oncoprint.setData(sortedData);
  }

  private initLegend(): void {
    if (!this.data) return;

    this.legend = new Legend('#legend', {
      orientation: 'horizontal',
      showCounts: true,
    });

    // Count mutations by type
    const counts = new Map<ConsequenceType, number>();
    for (const gene of this.data.genes) {
      for (const cell of gene.cells) {
        for (const mut of cell.mutations) {
          counts.set(mut.type, (counts.get(mut.type) || 0) + 1);
        }
      }
    }

    this.legend.setCounts(counts);
  }

  private setupControls(): void {
    // Sort dropdown
    const sortSelect = document.getElementById('sort-by') as HTMLSelectElement;
    if (sortSelect) {
      sortSelect.value = this.sortConfig.field;
      sortSelect.addEventListener('change', () => {
        this.sortConfig.field = sortSelect.value as SortConfig['field'];
        this.updateSort();
      });
    }

    // Filter dropdown
    const filterSelect = document.getElementById('filter-type') as HTMLSelectElement;
    if (filterSelect) {
      filterSelect.addEventListener('change', () => {
        // TODO: Implement filtering
        console.log('Filter:', filterSelect.value);
      });
    }

    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.oncoprint?.reset();
        this.updateStatus('View reset');
      });
    }
  }

  private updateSort(): void {
    if (!this.data || !this.oncoprint) return;

    const sortedData = sortOncoprintData(this.data, this.sortConfig);
    this.oncoprint.setData(sortedData);
  }

  private showLoading(show: boolean): void {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = show ? 'flex' : 'none';
    }
  }

  private showError(message: string): void {
    this.showLoading(false);
    const error = document.getElementById('error');
    if (error) {
      error.style.display = 'block';
      error.textContent = `Error: ${message}`;
    }
  }

  private updateStatus(message: string): void {
    const status = document.getElementById('status');
    if (status) {
      status.textContent = message;
    }
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new OncoprintApp();
  app.init();
});
