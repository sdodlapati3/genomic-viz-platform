/**
 * URL State Persistence
 *
 * Serialize/deserialize application state to/from URL parameters.
 * Enables shareable links with embedded configuration.
 */

import { z } from 'zod';
import { AppConfigSchema } from '../schemas';

// ============================================
// Types
// ============================================

export interface URLStateConfig {
  paramName: string;
  compression: boolean;
  maxLength: number;
  fallbackToStorage: boolean;
  storageKey: string;
}

export interface URLStateResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source?: 'url' | 'storage' | 'default';
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: URLStateConfig = {
  paramName: 'state',
  compression: true,
  maxLength: 2000, // Safe URL length
  fallbackToStorage: true,
  storageKey: 'genomicVizState',
};

// ============================================
// Compression Utilities
// ============================================

/**
 * Simple LZ-based string compression for URL state
 * Uses base64 encoding for URL safety
 */
export function compressState(state: string): string {
  try {
    // Use built-in compression if available, otherwise just base64
    const encoded = btoa(encodeURIComponent(state));
    return encoded;
  } catch {
    return btoa(state);
  }
}

/**
 * Decompress state from URL
 */
export function decompressState(compressed: string): string {
  try {
    const decoded = atob(compressed);
    return decodeURIComponent(decoded);
  } catch {
    try {
      return atob(compressed);
    } catch {
      throw new Error('Failed to decompress state');
    }
  }
}

// ============================================
// URL State Manager
// ============================================

export class URLStateManager<T extends z.ZodType> {
  private schema: T;
  private config: URLStateConfig;

  constructor(schema: T, config: Partial<URLStateConfig> = {}) {
    this.schema = schema;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Serialize state to URL parameter
   */
  serializeToURL(state: z.infer<T>): string {
    // Validate state
    const validated = this.schema.parse(state);

    // Stringify
    const json = JSON.stringify(validated);

    // Compress if enabled
    const encoded = this.config.compression ? compressState(json) : encodeURIComponent(json);

    return encoded;
  }

  /**
   * Generate full URL with state
   */
  generateURL(state: z.infer<T>, baseURL?: string): string {
    const base = baseURL || window.location.origin + window.location.pathname;
    const encoded = this.serializeToURL(state);

    // Check length
    const url = `${base}?${this.config.paramName}=${encoded}`;

    if (url.length > this.config.maxLength && this.config.fallbackToStorage) {
      // Store in localStorage and use reference
      const stateId = this.storeInStorage(state);
      return `${base}?${this.config.paramName}=ref:${stateId}`;
    }

    return url;
  }

  /**
   * Parse state from URL
   */
  parseFromURL(url?: string): URLStateResult<z.infer<T>> {
    try {
      const searchParams = new URLSearchParams(url ? new URL(url).search : window.location.search);

      const encoded = searchParams.get(this.config.paramName);

      if (!encoded) {
        return { success: false, error: 'No state parameter found', source: 'default' };
      }

      // Check for storage reference
      if (encoded.startsWith('ref:')) {
        const stateId = encoded.slice(4);
        return this.loadFromStorage(stateId);
      }

      // Decompress/decode
      const json = this.config.compression ? decompressState(encoded) : decodeURIComponent(encoded);

      // Parse and validate
      const parsed = JSON.parse(json);
      const validated = this.schema.parse(parsed);

      return { success: true, data: validated, source: 'url' };
    } catch (error) {
      return {
        success: false,
        error: `Failed to parse URL state: ${error}`,
        source: 'url',
      };
    }
  }

  /**
   * Update browser URL without reload
   */
  pushState(state: z.infer<T>): void {
    const url = this.generateURL(state);
    window.history.pushState({ state }, '', url);
  }

  /**
   * Replace browser URL without history entry
   */
  replaceState(state: z.infer<T>): void {
    const url = this.generateURL(state);
    window.history.replaceState({ state }, '', url);
  }

  /**
   * Store state in localStorage (for large states)
   */
  private storeInStorage(state: z.infer<T>): string {
    const stateId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const storageData = {
      id: stateId,
      state,
      timestamp: Date.now(),
    };

    try {
      // Clean up old entries
      this.cleanupStorage();

      localStorage.setItem(`${this.config.storageKey}_${stateId}`, JSON.stringify(storageData));
    } catch {
      console.warn('Failed to store state in localStorage');
    }

    return stateId;
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(stateId: string): URLStateResult<z.infer<T>> {
    try {
      const stored = localStorage.getItem(`${this.config.storageKey}_${stateId}`);

      if (!stored) {
        return { success: false, error: 'State not found in storage', source: 'storage' };
      }

      const { state } = JSON.parse(stored);
      const validated = this.schema.parse(state);

      return { success: true, data: validated, source: 'storage' };
    } catch (error) {
      return {
        success: false,
        error: `Failed to load from storage: ${error}`,
        source: 'storage',
      };
    }
  }

  /**
   * Clean up old storage entries (keep last 10)
   */
  private cleanupStorage(): void {
    const prefix = `${this.config.storageKey}_`;
    const entries: { key: string; timestamp: number }[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '{}');
          entries.push({ key, timestamp: data.timestamp || 0 });
        } catch {
          // Invalid entry, mark for removal
          entries.push({ key, timestamp: 0 });
        }
      }
    }

    // Sort by timestamp descending and remove old entries
    entries.sort((a, b) => b.timestamp - a.timestamp);
    entries.slice(10).forEach(({ key }) => {
      localStorage.removeItem(key);
    });
  }

  /**
   * Clear all stored states
   */
  clearStorage(): void {
    const prefix = `${this.config.storageKey}_`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Listen for browser navigation (back/forward)
   */
  onPopState(callback: (state: z.infer<T> | null) => void): () => void {
    const handler = (event: PopStateEvent) => {
      if (event.state?.state) {
        try {
          const validated = this.schema.parse(event.state.state);
          callback(validated);
        } catch {
          callback(null);
        }
      } else {
        // Try to parse from current URL
        const result = this.parseFromURL();
        callback(result.success ? result.data! : null);
      }
    };

    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }
}

// ============================================
// Convenience Factory
// ============================================

/**
 * Create a URL state manager for app config
 */
export function createAppConfigURLState(
  config?: Partial<URLStateConfig>
): URLStateManager<typeof AppConfigSchema> {
  return new URLStateManager(AppConfigSchema, config);
}
