// Single Cell Types

export interface Cell {
  id: string;
  barcode: string;
  // Coordinates for different reductions
  umap: [number, number];
  tsne: [number, number];
  pca: [number, number];
  // Annotations
  cluster: number;
  cellType: string;
  // Gene expression values
  expression: Record<string, number>;
  // Quality metrics
  nGenes: number;
  nUMI: number;
  percentMito: number;
  // Metadata
  sample?: string;
  batch?: string;
}

export interface CellCluster {
  id: number;
  name: string;
  color: string;
  cellCount: number;
  markers: string[];
}

export interface CellType {
  id: string;
  name: string;
  color: string;
  cellCount: number;
  clusters: number[];
}

export interface SingleCellDataset {
  id: string;
  name: string;
  description: string;
  cells: Cell[];
  clusters: CellCluster[];
  cellTypes: CellType[];
  genes: string[];
  metadata: {
    nCells: number;
    nGenes: number;
    organism: string;
    tissue: string;
  };
}

export interface SingleCellConfig {
  container: string;
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  reduction: 'umap' | 'tsne' | 'pca';
  colorBy: 'cluster' | 'celltype' | 'expression';
  gene?: string;
  pointSize: number;
  opacity: number;
  showAxes: boolean;
}

export interface SelectionState {
  selectedCells: Set<string>;
  highlightedCluster: number | null;
  highlightedCellType: string | null;
}
