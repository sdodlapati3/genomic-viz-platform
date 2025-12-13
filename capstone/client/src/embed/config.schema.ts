/**
 * Embed API Configuration Schema
 * 
 * Zod validation schemas for embed configuration
 * This ensures runtime type safety for config → render pipeline
 */

import { z } from 'zod';

// ============================================
// Base Schemas
// ============================================

const chromosomeSchema = z.enum([
  'chr1', 'chr2', 'chr3', 'chr4', 'chr5', 'chr6', 'chr7', 'chr8', 'chr9', 'chr10',
  'chr11', 'chr12', 'chr13', 'chr14', 'chr15', 'chr16', 'chr17', 'chr18', 'chr19', 'chr20',
  'chr21', 'chr22', 'chrX', 'chrY', 'chrM'
]);

const mutationTypeSchema = z.enum([
  'missense', 'nonsense', 'frameshift', 'splice', 'silent',
  'inframe_insertion', 'inframe_deletion', 'start_loss', 'stop_loss'
]);

const genomeAssemblySchema = z.enum(['hg38', 'hg19', 'mm10']);

// ============================================
// Shared Config Schemas
// ============================================

const dimensionsSchema = z.object({
  width: z.number().min(100).max(4000).default(800),
  height: z.number().min(100).max(4000).default(600),
  margin: z.object({
    top: z.number().min(0).default(40),
    right: z.number().min(0).default(40),
    bottom: z.number().min(0).default(60),
    left: z.number().min(0).default(60),
  }).default({}),
}).default({});

const styleSchema = z.object({
  fontFamily: z.string().default('Arial, sans-serif'),
  fontSize: z.number().min(8).max(32).default(12),
  colors: z.object({
    background: z.string().default('#ffffff'),
    primary: z.string().default('#3498db'),
    secondary: z.string().default('#2ecc71'),
    accent: z.string().default('#e74c3c'),
  }).default({}),
}).default({});

const hostSchema = z.union([
  z.string(), // CSS selector
  z.instanceof(HTMLElement),
]).optional();

// ============================================
// Gene View Configuration
// ============================================

export const geneViewConfigSchema = z.object({
  entrypoint: z.literal('gene'),
  
  // Required: Gene to display
  gene: z.string().min(1).max(50),
  
  // Genome assembly
  genome: genomeAssemblySchema.default('hg38'),
  
  // Display options
  showDomains: z.boolean().default(true),
  showMutations: z.boolean().default(true),
  showAxis: z.boolean().default(true),
  showLegend: z.boolean().default(true),
  
  // Highlight specific positions
  highlightPositions: z.array(z.number().int().positive()).default([]),
  
  // Mutation filter
  mutationFilter: z.object({
    types: z.array(mutationTypeSchema).default([]),
    minCount: z.number().int().min(0).default(1),
    maxCount: z.number().int().positive().optional(),
    samples: z.array(z.string()).default([]),
  }).default({}),
  
  // Interaction options
  interactive: z.boolean().default(true),
  tooltips: z.boolean().default(true),
  onClick: z.function()
    .args(z.object({
      position: z.number(),
      mutation: z.any(),
    }))
    .returns(z.void())
    .optional(),
  
  // Styling
  dimensions: dimensionsSchema,
  style: styleSchema,
  host: hostSchema,
  debug: z.boolean().default(false),
});

export type GeneViewConfig = z.infer<typeof geneViewConfigSchema>;

// ============================================
// Sample Matrix Configuration
// ============================================

export const sampleMatrixConfigSchema = z.object({
  entrypoint: z.literal('samplematrix'),
  
  // Required: Genes to display
  genes: z.array(z.string().min(1)).min(1),
  
  // Optional: Specific samples (otherwise all)
  samples: z.array(z.string()).default([]),
  
  // Cohort filter
  cohort: z.string().optional(),
  
  // Display options
  sortGenes: z.enum(['alphabetical', 'mutationFrequency', 'custom']).default('mutationFrequency'),
  sortSamples: z.enum(['alphabetical', 'mutationCount', 'clinical', 'custom']).default('mutationCount'),
  
  // Color scheme
  colorBy: z.enum(['mutationType', 'vaf', 'custom']).default('mutationType'),
  colorScale: z.record(z.string(), z.string()).optional(),
  
  // Cell options
  cellSize: z.number().min(5).max(50).default(15),
  cellPadding: z.number().min(0).max(10).default(1),
  
  // Row/column annotations
  showGeneAnnotations: z.boolean().default(true),
  showSampleAnnotations: z.boolean().default(true),
  
  // Interaction
  interactive: z.boolean().default(true),
  selectable: z.boolean().default(true),
  onSelect: z.function()
    .args(z.object({
      genes: z.array(z.string()),
      samples: z.array(z.string()),
    }))
    .returns(z.void())
    .optional(),
  
  // Styling
  dimensions: dimensionsSchema,
  style: styleSchema,
  host: hostSchema,
  debug: z.boolean().default(false),
});

export type SampleMatrixConfig = z.infer<typeof sampleMatrixConfigSchema>;

// ============================================
// Survival Plot Configuration
// ============================================

export const survivalPlotConfigSchema = z.object({
  entrypoint: z.literal('survival'),
  
  // Required: Cohort groups to compare
  groups: z.array(z.object({
    name: z.string().min(1),
    sampleIds: z.array(z.string()).min(1),
    color: z.string().optional(),
  })).min(1).max(5),
  
  // Time display
  timeUnit: z.enum(['days', 'months', 'years']).default('months'),
  maxTime: z.number().positive().optional(),
  
  // Display options
  showConfidenceInterval: z.boolean().default(true),
  showCensored: z.boolean().default(true),
  showAtRisk: z.boolean().default(true),
  showMedian: z.boolean().default(true),
  showPValue: z.boolean().default(true),
  
  // Statistical options
  confidenceLevel: z.number().min(0.8).max(0.99).default(0.95),
  
  // Interaction
  interactive: z.boolean().default(true),
  tooltips: z.boolean().default(true),
  
  // Styling
  dimensions: dimensionsSchema,
  style: styleSchema,
  host: hostSchema,
  debug: z.boolean().default(false),
});

export type SurvivalPlotConfig = z.infer<typeof survivalPlotConfigSchema>;

// ============================================
// Study View Configuration
// ============================================

export const studyViewConfigSchema = z.object({
  entrypoint: z.literal('studyview'),
  
  // Required: Study identifier
  study: z.string().min(1),
  
  // Filters
  filters: z.record(z.string(), z.unknown()).default({}),
  
  // Charts to display
  charts: z.array(z.enum([
    'mutationFrequency',
    'mutationType',
    'cancerType',
    'sampleType',
    'survivalOverview',
    'ageDistribution',
    'geneExpression',
  ])).default(['mutationFrequency', 'cancerType', 'survivalOverview']),
  
  // Layout
  layout: z.enum(['grid', 'row', 'column']).default('grid'),
  columns: z.number().min(1).max(4).default(2),
  
  // Interaction
  interactive: z.boolean().default(true),
  filterSync: z.boolean().default(true),
  onFilterChange: z.function()
    .args(z.record(z.string(), z.unknown()))
    .returns(z.void())
    .optional(),
  
  // Styling
  dimensions: dimensionsSchema,
  style: styleSchema,
  host: hostSchema,
  debug: z.boolean().default(false),
});

export type StudyViewConfig = z.infer<typeof studyViewConfigSchema>;

// ============================================
// Heatmap Configuration
// ============================================

export const heatmapConfigSchema = z.object({
  entrypoint: z.literal('heatmap'),
  
  // Data source
  dataSource: z.enum(['expression', 'cnv', 'custom']).default('expression'),
  
  // Gene/sample selection
  genes: z.array(z.string()).default([]),
  samples: z.array(z.string()).default([]),
  topN: z.number().int().min(1).max(500).default(50),
  
  // Clustering
  clusterRows: z.boolean().default(true),
  clusterColumns: z.boolean().default(true),
  clusterMethod: z.enum(['complete', 'average', 'single', 'ward']).default('complete'),
  distanceMetric: z.enum(['euclidean', 'manhattan', 'cosine', 'correlation']).default('euclidean'),
  
  // Display
  showRowDendrogram: z.boolean().default(true),
  showColumnDendrogram: z.boolean().default(true),
  showRowLabels: z.boolean().default(true),
  showColumnLabels: z.boolean().default(true),
  
  // Color scale
  colorScale: z.enum(['viridis', 'plasma', 'inferno', 'magma', 'cividis', 'RdBu', 'RdYlBu', 'PiYG']).default('RdBu'),
  colorCenter: z.number().default(0),
  
  // Interaction
  interactive: z.boolean().default(true),
  zoomable: z.boolean().default(true),
  
  // Styling
  dimensions: dimensionsSchema,
  style: styleSchema,
  host: hostSchema,
  debug: z.boolean().default(false),
});

export type HeatmapConfig = z.infer<typeof heatmapConfigSchema>;

// ============================================
// Volcano Plot Configuration
// ============================================

export const volcanoPlotConfigSchema = z.object({
  entrypoint: z.literal('volcano'),
  
  // Data
  group1: z.string(),
  group2: z.string(),
  
  // Thresholds
  pValueThreshold: z.number().min(0).max(1).default(0.05),
  foldChangeThreshold: z.number().positive().default(2),
  
  // Display
  showLabels: z.boolean().default(true),
  labelCount: z.number().int().min(0).max(50).default(10),
  highlightGenes: z.array(z.string()).default([]),
  
  // Interaction
  interactive: z.boolean().default(true),
  tooltips: z.boolean().default(true),
  onGeneClick: z.function()
    .args(z.object({
      gene: z.string(),
      log2FoldChange: z.number(),
      pValue: z.number(),
    }))
    .returns(z.void())
    .optional(),
  
  // Styling
  dimensions: dimensionsSchema,
  style: styleSchema,
  host: hostSchema,
  debug: z.boolean().default(false),
});

export type VolcanoPlotConfig = z.infer<typeof volcanoPlotConfigSchema>;

// ============================================
// Union Schema for All Configs
// ============================================

export const embedConfigSchema = z.discriminatedUnion('entrypoint', [
  geneViewConfigSchema,
  sampleMatrixConfigSchema,
  survivalPlotConfigSchema,
  studyViewConfigSchema,
  heatmapConfigSchema,
  volcanoPlotConfigSchema,
]);

export type EmbedConfig = z.infer<typeof embedConfigSchema>;

// ============================================
// Validation Functions
// ============================================

/**
 * Validate and parse embed configuration
 */
export function parseEmbedConfig(config: unknown): EmbedConfig {
  return embedConfigSchema.parse(config);
}

/**
 * Safe validation with error details
 */
export function validateEmbedConfig(config: unknown): {
  success: boolean;
  data?: EmbedConfig;
  errors?: Array<{ path: string; message: string }>;
} {
  const result = embedConfigSchema.safeParse(config);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    errors: result.error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    })),
  };
}

/**
 * Get default configuration for an entrypoint
 */
export function getDefaultConfig(entrypoint: EmbedConfig['entrypoint']): Partial<EmbedConfig> {
  switch (entrypoint) {
    case 'gene':
      return {
        entrypoint: 'gene',
        gene: 'TP53',
        genome: 'hg38',
        showDomains: true,
        showMutations: true,
      };
    case 'samplematrix':
      return {
        entrypoint: 'samplematrix',
        genes: ['TP53', 'EGFR', 'KRAS', 'BRAF', 'PIK3CA'],
      };
    case 'survival':
      return {
        entrypoint: 'survival',
        groups: [{ name: 'All Samples', sampleIds: [] }],
      };
    case 'studyview':
      return {
        entrypoint: 'studyview',
        study: 'default',
      };
    case 'heatmap':
      return {
        entrypoint: 'heatmap',
        dataSource: 'expression',
        topN: 50,
      };
    case 'volcano':
      return {
        entrypoint: 'volcano',
        group1: 'Control',
        group2: 'Treatment',
      };
    default:
      return {};
  }
}

export default {
  geneViewConfigSchema,
  sampleMatrixConfigSchema,
  survivalPlotConfigSchema,
  studyViewConfigSchema,
  heatmapConfigSchema,
  volcanoPlotConfigSchema,
  embedConfigSchema,
  parseEmbedConfig,
  validateEmbedConfig,
  getDefaultConfig,
};
