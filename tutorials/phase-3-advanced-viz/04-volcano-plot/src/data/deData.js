/**
 * Tutorial 3.4: Differential Expression Data Generator
 * Simple, fast data generation for volcano plots
 */

export const GENE_CATEGORIES = {
  'Cell Cycle': ['CDK', 'RB', 'CCND', 'CCNE'],
  'Apoptosis': ['BCL', 'BAX', 'CASP'],
  'Signal Transduction': ['KRAS', 'RAF', 'AKT', 'PIK3'],
  'Transcription': ['MYC', 'JUN', 'FOS', 'STAT'],
  'DNA Repair': ['BRCA', 'ATM', 'RAD'],
  'Immune Response': ['IL', 'TNF', 'IFN', 'CD'],
  'Angiogenesis': ['VEGF', 'HIF', 'PDGF'],
  'Tumor Suppressor': ['TP53', 'PTEN', 'RB1']
};

function getCategory(name) {
  for (const [cat, prefixes] of Object.entries(GENE_CATEGORIES)) {
    if (prefixes.some(p => name.startsWith(p))) return cat;
  }
  return 'Other';
}

/**
 * Generate differential expression data - optimized for speed
 */
export function generateDEData(nGenes = 500, percentDE = 15, percentUp = 50) {
  const data = [];
  
  // Known significant genes
  const knownGenes = [
    { gene: 'TP53', log2FoldChange: -2.3, pValue: 1e-15 },
    { gene: 'MYC', log2FoldChange: 2.5, pValue: 1e-18 },
    { gene: 'BRCA1', log2FoldChange: -1.9, pValue: 1e-12 },
    { gene: 'EGFR', log2FoldChange: 2.1, pValue: 1e-14 },
    { gene: 'KRAS', log2FoldChange: 1.6, pValue: 1e-10 },
    { gene: 'PTEN', log2FoldChange: -2.0, pValue: 1e-13 },
    { gene: 'BCL2', log2FoldChange: 1.8, pValue: 1e-11 },
    { gene: 'VEGFA', log2FoldChange: 2.2, pValue: 1e-12 },
    { gene: 'CDK4', log2FoldChange: 1.4, pValue: 1e-8 },
    { gene: 'RB1', log2FoldChange: -1.5, pValue: 1e-9 }
  ];
  
  // Add known genes
  knownGenes.forEach(g => {
    data.push({
      ...g,
      padj: g.pValue * 5,
      baseMean: 500 + Math.random() * 2000,
      category: getCategory(g.gene)
    });
  });
  
  const remaining = nGenes - knownGenes.length;
  const nDE = Math.floor(remaining * percentDE / 100);
  const nUp = Math.floor(nDE * percentUp / 100);
  const nDown = nDE - nUp;
  
  // Gene name prefixes
  const prefixes = ['GENE', 'LOC', 'FAM', 'KIAA', 'C1orf', 'ZNF', 'OR', 'TRIM'];
  
  // Upregulated DE genes
  for (let i = 0; i < nUp; i++) {
    const prefix = prefixes[i % prefixes.length];
    const log2FC = 1 + Math.random() * 2.5;
    const pVal = Math.pow(10, -4 - Math.random() * 10);
    data.push({
      gene: `${prefix}${100 + i}`,
      log2FoldChange: log2FC,
      pValue: pVal,
      padj: Math.min(pVal * 10, 0.04),
      baseMean: 100 + Math.random() * 2000,
      category: 'Other'
    });
  }
  
  // Downregulated DE genes
  for (let i = 0; i < nDown; i++) {
    const prefix = prefixes[i % prefixes.length];
    const log2FC = -(1 + Math.random() * 2.5);
    const pVal = Math.pow(10, -4 - Math.random() * 10);
    data.push({
      gene: `${prefix}${500 + i}`,
      log2FoldChange: log2FC,
      pValue: pVal,
      padj: Math.min(pVal * 10, 0.04),
      baseMean: 100 + Math.random() * 2000,
      category: 'Other'
    });
  }
  
  // Non-significant genes (majority)
  const nNonSig = remaining - nDE;
  for (let i = 0; i < nNonSig; i++) {
    const prefix = prefixes[i % prefixes.length];
    // Small fold changes, high p-values
    const log2FC = (Math.random() - 0.5) * 1.5;
    const pVal = 0.05 + Math.random() * 0.95;
    data.push({
      gene: `${prefix}${1000 + i}`,
      log2FoldChange: log2FC,
      pValue: pVal,
      padj: Math.min(pVal * 2, 1),
      baseMean: 50 + Math.random() * 1000,
      category: 'Other'
    });
  }
  
  return data;
}

export function getSummaryStats(data, fcThreshold = 1, pThreshold = 0.05) {
  const upregulated = data.filter(d => d.padj < pThreshold && d.log2FoldChange > fcThreshold);
  const downregulated = data.filter(d => d.padj < pThreshold && d.log2FoldChange < -fcThreshold);
  
  return {
    total: data.length,
    upregulated: upregulated.length,
    downregulated: downregulated.length,
    notSignificant: data.length - upregulated.length - downregulated.length,
    topUpregulated: upregulated.sort((a, b) => a.padj - b.padj).slice(0, 5),
    topDownregulated: downregulated.sort((a, b) => a.padj - b.padj).slice(0, 5)
  };
}
