/**
 * Mutation Types
 *
 * Type definitions for mutations, variants, and fusion breakpoints
 */

/**
 * Consequence types for protein-coding mutations
 */
export type ConsequenceType =
  | 'missense'
  | 'nonsense'
  | 'frameshift'
  | 'splice'
  | 'inframe_insertion'
  | 'inframe_deletion'
  | 'start_lost'
  | 'stop_lost'
  | 'synonymous';

/**
 * Mutation origin classification
 */
export type MutationOrigin = 'germline' | 'somatic' | 'unknown';

/**
 * ClinVar clinical significance
 */
export type ClinicalSignificance =
  | 'pathogenic'
  | 'likely_pathogenic'
  | 'uncertain'
  | 'likely_benign'
  | 'benign'
  | 'conflicting';

/**
 * Represents a protein mutation
 */
export interface Mutation {
  /** Unique identifier */
  id: string;
  /** Amino acid position (1-based) */
  position: number;
  /** Reference amino acid (single letter) */
  refAA: string;
  /** Alternate amino acid (single letter) */
  altAA: string;
  /** HGVS protein notation (e.g., "p.R248W") */
  hgvsp?: string;
  /** Consequence type */
  consequence: ConsequenceType;
  /** Germline or somatic origin */
  origin: MutationOrigin;
  /** Number of samples with this mutation */
  sampleCount: number;
  /** Sample IDs (optional) */
  samples?: string[];

  // Clinical annotations
  /** ClinVar significance */
  clinicalSignificance?: ClinicalSignificance;
  /** ClinVar ID */
  clinvarId?: string;
  /** COSMIC ID */
  cosmicId?: string;
  /** dbSNP rsID */
  rsId?: string;

  // Functional annotations
  /** Predicted functional impact (SIFT, PolyPhen, etc.) */
  functionalImpact?: 'high' | 'moderate' | 'low' | 'modifier';
  /** Is this in a hotspot region? */
  isHotspot?: boolean;

  // Population data
  /** gnomAD allele frequency */
  gnomadAF?: number;
}

/**
 * Stacked mutations at the same position
 */
export interface MutationStack {
  /** Amino acid position */
  position: number;
  /** All mutations at this position */
  mutations: Mutation[];
  /** Total sample count across all mutations */
  totalCount: number;
  /** Has germline mutations? */
  hasGermline: boolean;
  /** Has somatic mutations? */
  hasSomatic: boolean;
}

/**
 * Fusion breakpoint in a protein
 */
export interface FusionBreakpoint {
  /** Unique identifier */
  id: string;
  /** Position in this protein (1-based AA) */
  position: number;
  /** Partner gene symbol */
  partnerGene: string;
  /** Position in partner protein */
  partnerPosition: number;
  /** Is the fusion in-frame? */
  inFrame: boolean;
  /** 5' or 3' partner */
  orientation: '5prime' | '3prime';
  /** Number of samples with this fusion */
  sampleCount: number;
  /** Sample IDs */
  samples?: string[];
  /** Known fusion name (e.g., "BCR-ABL1") */
  fusionName?: string;
}

/**
 * Color scheme for consequence types
 */
export const CONSEQUENCE_COLORS: Record<ConsequenceType, string> = {
  missense: '#3498DB', // Blue
  nonsense: '#E74C3C', // Red
  frameshift: '#9B59B6', // Purple
  splice: '#F39C12', // Orange
  inframe_insertion: '#1ABC9C', // Teal
  inframe_deletion: '#E67E22', // Dark orange
  start_lost: '#C0392B', // Dark red
  stop_lost: '#8E44AD', // Dark purple
  synonymous: '#95A5A6', // Gray
};

/**
 * Labels for consequence types
 */
export const CONSEQUENCE_LABELS: Record<ConsequenceType, string> = {
  missense: 'Missense',
  nonsense: 'Nonsense',
  frameshift: 'Frameshift',
  splice: 'Splice site',
  inframe_insertion: 'In-frame insertion',
  inframe_deletion: 'In-frame deletion',
  start_lost: 'Start lost',
  stop_lost: 'Stop lost',
  synonymous: 'Synonymous',
};

/**
 * Shape indicators for consequence types
 */
export const CONSEQUENCE_SHAPES: Record<ConsequenceType, string> = {
  missense: 'circle',
  nonsense: 'square',
  frameshift: 'diamond',
  splice: 'triangle',
  inframe_insertion: 'plus',
  inframe_deletion: 'minus',
  start_lost: 'star',
  stop_lost: 'star',
  synonymous: 'circle',
};

/**
 * Get color for a mutation based on consequence
 */
export function getMutationColor(consequence: ConsequenceType): string {
  return CONSEQUENCE_COLORS[consequence] || '#95A5A6';
}

/**
 * Group mutations by position for stacking
 */
export function stackMutations(mutations: Mutation[]): MutationStack[] {
  const byPosition = new Map<number, Mutation[]>();

  for (const mutation of mutations) {
    const existing = byPosition.get(mutation.position) || [];
    existing.push(mutation);
    byPosition.set(mutation.position, existing);
  }

  const stacks: MutationStack[] = [];

  for (const [position, muts] of byPosition) {
    stacks.push({
      position,
      mutations: muts.sort((a, b) => b.sampleCount - a.sampleCount),
      totalCount: muts.reduce((sum, m) => sum + m.sampleCount, 0),
      hasGermline: muts.some((m) => m.origin === 'germline'),
      hasSomatic: muts.some((m) => m.origin === 'somatic'),
    });
  }

  return stacks.sort((a, b) => a.position - b.position);
}

/**
 * Format mutation for display
 */
export function formatMutation(mutation: Mutation): string {
  if (mutation.hgvsp) {
    return mutation.hgvsp;
  }
  return `p.${mutation.refAA}${mutation.position}${mutation.altAA}`;
}
