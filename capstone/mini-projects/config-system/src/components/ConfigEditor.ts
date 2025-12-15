/**
 * Configuration Editor Component
 *
 * Interactive UI for editing configuration with
 * validation feedback and live preview.
 */

import { ConfigStore, getConfigStore } from '../state';
import type { AppConfig, Track, View } from '../schemas';

// ============================================
// Types
// ============================================

export interface ConfigEditorOptions {
  container: HTMLElement;
  store?: ConfigStore;
  readOnly?: boolean;
  showValidation?: boolean;
  showHistory?: boolean;
  onChange?: (config: AppConfig) => void;
}

interface TabDefinition {
  id: string;
  label: string;
  icon: string;
}

// ============================================
// Config Editor Component
// ============================================

export class ConfigEditor {
  private container: HTMLElement;
  private store: ConfigStore;
  private options: Required<Omit<ConfigEditorOptions, 'container' | 'store'>>;
  private currentTab: string = 'general';
  private unsubscribe?: () => void;

  constructor(options: ConfigEditorOptions) {
    this.container = options.container;
    this.store = options.store || getConfigStore();
    this.options = {
      readOnly: options.readOnly ?? false,
      showValidation: options.showValidation ?? true,
      showHistory: options.showHistory ?? true,
      onChange: options.onChange ?? (() => {}),
    };

    this.render();
    this.setupSubscriptions();
  }

  private setupSubscriptions(): void {
    this.unsubscribe = this.store.subscribe((config) => {
      this.options.onChange(config);
      this.updateValidationStatus();
    });
  }

  private render(): void {
    this.container.innerHTML = '';
    this.container.className = 'config-editor';

    // Create main structure
    const header = this.createHeader();
    const tabs = this.createTabs();
    const content = this.createContent();
    const footer = this.createFooter();

    this.container.appendChild(header);
    this.container.appendChild(tabs);
    this.container.appendChild(content);
    this.container.appendChild(footer);

    // Initial content render
    this.renderTabContent();
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'config-editor-header';

    header.innerHTML = `
      <h2>Configuration Editor</h2>
      <div class="header-actions">
        ${
          this.options.showHistory
            ? `
          <button class="btn btn-icon" id="undo-btn" title="Undo" ${!this.store.canUndo() ? 'disabled' : ''}>
            ↶
          </button>
          <button class="btn btn-icon" id="redo-btn" title="Redo" ${!this.store.canRedo() ? 'disabled' : ''}>
            ↷
          </button>
        `
            : ''
        }
        <button class="btn btn-secondary" id="import-btn">Import</button>
        <button class="btn btn-secondary" id="export-btn">Export</button>
        <button class="btn btn-danger" id="reset-btn">Reset</button>
      </div>
    `;

    // Event listeners
    header.querySelector('#undo-btn')?.addEventListener('click', () => {
      this.store.undo();
      this.renderTabContent();
      this.updateHistoryButtons();
    });

    header.querySelector('#redo-btn')?.addEventListener('click', () => {
      this.store.redo();
      this.renderTabContent();
      this.updateHistoryButtons();
    });

    header.querySelector('#import-btn')?.addEventListener('click', () => this.handleImport());
    header.querySelector('#export-btn')?.addEventListener('click', () => this.handleExport());
    header.querySelector('#reset-btn')?.addEventListener('click', () => this.handleReset());

    return header;
  }

  private createTabs(): HTMLElement {
    const tabs: TabDefinition[] = [
      { id: 'general', label: 'General', icon: '⚙️' },
      { id: 'layout', label: 'Layout', icon: '📐' },
      { id: 'tracks', label: 'Tracks', icon: '📊' },
      { id: 'preferences', label: 'Preferences', icon: '🎨' },
      { id: 'data', label: 'Data Sources', icon: '🔗' },
      { id: 'json', label: 'JSON', icon: '{ }' },
    ];

    const tabContainer = document.createElement('div');
    tabContainer.className = 'config-editor-tabs';

    tabs.forEach((tab) => {
      const tabEl = document.createElement('button');
      tabEl.className = `tab ${tab.id === this.currentTab ? 'active' : ''}`;
      tabEl.dataset.tab = tab.id;
      tabEl.innerHTML = `<span class="tab-icon">${tab.icon}</span> ${tab.label}`;
      tabEl.addEventListener('click', () => this.switchTab(tab.id));
      tabContainer.appendChild(tabEl);
    });

    return tabContainer;
  }

  private createContent(): HTMLElement {
    const content = document.createElement('div');
    content.className = 'config-editor-content';
    content.id = 'tab-content';
    return content;
  }

  private createFooter(): HTMLElement {
    const footer = document.createElement('div');
    footer.className = 'config-editor-footer';

    footer.innerHTML = `
      <div class="validation-status" id="validation-status">
        <span class="status-icon">✓</span>
        <span class="status-text">Configuration valid</span>
      </div>
      <div class="footer-info">
        Version: ${this.store.get().version}
      </div>
    `;

    return footer;
  }

  private switchTab(tabId: string): void {
    this.currentTab = tabId;

    // Update tab buttons
    this.container.querySelectorAll('.tab').forEach((tab) => {
      const htmlTab = tab as HTMLElement;
      htmlTab.classList.toggle('active', htmlTab.dataset.tab === tabId);
    });

    this.renderTabContent();
  }

  private renderTabContent(): void {
    const content = this.container.querySelector('#tab-content');
    if (!content) return;

    const config = this.store.get();

    switch (this.currentTab) {
      case 'general':
        content.innerHTML = this.renderGeneralTab(config);
        break;
      case 'layout':
        content.innerHTML = this.renderLayoutTab(config);
        break;
      case 'tracks':
        content.innerHTML = this.renderTracksTab(config);
        break;
      case 'preferences':
        content.innerHTML = this.renderPreferencesTab(config);
        break;
      case 'data':
        content.innerHTML = this.renderDataTab(config);
        break;
      case 'json':
        content.innerHTML = this.renderJSONTab(config);
        break;
    }

    this.attachContentListeners();
  }

  private renderGeneralTab(config: AppConfig): string {
    return `
      <div class="form-section">
        <h3>Application Settings</h3>
        
        <div class="form-group">
          <label for="config-name">Name</label>
          <input type="text" id="config-name" value="${config.name}" 
            ${this.options.readOnly ? 'disabled' : ''} />
        </div>

        <div class="form-group">
          <label for="config-description">Description</label>
          <textarea id="config-description" rows="3" 
            ${this.options.readOnly ? 'disabled' : ''}>${config.description || ''}</textarea>
        </div>

        <div class="form-group">
          <label>Version</label>
          <input type="text" value="${config.version}" disabled />
        </div>
      </div>

      <div class="form-section">
        <h3>Features</h3>
        
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" id="feature-export" 
              ${config.features.exportEnabled ? 'checked' : ''}
              ${this.options.readOnly ? 'disabled' : ''} />
            Enable Export
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" id="feature-share" 
              ${config.features.shareEnabled ? 'checked' : ''}
              ${this.options.readOnly ? 'disabled' : ''} />
            Enable Sharing
          </label>
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" id="feature-history" 
              ${config.features.historyEnabled ? 'checked' : ''}
              ${this.options.readOnly ? 'disabled' : ''} />
            Enable History
          </label>
        </div>
      </div>
    `;
  }

  private renderLayoutTab(config: AppConfig): string {
    return `
      <div class="form-section">
        <h3>Layout Configuration</h3>
        
        <div class="form-group">
          <label for="layout-type">Layout Type</label>
          <select id="layout-type" ${this.options.readOnly ? 'disabled' : ''}>
            ${['single', 'horizontal', 'vertical', 'grid']
              .map(
                (type) => `
              <option value="${type}" ${config.layout.type === type ? 'selected' : ''}>${type}</option>
            `
              )
              .join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="layout-gap">Gap (px)</label>
          <input type="number" id="layout-gap" value="${config.layout.gap}" min="0" 
            ${this.options.readOnly ? 'disabled' : ''} />
        </div>

        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" id="layout-responsive" 
              ${config.layout.responsive ? 'checked' : ''}
              ${this.options.readOnly ? 'disabled' : ''} />
            Responsive
          </label>
        </div>
      </div>

      <div class="form-section">
        <h3>Views (${config.layout.views.length})</h3>
        <div class="views-list">
          ${config.layout.views.map((view, i) => this.renderViewItem(view, i)).join('')}
        </div>
        ${
          !this.options.readOnly
            ? `
          <button class="btn btn-secondary" id="add-view-btn">+ Add View</button>
        `
            : ''
        }
      </div>
    `;
  }

  private renderViewItem(view: View, index: number): string {
    return `
      <div class="view-item" data-index="${index}">
        <div class="view-header">
          <span class="view-name">${view.name}</span>
          <span class="view-type badge">${view.type}</span>
          <span class="view-tracks">${view.tracks.length} tracks</span>
        </div>
      </div>
    `;
  }

  private renderTracksTab(config: AppConfig): string {
    const allTracks = config.layout.views.flatMap((v) => v.tracks);

    return `
      <div class="form-section">
        <h3>All Tracks (${allTracks.length})</h3>
        ${
          allTracks.length === 0
            ? `
          <p class="empty-state">No tracks configured. Add tracks to your views.</p>
        `
            : `
          <div class="tracks-list">
            ${allTracks.map((track, i) => this.renderTrackItem(track, i)).join('')}
          </div>
        `
        }
        ${
          !this.options.readOnly
            ? `
          <button class="btn btn-primary" id="add-track-btn">+ Add Track</button>
        `
            : ''
        }
      </div>
    `;
  }

  private renderTrackItem(track: Track, index: number): string {
    const typeColors: Record<string, string> = {
      mutation: '#e74c3c',
      expression: '#3498db',
      domain: '#2ecc71',
      genome: '#9b59b6',
      heatmap: '#f39c12',
    };

    return `
      <div class="track-item" data-index="${index}">
        <div class="track-color" style="background: ${typeColors[track.type] || '#666'}"></div>
        <div class="track-info">
          <div class="track-name">${track.name}</div>
          <div class="track-meta">
            <span class="badge">${track.type}</span>
            ${track.visible ? '' : '<span class="badge badge-muted">Hidden</span>'}
          </div>
        </div>
        <div class="track-actions">
          <button class="btn btn-icon btn-small" title="Edit">✎</button>
          <button class="btn btn-icon btn-small" title="Delete">×</button>
        </div>
      </div>
    `;
  }

  private renderPreferencesTab(config: AppConfig): string {
    const prefs = config.preferences;

    return `
      <div class="form-section">
        <h3>Display</h3>
        
        <div class="form-group">
          <label for="pref-theme">Theme</label>
          <select id="pref-theme" ${this.options.readOnly ? 'disabled' : ''}>
            ${['light', 'dark', 'system']
              .map(
                (t) => `
              <option value="${t}" ${prefs.theme === t ? 'selected' : ''}>${t}</option>
            `
              )
              .join('')}
          </select>
        </div>

        <div class="form-group">
          <label for="pref-fontsize">Font Size</label>
          <select id="pref-fontsize" ${this.options.readOnly ? 'disabled' : ''}>
            ${['small', 'medium', 'large']
              .map(
                (s) => `
              <option value="${s}" ${prefs.fontSize === s ? 'selected' : ''}>${s}</option>
            `
              )
              .join('')}
          </select>
        </div>
      </div>

      <div class="form-section">
        <h3>Animations</h3>
        
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" id="pref-animations" 
              ${prefs.animationsEnabled ? 'checked' : ''}
              ${this.options.readOnly ? 'disabled' : ''} />
            Enable Animations
          </label>
        </div>

        <div class="form-group">
          <label for="pref-animation-duration">Duration (ms)</label>
          <input type="number" id="pref-animation-duration" value="${prefs.animationDuration}" 
            min="0" max="2000" ${this.options.readOnly ? 'disabled' : ''} />
        </div>
      </div>

      <div class="form-section">
        <h3>Tooltips</h3>
        
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" id="pref-tooltips" 
              ${prefs.tooltipsEnabled ? 'checked' : ''}
              ${this.options.readOnly ? 'disabled' : ''} />
            Enable Tooltips
          </label>
        </div>

        <div class="form-group">
          <label for="pref-tooltip-delay">Delay (ms)</label>
          <input type="number" id="pref-tooltip-delay" value="${prefs.tooltipDelay}" 
            min="0" max="2000" ${this.options.readOnly ? 'disabled' : ''} />
        </div>
      </div>

      <div class="form-section">
        <h3>Colors</h3>
        
        <div class="form-group">
          <label for="pref-highlight-color">Highlight Color</label>
          <input type="color" id="pref-highlight-color" value="${prefs.highlightColor}" 
            ${this.options.readOnly ? 'disabled' : ''} />
        </div>

        <div class="form-group">
          <label for="pref-selection-color">Selection Color</label>
          <input type="color" id="pref-selection-color" value="${prefs.selectionColor}" 
            ${this.options.readOnly ? 'disabled' : ''} />
        </div>
      </div>
    `;
  }

  private renderDataTab(config: AppConfig): string {
    const ds = config.dataSources;

    return `
      <div class="form-section">
        <h3>Cache Settings</h3>
        
        <div class="form-group checkbox-group">
          <label>
            <input type="checkbox" id="data-cache-enabled" 
              ${ds.cacheEnabled ? 'checked' : ''}
              ${this.options.readOnly ? 'disabled' : ''} />
            Enable Cache
          </label>
        </div>

        <div class="form-group">
          <label for="data-cache-duration">Cache Duration (ms)</label>
          <input type="number" id="data-cache-duration" value="${ds.cacheDuration}" 
            min="0" ${this.options.readOnly ? 'disabled' : ''} />
        </div>
      </div>

      <div class="form-section">
        <h3>API Endpoints (${ds.endpoints.length})</h3>
        ${
          ds.endpoints.length === 0
            ? `
          <p class="empty-state">No API endpoints configured.</p>
        `
            : `
          <div class="endpoints-list">
            ${ds.endpoints
              .map(
                (ep) => `
              <div class="endpoint-item">
                <strong>${ep.name}</strong>
                <span class="endpoint-url">${ep.baseUrl}</span>
              </div>
            `
              )
              .join('')}
          </div>
        `
        }
        ${
          !this.options.readOnly
            ? `
          <button class="btn btn-secondary" id="add-endpoint-btn">+ Add Endpoint</button>
        `
            : ''
        }
      </div>
    `;
  }

  private renderJSONTab(config: AppConfig): string {
    return `
      <div class="form-section json-editor">
        <h3>Raw JSON Configuration</h3>
        <textarea id="json-editor" rows="30" 
          ${this.options.readOnly ? 'readonly' : ''}>${JSON.stringify(config, null, 2)}</textarea>
        ${
          !this.options.readOnly
            ? `
          <button class="btn btn-primary" id="apply-json-btn">Apply Changes</button>
        `
            : ''
        }
      </div>
    `;
  }

  private attachContentListeners(): void {
    if (this.options.readOnly) return;

    // General tab
    this.attachInputListener('config-name', (value) => {
      this.store.setPath('name', value);
    });
    this.attachInputListener('config-description', (value) => {
      this.store.setPath('description', value || undefined);
    });
    this.attachCheckboxListener('feature-export', (checked) => {
      this.store.setPath('features.exportEnabled', checked);
    });
    this.attachCheckboxListener('feature-share', (checked) => {
      this.store.setPath('features.shareEnabled', checked);
    });
    this.attachCheckboxListener('feature-history', (checked) => {
      this.store.setPath('features.historyEnabled', checked);
    });

    // Layout tab
    this.attachSelectListener('layout-type', (value) => {
      this.store.setPath('layout.type', value);
    });
    this.attachInputListener('layout-gap', (value) => {
      this.store.setPath('layout.gap', parseInt(value) || 0);
    });
    this.attachCheckboxListener('layout-responsive', (checked) => {
      this.store.setPath('layout.responsive', checked);
    });

    // Preferences tab
    this.attachSelectListener('pref-theme', (value) => {
      this.store.setPath('preferences.theme', value);
    });
    this.attachSelectListener('pref-fontsize', (value) => {
      this.store.setPath('preferences.fontSize', value);
    });
    this.attachCheckboxListener('pref-animations', (checked) => {
      this.store.setPath('preferences.animationsEnabled', checked);
    });
    this.attachInputListener('pref-animation-duration', (value) => {
      this.store.setPath('preferences.animationDuration', parseInt(value) || 300);
    });
    this.attachCheckboxListener('pref-tooltips', (checked) => {
      this.store.setPath('preferences.tooltipsEnabled', checked);
    });
    this.attachInputListener('pref-tooltip-delay', (value) => {
      this.store.setPath('preferences.tooltipDelay', parseInt(value) || 200);
    });
    this.attachInputListener('pref-highlight-color', (value) => {
      this.store.setPath('preferences.highlightColor', value);
    });
    this.attachInputListener('pref-selection-color', (value) => {
      this.store.setPath('preferences.selectionColor', value);
    });

    // Data tab
    this.attachCheckboxListener('data-cache-enabled', (checked) => {
      this.store.setPath('dataSources.cacheEnabled', checked);
    });
    this.attachInputListener('data-cache-duration', (value) => {
      this.store.setPath('dataSources.cacheDuration', parseInt(value) || 3600000);
    });

    // JSON tab
    const applyJsonBtn = this.container.querySelector('#apply-json-btn');
    applyJsonBtn?.addEventListener('click', () => this.applyJSONChanges());
  }

  private attachInputListener(id: string, callback: (value: string) => void): void {
    const input = this.container.querySelector(`#${id}`) as HTMLInputElement;
    input?.addEventListener('change', () => callback(input.value));
  }

  private attachSelectListener(id: string, callback: (value: string) => void): void {
    const select = this.container.querySelector(`#${id}`) as HTMLSelectElement;
    select?.addEventListener('change', () => callback(select.value));
  }

  private attachCheckboxListener(id: string, callback: (checked: boolean) => void): void {
    const checkbox = this.container.querySelector(`#${id}`) as HTMLInputElement;
    checkbox?.addEventListener('change', () => callback(checkbox.checked));
  }

  private applyJSONChanges(): void {
    const textarea = this.container.querySelector('#json-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const result = this.store.import(textarea.value);
    if (!result.valid) {
      alert('Invalid JSON: ' + (result.errors?.message || result.warnings.join('\n')));
    } else {
      this.renderTabContent();
    }
  }

  private updateValidationStatus(): void {
    const status = this.container.querySelector('#validation-status');
    if (!status) return;

    const result = this.store.validate(this.store.get());
    const icon = status.querySelector('.status-icon')!;
    const text = status.querySelector('.status-text')!;

    if (result.valid && result.warnings.length === 0) {
      icon.textContent = '✓';
      text.textContent = 'Configuration valid';
      status.className = 'validation-status valid';
    } else if (result.valid) {
      icon.textContent = '⚠';
      text.textContent = `${result.warnings.length} warning(s)`;
      status.className = 'validation-status warning';
    } else {
      icon.textContent = '✗';
      text.textContent = 'Configuration invalid';
      status.className = 'validation-status error';
    }
  }

  private updateHistoryButtons(): void {
    const undoBtn = this.container.querySelector('#undo-btn') as HTMLButtonElement;
    const redoBtn = this.container.querySelector('#redo-btn') as HTMLButtonElement;

    if (undoBtn) undoBtn.disabled = !this.store.canUndo();
    if (redoBtn) redoBtn.disabled = !this.store.canRedo();
  }

  private handleImport(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const text = await file.text();
      const result = this.store.import(text);

      if (result.valid) {
        this.renderTabContent();
        alert('Configuration imported successfully');
      } else {
        alert('Import failed: ' + (result.errors?.message || result.warnings.join('\n')));
      }
    };
    input.click();
  }

  private handleExport(): void {
    const json = this.store.export();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.json';
    a.click();

    URL.revokeObjectURL(url);
  }

  private handleReset(): void {
    if (confirm('Are you sure you want to reset to default configuration?')) {
      this.store.reset();
      this.renderTabContent();
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.unsubscribe?.();
    this.container.innerHTML = '';
  }
}
