/**
 * Mutation Types
 *
 * Based on ProteinPaint mutation data structures
 */

export type ConsequenceType =
  | 'missense'
  | 'nonsense'
  | 'frameshift'
  | 'inframe_deletion'
  | 'inframe_insertion'
  | 'splice'
  | 'synonymous'
  | 'silent'
  | 'other';

export interface ProteinDomain {
  name: string;
  description: string;
  start: number;
  end: number;
  color: string;
}

export interface Mutation {
  id: string; // Unique identifier
  gene?: string; // Gene symbol
  position: number; // Amino acid position
  aaRef: string; // Reference amino acid
  aaAlt: string; // Alternate amino acid
  aaChange: string; // e.g., "R175H"
  type: ConsequenceType; // Mutation type
  consequence?: string; // VEP consequence term
  count: number; // Total occurrences
  frequency?: number; // Frequency in dataset
  clinicalSignificance?: string; // e.g., "pathogenic"
  sampleIds: string[]; // Samples with this mutation
  chromosome?: string;
  genomicPosition?: number;
  reference?: string;
  alternate?: string;
}

export interface GeneData {
  gene: string;
  ensemblId?: string;
  transcriptId?: string;
  proteinId?: string;
  proteinLength: number;
  chromosome?: string;
  start?: number;
  end?: number;
  strand?: '+' | '-';
  domains: ProteinDomain[];
  mutations: Mutation[];
}

export interface MutationCluster {
  position: number;
  mutations: Mutation[];
  totalCount: number;
  maxY: number; // For stacking multiple mutations
}

/**
 * Color schemes for mutation types
 */
export const MUTATION_COLORS: Record<ConsequenceType, string> = {
  missense: '#3498db', // Blue
  nonsense: '#e74c3c', // Red
  frameshift: '#9b59b6', // Purple
  inframe_deletion: '#f39c12', // Orange
  inframe_insertion: '#1abc9c', // Teal
  splice: '#e67e22', // Dark orange
  synonymous: '#95a5a6', // Gray
  silent: '#95a5a6', // Gray (same as synonymous)
  other: '#7f8c8d', // Dark gray
};

export const MUTATION_LABELS: Record<ConsequenceType, string> = {
  missense: 'Missense',
  nonsense: 'Nonsense',
  frameshift: 'Frameshift',
  inframe_deletion: 'In-frame Deletion',
  inframe_insertion: 'In-frame Insertion',
  splice: 'Splice Site',
  synonymous: 'Synonymous',
  silent: 'Silent',
  other: 'Other',
};
