/**
 * Oncoprint Types
 *
 * Type definitions for the Gene × Sample mutation matrix visualization
 */

// Mutation consequence types
export type ConsequenceType =
  | 'missense'
  | 'nonsense'
  | 'frameshift'
  | 'splice'
  | 'inframe_indel'
  | 'silent'
  | 'other';

// Truncating mutations (nonsense, frameshift, splice)
export const TRUNCATING_TYPES: ConsequenceType[] = ['nonsense', 'frameshift', 'splice'];

// Mutation colors matching ProteinPaint conventions
export const MUTATION_COLORS: Record<ConsequenceType, string> = {
  missense: '#3987cc', // Blue
  nonsense: '#e74c3c', // Red
  frameshift: '#27ae60', // Green
  splice: '#f39c12', // Orange
  inframe_indel: '#9b59b6', // Purple
  silent: '#95a5a6', // Gray
  other: '#7f8c8d', // Dark gray
};

export const MUTATION_LABELS: Record<ConsequenceType, string> = {
  missense: 'Missense',
  nonsense: 'Nonsense',
  frameshift: 'Frameshift',
  splice: 'Splice Site',
  inframe_indel: 'In-frame Indel',
  silent: 'Silent',
  other: 'Other',
};

// A single mutation event
export interface MutationEvent {
  id: string;
  gene: string;
  sampleId: string;
  position: number;
  aaChange: string; // e.g., "R175H"
  type: ConsequenceType;
  vaf?: number; // Variant allele frequency (optional)
}

// A cell in the oncoprint matrix
export interface OncoprintCell {
  gene: string;
  sampleId: string;
  mutations: MutationEvent[];
  hasMutation: boolean;
}

// Row data (gene)
export interface GeneRow {
  gene: string;
  cells: OncoprintCell[];
  mutationCount: number; // Total mutations across all samples
  sampleCount: number; // Number of samples with mutations
  frequency: number; // Percentage of samples mutated
}

// Column data (sample)
export interface SampleColumn {
  sampleId: string;
  disease?: string;
  mutationCount: number; // Total mutations in this sample
  genes: string[]; // Genes mutated in this sample
}

// Clinical annotation for samples
export interface SampleAnnotation {
  sampleId: string;
  disease: string;
  stage?: string;
  age?: number;
  gender?: string;
}

// Full oncoprint data model
export interface OncoprintData {
  genes: GeneRow[];
  samples: SampleColumn[];
  annotations: SampleAnnotation[];
  totalMutations: number;
}

// Sort options
export type SortField = 'frequency' | 'gene' | 'sample' | 'mutations';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// Filter options
export interface FilterConfig {
  mutationTypes: ConsequenceType[];
  minFrequency: number;
  genes: string[];
  samples: string[];
}

// Configuration for the Oncoprint component
export interface OncoprintConfig {
  width: number;
  height: number;
  cellWidth: number;
  cellHeight: number;
  cellPadding: number;
  labelWidth: number; // Width for gene labels
  annotationHeight: number; // Height for sample annotations
  showAnnotations: boolean;
  showFrequency: boolean;
  enableZoom: boolean;
  transitionDuration: number;
}

// Event types for linked views
export interface OncoprintSelectionEvent {
  genes: string[];
  samples: string[];
  mutations: MutationEvent[];
  source: string;
}

export interface OncoprintHighlightEvent {
  gene?: string;
  sampleId?: string;
  cell?: OncoprintCell;
  source: string;
}
