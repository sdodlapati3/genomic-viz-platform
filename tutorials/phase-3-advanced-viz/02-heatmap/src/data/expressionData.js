/**
 * Gene Expression Data Generator
 * Simulates RNA-seq expression data for heatmap visualization
 */

// Sample gene sets representing different pathways
export const GENE_SETS = {
  'Cell Cycle': ['CCNA2', 'CCNB1', 'CCND1', 'CCNE1', 'CDK1', 'CDK2', 'CDK4', 'MKI67', 'TOP2A', 'PCNA'],
  'Apoptosis': ['BCL2', 'BAX', 'CASP3', 'CASP8', 'CASP9', 'FAS', 'FASLG', 'BIRC5', 'MCL1', 'BCL2L1'],
  'DNA Repair': ['BRCA1', 'BRCA2', 'ATM', 'ATR', 'RAD51', 'PARP1', 'TP53', 'MDM2', 'CHEK1', 'CHEK2'],
  'Immune Response': ['CD3D', 'CD4', 'CD8A', 'IFNG', 'IL2', 'TNF', 'IL6', 'IL10', 'GZMA', 'PRF1'],
  'Metabolism': ['LDHA', 'PKM', 'HK2', 'ENO1', 'GAPDH', 'PGK1', 'TPI1', 'ALDOA', 'GPI', 'PFKL']
};

// All genes from all pathways
export const ALL_GENES = Object.values(GENE_SETS).flat();

// Sample conditions
export const CONDITIONS = [
  { id: 'Control_1', group: 'Control', color: '#4a90d9' },
  { id: 'Control_2', group: 'Control', color: '#4a90d9' },
  { id: 'Control_3', group: 'Control', color: '#4a90d9' },
  { id: 'Treatment_A_1', group: 'Treatment A', color: '#e74c3c' },
  { id: 'Treatment_A_2', group: 'Treatment A', color: '#e74c3c' },
  { id: 'Treatment_A_3', group: 'Treatment A', color: '#e74c3c' },
  { id: 'Treatment_B_1', group: 'Treatment B', color: '#2ecc71' },
  { id: 'Treatment_B_2', group: 'Treatment B', color: '#2ecc71' },
  { id: 'Treatment_B_3', group: 'Treatment B', color: '#2ecc71' }
];

// Gene pathway mapping
export const GENE_PATHWAY = {};
for (const [pathway, genes] of Object.entries(GENE_SETS)) {
  for (const gene of genes) {
    GENE_PATHWAY[gene] = pathway;
  }
}

// Pathway colors
export const PATHWAY_COLORS = {
  'Cell Cycle': '#e41a1c',
  'Apoptosis': '#377eb8',
  'DNA Repair': '#4daf4a',
  'Immune Response': '#984ea3',
  'Metabolism': '#ff7f00'
};

/**
 * Generate expression data with group-specific patterns
 */
export function generateExpressionData() {
  const data = {
    genes: [...ALL_GENES],
    samples: CONDITIONS.map(c => c.id),
    conditions: CONDITIONS,
    matrix: [],
    geneInfo: {},
    sampleInfo: {}
  };

  // Define expression patterns for each treatment
  const treatmentEffects = {
    'Control': {},
    'Treatment A': {
      'Cell Cycle': 2.0,      // Upregulated
      'Apoptosis': -1.5,      // Downregulated
      'DNA Repair': 1.2,
      'Immune Response': 0.5,
      'Metabolism': 1.8
    },
    'Treatment B': {
      'Cell Cycle': -1.2,     // Downregulated
      'Apoptosis': 1.8,       // Upregulated
      'DNA Repair': 0.8,
      'Immune Response': 2.2,
      'Metabolism': -0.5
    }
  };

  // Generate expression matrix
  for (let i = 0; i < data.genes.length; i++) {
    const gene = data.genes[i];
    const pathway = GENE_PATHWAY[gene];
    const row = [];

    // Base expression level (log2 scale, typically 4-10)
    const baseExpression = 6 + Math.random() * 3;

    for (const condition of CONDITIONS) {
      const effect = treatmentEffects[condition.group][pathway] || 0;
      
      // Add biological and technical noise
      const biologicalNoise = gaussianRandom() * 0.5;
      const technicalNoise = gaussianRandom() * 0.3;
      
      // Calculate final expression
      let expression = baseExpression + effect + biologicalNoise + technicalNoise;
      
      // Add gene-specific variation within pathway
      const geneVariation = Math.random() * 0.8 - 0.4;
      expression += geneVariation;
      
      row.push(Math.max(0, expression));
    }

    data.matrix.push(row);
    
    // Store gene info
    data.geneInfo[gene] = {
      pathway,
      pathwayColor: PATHWAY_COLORS[pathway],
      meanExpression: row.reduce((a, b) => a + b, 0) / row.length,
      variance: variance(row)
    };
  }

  // Store sample info
  for (const condition of CONDITIONS) {
    data.sampleInfo[condition.id] = {
      group: condition.group,
      color: condition.color
    };
  }

  return data;
}

/**
 * Z-score normalize expression data (per gene)
 */
export function zScoreNormalize(matrix) {
  return matrix.map(row => {
    const mean = row.reduce((a, b) => a + b, 0) / row.length;
    const std = Math.sqrt(row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length);
    return row.map(v => std > 0 ? (v - mean) / std : 0);
  });
}

/**
 * Calculate row (gene) variance for filtering
 */
export function calculateVariance(matrix) {
  return matrix.map(row => {
    const mean = row.reduce((a, b) => a + b, 0) / row.length;
    return row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length;
  });
}

/**
 * Filter genes by variance (keep top N most variable)
 */
export function filterByVariance(data, topN) {
  const variances = calculateVariance(data.matrix);
  const indices = variances
    .map((v, i) => ({ variance: v, index: i }))
    .sort((a, b) => b.variance - a.variance)
    .slice(0, topN)
    .map(x => x.index)
    .sort((a, b) => a - b);

  return {
    ...data,
    genes: indices.map(i => data.genes[i]),
    matrix: indices.map(i => data.matrix[i])
  };
}

// Helper functions
function gaussianRandom() {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function variance(arr) {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((a, b) => a + (b - mean) ** 2, 0) / arr.length;
}

export default { generateExpressionData, zScoreNormalize, filterByVariance };
