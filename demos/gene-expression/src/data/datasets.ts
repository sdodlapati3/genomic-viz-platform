import { ExpressionDataset, Gene, Sample, SampleGroup } from '../types';

// Generate gene list
function generateGenes(symbols: string[]): Gene[] {
  const chromosomes = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '10',
    '11',
    '12',
    '13',
    '14',
    '15',
    '16',
    '17',
    '18',
    '19',
    '20',
    '21',
    '22',
    'X',
    'Y',
  ];

  return symbols.map((symbol, i) => ({
    id: `ENSG${String(i + 1).padStart(11, '0')}`,
    symbol,
    name: `${symbol} gene`,
    chromosome: chromosomes[i % chromosomes.length],
    start: Math.floor(Math.random() * 100000000),
    end: Math.floor(Math.random() * 100000000) + 10000,
  }));
}

// Generate samples for a dataset
function generateSamples(groups: SampleGroup[], samplesPerGroup: number): Sample[] {
  const samples: Sample[] = [];

  groups.forEach((group) => {
    for (let i = 0; i < samplesPerGroup; i++) {
      const sampleId = `${group.id}_${i + 1}`;
      samples.push({
        id: sampleId,
        name: `${group.name} ${i + 1}`,
        group: group.id,
        metadata: {
          age: 30 + Math.floor(Math.random() * 50),
          stage: ['I', 'II', 'III', 'IV'][Math.floor(Math.random() * 4)],
        },
      });
      group.samples.push(sampleId);
    }
  });

  return samples;
}

// Generate expression matrix with group-specific patterns
function generateMatrix(
  genes: Gene[],
  samples: Sample[],
  groups: SampleGroup[],
  patterns: Record<string, Record<string, number>>
): number[][] {
  const matrix: number[][] = [];

  genes.forEach((gene) => {
    const row: number[] = [];
    samples.forEach((sample) => {
      // Base expression
      let value = 5 + Math.random() * 3;

      // Add group-specific effects
      const groupPattern = patterns[sample.group];
      if (groupPattern && groupPattern[gene.symbol]) {
        value += groupPattern[gene.symbol];
      }

      // Add noise
      value += (Math.random() - 0.5) * 2;
      value = Math.max(0, value);

      row.push(value);
    });
    matrix.push(row);
  });

  return matrix;
}

// TCGA Breast Cancer Dataset
const tcgaGenes = generateGenes([
  'BRCA1',
  'BRCA2',
  'TP53',
  'PIK3CA',
  'PTEN',
  'ESR1',
  'PGR',
  'ERBB2',
  'MKI67',
  'CDH1',
  'GATA3',
  'FOXA1',
  'CDK4',
  'CDK6',
  'CCND1',
  'RB1',
  'MYC',
  'EGFR',
  'AKT1',
  'MTOR',
  'BCL2',
  'BAX',
  'VEGFA',
  'HIF1A',
  'AURKA',
  'TOP2A',
  'BIRC5',
  'PCNA',
  'MCM2',
  'CCNB1',
]);

const tcgaGroups: SampleGroup[] = [
  { id: 'luminal_a', name: 'Luminal A', color: '#4daf4a', samples: [] },
  { id: 'luminal_b', name: 'Luminal B', color: '#377eb8', samples: [] },
  { id: 'her2', name: 'HER2+', color: '#e41a1c', samples: [] },
  { id: 'basal', name: 'Basal-like', color: '#984ea3', samples: [] },
  { id: 'normal', name: 'Normal-like', color: '#ff7f00', samples: [] },
];

const tcgaSamples = generateSamples(tcgaGroups, 8);

const tcgaPatterns: Record<string, Record<string, number>> = {
  luminal_a: { ESR1: 5, PGR: 4, GATA3: 4, FOXA1: 3, BCL2: 2 },
  luminal_b: { ESR1: 3, MKI67: 4, TOP2A: 3, AURKA: 3, CCNB1: 2 },
  her2: { ERBB2: 8, GRB7: 4, EGFR: 2, MYC: 3 },
  basal: { TP53: -2, EGFR: 4, MKI67: 5, TOP2A: 4, CDK6: 3 },
  normal: { CDH1: 2, PTEN: 2 },
};

export const tcgaDataset: ExpressionDataset = {
  id: 'tcga',
  name: 'TCGA Breast Cancer',
  description: 'TCGA-BRCA RNA-seq expression data',
  genes: tcgaGenes,
  samples: tcgaSamples,
  groups: tcgaGroups,
  matrix: generateMatrix(tcgaGenes, tcgaSamples, tcgaGroups, tcgaPatterns),
  metadata: {
    nGenes: tcgaGenes.length,
    nSamples: tcgaSamples.length,
    valueType: 'TPM',
    organism: 'Human',
  },
};

// GTEx Multi-Tissue Dataset
const gtexGenes = generateGenes([
  'GAPDH',
  'ACTB',
  'TUBA1A',
  'ALB',
  'INS',
  'GCG',
  'TTR',
  'APOA1',
  'CYP3A4',
  'SLC2A2',
  'NKX2-1',
  'SFTPC',
  'TNNT2',
  'MYH7',
  'ATP1A1',
  'SLC6A3',
  'TH',
  'TPH2',
  'GFAP',
  'MBP',
  'MYOG',
  'PAX7',
  'CD3D',
  'CD19',
  'CD14',
  'NCAM1',
  'SYP',
  'ENO2',
  'SNAP25',
  'MAP2',
]);

const gtexGroups: SampleGroup[] = [
  { id: 'liver', name: 'Liver', color: '#8B4513', samples: [] },
  { id: 'brain', name: 'Brain', color: '#FF69B4', samples: [] },
  { id: 'heart', name: 'Heart', color: '#DC143C', samples: [] },
  { id: 'lung', name: 'Lung', color: '#87CEEB', samples: [] },
  { id: 'muscle', name: 'Muscle', color: '#CD5C5C', samples: [] },
  { id: 'pancreas', name: 'Pancreas', color: '#DDA0DD', samples: [] },
];

const gtexSamples = generateSamples(gtexGroups, 6);

const gtexPatterns: Record<string, Record<string, number>> = {
  liver: { ALB: 10, CYP3A4: 8, APOA1: 6, TTR: 5 },
  brain: { GFAP: 8, MBP: 6, SYP: 5, MAP2: 5, SNAP25: 4, ENO2: 4 },
  heart: { TNNT2: 9, MYH7: 8, ATP1A1: 4 },
  lung: { SFTPC: 8, NKX2: 5 },
  muscle: { MYOG: 7, PAX7: 5, ACTB: 4 },
  pancreas: { INS: 10, GCG: 6, SLC2A2: 4 },
};

export const gtexDataset: ExpressionDataset = {
  id: 'gtex',
  name: 'GTEx Multi-Tissue',
  description: 'GTEx tissue-specific expression',
  genes: gtexGenes,
  samples: gtexSamples,
  groups: gtexGroups,
  matrix: generateMatrix(gtexGenes, gtexSamples, gtexGroups, gtexPatterns),
  metadata: {
    nGenes: gtexGenes.length,
    nSamples: gtexSamples.length,
    valueType: 'TPM',
    organism: 'Human',
  },
};

// Cancer Cell Lines Dataset
const celllineGenes = generateGenes([
  'KRAS',
  'BRAF',
  'NRAS',
  'PIK3CA',
  'TP53',
  'APC',
  'PTEN',
  'RB1',
  'CDKN2A',
  'EGFR',
  'ERBB2',
  'MET',
  'ALK',
  'ROS1',
  'RET',
  'FGFR1',
  'MDM2',
  'MYC',
  'MYCN',
  'BCL2',
  'BCL2L1',
  'MCL1',
  'BAX',
  'CASP3',
  'VIM',
  'CDH1',
  'CDH2',
  'SNAI1',
  'TWIST1',
  'ZEB1',
]);

const celllineGroups: SampleGroup[] = [
  { id: 'breast', name: 'Breast Cancer', color: '#FF69B4', samples: [] },
  { id: 'lung', name: 'Lung Cancer', color: '#4169E1', samples: [] },
  { id: 'colon', name: 'Colon Cancer', color: '#32CD32', samples: [] },
  { id: 'melanoma', name: 'Melanoma', color: '#2F4F4F', samples: [] },
];

const celllineSamples = generateSamples(celllineGroups, 6);

const celllinePatterns: Record<string, Record<string, number>> = {
  breast: { ERBB2: 6, ESR1: 4, PIK3CA: 3 },
  lung: { EGFR: 7, KRAS: 5, ALK: 4, MET: 3 },
  colon: { APC: -3, KRAS: 5, BRAF: 4 },
  melanoma: { BRAF: 8, NRAS: 4, CDKN2A: -4 },
};

export const celllineDataset: ExpressionDataset = {
  id: 'cellline',
  name: 'Cancer Cell Lines',
  description: 'CCLE cell line expression',
  genes: celllineGenes,
  samples: celllineSamples,
  groups: celllineGroups,
  matrix: generateMatrix(celllineGenes, celllineSamples, celllineGroups, celllinePatterns),
  metadata: {
    nGenes: celllineGenes.length,
    nSamples: celllineSamples.length,
    valueType: 'TPM',
    organism: 'Human',
  },
};

// Dataset registry
export const datasets: Record<string, ExpressionDataset> = {
  tcga: tcgaDataset,
  gtex: gtexDataset,
  cellline: celllineDataset,
};

export function getDataset(id: string): ExpressionDataset {
  return datasets[id] || tcgaDataset;
}
