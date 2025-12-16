// Gene Expression Types

export interface Gene {
  id: string;
  symbol: string;
  name: string;
  chromosome: string;
  start: number;
  end: number;
}

export interface Sample {
  id: string;
  name: string;
  group: string;
  metadata: Record<string, string | number>;
}

export interface ExpressionValue {
  geneId: string;
  sampleId: string;
  value: number;
  normalizedValue?: number;
}

export interface SampleGroup {
  id: string;
  name: string;
  color: string;
  samples: string[];
}

export interface ExpressionDataset {
  id: string;
  name: string;
  description: string;
  genes: Gene[];
  samples: Sample[];
  groups: SampleGroup[];
  matrix: number[][]; // genes x samples
  metadata: {
    nGenes: number;
    nSamples: number;
    valueType: 'TPM' | 'FPKM' | 'counts' | 'log2';
    organism: string;
  };
}

export interface ExpressionConfig {
  container: string;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  view: 'heatmap' | 'profile' | 'comparison';
  colorScale: 'viridis' | 'redblue' | 'yellowred' | 'blues';
  normalize: 'zscore' | 'log2' | 'raw';
  clusterRows: boolean;
  clusterCols: boolean;
  selectedGenes: string[];
}

export interface HierarchicalCluster {
  id: string;
  height: number;
  children?: HierarchicalCluster[];
  data?: { id: string; index: number };
}
