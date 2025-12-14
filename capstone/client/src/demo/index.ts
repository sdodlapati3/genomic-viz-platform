/**
 * Demo Integration - Ties all visualization components together
 * Demonstrates ProteinPaint-style embed pattern
 */

import * as d3 from 'd3';
import { GenomicEmbed, EmbedConfig } from '../embed';
import { GenomeBrowser } from '../components/GenomeBrowser';
import { ConfigEditor } from '../components/ConfigEditor';
import { StudyView } from '../components/StudyView';
import { renderLollipop } from '../visualizations/lollipop';
import { renderSampleMatrix } from '../visualizations/sampleMatrix';
import { renderSurvival } from '../visualizations/survival';
import { renderHeatmap } from '../visualizations/heatmap';
import { renderVolcano } from '../visualizations/volcano';

/**
 * Demo Application State
 */
interface DemoState {
  currentSection: string;
  embedInstance: GenomicEmbed | null;
  genomeBrowser: GenomeBrowser | null;
  configEditor: ConfigEditor | null;
  studyView: StudyView | null;
}

/**
 * Initialize demo application
 */
export function initDemo(): void {
  const state: DemoState = {
    currentSection: 'overview',
    embedInstance: null,
    genomeBrowser: null,
    configEditor: null,
    studyView: null,
  };

  // Setup navigation
  setupNavigation(state);

  // Check URL for initial config
  loadFromUrl(state);

  // Initialize default section
  showSection(state, 'overview');
}

/**
 * Setup navigation click handlers
 */
function setupNavigation(state: DemoState): void {
  const navButtons = document.querySelectorAll('nav button');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const section = (btn as HTMLElement).dataset.section;
      if (section) {
        showSection(state, section);
        updateNavButtons(section);
      }
    });
  });
}

/**
 * Update navigation button states
 */
function updateNavButtons(activeSection: string): void {
  document.querySelectorAll('nav button').forEach(btn => {
    const isActive = (btn as HTMLElement).dataset.section === activeSection;
    btn.classList.toggle('active', isActive);
  });
}

/**
 * Show a specific section
 */
function showSection(state: DemoState, sectionId: string): void {
  // Hide all sections
  document.querySelectorAll('.demo-section').forEach(s => {
    s.classList.remove('active');
  });

  // Show target section
  const section = document.getElementById(sectionId);
  if (section) {
    section.classList.add('active');
  }

  state.currentSection = sectionId;

  // Initialize section-specific content
  initializeSectionContent(state, sectionId);
}

/**
 * Initialize content for a specific section
 */
function initializeSectionContent(state: DemoState, sectionId: string): void {
  switch (sectionId) {
    case 'lollipop':
      initLollipopDemo(state);
      break;
    case 'browser':
      initBrowserDemo(state);
      break;
    case 'matrix':
      initMatrixDemo(state);
      break;
    case 'survival':
      initSurvivalDemo(state);
      break;
    case 'heatmap':
      initHeatmapDemo(state);
      break;
    case 'volcano':
      initVolcanoDemo(state);
      break;
    case 'studyview':
      initStudyViewDemo(state);
      break;
    case 'config':
      initConfigDemo(state);
      break;
  }
}

/**
 * Initialize Lollipop Plot Demo
 */
function initLollipopDemo(state: DemoState): void {
  const container = document.getElementById('lollipop-viz');
  if (!container || container.classList.contains('initialized')) return;

  // Get controls
  const geneSelect = document.getElementById('lollipop-gene') as HTMLSelectElement;
  const domainsCheck = document.getElementById('lollipop-domains') as HTMLInputElement;

  // Create render function
  const render = () => {
    container.innerHTML = '';
    const svg = d3.select(container)
      .append('svg')
      .attr('width', 800)
      .attr('height', 400);

    // Use embed pattern
    const config: EmbedConfig = {
      entrypoint: 'gene',
      gene: geneSelect.value,
      genome: 'hg38',
      showDomains: domainsCheck.checked,
      dimensions: { width: 800, height: 400 }
    };

    state.embedInstance = new GenomicEmbed(config);
    state.embedInstance.render('#lollipop-viz');
  };

  // Wire up render button
  const renderBtn = container.closest('.card')?.querySelector('.btn-primary');
  renderBtn?.addEventListener('click', render);

  // Wire up share button
  const shareBtn = container.closest('.card')?.querySelector('.btn-secondary');
  shareBtn?.addEventListener('click', () => {
    if (state.embedInstance) {
      const url = state.embedInstance.getShareableUrl();
      navigator.clipboard.writeText(url);
      alert('URL copied to clipboard!');
    }
  });

  // Initial render
  render();
  container.classList.add('initialized', 'loaded');
}

/**
 * Initialize Genome Browser Demo
 */
function initBrowserDemo(state: DemoState): void {
  const container = document.getElementById('browser-viz');
  if (!container || container.classList.contains('initialized')) return;

  // Create browser
  state.genomeBrowser = new GenomeBrowser({
    container: '#browser-viz',
    width: 900,
    height: 450,
    genome: 'hg38',
    initialRegion: {
      chromosome: 'chr17',
      start: 7668421,
      end: 7687490
    },
    tracks: [
      {
        id: 'genes',
        type: 'gene',
        label: 'RefSeq Genes',
        height: 100,
        color: '#2196F3'
      },
      {
        id: 'mutations',
        type: 'mutation',
        label: 'COSMIC Mutations',
        height: 60,
        color: '#f44336'
      }
    ]
  });

  // Wire up controls
  const chrSelect = document.getElementById('browser-chr') as HTMLSelectElement;
  const posInput = document.getElementById('browser-pos') as HTMLInputElement;

  const goBtn = document.querySelector('[onclick*="navigateBrowser"]');
  if (goBtn) {
    goBtn.removeAttribute('onclick');
    goBtn.addEventListener('click', () => {
      const chr = chrSelect.value;
      const [start, end] = posInput.value.split('-').map(Number);
      state.genomeBrowser?.navigateTo(chr, start, end);
    });
  }

  // Wire up zoom buttons
  document.querySelectorAll('[onclick*="zoomBrowser"]').forEach(btn => {
    const factor = btn.getAttribute('onclick')?.includes('2') ? 2 : 0.5;
    btn.removeAttribute('onclick');
    btn.addEventListener('click', () => {
      state.genomeBrowser?.zoom(factor);
    });
  });

  container.classList.add('initialized', 'loaded');
}

/**
 * Initialize Sample Matrix Demo
 */
function initMatrixDemo(state: DemoState): void {
  const container = document.getElementById('matrix-viz');
  if (!container || container.classList.contains('initialized')) return;

  const render = () => {
    container.innerHTML = '';

    // Generate mock data
    const genes = ['TP53', 'EGFR', 'KRAS', 'BRAF', 'PIK3CA', 'PTEN', 'APC', 'RB1'];
    const samples = Array.from({ length: 25 }, (_, i) => `SAMPLE_${i + 1}`);
    const mutationTypes = ['missense', 'nonsense', 'frameshift', 'splice'];

    const mutations = [];
    for (const gene of genes) {
      for (const sample of samples) {
        if (Math.random() > 0.7) {
          mutations.push({
            gene,
            sample,
            type: mutationTypes[Math.floor(Math.random() * mutationTypes.length)],
            vaf: 0.1 + Math.random() * 0.4
          });
        }
      }
    }

    renderSampleMatrix({
      container: '#matrix-viz',
      width: 850,
      height: 400,
      data: {
        genes,
        samples,
        mutations
      },
      colorScheme: {
        missense: '#2196F3',
        nonsense: '#f44336',
        frameshift: '#FF9800',
        splice: '#9C27B0'
      }
    });
  };

  // Wire up render button
  const renderBtn = container.closest('.card')?.querySelector('.btn-primary');
  renderBtn?.addEventListener('click', render);

  render();
  container.classList.add('initialized', 'loaded');
}

/**
 * Initialize Survival Demo
 */
function initSurvivalDemo(state: DemoState): void {
  const container = document.getElementById('survival-viz');
  if (!container || container.classList.contains('initialized')) return;

  const render = () => {
    container.innerHTML = '';

    const showCI = (document.getElementById('survival-ci') as HTMLInputElement)?.checked ?? true;
    const showAtRisk = (document.getElementById('survival-atrisk') as HTMLInputElement)?.checked ?? true;

    // Generate Kaplan-Meier data
    const generateGroup = (name: string, medianSurvival: number) => {
      const patients = [];
      for (let i = 0; i < 50; i++) {
        const time = Math.floor(-medianSurvival * Math.log(Math.random()));
        const event = Math.random() > 0.2 ? 1 : 0;
        patients.push({ time: Math.min(time, 120), event });
      }
      return { name, patients };
    };

    const data = {
      groups: [
        generateGroup('TP53 Mutant', 18),
        generateGroup('TP53 Wild-type', 36)
      ]
    };

    renderSurvival({
      container: '#survival-viz',
      width: 700,
      height: 400,
      data,
      showConfidenceInterval: showCI,
      showAtRiskTable: showAtRisk,
      colors: ['#e74c3c', '#3498db']
    });
  };

  // Wire up render button
  const renderBtn = container.closest('.card')?.querySelector('.btn-primary');
  renderBtn?.addEventListener('click', render);

  render();
  container.classList.add('initialized', 'loaded');
}

/**
 * Initialize Heatmap Demo
 */
function initHeatmapDemo(state: DemoState): void {
  const container = document.getElementById('heatmap-viz');
  if (!container || container.classList.contains('initialized')) return;

  const render = () => {
    container.innerHTML = '';

    const topN = parseInt((document.getElementById('heatmap-topn') as HTMLInputElement)?.value ?? '30');
    const colorScale = (document.getElementById('heatmap-color') as HTMLSelectElement)?.value ?? 'RdBu';
    const cluster = (document.getElementById('heatmap-cluster') as HTMLInputElement)?.checked ?? true;

    // Generate mock expression data
    const genes = Array.from({ length: topN }, (_, i) => `GENE_${i + 1}`);
    const samples = Array.from({ length: 20 }, (_, i) => `SAMPLE_${i + 1}`);

    const expression: number[][] = [];
    for (let i = 0; i < genes.length; i++) {
      const row = [];
      for (let j = 0; j < samples.length; j++) {
        row.push(Math.random() * 4 - 2); // z-scores between -2 and 2
      }
      expression.push(row);
    }

    renderHeatmap({
      container: '#heatmap-viz',
      width: 800,
      height: 500,
      data: { genes, samples, expression },
      colorScale,
      cluster
    });
  };

  // Wire up render button
  const renderBtn = container.closest('.card')?.querySelector('.btn-primary');
  renderBtn?.addEventListener('click', render);

  render();
  container.classList.add('initialized', 'loaded');
}

/**
 * Initialize Volcano Plot Demo
 */
function initVolcanoDemo(state: DemoState): void {
  const container = document.getElementById('volcano-viz');
  if (!container || container.classList.contains('initialized')) return;

  const render = () => {
    container.innerHTML = '';

    const pvalThreshold = parseFloat((document.getElementById('volcano-pval') as HTMLSelectElement)?.value ?? '0.05');
    const fcThreshold = parseFloat((document.getElementById('volcano-fc') as HTMLSelectElement)?.value ?? '2');
    const showLabels = (document.getElementById('volcano-labels') as HTMLInputElement)?.checked ?? true;

    // Generate mock differential expression data
    const points = [];
    for (let i = 0; i < 500; i++) {
      const log2FC = (Math.random() - 0.5) * 6;
      const pValue = Math.pow(10, -Math.random() * 10);
      points.push({
        gene: `GENE_${i + 1}`,
        log2FoldChange: log2FC,
        pValue,
        negLog10P: -Math.log10(pValue)
      });
    }

    // Add some significant genes
    const significantGenes = ['TP53', 'EGFR', 'MYC', 'BRCA1', 'KRAS'];
    significantGenes.forEach((gene, i) => {
      points.push({
        gene,
        log2FoldChange: (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2),
        pValue: Math.pow(10, -5 - Math.random() * 5),
        negLog10P: 5 + Math.random() * 5
      });
    });

    renderVolcano({
      container: '#volcano-viz',
      width: 700,
      height: 500,
      data: points,
      pValueThreshold: pvalThreshold,
      foldChangeThreshold: Math.log2(fcThreshold),
      showLabels
    });
  };

  // Wire up render button
  const renderBtn = container.closest('.card')?.querySelector('.btn-primary');
  renderBtn?.addEventListener('click', render);

  render();
  container.classList.add('initialized', 'loaded');
}

/**
 * Initialize Study View Demo
 */
function initStudyViewDemo(state: DemoState): void {
  const container = document.getElementById('studyview-viz');
  if (!container || container.classList.contains('initialized')) return;

  state.studyView = new StudyView({
    container: '#studyview-viz',
    width: 1200,
    height: 600
  });

  container.classList.add('initialized', 'loaded');
}

/**
 * Initialize Config Editor Demo
 */
function initConfigDemo(state: DemoState): void {
  const editorContainer = document.getElementById('config-editor');
  const previewContainer = document.getElementById('config-preview');

  if (!editorContainer || editorContainer.classList.contains('initialized')) return;

  state.configEditor = new ConfigEditor({
    container: '#config-editor',
    width: 500,
    height: 400,
    onConfigChange: (config) => {
      // Update preview
      if (previewContainer) {
        try {
          previewContainer.innerHTML = '';
          previewContainer.classList.add('loaded');

          // Render visualization based on config type
          const embed = new GenomicEmbed(config);
          embed.render('#config-preview');
        } catch (e) {
          previewContainer.innerHTML = `<div style="color: #e74c3c; padding: 20px;">Error: ${e}</div>`;
        }
      }
    }
  });

  editorContainer.classList.add('initialized');
}

/**
 * Load configuration from URL
 */
function loadFromUrl(state: DemoState): void {
  const urlParams = new URLSearchParams(window.location.search);

  // Check for config parameter
  if (urlParams.has('config')) {
    try {
      const encoded = urlParams.get('config')!;
      const config = JSON.parse(atob(encoded)) as EmbedConfig;

      // Determine which section to show based on config
      if (config.entrypoint === 'gene') {
        showSection(state, 'lollipop');
        updateNavButtons('lollipop');
      } else if (config.entrypoint === 'browser') {
        showSection(state, 'browser');
        updateNavButtons('browser');
      }

      // Apply config
      setTimeout(() => {
        if (state.embedInstance) {
          state.embedInstance = new GenomicEmbed(config);
        }
      }, 100);

    } catch (e) {
      console.error('Failed to parse config from URL:', e);
    }
  }

  // Check for section parameter
  if (urlParams.has('section')) {
    const section = urlParams.get('section')!;
    showSection(state, section);
    updateNavButtons(section);
  }
}

/**
 * Create shareable URL with current state
 */
export function createShareableUrl(config: EmbedConfig): string {
  const encoded = btoa(JSON.stringify(config));
  const url = new URL(window.location.href);
  url.searchParams.set('config', encoded);
  return url.toString();
}

// Auto-initialize when DOM is ready
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDemo);
  } else {
    initDemo();
  }
}
