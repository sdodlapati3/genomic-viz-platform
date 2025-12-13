/**
 * Data Service
 * 
 * Manages data fetching, caching, and state
 */

// Sample mutation data
const SAMPLE_MUTATIONS = [
  { gene: 'TP53', position: 175, ref: 'R', alt: 'H', type: 'missense', sample: 'S001', cancerType: 'breast' },
  { gene: 'TP53', position: 248, ref: 'R', alt: 'Q', type: 'missense', sample: 'S002', cancerType: 'lung' },
  { gene: 'TP53', position: 273, ref: 'R', alt: 'H', type: 'missense', sample: 'S003', cancerType: 'colon' },
  { gene: 'TP53', position: 282, ref: 'R', alt: 'W', type: 'missense', sample: 'S004', cancerType: 'breast' },
  { gene: 'TP53', position: 245, ref: 'G', alt: '*', type: 'nonsense', sample: 'S005', cancerType: 'lung' },
  { gene: 'BRCA1', position: 1685, ref: 'A', alt: 'fs', type: 'frameshift', sample: 'S006', cancerType: 'breast' },
  { gene: 'BRCA1', position: 185, ref: 'C', alt: 'S', type: 'missense', sample: 'S007', cancerType: 'breast' },
  { gene: 'BRCA2', position: 6174, ref: 'T', alt: 'fs', type: 'frameshift', sample: 'S008', cancerType: 'breast' },
  { gene: 'EGFR', position: 858, ref: 'L', alt: 'R', type: 'missense', sample: 'S009', cancerType: 'lung' },
  { gene: 'EGFR', position: 790, ref: 'T', alt: 'M', type: 'missense', sample: 'S010', cancerType: 'lung' },
  { gene: 'KRAS', position: 12, ref: 'G', alt: 'D', type: 'missense', sample: 'S011', cancerType: 'colon' },
  { gene: 'KRAS', position: 12, ref: 'G', alt: 'V', type: 'missense', sample: 'S012', cancerType: 'lung' },
  { gene: 'KRAS', position: 13, ref: 'G', alt: 'D', type: 'missense', sample: 'S013', cancerType: 'colon' },
  { gene: 'BRAF', position: 600, ref: 'V', alt: 'E', type: 'missense', sample: 'S014', cancerType: 'colon' },
  { gene: 'PIK3CA', position: 1047, ref: 'H', alt: 'R', type: 'missense', sample: 'S015', cancerType: 'breast' },
];

// Sample survival data
const SAMPLE_SURVIVAL = [
  { sample: 'S001', time: 365, event: 1, group: 'mutated' },
  { sample: 'S002', time: 730, event: 0, group: 'mutated' },
  { sample: 'S003', time: 180, event: 1, group: 'mutated' },
  { sample: 'S004', time: 545, event: 1, group: 'mutated' },
  { sample: 'S005', time: 400, event: 0, group: 'wildtype' },
  { sample: 'S006', time: 600, event: 0, group: 'wildtype' },
  { sample: 'S007', time: 300, event: 1, group: 'wildtype' },
  { sample: 'S008', time: 800, event: 0, group: 'wildtype' },
  { sample: 'S009', time: 200, event: 1, group: 'mutated' },
  { sample: 'S010', time: 500, event: 1, group: 'mutated' },
];

// Sample expression data (simplified)
const SAMPLE_EXPRESSION = {
  genes: ['TP53', 'BRCA1', 'BRCA2', 'EGFR', 'KRAS', 'BRAF', 'PIK3CA', 'MYC', 'PTEN', 'RB1'],
  samples: ['S001', 'S002', 'S003', 'S004', 'S005', 'S006', 'S007', 'S008', 'S009', 'S010'],
  values: [] // Will be populated with random data
};

// Generate random expression values
SAMPLE_EXPRESSION.values = SAMPLE_EXPRESSION.genes.map(() =>
  SAMPLE_EXPRESSION.samples.map(() => Math.random() * 10 - 5) // log2 fold change
);

export class DataService {
  constructor() {
    this.mutations = [];
    this.survival = [];
    this.expression = null;
    this.activeDataset = null;
    this.filters = {
      cancerType: '',
      variantTypes: ['missense', 'nonsense', 'frameshift', 'splice']
    };
    this.cache = new Map();
  }

  /**
   * Load sample data for demonstration
   */
  async loadSampleData() {
    this.mutations = [...SAMPLE_MUTATIONS];
    this.survival = [...SAMPLE_SURVIVAL];
    this.expression = { ...SAMPLE_EXPRESSION };
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return { mutations: this.mutations.length, survival: this.survival.length };
  }

  /**
   * Get global statistics
   */
  getGlobalStats() {
    const filtered = this.getFilteredMutations();
    const genes = new Set(filtered.map(m => m.gene));
    const samples = new Set(filtered.map(m => m.sample));
    
    return {
      totalVariants: filtered.length,
      totalSamples: samples.size,
      totalGenes: genes.size,
      cohortSize: samples.size
    };
  }

  /**
   * Get mutations with current filters applied
   */
  getFilteredMutations() {
    return this.mutations.filter(m => {
      if (this.filters.cancerType && m.cancerType !== this.filters.cancerType) {
        return false;
      }
      if (!this.filters.variantTypes.includes(m.type)) {
        return false;
      }
      return true;
    });
  }

  /**
   * Get mutations for a specific gene
   */
  getMutationsByGene(gene) {
    return this.getFilteredMutations().filter(m => m.gene === gene);
  }

  /**
   * Get mutation type distribution
   */
  getMutationTypeDistribution() {
    const filtered = this.getFilteredMutations();
    const counts = {};
    
    filtered.forEach(m => {
      counts[m.type] = (counts[m.type] || 0) + 1;
    });
    
    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      percentage: (count / filtered.length * 100).toFixed(1)
    }));
  }

  /**
   * Get top mutated genes
   */
  getTopMutatedGenes(limit = 10) {
    const filtered = this.getFilteredMutations();
    const counts = {};
    
    filtered.forEach(m => {
      counts[m.gene] = (counts[m.gene] || 0) + 1;
    });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([gene, count]) => ({ gene, count }));
  }

  /**
   * Get cancer type distribution
   */
  getCancerTypeDistribution() {
    const filtered = this.getFilteredMutations();
    const counts = {};
    
    filtered.forEach(m => {
      counts[m.cancerType] = (counts[m.cancerType] || 0) + 1;
    });
    
    return Object.entries(counts).map(([type, count]) => ({
      type,
      count
    }));
  }

  /**
   * Get survival data
   */
  getSurvivalData(groupBy = 'mutation_status') {
    return this.survival;
  }

  /**
   * Get expression data
   */
  getExpressionData() {
    return this.expression;
  }

  /**
   * Set active dataset
   */
  setActiveDataset(dataset) {
    this.activeDataset = dataset;
  }

  /**
   * Set filters
   */
  setFilters(filters) {
    this.filters = { ...this.filters, ...filters };
  }

  /**
   * Upload file (mock implementation)
   */
  async uploadFile(file) {
    // In production, this would send to the server
    console.log('Uploading file:', file.name);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For demo, just return success
    return { success: true, filename: file.name };
  }

  /**
   * Query data with natural language (for AI chat)
   */
  async queryData(question) {
    // In production, this would call the AI service
    console.log('Query:', question);
    
    // Mock responses based on keywords
    const lowerQ = question.toLowerCase();
    
    if (lowerQ.includes('mutation') && lowerQ.includes('tp53')) {
      const tp53 = this.getMutationsByGene('TP53');
      return {
        type: 'text',
        content: `Found ${tp53.length} mutations in TP53. The most common positions are 175, 248, 273, and 282, which are known hotspot mutations in the DNA-binding domain.`,
        data: tp53
      };
    }
    
    if (lowerQ.includes('gene') && lowerQ.includes('frequent')) {
      const top = this.getTopMutatedGenes(5);
      return {
        type: 'chart',
        chartType: 'bar',
        content: `The most frequently mutated genes are: ${top.map(g => `${g.gene} (${g.count})`).join(', ')}`,
        data: top
      };
    }
    
    if (lowerQ.includes('survival')) {
      return {
        type: 'visualization',
        vizType: 'survival',
        content: 'I can show you a survival analysis comparing mutated vs wild-type samples. Click below to view the Kaplan-Meier curve.',
        data: this.getSurvivalData()
      };
    }
    
    return {
      type: 'text',
      content: 'I can help you explore mutation data, gene expression, and survival analysis. Try asking about specific genes like TP53 or BRCA1, or ask about mutation frequencies.'
    };
  }
}
