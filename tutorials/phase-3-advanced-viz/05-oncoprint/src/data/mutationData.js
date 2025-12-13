/**
 * Tutorial 3.5: Oncoprint Data Generator
 * Generates realistic cancer mutation data
 */

// Mutation types with colors and shapes
export const MUTATION_TYPES = {
  missense: { color: '#2ecc71', label: 'Missense', shape: 'rect' },
  nonsense: { color: '#000000', label: 'Nonsense', shape: 'rect' },
  frameshift: { color: '#9b59b6', label: 'Frameshift', shape: 'rect' },
  splice: { color: '#f39c12', label: 'Splice Site', shape: 'rect' },
  inframe: { color: '#e67e22', label: 'In-frame Indel', shape: 'rect' },
  amplification: { color: '#e74c3c', label: 'Amplification', shape: 'rect-full' },
  deletion: { color: '#3498db', label: 'Deep Deletion', shape: 'rect-full' },
  fusion: { color: '#1abc9c', label: 'Fusion', shape: 'triangle' }
};

// Clinical feature options
export const CLINICAL_FEATURES = {
  stage: {
    label: 'Stage',
    values: ['I', 'II', 'III', 'IV'],
    colors: ['#a8e6cf', '#88d8b0', '#ffeaa7', '#ff7675']
  },
  gender: {
    label: 'Gender',
    values: ['Male', 'Female'],
    colors: ['#74b9ff', '#fd79a8']
  },
  age_group: {
    label: 'Age Group',
    values: ['<40', '40-60', '>60'],
    colors: ['#dfe6e9', '#b2bec3', '#636e72']
  }
};

// Cancer driver genes with typical mutation frequencies
const CANCER_GENES = {
  TCGA: [
    { gene: 'TP53', freq: 0.42, types: ['missense', 'nonsense', 'frameshift'] },
    { gene: 'PIK3CA', freq: 0.18, types: ['missense'] },
    { gene: 'KRAS', freq: 0.15, types: ['missense'] },
    { gene: 'PTEN', freq: 0.12, types: ['missense', 'nonsense', 'deletion'] },
    { gene: 'APC', freq: 0.10, types: ['nonsense', 'frameshift'] },
    { gene: 'BRAF', freq: 0.09, types: ['missense'] },
    { gene: 'EGFR', freq: 0.08, types: ['missense', 'amplification'] },
    { gene: 'CDKN2A', freq: 0.14, types: ['deletion', 'nonsense'] },
    { gene: 'RB1', freq: 0.07, types: ['nonsense', 'frameshift', 'deletion'] },
    { gene: 'MYC', freq: 0.11, types: ['amplification'] },
    { gene: 'ERBB2', freq: 0.06, types: ['amplification', 'missense'] },
    { gene: 'BRCA1', freq: 0.05, types: ['frameshift', 'nonsense'] },
    { gene: 'BRCA2', freq: 0.05, types: ['frameshift', 'nonsense'] },
    { gene: 'ATM', freq: 0.06, types: ['missense', 'nonsense'] },
    { gene: 'ARID1A', freq: 0.08, types: ['nonsense', 'frameshift'] },
    { gene: 'SMAD4', freq: 0.05, types: ['missense', 'deletion'] },
    { gene: 'FBXW7', freq: 0.06, types: ['missense', 'nonsense'] },
    { gene: 'NF1', freq: 0.07, types: ['nonsense', 'frameshift'] },
    { gene: 'CTNNB1', freq: 0.05, types: ['missense'] },
    { gene: 'IDH1', freq: 0.04, types: ['missense'] }
  ],
  BRCA: [
    { gene: 'TP53', freq: 0.35, types: ['missense', 'nonsense'] },
    { gene: 'PIK3CA', freq: 0.32, types: ['missense'] },
    { gene: 'CDH1', freq: 0.12, types: ['missense', 'frameshift'] },
    { gene: 'GATA3', freq: 0.10, types: ['frameshift'] },
    { gene: 'MAP3K1', freq: 0.08, types: ['frameshift', 'nonsense'] },
    { gene: 'BRCA1', freq: 0.06, types: ['frameshift', 'nonsense'] },
    { gene: 'BRCA2', freq: 0.06, types: ['frameshift', 'nonsense'] },
    { gene: 'ERBB2', freq: 0.15, types: ['amplification'] },
    { gene: 'MYC', freq: 0.12, types: ['amplification'] },
    { gene: 'CCND1', freq: 0.14, types: ['amplification'] }
  ],
  LUAD: [
    { gene: 'TP53', freq: 0.52, types: ['missense', 'nonsense'] },
    { gene: 'KRAS', freq: 0.33, types: ['missense'] },
    { gene: 'EGFR', freq: 0.18, types: ['missense', 'inframe'] },
    { gene: 'STK11', freq: 0.15, types: ['nonsense', 'frameshift'] },
    { gene: 'KEAP1', freq: 0.12, types: ['missense', 'nonsense'] },
    { gene: 'NF1', freq: 0.10, types: ['nonsense', 'frameshift'] },
    { gene: 'BRAF', freq: 0.08, types: ['missense'] },
    { gene: 'MET', freq: 0.05, types: ['amplification', 'splice'] },
    { gene: 'ALK', freq: 0.04, types: ['fusion'] },
    { gene: 'ROS1', freq: 0.02, types: ['fusion'] }
  ],
  COAD: [
    { gene: 'APC', freq: 0.75, types: ['nonsense', 'frameshift'] },
    { gene: 'TP53', freq: 0.55, types: ['missense', 'nonsense'] },
    { gene: 'KRAS', freq: 0.42, types: ['missense'] },
    { gene: 'PIK3CA', freq: 0.18, types: ['missense'] },
    { gene: 'SMAD4', freq: 0.12, types: ['missense', 'deletion'] },
    { gene: 'FBXW7', freq: 0.10, types: ['missense', 'nonsense'] },
    { gene: 'TCF7L2', freq: 0.08, types: ['frameshift'] },
    { gene: 'NRAS', freq: 0.05, types: ['missense'] },
    { gene: 'BRAF', freq: 0.12, types: ['missense'] },
    { gene: 'MSH6', freq: 0.06, types: ['frameshift'] }
  ]
};

/**
 * Generate sample ID
 */
function generateSampleId(index, cancerType) {
  const prefix = cancerType === 'TCGA' ? 'TCGA' : cancerType;
  return `${prefix}-${String(index + 1).padStart(4, '0')}`;
}

/**
 * Generate clinical data for a sample
 */
function generateClinicalData() {
  const clinical = {};
  
  for (const [key, feature] of Object.entries(CLINICAL_FEATURES)) {
    const idx = Math.floor(Math.random() * feature.values.length);
    clinical[key] = feature.values[idx];
  }
  
  return clinical;
}

/**
 * Generate mutations for a sample
 */
function generateMutations(genes) {
  const mutations = {};
  
  genes.forEach(geneInfo => {
    // Check if this gene is mutated based on frequency
    if (Math.random() < geneInfo.freq) {
      // Pick a random mutation type for this gene
      const typeIdx = Math.floor(Math.random() * geneInfo.types.length);
      const mutationType = geneInfo.types[typeIdx];
      
      mutations[geneInfo.gene] = {
        type: mutationType,
        ...generateMutationDetails(mutationType)
      };
      
      // Small chance of having multiple mutations (compound)
      if (Math.random() < 0.1 && geneInfo.types.length > 1) {
        const secondType = geneInfo.types.find(t => t !== mutationType);
        if (secondType) {
          mutations[geneInfo.gene].compound = {
            type: secondType,
            ...generateMutationDetails(secondType)
          };
        }
      }
    }
  });
  
  return mutations;
}

/**
 * Generate details for a specific mutation
 */
function generateMutationDetails(type) {
  const aminoAcids = ['A', 'R', 'N', 'D', 'C', 'E', 'Q', 'G', 'H', 'I', 'L', 'K', 'M', 'F', 'P', 'S', 'T', 'W', 'Y', 'V'];
  
  switch (type) {
    case 'missense':
      const pos = Math.floor(Math.random() * 500) + 1;
      const ref = aminoAcids[Math.floor(Math.random() * aminoAcids.length)];
      let alt = aminoAcids[Math.floor(Math.random() * aminoAcids.length)];
      while (alt === ref) alt = aminoAcids[Math.floor(Math.random() * aminoAcids.length)];
      return { change: `${ref}${pos}${alt}`, vaf: 0.1 + Math.random() * 0.6 };
    
    case 'nonsense':
      return { change: `*${Math.floor(Math.random() * 400) + 50}`, vaf: 0.1 + Math.random() * 0.6 };
    
    case 'frameshift':
      return { change: `fs*${Math.floor(Math.random() * 100)}`, vaf: 0.1 + Math.random() * 0.5 };
    
    case 'splice':
      return { change: `splice_site`, vaf: 0.15 + Math.random() * 0.5 };
    
    case 'inframe':
      return { change: `del${Math.floor(Math.random() * 20) + 1}`, vaf: 0.2 + Math.random() * 0.5 };
    
    case 'amplification':
      return { copyNumber: 4 + Math.floor(Math.random() * 20) };
    
    case 'deletion':
      return { copyNumber: 0 };
    
    case 'fusion':
      const partners = ['EML4', 'NPM1', 'CD74', 'KIF5B'];
      return { partner: partners[Math.floor(Math.random() * partners.length)] };
    
    default:
      return {};
  }
}

/**
 * Generate complete oncoprint dataset
 */
export function generateOncoprintData(cancerType = 'TCGA', nSamples = 100) {
  const genes = CANCER_GENES[cancerType] || CANCER_GENES.TCGA;
  const samples = [];
  
  for (let i = 0; i < nSamples; i++) {
    samples.push({
      id: generateSampleId(i, cancerType),
      clinical: generateClinicalData(),
      mutations: generateMutations(genes)
    });
  }
  
  return {
    samples,
    genes: genes.map(g => g.gene),
    cancerType
  };
}

/**
 * Calculate mutation frequency for each gene
 */
export function calculateGeneFrequencies(data) {
  const frequencies = {};
  
  data.genes.forEach(gene => {
    const mutatedCount = data.samples.filter(s => s.mutations[gene]).length;
    frequencies[gene] = {
      count: mutatedCount,
      percentage: (mutatedCount / data.samples.length * 100).toFixed(1)
    };
  });
  
  return frequencies;
}

/**
 * Get summary statistics
 */
export function getSummaryStats(data) {
  let totalMutations = 0;
  const mutationCounts = [];
  
  data.samples.forEach(sample => {
    const count = Object.keys(sample.mutations).length;
    totalMutations += count;
    mutationCounts.push(count);
  });
  
  return {
    totalSamples: data.samples.length,
    totalGenes: data.genes.length,
    totalMutations,
    avgMutations: (totalMutations / data.samples.length).toFixed(1),
    mutationCounts
  };
}

/**
 * Sort samples by mutation burden
 */
export function sortSamplesByMutationCount(samples, descending = true) {
  return [...samples].sort((a, b) => {
    const countA = Object.keys(a.mutations).length;
    const countB = Object.keys(b.mutations).length;
    return descending ? countB - countA : countA - countB;
  });
}

/**
 * Sort samples by gene priority (TP53 first, etc.)
 */
export function sortSamplesByGenePriority(samples, genes) {
  return [...samples].sort((a, b) => {
    for (const gene of genes) {
      const hasMutA = a.mutations[gene] ? 1 : 0;
      const hasMutB = b.mutations[gene] ? 1 : 0;
      if (hasMutA !== hasMutB) return hasMutB - hasMutA;
    }
    return 0;
  });
}

/**
 * Sort samples by clinical feature
 */
export function sortSamplesByClinical(samples, feature) {
  const featureInfo = CLINICAL_FEATURES[feature];
  if (!featureInfo) return samples;
  
  return [...samples].sort((a, b) => {
    const idxA = featureInfo.values.indexOf(a.clinical[feature]);
    const idxB = featureInfo.values.indexOf(b.clinical[feature]);
    return idxA - idxB;
  });
}

/**
 * Sort genes by mutation frequency
 */
export function sortGenesByFrequency(genes, samples) {
  const freqs = {};
  genes.forEach(gene => {
    freqs[gene] = samples.filter(s => s.mutations[gene]).length;
  });
  
  return [...genes].sort((a, b) => freqs[b] - freqs[a]);
}
