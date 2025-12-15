/**
 * Mutation type definitions for linked views
 */

export interface Mutation {
  id: string;
  gene: string;
  position: number;
  aaChange: string; // e.g., "R175H"
  consequence: ConsequenceType;
  sampleIds: string[]; // samples with this mutation
  hotspot?: boolean;
}

export type ConsequenceType =
  | 'missense'
  | 'nonsense'
  | 'frameshift'
  | 'inframe_deletion'
  | 'inframe_insertion'
  | 'splice'
  | 'synonymous';

export interface MutationSummary {
  gene: string;
  totalMutations: number;
  uniquePositions: number;
  mutatedSamples: number;
  consequenceCounts: Record<ConsequenceType, number>;
}
