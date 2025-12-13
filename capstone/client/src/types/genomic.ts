/**
 * Genomic Type Definitions
 * 
 * Core TypeScript interfaces for genomic data visualization
 * These types mirror ProteinPaint's data structures
 */

// ============================================
// Coordinate System Types
// ============================================

/**
 * Genomic coordinate on a chromosome
 */
export interface GenomicPosition {
  chromosome: Chromosome;
  position: number;
  strand?: Strand;
}

/**
 * Genomic region/range
 */
export interface GenomicRegion {
  chromosome: Chromosome;
  start: number;
  end: number;
  strand?: Strand;
}

export type Chromosome = 
  | 'chr1' | 'chr2' | 'chr3' | 'chr4' | 'chr5' 
  | 'chr6' | 'chr7' | 'chr8' | 'chr9' | 'chr10'
  | 'chr11' | 'chr12' | 'chr13' | 'chr14' | 'chr15'
  | 'chr16' | 'chr17' | 'chr18' | 'chr19' | 'chr20'
  | 'chr21' | 'chr22' | 'chrX' | 'chrY' | 'chrM';

export type Strand = '+' | '-';

// ============================================
// Gene Types
// ============================================

/**
 * Gene definition with transcript information
 */
export interface Gene {
  id: string;
  symbol: string;
  name: string;
  chromosome: Chromosome;
  start: number;
  end: number;
  strand: Strand;
  transcripts?: Transcript[];
  proteinLength?: number;
  domains?: ProteinDomain[];
}

/**
 * Transcript isoform
 */
export interface Transcript {
  id: string;
  geneId: string;
  name: string;
  chromosome: Chromosome;
  start: number;
  end: number;
  strand: Strand;
  exons: Exon[];
  cdsStart?: number;
  cdsEnd?: number;
  isCanonical?: boolean;
}

/**
 * Exon definition
 */
export interface Exon {
  number: number;
  start: number;
  end: number;
}

/**
 * Protein domain
 */
export interface ProteinDomain {
  name: string;
  description?: string;
  start: number;
  end: number;
  color?: string;
  source?: string;
}

// ============================================
// Mutation Types
// ============================================

/**
 * Mutation type classification
 */
export type MutationType = 
  | 'missense' 
  | 'nonsense' 
  | 'frameshift' 
  | 'splice' 
  | 'silent'
  | 'inframe_insertion'
  | 'inframe_deletion'
  | 'start_loss'
  | 'stop_loss';

/**
 * Single nucleotide variant
 */
export interface Mutation {
  id: string;
  gene: string;
  chromosome: Chromosome;
  position: number;
  refAllele: string;
  altAllele: string;
  type: MutationType;
  aaChange?: string;
  aaPosition?: number;
  consequence?: string;
  sampleId?: string;
  sampleCount?: number;
  frequency?: number;
}

/**
 * Mutation aggregated by position (for lollipop plots)
 */
export interface MutationCluster {
  position: number;
  aaPosition: number;
  aaChange: string;
  type: MutationType;
  count: number;
  samples: string[];
  mutations: Mutation[];
}

/**
 * Lollipop plot data structure
 */
export interface LollipopData {
  gene: Gene;
  mutations: MutationCluster[];
  domains: ProteinDomain[];
  totalSamples?: number;
}

// ============================================
// Sample & Clinical Types
// ============================================

/**
 * Sample type classification
 */
export type SampleType = 'tumor' | 'normal' | 'metastasis';

/**
 * Vital status
 */
export type VitalStatus = 'alive' | 'deceased' | 'unknown';

/**
 * Sample/patient information
 */
export interface Sample {
  id: string;
  patientId?: string;
  sampleType: SampleType;
  cancerType?: string;
  cancerSubtype?: string;
  stage?: string;
  grade?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  survivalDays?: number;
  vitalStatus?: VitalStatus;
  treatmentHistory?: Treatment[];
  metadata?: Record<string, unknown>;
}

/**
 * Treatment information
 */
export interface Treatment {
  type: string;
  name: string;
  startDate?: string;
  endDate?: string;
  response?: string;
}

// ============================================
// Expression Types
// ============================================

/**
 * Gene expression value
 */
export interface ExpressionValue {
  geneId: string;
  sampleId: string;
  value: number;
  unit?: 'TPM' | 'FPKM' | 'RPKM' | 'counts';
}

/**
 * Expression matrix (genes x samples)
 */
export interface ExpressionMatrix {
  genes: string[];
  samples: string[];
  values: number[][];
  unit: 'TPM' | 'FPKM' | 'RPKM' | 'counts';
}

/**
 * Differential expression result
 */
export interface DifferentialExpression {
  geneId: string;
  geneSymbol: string;
  log2FoldChange: number;
  pValue: number;
  adjustedPValue: number;
  baseMean?: number;
  group1Mean?: number;
  group2Mean?: number;
}

// ============================================
// Survival Types
// ============================================

/**
 * Survival data point
 */
export interface SurvivalDataPoint {
  time: number;
  survival: number;
  event: boolean;
  atRisk: number;
  censored?: number;
  ciLower?: number;
  ciUpper?: number;
}

/**
 * Survival curve for a cohort
 */
export interface SurvivalCurve {
  name: string;
  color?: string;
  data: SurvivalDataPoint[];
  medianSurvival?: number;
  sampleCount: number;
  eventCount: number;
}

/**
 * Survival analysis result
 */
export interface SurvivalAnalysis {
  curves: SurvivalCurve[];
  logRankPValue?: number;
  hazardRatio?: number;
  hazardRatioCI?: [number, number];
}

// ============================================
// Visualization Config Types
// ============================================

/**
 * Color scale configuration
 */
export interface ColorScale {
  type: 'sequential' | 'diverging' | 'categorical';
  domain: (number | string)[];
  range: string[];
}

/**
 * Axis configuration
 */
export interface AxisConfig {
  label: string;
  visible: boolean;
  ticks?: number;
  format?: string;
}

/**
 * Margin configuration
 */
export interface Margin {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Dimension configuration
 */
export interface Dimensions {
  width: number;
  height: number;
  margin?: Margin;
}

// ============================================
// Embed API Types (ProteinPaint-style)
// ============================================

/**
 * Base embed configuration
 */
export interface BaseEmbedConfig {
  host?: HTMLElement | string;
  debug?: boolean;
}

/**
 * Gene view embed configuration
 */
export interface GeneViewConfig extends BaseEmbedConfig {
  entrypoint: 'gene';
  gene: string;
  genome?: 'hg38' | 'hg19';
  showDomains?: boolean;
  showMutations?: boolean;
  highlightPositions?: number[];
  mutationFilter?: {
    types?: MutationType[];
    minCount?: number;
  };
}

/**
 * Sample matrix embed configuration
 */
export interface SampleMatrixConfig extends BaseEmbedConfig {
  entrypoint: 'samplematrix';
  genes: string[];
  samples?: string[];
  cohort?: string;
  sortBy?: 'gene' | 'sample' | 'mutationCount';
  colorBy?: 'mutationType' | 'custom';
}

/**
 * Survival plot embed configuration
 */
export interface SurvivalPlotConfig extends BaseEmbedConfig {
  entrypoint: 'survival';
  groups: {
    name: string;
    sampleIds: string[];
  }[];
  timeUnit?: 'days' | 'months' | 'years';
  showConfidenceInterval?: boolean;
  showAtRisk?: boolean;
}

/**
 * Study view embed configuration
 */
export interface StudyViewConfig extends BaseEmbedConfig {
  entrypoint: 'studyview';
  study: string;
  filters?: Record<string, unknown>;
  charts?: string[];
}

/**
 * Union type for all embed configurations
 */
export type EmbedConfig = 
  | GeneViewConfig 
  | SampleMatrixConfig 
  | SurvivalPlotConfig 
  | StudyViewConfig;

// ============================================
// API Response Types
// ============================================

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * API error response
 */
export interface ApiError {
  error: string;
  message: string;
  details?: Array<{
    path: string;
    message: string;
    code?: string;
  }>;
}

// ============================================
// Utility Types
// ============================================

/**
 * Make all properties of T optional recursively
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys of T that have value type V
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Nullable type helper
 */
export type Nullable<T> = T | null;

/**
 * ID type (string UUID)
 */
export type ID = string;
