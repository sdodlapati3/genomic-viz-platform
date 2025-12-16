import { SingleCellDataset, Cell } from '../types';

// Generate realistic single-cell data
function generateCells(
  nCells: number,
  clusterCenters: Array<{ x: number; y: number; cluster: number; cellType: string }>,
  genes: string[]
): Cell[] {
  const cells: Cell[] = [];
  const cellsPerCluster = Math.floor(nCells / clusterCenters.length);

  clusterCenters.forEach((center, clusterIdx) => {
    const nClusterCells =
      clusterIdx === clusterCenters.length - 1 ? nCells - cells.length : cellsPerCluster;

    for (let i = 0; i < nClusterCells; i++) {
      // Generate coordinates with cluster-specific spread
      const spread = 1.5 + Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * spread;

      const umapX = center.x + Math.cos(angle) * radius;
      const umapY = center.y + Math.sin(angle) * radius;

      // t-SNE tends to have more separated clusters
      const tsneSpread = spread * 0.8;
      const tsneX = center.x * 1.2 + Math.cos(angle) * tsneSpread;
      const tsneY = center.y * 1.2 + Math.sin(angle) * tsneSpread;

      // PCA has more overlapping clusters
      const pcaX = center.x * 0.8 + Math.cos(angle) * radius * 1.5;
      const pcaY = center.y * 0.8 + Math.sin(angle) * radius * 1.5;

      // Generate expression values
      const expression: Record<string, number> = {};
      genes.forEach((gene) => {
        // Base expression
        let value = Math.random() * 0.5;

        // Cell type specific markers
        if (gene === 'CD3D' && center.cellType.includes('T cell')) {
          value = 2 + Math.random() * 3;
        } else if (gene === 'CD19' && center.cellType === 'B cells') {
          value = 2.5 + Math.random() * 2.5;
        } else if (gene === 'CD14' && center.cellType === 'Monocytes') {
          value = 3 + Math.random() * 2;
        } else if (gene === 'NKG7' && center.cellType === 'NK cells') {
          value = 2 + Math.random() * 3;
        } else if (gene === 'PPBP' && center.cellType === 'Platelets') {
          value = 4 + Math.random() * 2;
        } else if (gene === 'MS4A1' && center.cellType === 'B cells') {
          value = 2 + Math.random() * 2;
        } else if (gene === 'FCGR3A' && center.cellType === 'NK cells') {
          value = 1.5 + Math.random() * 2;
        } else if (gene === 'CD8A' && center.cellType === 'CD8+ T cells') {
          value = 2.5 + Math.random() * 2;
        }

        expression[gene] = Math.max(0, value);
      });

      cells.push({
        id: `cell_${cells.length}`,
        barcode: `ACGT${String(cells.length).padStart(8, '0')}-1`,
        umap: [umapX, umapY],
        tsne: [tsneX, tsneY],
        pca: [pcaX, pcaY],
        cluster: center.cluster,
        cellType: center.cellType,
        expression,
        nGenes: 500 + Math.floor(Math.random() * 2000),
        nUMI: 1000 + Math.floor(Math.random() * 10000),
        percentMito: Math.random() * 5,
      });
    }
  });

  return cells;
}

// PBMC Dataset
const pbmcGenes = [
  'CD3D',
  'CD19',
  'CD14',
  'NKG7',
  'PPBP',
  'MS4A1',
  'FCGR3A',
  'CD8A',
  'IL7R',
  'GNLY',
];
const pbmcCenters = [
  { x: -5, y: 2, cluster: 0, cellType: 'CD4+ T cells' },
  { x: -3, y: -4, cluster: 1, cellType: 'CD8+ T cells' },
  { x: 4, y: 3, cluster: 2, cellType: 'B cells' },
  { x: 6, y: -2, cluster: 3, cellType: 'Monocytes' },
  { x: -6, y: -3, cluster: 4, cellType: 'NK cells' },
  { x: 0, y: 5, cluster: 5, cellType: 'Dendritic cells' },
  { x: 7, y: 4, cluster: 6, cellType: 'Platelets' },
  { x: -2, y: 0, cluster: 7, cellType: 'CD4+ T cells' },
];

const pbmcCells = generateCells(2000, pbmcCenters, pbmcGenes);

export const pbmcDataset: SingleCellDataset = {
  id: 'pbmc',
  name: 'PBMC 10K Cells',
  description: 'Peripheral Blood Mononuclear Cells',
  cells: pbmcCells,
  clusters: [
    {
      id: 0,
      name: 'Cluster 0',
      color: '#e41a1c',
      cellCount: pbmcCells.filter((c) => c.cluster === 0).length,
      markers: ['IL7R', 'CD3D'],
    },
    {
      id: 1,
      name: 'Cluster 1',
      color: '#377eb8',
      cellCount: pbmcCells.filter((c) => c.cluster === 1).length,
      markers: ['CD8A', 'CD3D'],
    },
    {
      id: 2,
      name: 'Cluster 2',
      color: '#4daf4a',
      cellCount: pbmcCells.filter((c) => c.cluster === 2).length,
      markers: ['CD19', 'MS4A1'],
    },
    {
      id: 3,
      name: 'Cluster 3',
      color: '#984ea3',
      cellCount: pbmcCells.filter((c) => c.cluster === 3).length,
      markers: ['CD14', 'LYZ'],
    },
    {
      id: 4,
      name: 'Cluster 4',
      color: '#ff7f00',
      cellCount: pbmcCells.filter((c) => c.cluster === 4).length,
      markers: ['NKG7', 'GNLY'],
    },
    {
      id: 5,
      name: 'Cluster 5',
      color: '#ffff33',
      cellCount: pbmcCells.filter((c) => c.cluster === 5).length,
      markers: ['FCER1A', 'CST3'],
    },
    {
      id: 6,
      name: 'Cluster 6',
      color: '#a65628',
      cellCount: pbmcCells.filter((c) => c.cluster === 6).length,
      markers: ['PPBP'],
    },
    {
      id: 7,
      name: 'Cluster 7',
      color: '#f781bf',
      cellCount: pbmcCells.filter((c) => c.cluster === 7).length,
      markers: ['CCR7', 'CD3D'],
    },
  ],
  cellTypes: [
    {
      id: 'cd4t',
      name: 'CD4+ T cells',
      color: '#e41a1c',
      cellCount: pbmcCells.filter((c) => c.cellType === 'CD4+ T cells').length,
      clusters: [0, 7],
    },
    {
      id: 'cd8t',
      name: 'CD8+ T cells',
      color: '#377eb8',
      cellCount: pbmcCells.filter((c) => c.cellType === 'CD8+ T cells').length,
      clusters: [1],
    },
    {
      id: 'bcell',
      name: 'B cells',
      color: '#4daf4a',
      cellCount: pbmcCells.filter((c) => c.cellType === 'B cells').length,
      clusters: [2],
    },
    {
      id: 'mono',
      name: 'Monocytes',
      color: '#984ea3',
      cellCount: pbmcCells.filter((c) => c.cellType === 'Monocytes').length,
      clusters: [3],
    },
    {
      id: 'nk',
      name: 'NK cells',
      color: '#ff7f00',
      cellCount: pbmcCells.filter((c) => c.cellType === 'NK cells').length,
      clusters: [4],
    },
    {
      id: 'dc',
      name: 'Dendritic cells',
      color: '#ffff33',
      cellCount: pbmcCells.filter((c) => c.cellType === 'Dendritic cells').length,
      clusters: [5],
    },
    {
      id: 'platelet',
      name: 'Platelets',
      color: '#a65628',
      cellCount: pbmcCells.filter((c) => c.cellType === 'Platelets').length,
      clusters: [6],
    },
  ],
  genes: pbmcGenes,
  metadata: {
    nCells: pbmcCells.length,
    nGenes: 20000,
    organism: 'Human',
    tissue: 'Peripheral Blood',
  },
};

// Tumor Microenvironment Dataset
const tumorGenes = [
  'CD3D',
  'CD8A',
  'FOXP3',
  'CD68',
  'EPCAM',
  'PECAM1',
  'ACTA2',
  'PDGFRB',
  'CD19',
  'MKI67',
];
const tumorCenters = [
  { x: -4, y: 3, cluster: 0, cellType: 'Tumor cells' },
  { x: -5, y: -2, cluster: 1, cellType: 'Tumor cells' },
  { x: 3, y: 4, cluster: 2, cellType: 'CD8+ T cells' },
  { x: 5, y: -1, cluster: 3, cellType: 'Macrophages' },
  { x: -1, y: -5, cluster: 4, cellType: 'Tregs' },
  { x: 6, y: 2, cluster: 5, cellType: 'Fibroblasts' },
  { x: 0, y: 6, cluster: 6, cellType: 'Endothelial' },
  { x: -6, y: 0, cluster: 7, cellType: 'B cells' },
  { x: 2, y: -3, cluster: 8, cellType: 'NK cells' },
];

const tumorCells = generateCells(1500, tumorCenters, tumorGenes);

export const tumorDataset: SingleCellDataset = {
  id: 'tumor',
  name: 'Tumor Microenvironment',
  description: 'Breast Cancer TME',
  cells: tumorCells,
  clusters: tumorCenters.map((c, i) => ({
    id: i,
    name: `Cluster ${i}`,
    color: [
      '#e41a1c',
      '#377eb8',
      '#4daf4a',
      '#984ea3',
      '#ff7f00',
      '#ffff33',
      '#a65628',
      '#f781bf',
      '#999999',
    ][i],
    cellCount: tumorCells.filter((cell) => cell.cluster === i).length,
    markers: [],
  })),
  cellTypes: [
    {
      id: 'tumor',
      name: 'Tumor cells',
      color: '#e41a1c',
      cellCount: tumorCells.filter((c) => c.cellType === 'Tumor cells').length,
      clusters: [0, 1],
    },
    {
      id: 'cd8t',
      name: 'CD8+ T cells',
      color: '#4daf4a',
      cellCount: tumorCells.filter((c) => c.cellType === 'CD8+ T cells').length,
      clusters: [2],
    },
    {
      id: 'macro',
      name: 'Macrophages',
      color: '#984ea3',
      cellCount: tumorCells.filter((c) => c.cellType === 'Macrophages').length,
      clusters: [3],
    },
    {
      id: 'treg',
      name: 'Tregs',
      color: '#ff7f00',
      cellCount: tumorCells.filter((c) => c.cellType === 'Tregs').length,
      clusters: [4],
    },
    {
      id: 'fibro',
      name: 'Fibroblasts',
      color: '#ffff33',
      cellCount: tumorCells.filter((c) => c.cellType === 'Fibroblasts').length,
      clusters: [5],
    },
    {
      id: 'endo',
      name: 'Endothelial',
      color: '#a65628',
      cellCount: tumorCells.filter((c) => c.cellType === 'Endothelial').length,
      clusters: [6],
    },
    {
      id: 'bcell',
      name: 'B cells',
      color: '#f781bf',
      cellCount: tumorCells.filter((c) => c.cellType === 'B cells').length,
      clusters: [7],
    },
    {
      id: 'nk',
      name: 'NK cells',
      color: '#999999',
      cellCount: tumorCells.filter((c) => c.cellType === 'NK cells').length,
      clusters: [8],
    },
  ],
  genes: tumorGenes,
  metadata: {
    nCells: tumorCells.length,
    nGenes: 25000,
    organism: 'Human',
    tissue: 'Breast Tumor',
  },
};

// Brain Cortex Dataset
const brainGenes = [
  'SLC17A7',
  'GAD1',
  'AQP4',
  'MOG',
  'PDGFRA',
  'CX3CR1',
  'CLDN5',
  'RBFOX3',
  'GFAP',
  'MBP',
];
const brainCenters = [
  { x: -4, y: 4, cluster: 0, cellType: 'Excitatory neurons' },
  { x: -2, y: -3, cluster: 1, cellType: 'Excitatory neurons' },
  { x: 3, y: 2, cluster: 2, cellType: 'Inhibitory neurons' },
  { x: 5, y: -2, cluster: 3, cellType: 'Astrocytes' },
  { x: -5, y: -1, cluster: 4, cellType: 'Oligodendrocytes' },
  { x: 0, y: 5, cluster: 5, cellType: 'Microglia' },
  { x: 6, y: 3, cluster: 6, cellType: 'OPCs' },
  { x: -3, y: 1, cluster: 7, cellType: 'Endothelial' },
];

const brainCells = generateCells(1800, brainCenters, brainGenes);

export const brainDataset: SingleCellDataset = {
  id: 'brain',
  name: 'Brain Cortex',
  description: 'Mouse Brain Cortex',
  cells: brainCells,
  clusters: brainCenters.map((c, i) => ({
    id: i,
    name: `Cluster ${i}`,
    color: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f'][
      i
    ],
    cellCount: brainCells.filter((cell) => cell.cluster === i).length,
    markers: [],
  })),
  cellTypes: [
    {
      id: 'exc',
      name: 'Excitatory neurons',
      color: '#1f77b4',
      cellCount: brainCells.filter((c) => c.cellType === 'Excitatory neurons').length,
      clusters: [0, 1],
    },
    {
      id: 'inh',
      name: 'Inhibitory neurons',
      color: '#2ca02c',
      cellCount: brainCells.filter((c) => c.cellType === 'Inhibitory neurons').length,
      clusters: [2],
    },
    {
      id: 'astro',
      name: 'Astrocytes',
      color: '#d62728',
      cellCount: brainCells.filter((c) => c.cellType === 'Astrocytes').length,
      clusters: [3],
    },
    {
      id: 'oligo',
      name: 'Oligodendrocytes',
      color: '#9467bd',
      cellCount: brainCells.filter((c) => c.cellType === 'Oligodendrocytes').length,
      clusters: [4],
    },
    {
      id: 'micro',
      name: 'Microglia',
      color: '#8c564b',
      cellCount: brainCells.filter((c) => c.cellType === 'Microglia').length,
      clusters: [5],
    },
    {
      id: 'opc',
      name: 'OPCs',
      color: '#e377c2',
      cellCount: brainCells.filter((c) => c.cellType === 'OPCs').length,
      clusters: [6],
    },
    {
      id: 'endo',
      name: 'Endothelial',
      color: '#7f7f7f',
      cellCount: brainCells.filter((c) => c.cellType === 'Endothelial').length,
      clusters: [7],
    },
  ],
  genes: brainGenes,
  metadata: {
    nCells: brainCells.length,
    nGenes: 30000,
    organism: 'Mouse',
    tissue: 'Brain Cortex',
  },
};

// Dataset registry
export const datasets: Record<string, SingleCellDataset> = {
  pbmc: pbmcDataset,
  tumor: tumorDataset,
  brain: brainDataset,
};

export function getDataset(id: string): SingleCellDataset {
  return datasets[id] || pbmcDataset;
}
