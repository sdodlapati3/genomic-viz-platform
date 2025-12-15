/**
 * Genome Browser Type Definitions
 */

// Genomic coordinates
export interface GenomicRegion {
  chromosome: string;
  start: number;
  end: number;
}

// Track types
export type TrackType = 'gene' | 'mutation' | 'signal' | 'annotation';

// Base track configuration
export interface TrackConfig {
  id: string;
  type: TrackType;
  name: string;
  height: number;
  visible: boolean;
  collapsed: boolean;
}

// Gene feature
export interface GeneFeature {
  id: string;
  symbol: string;
  chromosome: string;
  start: number;
  end: number;
  strand: '+' | '-';
  exons: Exon[];
  transcripts?: Transcript[];
}

export interface Exon {
  start: number;
  end: number;
  type: 'exon' | 'utr5' | 'utr3' | 'cds';
}

export interface Transcript {
  id: string;
  start: number;
  end: number;
  exons: Exon[];
}

// Mutation feature
export interface MutationFeature {
  id: string;
  chromosome: string;
  position: number;
  ref: string;
  alt: string;
  gene?: string;
  aaChange?: string;
  consequence: ConsequenceType;
  sampleCount: number;
  vaf?: number;
}

export type ConsequenceType =
  | 'missense'
  | 'nonsense'
  | 'frameshift'
  | 'splice'
  | 'inframe_indel'
  | 'synonymous'
  | 'intron'
  | 'utr'
  | 'other';

// Signal data point
export interface SignalPoint {
  position: number;
  value: number;
}

// Annotation feature
export interface AnnotationFeature {
  id: string;
  chromosome: string;
  start: number;
  end: number;
  name: string;
  type: string;
  color?: string;
}

// Track data types
export interface GeneTrackData {
  genes: GeneFeature[];
}

export interface MutationTrackData {
  mutations: MutationFeature[];
}

export interface SignalTrackData {
  points: SignalPoint[];
  min: number;
  max: number;
}

export interface AnnotationTrackData {
  annotations: AnnotationFeature[];
}

// Browser configuration
export interface BrowserConfig {
  width: number;
  trackAreaHeight: number;
  rulerHeight: number;
  labelWidth: number;
  minBp: number; // Minimum base pairs visible
  maxBp: number; // Maximum base pairs visible
}

// Browser state
export interface BrowserState {
  region: GenomicRegion;
  tracks: TrackConfig[];
  selectedFeature: string | null;
  hoveredFeature: string | null;
}

// Ruler tick
export interface RulerTick {
  position: number;
  x: number;
  label: string;
  major: boolean;
}
