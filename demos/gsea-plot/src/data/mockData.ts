/**
 * Generate mock GSEA data for demonstration
 */

import type { Gene, GseaResult } from '../types';

// Simulated gene symbols
const GENE_SYMBOLS = [
  'TP53',
  'CDKN1A',
  'BAX',
  'BBC3',
  'PMAIP1',
  'GADD45A',
  'MDM2',
  'SESN1',
  'PLK2',
  'DDB2',
  'RRM2B',
  'TIGAR',
  'ZMAT3',
  'FDXR',
  'AEN',
  'BTG2',
  'SFN',
  'RPS27L',
  'CCNG1',
  'PHLDA3',
  'GDF15',
  'POLK',
  'XPC',
  'TRIAP1',
  'MYC',
  'E2F1',
  'E2F2',
  'CDK4',
  'CCND1',
  'CCNE1',
  'CDC25A',
  'MCM2',
  'MCM3',
  'MCM4',
  'MCM5',
  'MCM6',
  'MCM7',
  'ORC1',
  'ORC6',
  'CDC6',
  'CDT1',
  'PCNA',
  'RRM1',
  'RRM2',
  'TYMS',
  'TK1',
  'DHFR',
  'CAD',
  'BRCA1',
  'BRCA2',
  'RAD51',
  'ATM',
  'ATR',
  'CHEK1',
  'CHEK2',
  'AURKA',
  'AURKB',
  'PLK1',
  'BUB1',
  'BUB1B',
  'MAD2L1',
  'CDC20',
  'CCNB1',
  'CDK1',
  'FOXM1',
  'BIRC5',
  'TOP2A',
  'KIF11',
  'KIF23',
  'TPX2',
  'NUSAP1',
  'PRC1',
  'CENPA',
  'CENPE',
  'CENPF',
  'NDC80',
  'NUF2',
  'SPC24',
  'SPC25',
  'ZWINT',
];

// More gene symbols for padding
const ADDITIONAL_GENES = Array.from({ length: 500 }, (_, i) => `GENE${i + 1}`);
const ALL_GENES = [...new Set([...GENE_SYMBOLS, ...ADDITIONAL_GENES])];

// Gene sets
const GENE_SETS: Record<string, string[]> = {
  HALLMARK_P53_PATHWAY: [
    'TP53',
    'CDKN1A',
    'BAX',
    'BBC3',
    'PMAIP1',
    'GADD45A',
    'MDM2',
    'SESN1',
    'PLK2',
    'DDB2',
    'RRM2B',
    'TIGAR',
    'ZMAT3',
    'FDXR',
    'AEN',
    'BTG2',
    'SFN',
    'RPS27L',
    'CCNG1',
    'PHLDA3',
    'GDF15',
    'POLK',
    'XPC',
    'TRIAP1',
  ],
  HALLMARK_MYC_TARGETS_V1: [
    'MYC',
    'E2F1',
    'E2F2',
    'CDK4',
    'CCND1',
    'CCNE1',
    'CDC25A',
    'MCM2',
    'MCM3',
    'MCM4',
    'MCM5',
    'MCM6',
    'MCM7',
    'ORC1',
    'ORC6',
    'CDC6',
    'CDT1',
    'PCNA',
    'RRM1',
    'RRM2',
    'TYMS',
    'TK1',
    'DHFR',
    'CAD',
  ],
  HALLMARK_E2F_TARGETS: [
    'E2F1',
    'E2F2',
    'CCNE1',
    'CDK4',
    'CDC25A',
    'MCM2',
    'MCM3',
    'MCM4',
    'MCM5',
    'MCM6',
    'MCM7',
    'ORC1',
    'PCNA',
    'BRCA1',
    'RAD51',
    'CHEK1',
    'AURKA',
    'AURKB',
    'PLK1',
    'BUB1',
    'MAD2L1',
    'CDC20',
    'CCNB1',
    'CDK1',
  ],
  HALLMARK_G2M_CHECKPOINT: [
    'CCNB1',
    'CDK1',
    'AURKA',
    'AURKB',
    'PLK1',
    'BUB1',
    'BUB1B',
    'MAD2L1',
    'CDC20',
    'FOXM1',
    'BIRC5',
    'TOP2A',
    'KIF11',
    'KIF23',
    'TPX2',
    'NUSAP1',
    'PRC1',
    'CENPA',
    'CENPE',
    'CENPF',
    'NDC80',
    'NUF2',
    'SPC24',
    'SPC25',
  ],
};

/**
 * Generate a ranked gene list with scores
 */
function generateRankedList(geneSetName: string): Gene[] {
  const geneSet = new Set(GENE_SETS[geneSetName] || []);
  const genes: Gene[] = [];

  // Shuffle all genes
  const shuffledGenes = [...ALL_GENES].sort(() => Math.random() - 0.5);

  // Assign scores - genes in the gene set tend to have higher scores
  for (let i = 0; i < shuffledGenes.length; i++) {
    const symbol = shuffledGenes[i];
    const inGeneSet = geneSet.has(symbol);

    // Base score from normal distribution
    let score = (Math.random() - 0.5) * 4;

    // Boost score for genes in the gene set (simulating enrichment)
    if (inGeneSet) {
      score += 1.5 + Math.random() * 1.5;
    }

    genes.push({
      symbol,
      rank: i,
      score,
      inGeneSet,
    });
  }

  // Sort by score (descending) to create ranked list
  genes.sort((a, b) => b.score - a.score);

  // Update ranks after sorting
  genes.forEach((gene, i) => {
    gene.rank = i;
  });

  return genes;
}

/**
 * Calculate running enrichment score
 */
function calculateRunningSum(rankedList: Gene[], geneSetSize: number): number[] {
  const N = rankedList.length;
  const Nh = geneSetSize;
  const Nr = rankedList.reduce((sum, g) => sum + (g.inGeneSet ? Math.abs(g.score) : 0), 0);

  const runningSum: number[] = [];
  let es = 0;

  for (let i = 0; i < N; i++) {
    const gene = rankedList[i];
    if (gene.inGeneSet) {
      es += Math.abs(gene.score) / Nr;
    } else {
      es -= 1 / (N - Nh);
    }
    runningSum.push(es);
  }

  return runningSum;
}

/**
 * Generate complete GSEA result for a gene set
 */
export function generateGseaResult(geneSetName: string): GseaResult {
  const rankedList = generateRankedList(geneSetName);
  const geneSet = GENE_SETS[geneSetName] || [];
  const geneSetSize = geneSet.length;

  const runningSum = calculateRunningSum(rankedList, geneSetSize);

  // Find max absolute ES
  let maxEs = 0;
  let maxEsPosition = 0;
  for (let i = 0; i < runningSum.length; i++) {
    if (Math.abs(runningSum[i]) > Math.abs(maxEs)) {
      maxEs = runningSum[i];
      maxEsPosition = i;
    }
  }

  // Count leading edge genes
  const leadingEdgeSize = rankedList.slice(0, maxEsPosition + 1).filter((g) => g.inGeneSet).length;

  return {
    geneSetName,
    geneSetSize,
    enrichmentScore: maxEs,
    normalizedEnrichmentScore: maxEs * 1.8 + (Math.random() - 0.5) * 0.2,
    nominalPValue: Math.random() * 0.05,
    fdrQValue: Math.random() * 0.1,
    fwerPValue: Math.random() * 0.15,
    leadingEdgeSize,
    rankedList,
    runningSum,
    maxEsPosition,
  };
}

/**
 * Get available gene set names
 */
export function getGeneSetNames(): string[] {
  return Object.keys(GENE_SETS);
}
