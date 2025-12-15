/**
 * Base Track Configuration Schemas
 *
 * Zod schemas for validating visualization track configurations.
 * Based on ProteinPaint's track configuration patterns.
 */

import { z } from 'zod';

// ============================================
// Common/Shared Schemas
// ============================================

/**
 * Color schema - supports hex, rgb, rgba, and named colors
 */
export const ColorSchema = z.string().refine(
  (val) => {
    // Hex color
    if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(val)) return true;
    // RGB/RGBA
    if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/.test(val)) return true;
    // Named colors (basic set)
    const namedColors = [
      'red',
      'blue',
      'green',
      'yellow',
      'orange',
      'purple',
      'pink',
      'cyan',
      'magenta',
      'black',
      'white',
      'gray',
      'grey',
    ];
    return namedColors.includes(val.toLowerCase());
  },
  { message: 'Invalid color format. Use hex (#RGB, #RRGGBB), rgb(), rgba(), or named color.' }
);

/**
 * Genomic position schema
 */
export const GenomicPositionSchema = z
  .object({
    chr: z.string().regex(/^(chr)?([1-9]|1[0-9]|2[0-2]|X|Y|M|MT)$/i, 'Invalid chromosome'),
    start: z.number().int().nonnegative(),
    stop: z.number().int().nonnegative(),
  })
  .refine((data) => data.stop >= data.start, {
    message: 'Stop position must be >= start position',
    path: ['stop'],
  });

/**
 * Dimension schema with validation
 */
export const DimensionSchema = z.object({
  width: z.number().positive().default(800),
  height: z.number().positive().default(400),
  margin: z
    .object({
      top: z.number().nonnegative().default(20),
      right: z.number().nonnegative().default(20),
      bottom: z.number().nonnegative().default(40),
      left: z.number().nonnegative().default(60),
    })
    .default({}),
});

// ============================================
// Track Type Schemas
// ============================================

/**
 * Base track configuration (common to all tracks)
 */
export const BaseTrackSchema = z.object({
  id: z.string().min(1, 'Track ID is required'),
  name: z.string().min(1, 'Track name is required'),
  type: z.string(),
  visible: z.boolean().default(true),
  height: z.number().positive().default(100),
  order: z.number().int().nonnegative().optional(),
});

/**
 * Mutation track configuration
 */
export const MutationTrackSchema = BaseTrackSchema.extend({
  type: z.literal('mutation'),
  gene: z.string().min(1, 'Gene name is required'),
  data: z.object({
    source: z.enum(['api', 'file', 'inline']),
    url: z.string().url().optional(),
    mutations: z
      .array(
        z.object({
          position: z.number().int().positive(),
          aaChange: z.string(),
          consequence: z.enum([
            'missense',
            'nonsense',
            'frameshift',
            'splice',
            'inframe_deletion',
            'inframe_insertion',
            'synonymous',
          ]),
          count: z.number().int().nonnegative().optional(),
        })
      )
      .optional(),
  }),
  display: z
    .object({
      lollipopRadius: z.number().positive().default(5),
      stemWidth: z.number().positive().default(1),
      colorByConsequence: z.boolean().default(true),
      consequenceColors: z.record(z.string(), ColorSchema).optional(),
      showLabels: z.boolean().default(false),
      labelThreshold: z.number().int().positive().default(5),
    })
    .default({}),
});

/**
 * Expression track configuration
 */
export const ExpressionTrackSchema = BaseTrackSchema.extend({
  type: z.literal('expression'),
  gene: z.string().min(1),
  data: z.object({
    source: z.enum(['api', 'file', 'inline']),
    url: z.string().url().optional(),
    values: z
      .array(
        z.object({
          sampleId: z.string(),
          value: z.number(),
          group: z.string().optional(),
        })
      )
      .optional(),
  }),
  display: z
    .object({
      plotType: z.enum(['boxplot', 'violin', 'dot', 'bar']).default('boxplot'),
      colorByGroup: z.boolean().default(true),
      groupColors: z.record(z.string(), ColorSchema).optional(),
      showOutliers: z.boolean().default(true),
      outlierMethod: z.enum(['iqr', 'zscore', 'mad']).default('iqr'),
      outlierThreshold: z.number().positive().default(1.5),
    })
    .default({}),
});

/**
 * Domain track configuration (for protein domains)
 */
export const DomainTrackSchema = BaseTrackSchema.extend({
  type: z.literal('domain'),
  protein: z.string().min(1),
  data: z.object({
    source: z.enum(['api', 'file', 'inline']),
    url: z.string().url().optional(),
    domains: z
      .array(
        z.object({
          name: z.string(),
          start: z.number().int().positive(),
          end: z.number().int().positive(),
          color: ColorSchema.optional(),
          description: z.string().optional(),
        })
      )
      .optional(),
  }),
  display: z
    .object({
      height: z.number().positive().default(30),
      showLabels: z.boolean().default(true),
      labelPosition: z.enum(['inside', 'above', 'below']).default('inside'),
      defaultColor: ColorSchema.default('#3498db'),
    })
    .default({}),
});

/**
 * Genome browser track configuration
 */
export const GenomeBrowserTrackSchema = BaseTrackSchema.extend({
  type: z.literal('genome'),
  position: GenomicPositionSchema,
  reference: z.enum(['hg38', 'hg19', 'mm10', 'mm39']).default('hg38'),
  data: z.object({
    source: z.enum(['api', 'bigwig', 'bigbed', 'vcf']),
    url: z.string().url(),
    indexUrl: z.string().url().optional(),
  }),
  display: z
    .object({
      color: ColorSchema.default('#1a73e8'),
      scale: z.enum(['linear', 'log']).default('linear'),
      autoscale: z.boolean().default(true),
      minValue: z.number().optional(),
      maxValue: z.number().optional(),
    })
    .default({}),
});

/**
 * Heatmap track configuration
 */
export const HeatmapTrackSchema = BaseTrackSchema.extend({
  type: z.literal('heatmap'),
  data: z.object({
    source: z.enum(['api', 'file', 'inline']),
    url: z.string().url().optional(),
    matrix: z.array(z.array(z.number())).optional(),
    rowLabels: z.array(z.string()).optional(),
    colLabels: z.array(z.string()).optional(),
  }),
  display: z
    .object({
      colorScale: z
        .enum(['viridis', 'inferno', 'plasma', 'blues', 'reds', 'diverging'])
        .default('viridis'),
      showRowLabels: z.boolean().default(true),
      showColLabels: z.boolean().default(true),
      cellSize: z.number().positive().default(10),
      clustering: z
        .object({
          rows: z.boolean().default(false),
          cols: z.boolean().default(false),
          method: z.enum(['hierarchical', 'kmeans']).default('hierarchical'),
        })
        .default({}),
    })
    .default({}),
});

// ============================================
// Union Track Schema
// ============================================

/**
 * Any valid track configuration
 */
export const TrackSchema = z.discriminatedUnion('type', [
  MutationTrackSchema,
  ExpressionTrackSchema,
  DomainTrackSchema,
  GenomeBrowserTrackSchema,
  HeatmapTrackSchema,
]);

// ============================================
// Type Exports
// ============================================

export type Color = z.infer<typeof ColorSchema>;
export type GenomicPosition = z.infer<typeof GenomicPositionSchema>;
export type Dimension = z.infer<typeof DimensionSchema>;
export type BaseTrack = z.infer<typeof BaseTrackSchema>;
export type MutationTrack = z.infer<typeof MutationTrackSchema>;
export type ExpressionTrack = z.infer<typeof ExpressionTrackSchema>;
export type DomainTrack = z.infer<typeof DomainTrackSchema>;
export type GenomeBrowserTrack = z.infer<typeof GenomeBrowserTrackSchema>;
export type HeatmapTrack = z.infer<typeof HeatmapTrackSchema>;
export type Track = z.infer<typeof TrackSchema>;
