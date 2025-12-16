// CNV Track Types

export interface Chromosome {
  id: string;
  name: string;
  size: number;
  centromereStart: number;
  centromereEnd: number;
}

export interface Cytoband {
  chromosome: string;
  start: number;
  end: number;
  name: string;
  stain: 'gneg' | 'gpos25' | 'gpos50' | 'gpos75' | 'gpos100' | 'acen' | 'gvar' | 'stalk';
}

export interface CNVSegment {
  id: string;
  chromosome: string;
  start: number;
  end: number;
  log2Ratio: number;
  segmentMean: number;
  probeCount: number;
  call: 'amplification' | 'gain' | 'neutral' | 'loss' | 'deep_deletion';
  genes: string[];
}

export interface CNVProbe {
  chromosome: string;
  position: number;
  log2Ratio: number;
}

export interface Gene {
  symbol: string;
  chromosome: string;
  start: number;
  end: number;
  strand: '+' | '-';
  type: 'oncogene' | 'tumor_suppressor' | 'other';
}

export interface CNVSample {
  id: string;
  name: string;
  description: string;
  segments: CNVSegment[];
  probes: CNVProbe[];
  genes: Gene[];
  metadata: {
    ploidy: number;
    purity: number;
    nSegments: number;
    fractionAltered: number;
  };
}

export interface CNVConfig {
  container: string;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  view: 'linear' | 'heatmap' | 'segments';
  colorBy: 'gainloss' | 'logr' | 'segment';
  chromosome: string;
  showGenes: boolean;
  showCytobands: boolean;
  log2Threshold: number;
}

export interface CNVColors {
  amplification: string;
  gain: string;
  neutral: string;
  loss: string;
  deepDeletion: string;
}
