/**
 * Configuration Store
 *
 * Reactive state management for configuration with
 * validation, history, and persistence.
 */

import { z } from 'zod';
import { AppConfigSchema, AppConfig } from '../schemas';
import { migrationRegistry } from '../migrations';

// ============================================
// Types
// ============================================

export interface ConfigStoreOptions {
  initialConfig?: Partial<AppConfig>;
  historyEnabled?: boolean;
  historyMaxSize?: number;
  autoValidate?: boolean;
  persistKey?: string;
}

export interface ConfigHistoryEntry {
  config: AppConfig;
  timestamp: number;
  description?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: z.ZodError | null;
  warnings: string[];
}

type ConfigListener = (config: AppConfig, previousConfig: AppConfig | null) => void;

// ============================================
// Default Configuration
// ============================================

const CURRENT_VERSION = '2.0.0';

function createDefaultConfig(): AppConfig {
  return {
    version: CURRENT_VERSION,
    name: 'Genomic Visualization',
    layout: {
      type: 'single',
      views: [
        {
          id: 'main',
          name: 'Main View',
          type: 'main',
          tracks: [],
          linkedViews: [],
          zoom: {
            enabled: true,
            minScale: 0.1,
            maxScale: 10,
            currentScale: 1,
          },
        },
      ],
      gap: 10,
      responsive: true,
    },
    preferences: {
      theme: 'light',
      fontSize: 'medium',
      animationsEnabled: true,
      animationDuration: 300,
      tooltipsEnabled: true,
      tooltipDelay: 200,
      highlightColor: '#ffc107',
      selectionColor: '#2196f3',
      keyboardShortcutsEnabled: true,
      autoSave: true,
      autoSaveInterval: 30000,
    },
    dataSources: {
      endpoints: [],
      cacheEnabled: true,
      cacheDuration: 3600000,
    },
    features: {
      exportEnabled: true,
      exportFormats: ['png', 'svg'],
      shareEnabled: true,
      collaborationEnabled: false,
      historyEnabled: true,
      historyMaxEntries: 50,
    },
  };
}

// ============================================
// Config Store Implementation
// ============================================

export class ConfigStore {
  private config: AppConfig;
  private history: ConfigHistoryEntry[] = [];
  private historyIndex: number = -1;
  private listeners: Set<ConfigListener> = new Set();
  private options: {
    initialConfig: Partial<AppConfig> | undefined;
    historyEnabled: boolean;
    historyMaxSize: number;
    autoValidate: boolean;
    persistKey: string;
  };

  constructor(options: ConfigStoreOptions = {}) {
    this.options = {
      initialConfig: options.initialConfig,
      historyEnabled: options.historyEnabled ?? true,
      historyMaxSize: options.historyMaxSize ?? 50,
      autoValidate: options.autoValidate ?? true,
      persistKey: options.persistKey ?? 'genomicVizConfig',
    };

    // Initialize config
    this.config = this.initializeConfig();

    // Add initial state to history
    if (this.options.historyEnabled) {
      this.pushHistory('Initial state');
    }
  }

  /**
   * Initialize configuration from various sources
   */
  private initializeConfig(): AppConfig {
    // Try to load from localStorage first
    if (this.options.persistKey) {
      const persisted = this.loadFromStorage();
      if (persisted) {
        return this.migrateIfNeeded(persisted);
      }
    }

    // Use initial config if provided
    if (this.options.initialConfig) {
      const merged = { ...createDefaultConfig(), ...this.options.initialConfig };
      const result = AppConfigSchema.safeParse(merged);
      if (result.success) {
        return result.data;
      }
    }

    // Fall back to default
    return createDefaultConfig();
  }

  /**
   * Migrate config to current version if needed
   */
  private migrateIfNeeded(config: unknown): AppConfig {
    const configObj = config as Record<string, unknown>;
    const version = (configObj.version as string) || '1.0.0';

    if (version !== CURRENT_VERSION) {
      const result = migrationRegistry.migrate(config, version, CURRENT_VERSION);
      if (result.success) {
        const validated = AppConfigSchema.safeParse(result.config);
        if (validated.success) {
          console.log(`Config migrated from ${version} to ${CURRENT_VERSION}`);
          return validated.data;
        }
      }
      console.warn('Migration failed, using default config');
      return createDefaultConfig();
    }

    const validated = AppConfigSchema.safeParse(config);
    return validated.success ? validated.data : createDefaultConfig();
  }

  /**
   * Get current configuration
   */
  get(): AppConfig {
    return { ...this.config };
  }

  /**
   * Get a specific config path
   */
  getPath<T>(path: string): T | undefined {
    const parts = path.split('.');
    let current: unknown = this.config;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current as T;
  }

  /**
   * Update configuration
   */
  set(updates: Partial<AppConfig>, description?: string): ValidationResult {
    const previousConfig = this.config;
    const newConfig = this.mergeDeep(this.config, updates);

    // Validate if enabled
    if (this.options.autoValidate) {
      const result = this.validate(newConfig);
      if (!result.valid) {
        return result;
      }
    }

    // Apply update
    this.config = newConfig as AppConfig;

    // Update history
    if (this.options.historyEnabled) {
      this.pushHistory(description || 'Configuration updated');
    }

    // Persist
    this.saveToStorage();

    // Notify listeners
    this.notifyListeners(previousConfig);

    return { valid: true, errors: null, warnings: [] };
  }

  /**
   * Update a specific path
   */
  setPath(path: string, value: unknown, description?: string): ValidationResult {
    const parts = path.split('.');
    const updates: Record<string, unknown> = {};
    let current = updates;

    for (let i = 0; i < parts.length - 1; i++) {
      current[parts[i]] = {};
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;

    return this.set(updates as Partial<AppConfig>, description || `Updated ${path}`);
  }

  /**
   * Validate a configuration
   */
  validate(config: unknown): ValidationResult {
    const result = AppConfigSchema.safeParse(config);
    const warnings: string[] = [];

    // Check for potential issues
    if (result.success) {
      const cfg = result.data;

      // Warn about empty views
      if (cfg.layout.views.length === 0) {
        warnings.push('Configuration has no views defined');
      }

      // Warn about views with no tracks
      cfg.layout.views.forEach((view) => {
        if (view.tracks.length === 0) {
          warnings.push(`View "${view.name}" has no tracks`);
        }
      });
    }

    return {
      valid: result.success,
      errors: result.success ? null : result.error,
      warnings,
    };
  }

  /**
   * Subscribe to config changes
   */
  subscribe(listener: ConfigListener): () => void {
    this.listeners.add(listener);
    // Call immediately with current config
    listener(this.config, null);
    return () => this.listeners.delete(listener);
  }

  /**
   * Undo last change
   */
  undo(): boolean {
    if (!this.options.historyEnabled || this.historyIndex <= 0) {
      return false;
    }

    this.historyIndex--;
    const previousConfig = this.config;
    this.config = { ...this.history[this.historyIndex].config };
    this.saveToStorage();
    this.notifyListeners(previousConfig);
    return true;
  }

  /**
   * Redo last undone change
   */
  redo(): boolean {
    if (!this.options.historyEnabled || this.historyIndex >= this.history.length - 1) {
      return false;
    }

    this.historyIndex++;
    const previousConfig = this.config;
    this.config = { ...this.history[this.historyIndex].config };
    this.saveToStorage();
    this.notifyListeners(previousConfig);
    return true;
  }

  /**
   * Get history entries
   */
  getHistory(): ConfigHistoryEntry[] {
    return this.history.map((entry) => ({ ...entry }));
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.options.historyEnabled && this.historyIndex > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.options.historyEnabled && this.historyIndex < this.history.length - 1;
  }

  /**
   * Reset to default configuration
   */
  reset(): void {
    const previousConfig = this.config;
    this.config = createDefaultConfig();

    if (this.options.historyEnabled) {
      this.pushHistory('Reset to default');
    }

    this.saveToStorage();
    this.notifyListeners(previousConfig);
  }

  /**
   * Export configuration as JSON
   */
  export(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  import(json: string): ValidationResult {
    try {
      const parsed = JSON.parse(json);
      const migrated = this.migrateIfNeeded(parsed);
      return this.set(migrated, 'Imported configuration');
    } catch (error) {
      return {
        valid: false,
        errors: null,
        warnings: [`Import failed: ${error}`],
      };
    }
  }

  // ============================================
  // Private Methods
  // ============================================

  private pushHistory(description: string): void {
    // Truncate future history if we're not at the end
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1);
    }

    this.history.push({
      config: { ...this.config },
      timestamp: Date.now(),
      description,
    });

    // Limit history size
    if (this.history.length > this.options.historyMaxSize) {
      this.history = this.history.slice(-this.options.historyMaxSize);
    }

    this.historyIndex = this.history.length - 1;
  }

  private notifyListeners(previousConfig: AppConfig): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.config, previousConfig);
      } catch (error) {
        console.error('Config listener error:', error);
      }
    });
  }

  private loadFromStorage(): unknown | null {
    try {
      const stored = localStorage.getItem(this.options.persistKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.options.persistKey, JSON.stringify(this.config));
    } catch (error) {
      console.warn('Failed to save config to storage:', error);
    }
  }

  private mergeDeep(target: unknown, source: unknown): unknown {
    if (source === undefined) return target;
    if (source === null || typeof source !== 'object') return source;
    if (Array.isArray(source)) return [...source];
    if (target === null || typeof target !== 'object') return source;

    const result = { ...(target as Record<string, unknown>) };
    for (const key of Object.keys(source as Record<string, unknown>)) {
      result[key] = this.mergeDeep(
        (target as Record<string, unknown>)[key],
        (source as Record<string, unknown>)[key]
      );
    }
    return result;
  }
}

// ============================================
// Singleton Instance
// ============================================

let globalStore: ConfigStore | null = null;

export function getConfigStore(options?: ConfigStoreOptions): ConfigStore {
  if (!globalStore) {
    globalStore = new ConfigStore(options);
  }
  return globalStore;
}

export function resetConfigStore(): void {
  globalStore = null;
}
