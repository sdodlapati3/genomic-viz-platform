/**
 * Genome Browser Demo Data
 *
 * Sample genomic data for TP53 region on chromosome 17
 */

import type {
  GeneFeature,
  MutationFeature,
  SignalPoint,
  AnnotationFeature,
  ConsequenceType,
} from './types';

// TP53 gene structure (simplified, based on real coordinates)
export const TP53_GENE: GeneFeature = {
  id: 'ENSG00000141510',
  symbol: 'TP53',
  chromosome: 'chr17',
  start: 7668402,
  end: 7687550,
  strand: '-',
  exons: [
    { start: 7687377, end: 7687550, type: 'utr5' },
    { start: 7676594, end: 7676622, type: 'cds' },
    { start: 7676381, end: 7676403, type: 'cds' },
    { start: 7675994, end: 7676272, type: 'cds' },
    { start: 7675053, end: 7675236, type: 'cds' },
    { start: 7674858, end: 7674971, type: 'cds' },
    { start: 7674180, end: 7674290, type: 'cds' },
    { start: 7673701, end: 7673837, type: 'cds' },
    { start: 7673535, end: 7673608, type: 'cds' },
    { start: 7670609, end: 7670715, type: 'cds' },
    { start: 7668402, end: 7669690, type: 'utr3' },
  ],
};

// Additional genes in the region
export const NEIGHBORING_GENES: GeneFeature[] = [
  {
    id: 'ENSG00000141499',
    symbol: 'WRAP53',
    chromosome: 'chr17',
    start: 7590856,
    end: 7606820,
    strand: '+',
    exons: [
      { start: 7590856, end: 7591100, type: 'utr5' },
      { start: 7594000, end: 7594500, type: 'cds' },
      { start: 7600000, end: 7600800, type: 'cds' },
      { start: 7606400, end: 7606820, type: 'utr3' },
    ],
  },
  {
    id: 'ENSG00000183765',
    symbol: 'EFNB3',
    chromosome: 'chr17',
    start: 7700000,
    end: 7720000,
    strand: '-',
    exons: [
      { start: 7718000, end: 7720000, type: 'utr5' },
      { start: 7710000, end: 7712000, type: 'cds' },
      { start: 7705000, end: 7706000, type: 'cds' },
      { start: 7700000, end: 7702000, type: 'utr3' },
    ],
  },
];

// Generate mutations across TP53
export function generateMutations(): MutationFeature[] {
  const mutations: MutationFeature[] = [];
  const consequenceTypes: ConsequenceType[] = [
    'missense',
    'nonsense',
    'frameshift',
    'splice',
    'synonymous',
  ];

  // Known TP53 hotspot positions (approximate genomic coordinates)
  const hotspots = [
    { pos: 7674220, aa: 'R175H', cons: 'missense' as ConsequenceType, count: 45 },
    { pos: 7674236, aa: 'R248Q', cons: 'missense' as ConsequenceType, count: 38 },
    { pos: 7674250, aa: 'R248W', cons: 'missense' as ConsequenceType, count: 35 },
    { pos: 7674858, aa: 'R273H', cons: 'missense' as ConsequenceType, count: 42 },
    { pos: 7674870, aa: 'R273C', cons: 'missense' as ConsequenceType, count: 28 },
    { pos: 7675085, aa: 'R282W', cons: 'missense' as ConsequenceType, count: 22 },
    { pos: 7675140, aa: 'G245S', cons: 'missense' as ConsequenceType, count: 18 },
    { pos: 7676381, aa: 'Y220C', cons: 'missense' as ConsequenceType, count: 15 },
  ];

  // Add hotspot mutations
  for (const hs of hotspots) {
    mutations.push({
      id: `mut-${hs.pos}`,
      chromosome: 'chr17',
      position: hs.pos,
      ref: 'C',
      alt: 'T',
      gene: 'TP53',
      aaChange: hs.aa,
      consequence: hs.cons,
      sampleCount: hs.count,
      vaf: 0.3 + Math.random() * 0.4,
    });
  }

  // Add some random mutations
  for (let i = 0; i < 30; i++) {
    const position = 7668402 + Math.floor(Math.random() * (7687550 - 7668402));
    mutations.push({
      id: `mut-rand-${i}`,
      chromosome: 'chr17',
      position,
      ref: ['A', 'C', 'G', 'T'][Math.floor(Math.random() * 4)],
      alt: ['A', 'C', 'G', 'T'][Math.floor(Math.random() * 4)],
      gene: 'TP53',
      consequence: consequenceTypes[Math.floor(Math.random() * consequenceTypes.length)],
      sampleCount: 1 + Math.floor(Math.random() * 10),
      vaf: 0.1 + Math.random() * 0.5,
    });
  }

  return mutations.sort((a, b) => a.position - b.position);
}

// Generate signal/coverage data
export function generateSignalData(start: number, end: number): SignalPoint[] {
  const points: SignalPoint[] = [];
  const numPoints = Math.min(1000, Math.floor((end - start) / 50));
  const step = (end - start) / numPoints;

  for (let i = 0; i < numPoints; i++) {
    const position = Math.floor(start + i * step);
    // Create realistic-looking coverage with some variation
    const baseValue = 30 + Math.random() * 20;
    const noise = Math.sin(i * 0.1) * 10 + Math.random() * 10;
    // Add some peaks in exonic regions
    const inExon = TP53_GENE.exons.some((e) => position >= e.start && position <= e.end);
    const exonBoost = inExon ? 20 + Math.random() * 30 : 0;

    points.push({
      position,
      value: Math.max(0, baseValue + noise + exonBoost),
    });
  }

  return points;
}

// Regulatory annotations
export function generateAnnotations(): AnnotationFeature[] {
  return [
    {
      id: 'ann-1',
      chromosome: 'chr17',
      start: 7687300,
      end: 7687600,
      name: 'TP53 Promoter',
      type: 'promoter',
      color: '#4CAF50',
    },
    {
      id: 'ann-2',
      chromosome: 'chr17',
      start: 7680000,
      end: 7682000,
      name: 'Enhancer Region',
      type: 'enhancer',
      color: '#FF9800',
    },
    {
      id: 'ann-3',
      chromosome: 'chr17',
      start: 7670000,
      end: 7671000,
      name: 'CpG Island',
      type: 'cpg',
      color: '#2196F3',
    },
    {
      id: 'ann-4',
      chromosome: 'chr17',
      start: 7675000,
      end: 7676000,
      name: 'DNase Hypersensitive',
      type: 'dnase',
      color: '#9C27B0',
    },
  ];
}

// Get all genes for the region
export function getGenesInRegion(chromosome: string, start: number, end: number): GeneFeature[] {
  const allGenes = [TP53_GENE, ...NEIGHBORING_GENES];
  return allGenes.filter(
    (g) =>
      g.chromosome === chromosome &&
      ((g.start >= start && g.start <= end) ||
        (g.end >= start && g.end <= end) ||
        (g.start <= start && g.end >= end))
  );
}
