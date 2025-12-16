/**
 * Base arc interface for circular visualizations
 */
export interface Arc {
  startAngle: number;
  endAngle: number;
  innerRadius: number;
  outerRadius: number;
  color: string;
  text?: string;
}

/**
 * Chromosome definition with size and angle mapping
 */
export interface Chromosome extends Arc {
  name: string;
  size: number;
  /** Midpoint angle for label positioning */
  angle: number;
}

/**
 * Single nucleotide variant or indel
 */
export interface SnvData {
  chr: string;
  pos: number;
  gene: string;
  class: MutationClass;
  mname?: string; // mutation name like "R175H"
}

export interface SnvArc extends Arc {
  chr: string;
  pos: number;
  gene: string;
  mname?: string;
  mutClass: MutationClass;
}

/**
 * Copy number variation
 */
export interface CnvData {
  chr: string;
  start: number;
  end: number;
  value: number; // log2 ratio: positive = gain, negative = loss
}

export interface CnvArc extends Arc {
  chr: string;
  start: number;
  end: number;
  value: number;
  type: 'gain' | 'loss';
}

/**
 * Loss of heterozygosity (LOH) data
 */
export interface LohData {
  chr: string;
  start: number;
  end: number;
  bafValue: number; // B-allele frequency (0.5 = normal, 0 or 1 = LOH)
  copyNeutral?: boolean; // Copy-neutral LOH
}

export interface LohArc extends Arc {
  chr: string;
  start: number;
  end: number;
  bafValue: number;
  copyNeutral: boolean;
  type: 'loh' | 'cnloh';
}

/**
 * Fusion / Structural variant
 */
export interface FusionData {
  chrA: string;
  posA: number;
  geneA: string;
  chrB: string;
  posB: number;
  geneB: string;
}

export interface FusionChord {
  source: {
    startAngle: number;
    endAngle: number;
  };
  target: {
    startAngle: number;
    endAngle: number;
  };
  chrA: string;
  posA: number;
  geneA: string;
  chrB: string;
  posB: number;
  geneB: string;
  color: string;
}

/**
 * Mutation classes from ProteinPaint
 */
export type MutationClass =
  | 'missense'
  | 'nonsense'
  | 'frameshift'
  | 'splice'
  | 'inframe'
  | 'silent'
  | 'utr_5'
  | 'utr_3'
  | 'intron'
  | 'other';

/**
 * Sample data containing all variants
 */
export interface SampleData {
  sample: string;
  mutations: SnvData[];
  cnv: CnvData[];
  fusions: FusionData[];
  loh?: LohData[]; // Optional LOH data
}

/**
 * Disco plot settings
 */
export interface DiscoSettings {
  radius: number;
  padAngle: number;
  chromosomeWidth: number;
  snvRingWidth: number;
  cnvRingWidth: number;
  lohRingWidth: number; // LOH layer width
  showLabels: boolean;
  showSnv: boolean;
  showCnv: boolean;
  showFusions: boolean;
  showLoh: boolean; // LOH layer toggle
}

/**
 * Reference genome chromosome sizes
 */
export interface GenomeReference {
  name: string;
  chromosomes: { [chr: string]: number };
  order: string[];
}
