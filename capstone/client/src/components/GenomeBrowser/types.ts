/**
 * Genome Browser Type Definitions
 * 
 * Types for the track-based genome browser system
 */

// ============================================
// Coordinate Types
// ============================================

export type Chromosome = 
  | 'chr1' | 'chr2' | 'chr3' | 'chr4' | 'chr5' 
  | 'chr6' | 'chr7' | 'chr8' | 'chr9' | 'chr10'
  | 'chr11' | 'chr12' | 'chr13' | 'chr14' | 'chr15'
  | 'chr16' | 'chr17' | 'chr18' | 'chr19' | 'chr20'
  | 'chr21' | 'chr22' | 'chrX' | 'chrY' | 'chrM';

export interface GenomicRegion {
  chromosome: Chromosome;
  start: number;
  end: number;
}

export interface ViewState {
  region: GenomicRegion;
  pixelsPerBase: number;
}

// ============================================
// Track Types
// ============================================

export type TrackType = 
  | 'gene' 
  | 'mutation' 
  | 'coverage' 
  | 'custom'
  | 'ruler'
  | 'cytoband';

export interface TrackConfig {
  id: string;
  type: TrackType;
  label: string;
  height: number;
  visible: boolean;
  collapsed?: boolean;
  order?: number;
  options?: Record<string, unknown>;
}

export interface TrackData<T = unknown> {
  trackId: string;
  region: GenomicRegion;
  data: T[];
  loading: boolean;
  error?: string;
}

// ============================================
// Gene Track Data
// ============================================

export interface GeneFeature {
  id: string;
  symbol: string;
  name: string;
  chromosome: Chromosome;
  start: number;
  end: number;
  strand: '+' | '-';
  biotype?: string;
  exons: ExonFeature[];
  cdsStart?: number;
  cdsEnd?: number;
}

export interface ExonFeature {
  number: number;
  start: number;
  end: number;
  type: 'exon' | 'cds' | 'utr5' | 'utr3';
}

// ============================================
// Mutation Track Data
// ============================================

export interface MutationFeature {
  id: string;
  chromosome: Chromosome;
  position: number;
  ref: string;
  alt: string;
  type: MutationType;
  gene?: string;
  aaChange?: string;
  sampleCount: number;
  consequence?: string;
  vaf?: number;
}

export type MutationType = 
  | 'missense' 
  | 'nonsense' 
  | 'frameshift' 
  | 'splice' 
  | 'silent'
  | 'inframe_insertion'
  | 'inframe_deletion';

// ============================================
// Coverage Track Data
// ============================================

export interface CoveragePoint {
  position: number;
  coverage: number;
}

// ============================================
// Browser Configuration
// ============================================

export interface BrowserConfig {
  width: number;
  genome: 'hg38' | 'hg19' | 'mm10';
  initialRegion: GenomicRegion;
  tracks: TrackConfig[];
  showNavigation?: boolean;
  showCoordinates?: boolean;
  showCytoband?: boolean;
  minZoom?: number;
  maxZoom?: number;
}

// ============================================
// Navigation Events
// ============================================

export interface NavigationEvent {
  type: 'pan' | 'zoom' | 'jump';
  region: GenomicRegion;
  source: 'user' | 'api';
}

export interface SelectionEvent {
  type: 'region' | 'feature';
  region?: GenomicRegion;
  feature?: GeneFeature | MutationFeature;
}

// ============================================
// Track Renderer Interface
// ============================================

export interface TrackRenderer<T = unknown> {
  trackId: string;
  render: (
    ctx: CanvasRenderingContext2D | SVGGElement,
    data: T[],
    viewState: ViewState,
    config: TrackConfig
  ) => void;
  getTooltip?: (feature: T, x: number, y: number) => string;
  onClick?: (feature: T, event: MouseEvent) => void;
}

// ============================================
// Chromosome Sizes (hg38)
// ============================================

export const CHROMOSOME_SIZES_HG38: Record<Chromosome, number> = {
  chr1: 248956422,
  chr2: 242193529,
  chr3: 198295559,
  chr4: 190214555,
  chr5: 181538259,
  chr6: 170805979,
  chr7: 159345973,
  chr8: 145138636,
  chr9: 138394717,
  chr10: 133797422,
  chr11: 135086622,
  chr12: 133275309,
  chr13: 114364328,
  chr14: 107043718,
  chr15: 101991189,
  chr16: 90338345,
  chr17: 83257441,
  chr18: 80373285,
  chr19: 58617616,
  chr20: 64444167,
  chr21: 46709983,
  chr22: 50818468,
  chrX: 156040895,
  chrY: 57227415,
  chrM: 16569,
};

export default {
  CHROMOSOME_SIZES_HG38,
};
