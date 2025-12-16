/**
 * Hi-C Contact Matrix Types
 */

export interface HicBin {
  row: number;
  col: number;
  value: number;
  startRow: number; // Genomic position
  endRow: number;
  startCol: number;
  endCol: number;
}

export interface HicMatrix {
  region: string;
  chromosome: string;
  startPos: number;
  endPos: number;
  resolution: number;
  normalization: string;
  bins: HicBin[];
  numBins: number;
  maxValue: number;
  minValue: number;
}

export interface TAD {
  start: number;
  end: number;
  startBin: number;
  endBin: number;
}

export interface HicSettings {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  colormap: 'red' | 'blue' | 'viridis';
  logScale: boolean;
  showTADs: boolean;
}
