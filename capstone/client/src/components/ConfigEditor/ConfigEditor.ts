/**
 * Config Editor Component
 * 
 * Interactive JSON configuration editor with:
 * - Syntax highlighting
 * - Real-time validation
 * - Preset configurations
 * - Export/Import functionality
 */

import { z } from 'zod';
import {
  embedConfigSchema,
  validateEmbedConfig,
  getDefaultConfig,
  type EmbedConfig,
} from '../../embed/config.schema';

// ============================================
// Types
// ============================================

export interface ConfigEditorOptions {
  container: HTMLElement | string;
  initialConfig?: EmbedConfig;
  onChange?: (config: EmbedConfig, isValid: boolean) => void;
  onError?: (errors: Array<{ path: string; message: string }>) => void;
  theme?: 'light' | 'dark';
  height?: number;
}

interface PresetConfig {
  name: string;
  description: string;
  config: Partial<EmbedConfig>;
}

// ============================================
// Preset Configurations
// ============================================

const PRESETS: PresetConfig[] = [
  {
    name: 'TP53 Gene View',
    description: 'Lollipop plot for TP53 mutations',
    config: {
      entrypoint: 'gene',
      gene: 'TP53',
      genome: 'hg38',
      showDomains: true,
      showMutations: true,
      showLegend: true,
    },
  },
  {
    name: 'Cancer Gene Panel',
    description: 'Sample matrix for common cancer genes',
    config: {
      entrypoint: 'samplematrix',
      genes: ['TP53', 'EGFR', 'KRAS', 'BRAF', 'PIK3CA', 'PTEN', 'RB1', 'CDKN2A'],
      sortGenes: 'mutationFrequency',
      sortSamples: 'mutationCount',
      colorBy: 'mutationType',
    },
  },
  {
    name: 'Survival Analysis',
    description: 'Compare survival by TP53 status',
    config: {
      entrypoint: 'survival',
      groups: [
        { name: 'TP53 Mutant', sampleIds: ['S001', 'S002', 'S003'], color: '#e74c3c' },
        { name: 'TP53 Wild-type', sampleIds: ['S004', 'S005', 'S006'], color: '#3498db' },
      ],
      timeUnit: 'months',
      showConfidenceInterval: true,
      showAtRisk: true,
      showPValue: true,
    },
  },
  {
    name: 'Expression Heatmap',
    description: 'Top variable genes heatmap',
    config: {
      entrypoint: 'heatmap',
      dataSource: 'expression',
      topN: 50,
      clusterRows: true,
      clusterColumns: true,
      colorScale: 'RdBu',
    },
  },
  {
    name: 'Differential Expression',
    description: 'Volcano plot for DE analysis',
    config: {
      entrypoint: 'volcano',
      group1: 'Treatment',
      group2: 'Control',
      pValueThreshold: 0.05,
      foldChangeThreshold: 2,
      showLabels: true,
      labelCount: 10,
    },
  },
];

// ============================================
// Config Editor Class
// ============================================

export class ConfigEditor {
  private container: HTMLElement;
  private options: Required<ConfigEditorOptions>;
  private currentConfig: EmbedConfig | null = null;
  private validationErrors: Array<{ path: string; message: string }> = [];
  
  private textarea: HTMLTextAreaElement | null = null;
  private errorDisplay: HTMLElement | null = null;
  private presetSelect: HTMLSelectElement | null = null;

  constructor(options: ConfigEditorOptions) {
    // Resolve container
    if (typeof options.container === 'string') {
      const el = document.querySelector(options.container);
      if (!el || !(el instanceof HTMLElement)) {
        throw new Error(`Container not found: ${options.container}`);
      }
      this.container = el;
    } else {
      this.container = options.container;
    }

    this.options = {
      container: this.container,
      initialConfig: options.initialConfig || (getDefaultConfig('gene') as EmbedConfig),
      onChange: options.onChange || (() => {}),
      onError: options.onError || (() => {}),
      theme: options.theme || 'light',
      height: options.height || 400,
    };

    this.currentConfig = this.options.initialConfig;
    this.init();
  }

  // ============================================
  // Initialization
  // ============================================

  private init(): void {
    this.container.innerHTML = '';
    this.container.style.fontFamily = 'system-ui, -apple-system, sans-serif';

    const wrapper = document.createElement('div');
    wrapper.className = 'config-editor';
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 15px;
      background: ${this.options.theme === 'dark' ? '#1e1e1e' : '#f8f9fa'};
      border-radius: 8px;
      border: 1px solid ${this.options.theme === 'dark' ? '#333' : '#dee2e6'};
    `;

    // Toolbar
    wrapper.appendChild(this.createToolbar());

    // Editor area
    wrapper.appendChild(this.createEditorArea());

    // Error display
    wrapper.appendChild(this.createErrorDisplay());

    // Action buttons
    wrapper.appendChild(this.createActionButtons());

    this.container.appendChild(wrapper);

    // Load initial config
    this.setConfig(this.currentConfig!);
  }

  // ============================================
  // UI Components
  // ============================================

  private createToolbar(): HTMLElement {
    const toolbar = document.createElement('div');
    toolbar.className = 'config-editor-toolbar';
    toolbar.style.cssText = `
      display: flex;
      align-items: center;
      gap: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid ${this.options.theme === 'dark' ? '#333' : '#dee2e6'};
    `;

    // Preset selector
    const presetLabel = document.createElement('label');
    presetLabel.textContent = 'Presets:';
    presetLabel.style.cssText = `
      font-size: 13px;
      font-weight: 500;
      color: ${this.options.theme === 'dark' ? '#ccc' : '#333'};
    `;

    this.presetSelect = document.createElement('select');
    this.presetSelect.style.cssText = `
      padding: 6px 10px;
      border: 1px solid ${this.options.theme === 'dark' ? '#444' : '#ccc'};
      border-radius: 4px;
      background: ${this.options.theme === 'dark' ? '#2d2d2d' : '#fff'};
      color: ${this.options.theme === 'dark' ? '#ccc' : '#333'};
      font-size: 13px;
      cursor: pointer;
    `;

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select Preset --';
    this.presetSelect.appendChild(defaultOption);

    PRESETS.forEach((preset, i) => {
      const option = document.createElement('option');
      option.value = String(i);
      option.textContent = preset.name;
      option.title = preset.description;
      this.presetSelect.appendChild(option);
    });

    this.presetSelect.addEventListener('change', () => {
      const index = parseInt(this.presetSelect!.value, 10);
      if (!isNaN(index) && PRESETS[index]) {
        this.setConfig(PRESETS[index].config as EmbedConfig);
      }
    });

    toolbar.appendChild(presetLabel);
    toolbar.appendChild(this.presetSelect);

    // Format button
    const formatBtn = this.createButton('Format', () => this.formatJson());
    toolbar.appendChild(formatBtn);

    // Clear button
    const clearBtn = this.createButton('Clear', () => this.clear());
    clearBtn.style.marginLeft = 'auto';
    toolbar.appendChild(clearBtn);

    return toolbar;
  }

  private createEditorArea(): HTMLElement {
    const editorArea = document.createElement('div');
    editorArea.className = 'config-editor-area';
    editorArea.style.cssText = `
      position: relative;
      border-radius: 6px;
      overflow: hidden;
    `;

    // Line numbers
    const lineNumbers = document.createElement('div');
    lineNumbers.className = 'line-numbers';
    lineNumbers.style.cssText = `
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 40px;
      background: ${this.options.theme === 'dark' ? '#252526' : '#f0f0f0'};
      color: ${this.options.theme === 'dark' ? '#858585' : '#999'};
      padding: 10px 5px;
      text-align: right;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 12px;
      line-height: 1.5;
      user-select: none;
      overflow: hidden;
    `;

    // Textarea
    this.textarea = document.createElement('textarea');
    this.textarea.className = 'config-textarea';
    this.textarea.style.cssText = `
      width: 100%;
      height: ${this.options.height}px;
      padding: 10px 10px 10px 50px;
      border: 1px solid ${this.options.theme === 'dark' ? '#444' : '#ccc'};
      border-radius: 6px;
      background: ${this.options.theme === 'dark' ? '#1e1e1e' : '#fff'};
      color: ${this.options.theme === 'dark' ? '#d4d4d4' : '#333'};
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 12px;
      line-height: 1.5;
      resize: vertical;
      outline: none;
      tab-size: 2;
    `;
    this.textarea.spellcheck = false;

    this.textarea.addEventListener('input', () => this.handleInput());
    this.textarea.addEventListener('scroll', () => {
      lineNumbers.scrollTop = this.textarea!.scrollTop;
    });
    this.textarea.addEventListener('keydown', (e) => this.handleKeydown(e));

    editorArea.appendChild(lineNumbers);
    editorArea.appendChild(this.textarea);

    // Update line numbers
    this.updateLineNumbers(lineNumbers);
    this.textarea.addEventListener('input', () => this.updateLineNumbers(lineNumbers));

    return editorArea;
  }

  private createErrorDisplay(): HTMLElement {
    this.errorDisplay = document.createElement('div');
    this.errorDisplay.className = 'config-editor-errors';
    this.errorDisplay.style.cssText = `
      padding: 10px;
      border-radius: 4px;
      font-size: 12px;
      display: none;
    `;
    return this.errorDisplay;
  }

  private createActionButtons(): HTMLElement {
    const actions = document.createElement('div');
    actions.className = 'config-editor-actions';
    actions.style.cssText = `
      display: flex;
      gap: 10px;
      padding-top: 10px;
      border-top: 1px solid ${this.options.theme === 'dark' ? '#333' : '#dee2e6'};
    `;

    // Validate button
    const validateBtn = this.createButton('Validate', () => this.validate(), true);
    actions.appendChild(validateBtn);

    // Copy button
    const copyBtn = this.createButton('Copy', () => this.copyToClipboard());
    actions.appendChild(copyBtn);

    // Export button
    const exportBtn = this.createButton('Export', () => this.exportConfig());
    actions.appendChild(exportBtn);

    // Import button
    const importBtn = this.createButton('Import', () => this.importConfig());
    actions.appendChild(importBtn);

    return actions;
  }

  private createButton(text: string, onClick: () => void, primary = false): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      padding: 8px 16px;
      border: 1px solid ${primary ? '#3498db' : (this.options.theme === 'dark' ? '#444' : '#ccc')};
      border-radius: 4px;
      background: ${primary ? '#3498db' : (this.options.theme === 'dark' ? '#2d2d2d' : '#fff')};
      color: ${primary ? '#fff' : (this.options.theme === 'dark' ? '#ccc' : '#333')};
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    `;
    btn.addEventListener('click', onClick);
    btn.addEventListener('mouseover', () => {
      btn.style.opacity = '0.8';
    });
    btn.addEventListener('mouseout', () => {
      btn.style.opacity = '1';
    });
    return btn;
  }

  // ============================================
  // Event Handlers
  // ============================================

  private handleInput(): void {
    this.validateDebounced();
  }

  private handleKeydown(e: KeyboardEvent): void {
    // Tab support
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = this.textarea!.selectionStart;
      const end = this.textarea!.selectionEnd;
      const value = this.textarea!.value;
      this.textarea!.value = value.substring(0, start) + '  ' + value.substring(end);
      this.textarea!.selectionStart = this.textarea!.selectionEnd = start + 2;
    }

    // Ctrl+Enter to validate
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      this.validate();
    }
  }

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  
  private validateDebounced(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => this.validate(), 300);
  }

  // ============================================
  // Core Methods
  // ============================================

  public setConfig(config: EmbedConfig): void {
    this.currentConfig = config;
    if (this.textarea) {
      this.textarea.value = JSON.stringify(config, null, 2);
      this.validate();
    }
  }

  public getConfig(): EmbedConfig | null {
    return this.currentConfig;
  }

  public validate(): boolean {
    if (!this.textarea) return false;

    let parsed: unknown;
    
    // Try to parse JSON
    try {
      parsed = JSON.parse(this.textarea.value);
    } catch (e) {
      this.showError([{ path: 'JSON', message: `Invalid JSON: ${(e as Error).message}` }]);
      return false;
    }

    // Validate against schema
    const result = validateEmbedConfig(parsed);
    
    if (result.success) {
      this.currentConfig = result.data!;
      this.validationErrors = [];
      this.showSuccess();
      this.options.onChange(this.currentConfig, true);
      return true;
    } else {
      this.validationErrors = result.errors || [];
      this.showError(this.validationErrors);
      this.options.onError(this.validationErrors);
      return false;
    }
  }

  private showError(errors: Array<{ path: string; message: string }>): void {
    if (!this.errorDisplay) return;
    
    this.errorDisplay.style.display = 'block';
    this.errorDisplay.style.background = this.options.theme === 'dark' ? '#3d2020' : '#fee';
    this.errorDisplay.style.color = '#c00';
    this.errorDisplay.style.border = '1px solid #c00';
    
    this.errorDisplay.innerHTML = `
      <strong>Validation Errors:</strong>
      <ul style="margin: 5px 0 0 20px; padding: 0;">
        ${errors.map(e => `<li><code>${e.path}</code>: ${e.message}</li>`).join('')}
      </ul>
    `;
  }

  private showSuccess(): void {
    if (!this.errorDisplay) return;
    
    this.errorDisplay.style.display = 'block';
    this.errorDisplay.style.background = this.options.theme === 'dark' ? '#1d3d20' : '#efe';
    this.errorDisplay.style.color = '#080';
    this.errorDisplay.style.border = '1px solid #080';
    this.errorDisplay.innerHTML = '✓ Configuration is valid';

    setTimeout(() => {
      if (this.errorDisplay && this.validationErrors.length === 0) {
        this.errorDisplay.style.display = 'none';
      }
    }, 2000);
  }

  private formatJson(): void {
    if (!this.textarea) return;
    
    try {
      const parsed = JSON.parse(this.textarea.value);
      this.textarea.value = JSON.stringify(parsed, null, 2);
    } catch (e) {
      // If invalid JSON, don't format
    }
  }

  private clear(): void {
    if (!this.textarea) return;
    this.textarea.value = '{\n  \n}';
    this.currentConfig = null;
    if (this.errorDisplay) {
      this.errorDisplay.style.display = 'none';
    }
  }

  private async copyToClipboard(): Promise<void> {
    if (!this.textarea) return;
    
    try {
      await navigator.clipboard.writeText(this.textarea.value);
      // Visual feedback
      const originalBg = this.textarea.style.background;
      this.textarea.style.background = this.options.theme === 'dark' ? '#1d3d20' : '#efe';
      setTimeout(() => {
        this.textarea!.style.background = originalBg;
      }, 200);
    } catch (e) {
      console.error('Failed to copy:', e);
    }
  }

  private exportConfig(): void {
    if (!this.textarea) return;
    
    const blob = new Blob([this.textarea.value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'genomic-config.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  private importConfig(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        if (this.textarea) {
          this.textarea.value = text;
          this.formatJson();
          this.validate();
        }
      } catch (err) {
        console.error('Failed to import:', err);
      }
    });
    
    input.click();
  }

  private updateLineNumbers(container: HTMLElement): void {
    if (!this.textarea) return;
    
    const lines = this.textarea.value.split('\n').length;
    container.innerHTML = Array.from({ length: lines }, (_, i) => i + 1).join('<br>');
  }

  public destroy(): void {
    this.container.innerHTML = '';
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

export default ConfigEditor;
