/**
 * Sample type definitions for linked views
 * Represents patient/sample data with associated mutations and expression
 */

export interface Sample {
  id: string;
  patientId: string;
  sampleType: SampleType;
  diagnosis: string;
  age?: number;
  sex?: 'M' | 'F' | 'Unknown';
  mutations: string[]; // mutation IDs
  selected?: boolean;
  highlighted?: boolean;
}

export type SampleType = 'tumor' | 'normal' | 'cell_line' | 'xenograft';

export interface SampleGroup {
  name: string;
  samples: Sample[];
  color: string;
}

export interface SampleFilterCriteria {
  sampleTypes?: SampleType[];
  diagnoses?: string[];
  hasGene?: string;
  minMutationCount?: number;
  maxMutationCount?: number;
}

export interface SampleMetadata {
  totalSamples: number;
  sampleTypeCounts: Record<SampleType, number>;
  diagnosisCounts: Record<string, number>;
  mutationCountDistribution: {
    min: number;
    max: number;
    mean: number;
    median: number;
  };
}
