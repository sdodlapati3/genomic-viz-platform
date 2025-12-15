/**
 * Config System - Main Application
 *
 * Demonstrates the configuration system with:
 * - Zod schema validation
 * - Config editor UI
 * - URL state persistence
 * - Migration system
 */

import './styles.css';
import { ConfigEditor } from './components';
import { getConfigStore, createAppConfigURLState } from './state';
import { MutationTrackSchema } from './schemas';
import { migrationRegistry } from './migrations';

// ============================================
// Initialize Application
// ============================================

function init(): void {
  setupLayout();
  setupConfigStore();
  setupEditor();
  setupDemos();
}

function setupLayout(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <header class="header">
      <h1>🔧 Config System Demo</h1>
      <p>Type-safe configuration with Zod validation, migrations, and URL persistence</p>
    </header>

    <div class="main-layout">
      <div class="sidebar">
        <div class="demo-section">
          <h3>Quick Actions</h3>
          <button class="btn btn-primary" id="demo-validate">Validate Sample Config</button>
          <button class="btn btn-secondary" id="demo-migrate">Test Migration</button>
          <button class="btn btn-secondary" id="demo-url">Generate Share URL</button>
          <button class="btn btn-secondary" id="demo-add-track">Add Sample Track</button>
        </div>

        <div class="demo-section">
          <h3>Validation Demo</h3>
          <div id="validation-output" class="output-box"></div>
        </div>

        <div class="demo-section">
          <h3>URL State</h3>
          <input type="text" id="url-output" class="url-input" readonly placeholder="Generated URL will appear here" />
          <button class="btn btn-small" id="copy-url">Copy</button>
        </div>
      </div>

      <div class="editor-container">
        <div id="config-editor"></div>
      </div>
    </div>

    <div class="info-section">
      <h3>About This Demo</h3>
      <div class="info-cards">
        <div class="info-card">
          <h4>📋 Zod Schemas</h4>
          <p>Type-safe configuration validation with descriptive error messages and automatic TypeScript type inference.</p>
        </div>
        <div class="info-card">
          <h4>🔄 Migrations</h4>
          <p>Version-aware configuration migrations ensure backward compatibility as schemas evolve.</p>
        </div>
        <div class="info-card">
          <h4>🔗 URL State</h4>
          <p>Serialize configuration to URL parameters for shareable links with embedded settings.</p>
        </div>
        <div class="info-card">
          <h4>⏪ History</h4>
          <p>Undo/redo support with configurable history size for easy experimentation.</p>
        </div>
      </div>
    </div>
  `;
}

function setupConfigStore(): void {
  // Initialize store (will load from localStorage if available)
  getConfigStore();
}

function setupEditor(): void {
  const container = document.getElementById('config-editor');
  if (!container) return;

  new ConfigEditor({
    container,
    showValidation: true,
    showHistory: true,
    onChange: (config) => {
      console.log('Config changed:', config);
    },
  });
}

function setupDemos(): void {
  // Validate Sample Config
  document.getElementById('demo-validate')?.addEventListener('click', () => {
    demoValidation();
  });

  // Test Migration
  document.getElementById('demo-migrate')?.addEventListener('click', () => {
    demoMigration();
  });

  // Generate URL
  document.getElementById('demo-url')?.addEventListener('click', () => {
    demoURLState();
  });

  // Add Track
  document.getElementById('demo-add-track')?.addEventListener('click', () => {
    demoAddTrack();
  });

  // Copy URL
  document.getElementById('copy-url')?.addEventListener('click', () => {
    const input = document.getElementById('url-output') as HTMLInputElement;
    if (input?.value) {
      navigator.clipboard.writeText(input.value);
      alert('URL copied to clipboard!');
    }
  });
}

// ============================================
// Demo Functions
// ============================================

function demoValidation(): void {
  const output = document.getElementById('validation-output');
  if (!output) return;

  // Test valid config
  const validTrack = {
    id: 'track-1',
    name: 'TP53 Mutations',
    type: 'mutation' as const,
    gene: 'TP53',
    data: {
      source: 'inline' as const,
      mutations: [
        { position: 175, aaChange: 'R175H', consequence: 'missense' as const },
        { position: 248, aaChange: 'R248W', consequence: 'missense' as const },
      ],
    },
    display: {
      lollipopRadius: 5,
      colorByConsequence: true,
    },
  };

  // Validate the track
  MutationTrackSchema.parse(validTrack);

  // Test invalid config
  const invalidTrack = {
    id: '', // Invalid: empty string
    name: 'Test Track',
    type: 'mutation',
    gene: '', // Invalid: empty string
    data: {
      source: 'invalid', // Invalid: not in enum
    },
  };

  const invalidResult = MutationTrackSchema.safeParse(invalidTrack);

  output.innerHTML = `
    <div class="validation-result success">
      <strong>✓ Valid Track Config:</strong>
      <pre>${JSON.stringify(validTrack, null, 2)}</pre>
    </div>
    
    <div class="validation-result error">
      <strong>✗ Invalid Track Config:</strong>
      <pre>${JSON.stringify(invalidTrack, null, 2)}</pre>
      <strong>Errors:</strong>
      <pre>${invalidResult.success ? 'None' : JSON.stringify(invalidResult.error.issues, null, 2)}</pre>
    </div>
  `;
}

function demoMigration(): void {
  const output = document.getElementById('validation-output');
  if (!output) return;

  // Old config format (v1.0.0)
  const oldConfig = {
    version: '1.0.0',
    name: 'My Visualization',
    tracks: [
      { id: 'track-1', name: 'Mutations', type: 'mutation', gene: 'TP53', data: { source: 'api' } },
    ],
  };

  // Run migrations
  const result = migrationRegistry.migrate(oldConfig, '1.0.0', '2.0.0');

  output.innerHTML = `
    <div class="migration-result">
      <h4>Migration Test: 1.0.0 → 2.0.0</h4>
      
      <div class="migration-step">
        <strong>Input (v1.0.0):</strong>
        <pre>${JSON.stringify(oldConfig, null, 2)}</pre>
      </div>
      
      <div class="migration-step">
        <strong>Result:</strong>
        <span class="${result.success ? 'success' : 'error'}">
          ${result.success ? '✓ Success' : '✗ Failed'}
        </span>
      </div>
      
      <div class="migration-step">
        <strong>Migrations Applied:</strong>
        <ul>
          ${result.migrationsApplied.map((m) => `<li>${m}</li>`).join('')}
        </ul>
      </div>
      
      <div class="migration-step">
        <strong>Output (v2.0.0):</strong>
        <pre>${JSON.stringify(result.config, null, 2)}</pre>
      </div>
    </div>
  `;
}

function demoURLState(): void {
  const urlOutput = document.getElementById('url-output') as HTMLInputElement;
  if (!urlOutput) return;

  const store = getConfigStore();
  const urlState = createAppConfigURLState();

  try {
    const url = urlState.generateURL(store.get());
    urlOutput.value = url;
  } catch (error) {
    urlOutput.value = `Error: ${error}`;
  }
}

function demoAddTrack(): void {
  const store = getConfigStore();
  const config = store.get();

  // Add a sample mutation track
  const newTrack = {
    id: `track-${Date.now()}`,
    name: 'Demo Mutation Track',
    type: 'mutation' as const,
    visible: true,
    height: 100,
    gene: 'TP53',
    data: {
      source: 'inline' as const,
      mutations: [
        { position: 175, aaChange: 'R175H', consequence: 'missense' as const, count: 50 },
        { position: 248, aaChange: 'R248W', consequence: 'missense' as const, count: 35 },
        { position: 273, aaChange: 'R273H', consequence: 'missense' as const, count: 28 },
      ],
    },
    display: {
      lollipopRadius: 5,
      stemWidth: 1,
      colorByConsequence: true,
      showLabels: false,
      labelThreshold: 5,
    },
  };

  // Add to first view
  if (config.layout.views.length > 0) {
    const updatedViews = [...config.layout.views];
    updatedViews[0] = {
      ...updatedViews[0],
      tracks: [...updatedViews[0].tracks, newTrack],
    };

    store.set({ layout: { ...config.layout, views: updatedViews } }, 'Added demo track');
    alert('Demo track added! Check the Tracks tab.');
  }
}

// ============================================
// Initialize
// ============================================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
