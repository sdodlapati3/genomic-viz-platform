/**
 * Type Exports
 */

export * from './protein';
export * from './mutation';

// Re-export common types for convenience
export type {
  Protein,
  ProteinDomain,
  ProteinRegion,
  PTMSite,
  ProteinData,
  DomainSource,
} from './protein';

export type {
  Mutation,
  MutationStack,
  FusionBreakpoint,
  ConsequenceType,
  MutationOrigin,
  ClinicalSignificance,
} from './mutation';
