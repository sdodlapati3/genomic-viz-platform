/**
 * useUrlState Hook
 * 
 * Manages visualization state in URL parameters for reproducibility.
 * "Copy link reproduces the same view" - critical for scientific tools.
 * 
 * Features:
 * - Serializes state to URL parameters
 * - Parses URL on page load
 * - Supports deep linking
 * - History navigation (back/forward)
 * - Debounced updates to prevent excessive history entries
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { z } from 'zod';

// ============================================
// Types
// ============================================

interface UseUrlStateOptions<T> {
  /** Key for the URL parameter (default: 'state') */
  paramKey?: string;
  /** Debounce delay in ms (default: 500) */
  debounce?: number;
  /** Whether to replace or push history entries (default: true = replace) */
  replaceState?: boolean;
  /** Zod schema for validation */
  schema?: z.ZodType<T>;
  /** Default value if URL has no state */
  defaultValue: T;
}

interface UseUrlStateReturn<T> {
  /** Current state */
  state: T;
  /** Update state (also updates URL) */
  setState: (newState: Partial<T> | ((prev: T) => T)) => void;
  /** Reset to default state */
  resetState: () => void;
  /** Get shareable URL */
  getShareableUrl: () => string;
  /** Copy URL to clipboard */
  copyUrlToClipboard: () => Promise<boolean>;
  /** Whether state was loaded from URL */
  loadedFromUrl: boolean;
}

// ============================================
// Serialization Utilities
// ============================================

/**
 * Serialize state to URL-safe string
 */
function serializeState<T>(state: T): string {
  try {
    const json = JSON.stringify(state);
    // Use base64 for URL safety
    return btoa(encodeURIComponent(json));
  } catch {
    console.error('[useUrlState] Failed to serialize state');
    return '';
  }
}

/**
 * Deserialize state from URL string
 */
function deserializeState<T>(encoded: string, defaultValue: T): T {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json) as T;
  } catch {
    console.warn('[useUrlState] Failed to deserialize state, using default');
    return defaultValue;
  }
}

/**
 * Alternative: Serialize as readable query params (for simple states)
 */
function serializeToQueryParams(state: Record<string, unknown>): URLSearchParams {
  const params = new URLSearchParams();
  
  for (const [key, value] of Object.entries(state)) {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        params.set(key, value.join(','));
      } else if (typeof value === 'object') {
        params.set(key, JSON.stringify(value));
      } else {
        params.set(key, String(value));
      }
    }
  }
  
  return params;
}

/**
 * Parse query params back to state
 */
function parseQueryParams<T>(params: URLSearchParams, defaultValue: T): T {
  const result: Record<string, unknown> = { ...defaultValue as Record<string, unknown> };
  
  params.forEach((value, key) => {
    if (key in result) {
      const defaultType = typeof (defaultValue as Record<string, unknown>)[key];
      
      switch (defaultType) {
        case 'number':
          result[key] = parseFloat(value);
          break;
        case 'boolean':
          result[key] = value === 'true';
          break;
        case 'object':
          if (Array.isArray((defaultValue as Record<string, unknown>)[key])) {
            result[key] = value.split(',');
          } else {
            try {
              result[key] = JSON.parse(value);
            } catch {
              result[key] = value;
            }
          }
          break;
        default:
          result[key] = value;
      }
    }
  });
  
  return result as T;
}

// ============================================
// Main Hook
// ============================================

export function useUrlState<T extends Record<string, unknown>>(
  options: UseUrlStateOptions<T>
): UseUrlStateReturn<T> {
  const {
    paramKey = 'state',
    debounce = 500,
    replaceState = true,
    schema,
    defaultValue,
  } = options;

  const [loadedFromUrl, setLoadedFromUrl] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize state from URL or default
  const [state, setStateInternal] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const encodedState = urlParams.get(paramKey);

    if (encodedState) {
      const parsed = deserializeState<T>(encodedState, defaultValue);
      
      // Validate with schema if provided
      if (schema) {
        const result = schema.safeParse(parsed);
        if (result.success) {
          setLoadedFromUrl(true);
          return result.data;
        }
        console.warn('[useUrlState] Schema validation failed:', result.error);
      } else {
        setLoadedFromUrl(true);
        return parsed;
      }
    }

    return defaultValue;
  });

  // Update URL when state changes
  const updateUrl = useCallback((newState: T) => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);
    const serialized = serializeState(newState);
    
    if (serialized) {
      url.searchParams.set(paramKey, serialized);
    } else {
      url.searchParams.delete(paramKey);
    }

    if (replaceState) {
      window.history.replaceState({}, '', url.toString());
    } else {
      window.history.pushState({}, '', url.toString());
    }
  }, [paramKey, replaceState]);

  // Debounced URL update
  const debouncedUpdateUrl = useCallback((newState: T) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      updateUrl(newState);
    }, debounce);
  }, [updateUrl, debounce]);

  // Main setState function
  const setState = useCallback((newStateOrUpdater: Partial<T> | ((prev: T) => T)) => {
    setStateInternal((prev) => {
      let newState: T;
      
      if (typeof newStateOrUpdater === 'function') {
        newState = newStateOrUpdater(prev);
      } else {
        newState = { ...prev, ...newStateOrUpdater };
      }

      // Validate with schema if provided
      if (schema) {
        const result = schema.safeParse(newState);
        if (!result.success) {
          console.error('[useUrlState] Invalid state:', result.error);
          return prev;
        }
        newState = result.data;
      }

      debouncedUpdateUrl(newState);
      return newState;
    });
  }, [schema, debouncedUpdateUrl]);

  // Reset to default
  const resetState = useCallback(() => {
    setStateInternal(defaultValue);
    
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete(paramKey);
      window.history.replaceState({}, '', url.toString());
    }
  }, [defaultValue, paramKey]);

  // Get shareable URL
  const getShareableUrl = useCallback((): string => {
    if (typeof window === 'undefined') return '';
    
    const url = new URL(window.location.href);
    url.searchParams.set(paramKey, serializeState(state));
    return url.toString();
  }, [state, paramKey]);

  // Copy URL to clipboard
  const copyUrlToClipboard = useCallback(async (): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(getShareableUrl());
      return true;
    } catch (error) {
      console.error('[useUrlState] Failed to copy URL:', error);
      return false;
    }
  }, [getShareableUrl]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const encodedState = urlParams.get(paramKey);
      
      if (encodedState) {
        const parsed = deserializeState<T>(encodedState, defaultValue);
        setStateInternal(parsed);
      } else {
        setStateInternal(defaultValue);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [paramKey, defaultValue]);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    state,
    setState,
    resetState,
    getShareableUrl,
    copyUrlToClipboard,
    loadedFromUrl,
  };
}

// ============================================
// Specialized Hooks for Common Use Cases
// ============================================

/**
 * Hook for gene view URL state
 */
export interface GeneViewUrlState {
  gene: string;
  showDomains: boolean;
  showMutations: boolean;
  mutationTypes: string[];
  highlightPositions: number[];
}

export function useGeneViewUrlState(defaultGene = 'TP53') {
  return useUrlState<GeneViewUrlState>({
    paramKey: 'gv',
    defaultValue: {
      gene: defaultGene,
      showDomains: true,
      showMutations: true,
      mutationTypes: [],
      highlightPositions: [],
    },
    schema: z.object({
      gene: z.string().min(1),
      showDomains: z.boolean(),
      showMutations: z.boolean(),
      mutationTypes: z.array(z.string()),
      highlightPositions: z.array(z.number()),
    }),
  });
}

/**
 * Hook for sample matrix URL state
 */
export interface SampleMatrixUrlState {
  genes: string[];
  samples: string[];
  sortBy: 'gene' | 'sample' | 'frequency';
  colorBy: 'mutationType' | 'vaf';
}

export function useSampleMatrixUrlState(defaultGenes: string[] = ['TP53', 'EGFR', 'KRAS']) {
  return useUrlState<SampleMatrixUrlState>({
    paramKey: 'sm',
    defaultValue: {
      genes: defaultGenes,
      samples: [],
      sortBy: 'frequency',
      colorBy: 'mutationType',
    },
    schema: z.object({
      genes: z.array(z.string()),
      samples: z.array(z.string()),
      sortBy: z.enum(['gene', 'sample', 'frequency']),
      colorBy: z.enum(['mutationType', 'vaf']),
    }),
  });
}

/**
 * Hook for survival plot URL state
 */
export interface SurvivalUrlState {
  groups: Array<{ name: string; sampleIds: string[] }>;
  timeUnit: 'days' | 'months' | 'years';
  showCI: boolean;
}

export function useSurvivalUrlState() {
  return useUrlState<SurvivalUrlState>({
    paramKey: 'surv',
    defaultValue: {
      groups: [],
      timeUnit: 'months',
      showCI: true,
    },
    schema: z.object({
      groups: z.array(z.object({
        name: z.string(),
        sampleIds: z.array(z.string()),
      })),
      timeUnit: z.enum(['days', 'months', 'years']),
      showCI: z.boolean(),
    }),
  });
}

// ============================================
// ShareView Component Helper
// ============================================

export interface ShareViewProps {
  getUrl: () => string;
  onCopy?: () => void;
}

/**
 * Utility function to create share button behavior
 */
export function createShareHandler(getUrl: () => string) {
  return {
    async copy(): Promise<boolean> {
      try {
        await navigator.clipboard.writeText(getUrl());
        return true;
      } catch {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = getUrl();
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      }
    },
    
    open(): void {
      window.open(getUrl(), '_blank');
    },
    
    getUrl,
  };
}

export default useUrlState;
