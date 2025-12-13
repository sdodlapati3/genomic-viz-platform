/**
 * GenomicEmbed - Main Embed API Component
 * 
 * This component implements a ProteinPaint-style embed API
 * that takes a typed configuration and renders the appropriate visualization.
 * 
 * Usage:
 * ```typescript
 * const embed = new GenomicEmbed({
 *   entrypoint: 'gene',
 *   gene: 'TP53',
 *   showDomains: true,
 * });
 * embed.render(document.getElementById('container'));
 * ```
 */

import * as d3 from 'd3';
import {
  EmbedConfig,
  GeneViewConfig,
  SampleMatrixConfig,
  SurvivalPlotConfig,
  HeatmapConfig,
  VolcanoPlotConfig,
  parseEmbedConfig,
  validateEmbedConfig,
} from './config.schema';

// Import visualization renderers (these would be the actual implementations)
import { renderLollipopPlot } from '../visualizations/lollipop';
import { renderSampleMatrix } from '../visualizations/sampleMatrix';
import { renderSurvivalPlot } from '../visualizations/survival';
import { renderHeatmap } from '../visualizations/heatmap';
import { renderVolcanoPlot } from '../visualizations/volcano';

/**
 * GenomicEmbed class - Main entry point for embed API
 */
export class GenomicEmbed {
  private config: EmbedConfig;
  private container: HTMLElement | null = null;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private data: unknown = null;
  private loading = false;
  private error: Error | null = null;
  private onUpdate: ((config: EmbedConfig) => void)[] = [];
  private onError: ((error: Error) => void)[] = [];

  /**
   * Create a new GenomicEmbed instance
   * @param config - Embed configuration (will be validated)
   */
  constructor(config: unknown) {
    const validation = validateEmbedConfig(config);
    
    if (!validation.success) {
      const errorMsg = validation.errors
        ?.map(e => `${e.path}: ${e.message}`)
        .join('\n');
      throw new Error(`Invalid embed configuration:\n${errorMsg}`);
    }
    
    this.config = validation.data!;
    
    if (this.config.debug) {
      console.log('[GenomicEmbed] Initialized with config:', this.config);
    }
  }

  /**
   * Render the visualization to a container
   * @param container - DOM element or CSS selector
   */
  async render(container: HTMLElement | string): Promise<void> {
    // Resolve container
    if (typeof container === 'string') {
      const el = document.querySelector(container);
      if (!el || !(el instanceof HTMLElement)) {
        throw new Error(`Container not found: ${container}`);
      }
      this.container = el;
    } else {
      this.container = container;
    }

    // Clear existing content
    this.container.innerHTML = '';
    
    // Show loading state
    this.setLoading(true);

    try {
      // Fetch data based on entrypoint
      this.data = await this.fetchData();
      
      // Render the visualization
      await this.renderVisualization();
      
      this.setLoading(false);
    } catch (error) {
      this.setLoading(false);
      this.setError(error as Error);
      throw error;
    }
  }

  /**
   * Update configuration and re-render
   * @param partialConfig - Partial configuration to merge
   */
  async update(partialConfig: Partial<EmbedConfig>): Promise<void> {
    const newConfig = { ...this.config, ...partialConfig };
    const validation = validateEmbedConfig(newConfig);
    
    if (!validation.success) {
      throw new Error(`Invalid configuration update: ${JSON.stringify(validation.errors)}`);
    }
    
    this.config = validation.data!;
    
    // Notify listeners
    this.onUpdate.forEach(cb => cb(this.config));
    
    // Re-render if container exists
    if (this.container) {
      await this.render(this.container);
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): EmbedConfig {
    return { ...this.config };
  }

  /**
   * Serialize configuration to URL-safe string
   */
  toUrlParams(): string {
    const params = new URLSearchParams();
    params.set('config', btoa(JSON.stringify(this.config)));
    return params.toString();
  }

  /**
   * Create embed from URL parameters
   */
  static fromUrlParams(urlParams: string): GenomicEmbed {
    const params = new URLSearchParams(urlParams);
    const configStr = params.get('config');
    
    if (!configStr) {
      throw new Error('No config parameter found in URL');
    }
    
    const config = JSON.parse(atob(configStr));
    return new GenomicEmbed(config);
  }

  /**
   * Get shareable URL for current state
   */
  getShareableUrl(): string {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?${this.toUrlParams()}`;
  }

  /**
   * Subscribe to configuration updates
   */
  onConfigUpdate(callback: (config: EmbedConfig) => void): () => void {
    this.onUpdate.push(callback);
    return () => {
      this.onUpdate = this.onUpdate.filter(cb => cb !== callback);
    };
  }

  /**
   * Subscribe to errors
   */
  onErrorOccurred(callback: (error: Error) => void): () => void {
    this.onError.push(callback);
    return () => {
      this.onError = this.onError.filter(cb => cb !== callback);
    };
  }

  /**
   * Destroy the embed instance
   */
  destroy(): void {
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.container = null;
    this.svg = null;
    this.data = null;
    this.onUpdate = [];
    this.onError = [];
  }

  // ============================================
  // Private Methods
  // ============================================

  private async fetchData(): Promise<unknown> {
    const { entrypoint } = this.config;
    
    switch (entrypoint) {
      case 'gene':
        return this.fetchGeneData(this.config as GeneViewConfig);
      case 'samplematrix':
        return this.fetchSampleMatrixData(this.config as SampleMatrixConfig);
      case 'survival':
        return this.fetchSurvivalData(this.config as SurvivalPlotConfig);
      case 'heatmap':
        return this.fetchHeatmapData(this.config as HeatmapConfig);
      case 'volcano':
        return this.fetchVolcanoData(this.config as VolcanoPlotConfig);
      default:
        throw new Error(`Unknown entrypoint: ${entrypoint}`);
    }
  }

  private async fetchGeneData(config: GeneViewConfig): Promise<unknown> {
    // In production, this would call the API
    // For now, return mock data
    const response = await fetch(`/api/genes/${config.gene}/lollipop`);
    if (!response.ok) {
      // Return mock data for demo
      return {
        gene: {
          symbol: config.gene,
          name: `${config.gene} Gene`,
          chromosome: 'chr17',
          proteinLength: 393,
        },
        mutations: [
          { position: 175, count: 12, type: 'missense', aaChange: 'R175H' },
          { position: 248, count: 18, type: 'missense', aaChange: 'R248Q' },
          { position: 273, count: 15, type: 'missense', aaChange: 'R273H' },
        ],
        domains: [
          { name: 'Transactivation', start: 1, end: 43, color: '#3498db' },
          { name: 'DNA-binding', start: 94, end: 292, color: '#e74c3c' },
          { name: 'Tetramerization', start: 324, end: 355, color: '#2ecc71' },
        ],
      };
    }
    return response.json();
  }

  private async fetchSampleMatrixData(config: SampleMatrixConfig): Promise<unknown> {
    // Mock data for sample matrix
    return {
      genes: config.genes,
      samples: config.samples.length > 0 ? config.samples : ['S001', 'S002', 'S003', 'S004', 'S005'],
      matrix: config.genes.map(gene => 
        (config.samples.length > 0 ? config.samples : ['S001', 'S002', 'S003', 'S004', 'S005']).map(() => 
          Math.random() > 0.7 ? ['missense', 'nonsense', 'frameshift'][Math.floor(Math.random() * 3)] : null
        )
      ),
    };
  }

  private async fetchSurvivalData(config: SurvivalPlotConfig): Promise<unknown> {
    // Mock survival data
    return {
      curves: config.groups.map((group, i) => ({
        name: group.name,
        color: group.color || d3.schemeCategory10[i],
        data: this.generateMockSurvivalCurve(),
      })),
      logRankPValue: 0.023,
    };
  }

  private async fetchHeatmapData(config: HeatmapConfig): Promise<unknown> {
    // Mock heatmap data
    const genes = config.genes.length > 0 ? config.genes : 
      Array.from({ length: config.topN }, (_, i) => `Gene${i + 1}`);
    const samples = config.samples.length > 0 ? config.samples :
      Array.from({ length: 20 }, (_, i) => `Sample${i + 1}`);
    
    return {
      genes,
      samples,
      values: genes.map(() => samples.map(() => (Math.random() - 0.5) * 6)),
    };
  }

  private async fetchVolcanoData(config: VolcanoPlotConfig): Promise<unknown> {
    // Mock differential expression data
    return {
      group1: config.group1,
      group2: config.group2,
      genes: Array.from({ length: 1000 }, (_, i) => ({
        gene: `Gene${i + 1}`,
        log2FoldChange: (Math.random() - 0.5) * 8,
        pValue: Math.pow(10, -Math.random() * 10),
      })),
    };
  }

  private generateMockSurvivalCurve(): unknown[] {
    const data = [];
    let survival = 1;
    for (let time = 0; time <= 60; time += 6) {
      survival = survival * (0.85 + Math.random() * 0.1);
      data.push({
        time,
        survival: Math.max(0, survival),
        atRisk: Math.floor(100 * survival),
      });
    }
    return data;
  }

  private async renderVisualization(): Promise<void> {
    if (!this.container || !this.data) return;

    const { entrypoint, dimensions } = this.config;
    
    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', dimensions?.width || 800)
      .attr('height', dimensions?.height || 600)
      .attr('class', 'genomic-embed');

    switch (entrypoint) {
      case 'gene':
        renderLollipopPlot(this.svg, this.data, this.config as GeneViewConfig);
        break;
      case 'samplematrix':
        renderSampleMatrix(this.svg, this.data, this.config as SampleMatrixConfig);
        break;
      case 'survival':
        renderSurvivalPlot(this.svg, this.data, this.config as SurvivalPlotConfig);
        break;
      case 'heatmap':
        renderHeatmap(this.svg, this.data, this.config as HeatmapConfig);
        break;
      case 'volcano':
        renderVolcanoPlot(this.svg, this.data, this.config as VolcanoPlotConfig);
        break;
    }
  }

  private setLoading(loading: boolean): void {
    this.loading = loading;
    if (this.container) {
      if (loading) {
        this.container.innerHTML = `
          <div class="genomic-embed-loading">
            <div class="spinner"></div>
            <p>Loading visualization...</p>
          </div>
        `;
      }
    }
  }

  private setError(error: Error): void {
    this.error = error;
    this.onError.forEach(cb => cb(error));
    
    if (this.container) {
      this.container.innerHTML = `
        <div class="genomic-embed-error">
          <h3>Error Loading Visualization</h3>
          <p>${error.message}</p>
          <button onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }
}

/**
 * Factory function for creating embeds
 */
export function createEmbed(config: unknown): GenomicEmbed {
  return new GenomicEmbed(config);
}

/**
 * Initialize embed from URL if present
 */
export function initFromUrl(): GenomicEmbed | null {
  try {
    const urlParams = window.location.search.slice(1);
    if (urlParams.includes('config=')) {
      return GenomicEmbed.fromUrlParams(urlParams);
    }
  } catch (error) {
    console.error('[GenomicEmbed] Failed to initialize from URL:', error);
  }
  return null;
}

export default GenomicEmbed;
