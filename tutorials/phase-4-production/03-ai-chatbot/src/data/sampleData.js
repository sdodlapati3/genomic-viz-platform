/**
 * Sample Genomic Data for Chat Queries
 * Simulated database for natural language data queries
 */

// Sample mutation data
export const mutations = [
  { id: 1, gene: 'TP53', position: 'R175H', chromosome: '17', type: 'missense', samples: 342, cancer: 'breast', pathogenicity: 'Pathogenic' },
  { id: 2, gene: 'TP53', position: 'R248Q', chromosome: '17', type: 'missense', samples: 218, cancer: 'colorectal', pathogenicity: 'Pathogenic' },
  { id: 3, gene: 'TP53', position: 'R273H', chromosome: '17', type: 'missense', samples: 195, cancer: 'lung', pathogenicity: 'Pathogenic' },
  { id: 4, gene: 'KRAS', position: 'G12D', chromosome: '12', type: 'missense', samples: 567, cancer: 'pancreatic', pathogenicity: 'Pathogenic' },
  { id: 5, gene: 'KRAS', position: 'G12V', chromosome: '12', type: 'missense', samples: 423, cancer: 'colorectal', pathogenicity: 'Pathogenic' },
  { id: 6, gene: 'KRAS', position: 'G12C', chromosome: '12', type: 'missense', samples: 312, cancer: 'lung', pathogenicity: 'Pathogenic' },
  { id: 7, gene: 'EGFR', position: 'L858R', chromosome: '7', type: 'missense', samples: 245, cancer: 'lung', pathogenicity: 'Pathogenic' },
  { id: 8, gene: 'EGFR', position: 'T790M', chromosome: '7', type: 'missense', samples: 156, cancer: 'lung', pathogenicity: 'Pathogenic' },
  { id: 9, gene: 'BRAF', position: 'V600E', chromosome: '7', type: 'missense', samples: 389, cancer: 'melanoma', pathogenicity: 'Pathogenic' },
  { id: 10, gene: 'PIK3CA', position: 'H1047R', chromosome: '3', type: 'missense', samples: 278, cancer: 'breast', pathogenicity: 'Pathogenic' },
  { id: 11, gene: 'BRCA1', position: '185delAG', chromosome: '17', type: 'frameshift', samples: 89, cancer: 'breast', pathogenicity: 'Pathogenic' },
  { id: 12, gene: 'BRCA2', position: '6174delT', chromosome: '13', type: 'frameshift', samples: 67, cancer: 'ovarian', pathogenicity: 'Pathogenic' },
  { id: 13, gene: 'APC', position: 'R1450X', chromosome: '5', type: 'nonsense', samples: 145, cancer: 'colorectal', pathogenicity: 'Pathogenic' },
  { id: 14, gene: 'RB1', position: 'R661W', chromosome: '13', type: 'missense', samples: 52, cancer: 'retinoblastoma', pathogenicity: 'Pathogenic' },
  { id: 15, gene: 'VHL', position: 'R167Q', chromosome: '3', type: 'missense', samples: 78, cancer: 'renal', pathogenicity: 'Pathogenic' }
];

// Sample clinical data
export const samples = [
  { id: 'TCGA-001', cancer: 'breast', stage: 'II', age: 54, gender: 'female', survival_months: 48, status: 'alive' },
  { id: 'TCGA-002', cancer: 'breast', stage: 'III', age: 62, gender: 'female', survival_months: 36, status: 'deceased' },
  { id: 'TCGA-003', cancer: 'lung', stage: 'IV', age: 67, gender: 'male', survival_months: 18, status: 'deceased' },
  { id: 'TCGA-004', cancer: 'lung', stage: 'II', age: 58, gender: 'male', survival_months: 60, status: 'alive' },
  { id: 'TCGA-005', cancer: 'colorectal', stage: 'III', age: 71, gender: 'male', survival_months: 42, status: 'alive' },
  { id: 'TCGA-006', cancer: 'colorectal', stage: 'IV', age: 65, gender: 'female', survival_months: 24, status: 'deceased' },
  { id: 'TCGA-007', cancer: 'melanoma', stage: 'III', age: 45, gender: 'male', survival_months: 30, status: 'alive' },
  { id: 'TCGA-008', cancer: 'pancreatic', stage: 'IV', age: 72, gender: 'female', survival_months: 8, status: 'deceased' },
  { id: 'TCGA-009', cancer: 'ovarian', stage: 'III', age: 56, gender: 'female', survival_months: 32, status: 'alive' },
  { id: 'TCGA-010', cancer: 'renal', stage: 'II', age: 61, gender: 'male', survival_months: 54, status: 'alive' }
];

// Gene statistics
export const geneStats = [
  { gene: 'TP53', mutations_count: 755, samples_mutated: 623, percent_mutated: 15.2, role: 'tumor_suppressor' },
  { gene: 'KRAS', mutations_count: 1302, samples_mutated: 1102, percent_mutated: 26.9, role: 'oncogene' },
  { gene: 'EGFR', mutations_count: 401, samples_mutated: 356, percent_mutated: 8.7, role: 'oncogene' },
  { gene: 'BRAF', mutations_count: 389, samples_mutated: 378, percent_mutated: 9.2, role: 'oncogene' },
  { gene: 'PIK3CA', mutations_count: 278, samples_mutated: 265, percent_mutated: 6.5, role: 'oncogene' },
  { gene: 'BRCA1', mutations_count: 156, samples_mutated: 142, percent_mutated: 3.5, role: 'tumor_suppressor' },
  { gene: 'BRCA2', mutations_count: 134, samples_mutated: 121, percent_mutated: 3.0, role: 'tumor_suppressor' },
  { gene: 'APC', mutations_count: 245, samples_mutated: 234, percent_mutated: 5.7, role: 'tumor_suppressor' },
  { gene: 'RB1', mutations_count: 89, samples_mutated: 82, percent_mutated: 2.0, role: 'tumor_suppressor' },
  { gene: 'VHL', mutations_count: 112, samples_mutated: 98, percent_mutated: 2.4, role: 'tumor_suppressor' }
];

/**
 * Query mutations by various criteria
 */
export function queryMutations(criteria = {}) {
  let results = [...mutations];
  
  if (criteria.gene) {
    results = results.filter(m => m.gene.toLowerCase() === criteria.gene.toLowerCase());
  }
  if (criteria.cancer) {
    results = results.filter(m => m.cancer.toLowerCase() === criteria.cancer.toLowerCase());
  }
  if (criteria.type) {
    results = results.filter(m => m.type.toLowerCase() === criteria.type.toLowerCase());
  }
  if (criteria.minSamples) {
    results = results.filter(m => m.samples >= criteria.minSamples);
  }
  
  return results;
}

/**
 * Query samples by criteria
 */
export function querySamples(criteria = {}) {
  let results = [...samples];
  
  if (criteria.cancer) {
    results = results.filter(s => s.cancer.toLowerCase() === criteria.cancer.toLowerCase());
  }
  if (criteria.stage) {
    results = results.filter(s => s.stage === criteria.stage);
  }
  if (criteria.status) {
    results = results.filter(s => s.status === criteria.status);
  }
  if (criteria.gender) {
    results = results.filter(s => s.gender === criteria.gender);
  }
  
  return results;
}

/**
 * Get aggregated statistics
 */
export function getStatistics(type) {
  switch (type) {
    case 'mutations_by_gene':
      return geneStats.map(g => ({ gene: g.gene, count: g.mutations_count }));
    
    case 'mutations_by_cancer':
      const byCancer = {};
      mutations.forEach(m => {
        byCancer[m.cancer] = (byCancer[m.cancer] || 0) + m.samples;
      });
      return Object.entries(byCancer).map(([cancer, count]) => ({ cancer, count }));
    
    case 'survival_by_cancer':
      const survivalByCancer = {};
      samples.forEach(s => {
        if (!survivalByCancer[s.cancer]) {
          survivalByCancer[s.cancer] = { total: 0, sum: 0 };
        }
        survivalByCancer[s.cancer].total++;
        survivalByCancer[s.cancer].sum += s.survival_months;
      });
      return Object.entries(survivalByCancer).map(([cancer, data]) => ({
        cancer,
        avg_survival: (data.sum / data.total).toFixed(1)
      }));
    
    default:
      return null;
  }
}

/**
 * Parse natural language query to structured query
 */
export function parseNaturalQuery(query) {
  const queryLower = query.toLowerCase();
  const result = { type: 'unknown', criteria: {} };
  
  // Detect query type
  if (queryLower.includes('mutation') || queryLower.includes('variant')) {
    result.type = 'mutations';
  } else if (queryLower.includes('sample') || queryLower.includes('patient')) {
    result.type = 'samples';
  } else if (queryLower.includes('statistic') || queryLower.includes('count') || queryLower.includes('how many')) {
    result.type = 'statistics';
  }
  
  // Extract gene names
  const genes = ['TP53', 'KRAS', 'EGFR', 'BRAF', 'PIK3CA', 'BRCA1', 'BRCA2', 'APC', 'RB1', 'VHL'];
  for (const gene of genes) {
    if (queryLower.includes(gene.toLowerCase())) {
      result.criteria.gene = gene;
      break;
    }
  }
  
  // Extract cancer types
  const cancers = ['breast', 'lung', 'colorectal', 'melanoma', 'pancreatic', 'ovarian', 'renal'];
  for (const cancer of cancers) {
    if (queryLower.includes(cancer)) {
      result.criteria.cancer = cancer;
      break;
    }
  }
  
  // Extract mutation types
  const mutTypes = ['missense', 'nonsense', 'frameshift', 'splice'];
  for (const mt of mutTypes) {
    if (queryLower.includes(mt)) {
      result.criteria.type = mt;
      break;
    }
  }
  
  return result;
}
