/**
 * Sample Data - TP53
 *
 * Realistic test data for the protein panel based on TP53 (tumor protein p53)
 */

import type {
  Protein,
  ProteinDomain,
  Mutation,
  FusionBreakpoint,
  ConsequenceType,
  MutationOrigin,
} from '../types';

/**
 * TP53 protein data
 */
export const TP53_PROTEIN: Protein = {
  id: 'ENSP00000269305',
  symbol: 'TP53',
  name: 'Cellular tumor antigen p53',
  length: 393,
  uniprot: 'P04637',
  refseq: 'NP_000537.3',
  aliases: ['p53', 'TRP53', 'Tumor protein p53'],
};

/**
 * TP53 functional domains
 */
export const TP53_DOMAINS: ProteinDomain[] = [
  {
    id: 'TAD1',
    name: 'Transactivation domain 1',
    shortName: 'TAD1',
    source: 'pfam',
    start: 1,
    end: 42,
    color: '#16A085',
    description: 'N-terminal transactivation domain, interacts with MDM2',
    externalId: 'PF08563',
  },
  {
    id: 'TAD2',
    name: 'Transactivation domain 2',
    shortName: 'TAD2',
    source: 'pfam',
    start: 43,
    end: 62,
    color: '#1ABC9C',
    description: 'Second transactivation domain',
  },
  {
    id: 'PRD',
    name: 'Proline-rich domain',
    shortName: 'PRD',
    source: 'custom',
    start: 63,
    end: 97,
    color: '#F39C12',
    description: 'Proline-rich regulatory domain',
  },
  {
    id: 'DBD',
    name: 'DNA-binding domain',
    shortName: 'DBD',
    source: 'pfam',
    start: 102,
    end: 292,
    color: '#E74C3C',
    description: 'Core DNA-binding domain, contains most cancer mutations',
    externalId: 'PF00870',
  },
  {
    id: 'NLS',
    name: 'Nuclear localization signal',
    shortName: 'NLS',
    source: 'custom',
    start: 305,
    end: 322,
    color: '#3498DB',
    description: 'Nuclear localization signal',
  },
  {
    id: 'TET',
    name: 'Tetramerization domain',
    shortName: 'TET',
    source: 'pfam',
    start: 326,
    end: 356,
    color: '#8E44AD',
    description: 'Oligomerization domain, forms tetramers',
    externalId: 'PF07710',
  },
  {
    id: 'REG',
    name: 'C-terminal regulatory domain',
    shortName: 'REG',
    source: 'custom',
    start: 364,
    end: 393,
    color: '#D35400',
    description: 'Negative regulatory domain',
  },
];

/**
 * Common TP53 mutations (hotspots and frequent mutations)
 */
export const TP53_MUTATIONS: Mutation[] = [
  // DNA-binding domain hotspots
  {
    id: 'mut_R175H',
    position: 175,
    refAA: 'R',
    altAA: 'H',
    hgvsp: 'p.R175H',
    consequence: 'missense',
    origin: 'somatic',
    sampleCount: 156,
    clinicalSignificance: 'pathogenic',
    cosmicId: 'COSM10648',
    isHotspot: true,
    functionalImpact: 'high',
  },
  {
    id: 'mut_R248W',
    position: 248,
    refAA: 'R',
    altAA: 'W',
    hgvsp: 'p.R248W',
    consequence: 'missense',
    origin: 'somatic',
    sampleCount: 132,
    clinicalSignificance: 'pathogenic',
    cosmicId: 'COSM10656',
    isHotspot: true,
    functionalImpact: 'high',
  },
  {
    id: 'mut_R248Q',
    position: 248,
    refAA: 'R',
    altAA: 'Q',
    hgvsp: 'p.R248Q',
    consequence: 'missense',
    origin: 'somatic',
    sampleCount: 98,
    clinicalSignificance: 'pathogenic',
    cosmicId: 'COSM10662',
    isHotspot: true,
    functionalImpact: 'high',
  },
  {
    id: 'mut_R273H',
    position: 273,
    refAA: 'R',
    altAA: 'H',
    hgvsp: 'p.R273H',
    consequence: 'missense',
    origin: 'somatic',
    sampleCount: 124,
    clinicalSignificance: 'pathogenic',
    cosmicId: 'COSM10659',
    isHotspot: true,
    functionalImpact: 'high',
  },
  {
    id: 'mut_R273C',
    position: 273,
    refAA: 'R',
    altAA: 'C',
    hgvsp: 'p.R273C',
    consequence: 'missense',
    origin: 'somatic',
    sampleCount: 67,
    clinicalSignificance: 'pathogenic',
    cosmicId: 'COSM10660',
    isHotspot: true,
    functionalImpact: 'high',
  },
  {
    id: 'mut_R282W',
    position: 282,
    refAA: 'R',
    altAA: 'W',
    hgvsp: 'p.R282W',
    consequence: 'missense',
    origin: 'somatic',
    sampleCount: 54,
    clinicalSignificance: 'pathogenic',
    cosmicId: 'COSM10704',
    isHotspot: true,
    functionalImpact: 'high',
  },
  {
    id: 'mut_G245S',
    position: 245,
    refAA: 'G',
    altAA: 'S',
    hgvsp: 'p.G245S',
    consequence: 'missense',
    origin: 'somatic',
    sampleCount: 43,
    clinicalSignificance: 'pathogenic',
    cosmicId: 'COSM43584',
    isHotspot: true,
    functionalImpact: 'high',
  },
  {
    id: 'mut_Y220C',
    position: 220,
    refAA: 'Y',
    altAA: 'C',
    hgvsp: 'p.Y220C',
    consequence: 'missense',
    origin: 'somatic',
    sampleCount: 38,
    clinicalSignificance: 'pathogenic',
    cosmicId: 'COSM10758',
    functionalImpact: 'high',
  },
  // Nonsense mutations
  {
    id: 'mut_R196X',
    position: 196,
    refAA: 'R',
    altAA: '*',
    hgvsp: 'p.R196*',
    consequence: 'nonsense',
    origin: 'somatic',
    sampleCount: 28,
    clinicalSignificance: 'pathogenic',
    functionalImpact: 'high',
  },
  {
    id: 'mut_Q192X',
    position: 192,
    refAA: 'Q',
    altAA: '*',
    hgvsp: 'p.Q192*',
    consequence: 'nonsense',
    origin: 'somatic',
    sampleCount: 15,
    clinicalSignificance: 'pathogenic',
    functionalImpact: 'high',
  },
  // Frameshift mutations
  {
    id: 'mut_P152fs',
    position: 152,
    refAA: 'P',
    altAA: 'fs',
    hgvsp: 'p.P152fs',
    consequence: 'frameshift',
    origin: 'somatic',
    sampleCount: 12,
    clinicalSignificance: 'pathogenic',
    functionalImpact: 'high',
  },
  // Splice site mutation
  {
    id: 'mut_splice_125',
    position: 125,
    refAA: 'C',
    altAA: '?',
    hgvsp: 'p.C125_splice',
    consequence: 'splice',
    origin: 'somatic',
    sampleCount: 18,
    clinicalSignificance: 'pathogenic',
    functionalImpact: 'high',
  },
  // Germline mutations (Li-Fraumeni syndrome)
  {
    id: 'mut_R337H_germ',
    position: 337,
    refAA: 'R',
    altAA: 'H',
    hgvsp: 'p.R337H',
    consequence: 'missense',
    origin: 'germline',
    sampleCount: 24,
    clinicalSignificance: 'pathogenic',
    rsId: 'rs121912651',
    functionalImpact: 'moderate',
  },
  {
    id: 'mut_R248W_germ',
    position: 248,
    refAA: 'R',
    altAA: 'W',
    hgvsp: 'p.R248W',
    consequence: 'missense',
    origin: 'germline',
    sampleCount: 8,
    clinicalSignificance: 'pathogenic',
    functionalImpact: 'high',
  },
  // Less frequent mutations
  {
    id: 'mut_V157F',
    position: 157,
    refAA: 'V',
    altAA: 'F',
    hgvsp: 'p.V157F',
    consequence: 'missense',
    origin: 'somatic',
    sampleCount: 22,
    clinicalSignificance: 'likely_pathogenic',
    functionalImpact: 'moderate',
  },
  {
    id: 'mut_H179R',
    position: 179,
    refAA: 'H',
    altAA: 'R',
    hgvsp: 'p.H179R',
    consequence: 'missense',
    origin: 'somatic',
    sampleCount: 16,
    clinicalSignificance: 'pathogenic',
    functionalImpact: 'high',
  },
  {
    id: 'mut_C176F',
    position: 176,
    refAA: 'C',
    altAA: 'F',
    hgvsp: 'p.C176F',
    consequence: 'missense',
    origin: 'somatic',
    sampleCount: 14,
    clinicalSignificance: 'pathogenic',
    functionalImpact: 'high',
  },
  // Tetramerization domain mutations
  {
    id: 'mut_R342X',
    position: 342,
    refAA: 'R',
    altAA: '*',
    hgvsp: 'p.R342*',
    consequence: 'nonsense',
    origin: 'somatic',
    sampleCount: 7,
    clinicalSignificance: 'pathogenic',
    functionalImpact: 'high',
  },
  // TAD domain mutation
  {
    id: 'mut_P27L',
    position: 27,
    refAA: 'P',
    altAA: 'L',
    hgvsp: 'p.P27L',
    consequence: 'missense',
    origin: 'somatic',
    sampleCount: 5,
    clinicalSignificance: 'uncertain',
    functionalImpact: 'moderate',
  },
];

/**
 * Example fusion breakpoints
 */
export const TP53_FUSIONS: FusionBreakpoint[] = [
  {
    id: 'fusion_1',
    position: 185,
    partnerGene: 'WRAP53',
    partnerPosition: 120,
    inFrame: true,
    orientation: '5prime',
    sampleCount: 3,
    fusionName: 'TP53-WRAP53',
  },
  {
    id: 'fusion_2',
    position: 292,
    partnerGene: 'EFNB3',
    partnerPosition: 45,
    inFrame: false,
    orientation: '3prime',
    sampleCount: 2,
  },
];

/**
 * Generate random mutations for testing
 */
export function generateRandomMutations(count: number, proteinLength: number = 393): Mutation[] {
  const consequences: ConsequenceType[] = [
    'missense',
    'missense',
    'missense',
    'missense', // Weight toward missense
    'nonsense',
    'frameshift',
    'splice',
    'inframe_deletion',
  ];
  const origins: MutationOrigin[] = ['somatic', 'somatic', 'somatic', 'germline'];
  const aas = 'ACDEFGHIKLMNPQRSTVWY';

  const mutations: Mutation[] = [];

  for (let i = 0; i < count; i++) {
    const position = Math.floor(Math.random() * proteinLength) + 1;
    const consequence = consequences[Math.floor(Math.random() * consequences.length)];
    const origin = origins[Math.floor(Math.random() * origins.length)];
    const refAA = aas[Math.floor(Math.random() * aas.length)];
    let altAA = aas[Math.floor(Math.random() * aas.length)];

    if (consequence === 'nonsense') altAA = '*';
    if (consequence === 'frameshift') altAA = 'fs';

    mutations.push({
      id: `mut_${i}`,
      position,
      refAA,
      altAA,
      hgvsp: `p.${refAA}${position}${altAA}`,
      consequence,
      origin,
      sampleCount: Math.floor(Math.random() * 50) + 1,
    });
  }

  return mutations;
}

/**
 * Get complete TP53 data
 */
export function getTP53Data() {
  return {
    protein: TP53_PROTEIN,
    domains: TP53_DOMAINS,
    mutations: TP53_MUTATIONS,
    fusions: TP53_FUSIONS,
  };
}
