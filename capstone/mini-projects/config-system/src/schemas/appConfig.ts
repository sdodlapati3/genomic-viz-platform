/**
 * Application Configuration Schema
 *
 * Top-level configuration for the visualization application,
 * including layout, tracks, and user preferences.
 */

import { z } from 'zod';
import { TrackSchema, DimensionSchema, ColorSchema } from './tracks';

// ============================================
// View Configuration
// ============================================

/**
 * Single view configuration
 */
export const ViewSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['main', 'detail', 'overview', 'panel']),
  dimensions: DimensionSchema.optional(),
  tracks: z.array(TrackSchema).default([]),
  linkedViews: z.array(z.string()).default([]),
  zoom: z
    .object({
      enabled: z.boolean().default(true),
      minScale: z.number().positive().default(0.1),
      maxScale: z.number().positive().default(10),
      currentScale: z.number().positive().default(1),
    })
    .default({}),
});

// ============================================
// Layout Configuration
// ============================================

/**
 * Layout configuration for multi-view arrangements
 */
export const LayoutSchema = z.object({
  type: z.enum(['single', 'horizontal', 'vertical', 'grid', 'custom']).default('single'),
  views: z.array(ViewSchema).min(1),
  gap: z.number().nonnegative().default(10),
  responsive: z.boolean().default(true),
});

// ============================================
// User Preferences
// ============================================

/**
 * User preference settings
 */
export const PreferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).default('light'),
  fontSize: z.enum(['small', 'medium', 'large']).default('medium'),
  animationsEnabled: z.boolean().default(true),
  animationDuration: z.number().nonnegative().default(300),
  tooltipsEnabled: z.boolean().default(true),
  tooltipDelay: z.number().nonnegative().default(200),
  highlightColor: ColorSchema.default('#ffc107'),
  selectionColor: ColorSchema.default('#2196f3'),
  keyboardShortcutsEnabled: z.boolean().default(true),
  autoSave: z.boolean().default(true),
  autoSaveInterval: z.number().positive().default(30000), // 30 seconds
});

// ============================================
// Data Source Configuration
// ============================================

/**
 * API endpoint configuration
 */
export const ApiEndpointSchema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
  timeout: z.number().positive().default(30000),
  retries: z.number().int().nonnegative().default(3),
  headers: z.record(z.string(), z.string()).default({}),
});

/**
 * Data sources configuration
 */
export const DataSourcesSchema = z.object({
  defaultSource: z.string().optional(),
  endpoints: z.array(ApiEndpointSchema).default([]),
  cacheEnabled: z.boolean().default(true),
  cacheDuration: z.number().positive().default(3600000), // 1 hour
});

// ============================================
// Main Application Configuration
// ============================================

/**
 * Complete application configuration
 */
export const AppConfigSchema = z.object({
  // Metadata
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be in semver format (x.y.z)'),
  name: z.string().min(1).default('Genomic Visualization'),
  description: z.string().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),

  // Layout and views
  layout: LayoutSchema,

  // User preferences
  preferences: PreferencesSchema.default({}),

  // Data sources
  dataSources: DataSourcesSchema.default({}),

  // Feature flags
  features: z
    .object({
      exportEnabled: z.boolean().default(true),
      exportFormats: z.array(z.enum(['png', 'svg', 'pdf', 'json'])).default(['png', 'svg']),
      shareEnabled: z.boolean().default(true),
      collaborationEnabled: z.boolean().default(false),
      historyEnabled: z.boolean().default(true),
      historyMaxEntries: z.number().int().positive().default(50),
    })
    .default({}),
});

// ============================================
// Type Exports
// ============================================

export type View = z.infer<typeof ViewSchema>;
export type Layout = z.infer<typeof LayoutSchema>;
export type Preferences = z.infer<typeof PreferencesSchema>;
export type ApiEndpoint = z.infer<typeof ApiEndpointSchema>;
export type DataSources = z.infer<typeof DataSourcesSchema>;
export type AppConfig = z.infer<typeof AppConfigSchema>;
