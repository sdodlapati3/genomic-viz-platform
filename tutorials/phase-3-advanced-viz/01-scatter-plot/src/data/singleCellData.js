/**
 * Single-cell RNA-seq data generator
 * Simulates UMAP coordinates with cell type annotations
 */

// Cell type definitions with cluster centers and colors
export const CELL_TYPES = {
  'T cells': { 
    color: '#e41a1c', 
    center: [-5, 3], 
    spread: 1.5, 
    proportion: 0.20,
    markers: ['CD3D', 'CD4', 'CD8A', 'PTPRC', 'IL7R']
  },
  'B cells': { 
    color: '#377eb8', 
    center: [-3, -4], 
    spread: 1.2, 
    proportion: 0.15,
    markers: ['CD19', 'MS4A1', 'CD79A', 'PAX5']
  },
  'Macrophages': { 
    color: '#4daf4a', 
    center: [4, 2], 
    spread: 1.8, 
    proportion: 0.18,
    markers: ['CD68', 'CD14', 'FCGR3A', 'CSF1R']
  },
  'NK cells': { 
    color: '#ff7f00', 
    center: [-6, -1], 
    spread: 1.0, 
    proportion: 0.10,
    markers: ['NKG7', 'GNLY', 'NCAM1', 'PRF1']
  },
  'Dendritic cells': { 
    color: '#984ea3', 
    center: [2, -3], 
    spread: 1.3, 
    proportion: 0.08,
    markers: ['CD1C', 'CLEC10A', 'FCER1A', 'ITGAX']
  },
  'Fibroblasts': { 
    color: '#00bfc4', 
    center: [5, -2], 
    spread: 2.0, 
    proportion: 0.12,
    markers: ['COL1A1', 'DCN', 'LUM', 'FAP']
  },
  'Tumor cells': { 
    color: '#666666', 
    center: [0, 0], 
    spread: 3.0, 
    proportion: 0.17,
    markers: ['EPCAM', 'KRT8', 'KRT18', 'MKI67']
  }
};

// All marker genes for expression coloring
export const MARKER_GENES = [
  'CD3D', 'CD4', 'CD8A', 'CD19', 'MS4A1', 'CD68', 'CD14',
  'NKG7', 'GNLY', 'CD1C', 'COL1A1', 'DCN', 'EPCAM', 'KRT8',
  'MKI67', 'PTPRC', 'ACTB', 'GAPDH', 'B2M'
];

// Sample metadata
export const SAMPLES = ['Sample_1', 'Sample_2', 'Sample_3', 'Sample_4', 'Sample_5'];

/**
 * Box-Muller transform for Gaussian distribution
 */
function gaussianRandom() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Generate gene expression values for a cell type
 */
function generateExpression(cellType) {
  const markerLevels = {
    'T cells': { CD3D: 8, CD4: 6, CD8A: 5, PTPRC: 7, IL7R: 4 },
    'B cells': { CD19: 8, MS4A1: 7, CD79A: 6, PTPRC: 7, PAX5: 5 },
    'Macrophages': { CD68: 8, CD14: 7, FCGR3A: 6, CSF1R: 5 },
    'NK cells': { NKG7: 8, GNLY: 7, NCAM1: 6, PRF1: 5 },
    'Dendritic cells': { CD1C: 8, CLEC10A: 7, FCER1A: 6, ITGAX: 5 },
    'Fibroblasts': { COL1A1: 8, DCN: 7, LUM: 6, FAP: 5 },
    'Tumor cells': { EPCAM: 8, KRT8: 7, KRT18: 6, MKI67: 5 }
  };

  const baseExpression = markerLevels[cellType] || {};
  const expression = {};

  // Add marker genes with noise
  for (const gene of MARKER_GENES) {
    if (baseExpression[gene]) {
      expression[gene] = Math.max(0, baseExpression[gene] + gaussianRandom() * 1.5);
    } else {
      // Low background expression for non-markers
      expression[gene] = Math.max(0, 1 + gaussianRandom() * 0.5);
    }
  }

  // Housekeeping genes - expressed in all cells
  expression.ACTB = Math.max(0, 6 + gaussianRandom());
  expression.GAPDH = Math.max(0, 5.5 + gaussianRandom());
  expression.B2M = Math.max(0, 5 + gaussianRandom());

  return expression;
}

/**
 * Generate single-cell data with specified number of cells
 * @param {number} numCells - Total number of cells to generate
 * @returns {Array} Array of cell objects with UMAP coordinates and metadata
 */
export function generateSingleCellData(numCells = 1000) {
  const cells = [];
  const cellTypes = Object.entries(CELL_TYPES);
  
  let cellId = 0;

  for (const [typeName, typeInfo] of cellTypes) {
    const count = Math.round(numCells * typeInfo.proportion);
    
    for (let i = 0; i < count; i++) {
      // Generate UMAP coordinates with Gaussian distribution around cluster center
      const umap1 = typeInfo.center[0] + gaussianRandom() * typeInfo.spread;
      const umap2 = typeInfo.center[1] + gaussianRandom() * typeInfo.spread;
      
      // Generate gene expression
      const geneExpression = generateExpression(typeName);
      
      cells.push({
        cellId: `cell_${cellId++}`,
        umap1,
        umap2,
        cellType: typeName,
        sample: SAMPLES[Math.floor(Math.random() * SAMPLES.length)],
        nGenes: Math.floor(Math.random() * 2000) + 500,
        nUMI: Math.floor(Math.random() * 10000) + 1000,
        percentMito: Math.random() * 10,
        geneExpression
      });
    }
  }

  // Shuffle to mix cell types
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  return cells;
}

export default { generateSingleCellData, CELL_TYPES, MARKER_GENES, SAMPLES };
