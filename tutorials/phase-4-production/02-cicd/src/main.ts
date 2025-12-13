/**
 * Main Application Entry Point
 * CI/CD Demo for Genomic Visualization Platform
 */

import { createBarChart } from './components/BarChart';
import { validateData, processGeneData } from './utils/dataTransform';
import { sampleGeneData } from './data/sampleData';
import './styles/main.css';

// Type declarations for environment variables
declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;

interface AppConfig {
  version: string;
  buildDate: string;
  environment: string;
}

/**
 * Application configuration
 */
const config: AppConfig = {
  version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
  buildDate: typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : new Date().toISOString(),
  environment: import.meta.env.MODE || 'development',
};

// Get D3 version safely
const d3Version = '7.x';

/**
 * Initialize application
 */
async function initApp(): Promise<void> {
  console.log(`🚀 Starting Genomic Viz Platform v${config.version}`);
  console.log(`📅 Build date: ${config.buildDate}`);
  console.log(`🌍 Environment: ${config.environment}`);

  // Update version display
  updateBuildInfo();

  // Initialize pipeline status display
  renderPipelineStatus();

  // Render sample visualization
  await renderVisualization();
}

/**
 * Update build information in UI
 */
function updateBuildInfo(): void {
  const versionEl = document.getElementById('version');
  const buildDateEl = document.getElementById('build-date');
  const buildDetailsEl = document.getElementById('build-details');

  if (versionEl) {
    versionEl.textContent = config.version;
  }

  if (buildDateEl) {
    const date = new Date(config.buildDate);
    buildDateEl.textContent = date.toLocaleString();
  }

  if (buildDetailsEl) {
    buildDetailsEl.innerHTML = `
      <dl>
        <dt>Version</dt>
        <dd>${config.version}</dd>
        <dt>Build Date</dt>
        <dd>${config.buildDate}</dd>
        <dt>Environment</dt>
        <dd>${config.environment}</dd>
        <dt>D3 Version</dt>
        <dd>${d3Version}</dd>
      </dl>
    `;
  }
}

/**
 * Render CI/CD pipeline status visualization
 */
function renderPipelineStatus(): void {
  const container = document.getElementById('status-container');
  if (!container) return;

  const stages = [
    { name: 'Lint', status: 'success', icon: '🔍' },
    { name: 'Test', status: 'success', icon: '🧪' },
    { name: 'Build', status: 'success', icon: '📦' },
    { name: 'Security', status: 'success', icon: '🔐' },
    { name: 'Deploy', status: 'pending', icon: '🚀' },
  ];

  const statusHtml = `
    <div class="pipeline-stages">
      ${stages
        .map(
          (stage, index) => `
        <div class="pipeline-stage ${stage.status}">
          <span class="stage-icon">${stage.icon}</span>
          <span class="stage-name">${stage.name}</span>
          <span class="stage-status">${getStatusIcon(stage.status)}</span>
        </div>
        ${index < stages.length - 1 ? '<span class="stage-connector">→</span>' : ''}
      `
        )
        .join('')}
    </div>
  `;

  container.innerHTML = statusHtml;
}

/**
 * Get status icon for pipeline stage
 */
function getStatusIcon(status: string): string {
  switch (status) {
    case 'success':
      return '✅';
    case 'failure':
      return '❌';
    case 'pending':
      return '⏳';
    case 'running':
      return '🔄';
    default:
      return '⚪';
  }
}

/**
 * Render sample D3 visualization
 */
async function renderVisualization(): Promise<void> {
  const container = document.getElementById('chart-container');
  if (!container) return;

  try {
    // Validate and process data
    const validatedData = validateData(sampleGeneData);
    const processedData = processGeneData(validatedData);

    // Create chart
    createBarChart(container, processedData, {
      width: 600,
      height: 300,
      margin: { top: 20, right: 20, bottom: 40, left: 60 },
      title: 'Gene Expression Levels',
      xLabel: 'Gene',
      yLabel: 'Expression (TPM)',
    });

    console.log('✅ Visualization rendered successfully');
  } catch (error) {
    console.error('❌ Error rendering visualization:', error);
    container.innerHTML = `
      <div class="error-message">
        <p>Error loading visualization</p>
        <code>${error instanceof Error ? error.message : 'Unknown error'}</code>
      </div>
    `;
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export for testing
export { config, initApp, updateBuildInfo, renderPipelineStatus };
