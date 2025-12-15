/**
 * Mock data for linked views demonstration
 *
 * Simulates a cohort with TP53 mutations and expression data
 */

import { Sample, Mutation, GeneExpression } from '../types';

// Generate 50 samples with varying characteristics
export const SAMPLES: Sample[] = [
  // Group 1: High expressors with TP53 mutations
  {
    id: 'S001',
    patientId: 'P001',
    sampleType: 'tumor',
    diagnosis: 'AML',
    age: 45,
    sex: 'M',
    mutations: ['M001', 'M005'],
  },
  {
    id: 'S002',
    patientId: 'P002',
    sampleType: 'tumor',
    diagnosis: 'AML',
    age: 62,
    sex: 'F',
    mutations: ['M001'],
  },
  {
    id: 'S003',
    patientId: 'P003',
    sampleType: 'tumor',
    diagnosis: 'AML',
    age: 38,
    sex: 'M',
    mutations: ['M002'],
  },
  {
    id: 'S004',
    patientId: 'P004',
    sampleType: 'tumor',
    diagnosis: 'ALL',
    age: 12,
    sex: 'F',
    mutations: ['M003', 'M006'],
  },
  {
    id: 'S005',
    patientId: 'P005',
    sampleType: 'tumor',
    diagnosis: 'ALL',
    age: 8,
    sex: 'M',
    mutations: ['M003'],
  },

  // Group 2: Normal expressors without mutations
  {
    id: 'S006',
    patientId: 'P006',
    sampleType: 'tumor',
    diagnosis: 'AML',
    age: 55,
    sex: 'F',
    mutations: [],
  },
  {
    id: 'S007',
    patientId: 'P007',
    sampleType: 'tumor',
    diagnosis: 'AML',
    age: 48,
    sex: 'M',
    mutations: [],
  },
  {
    id: 'S008',
    patientId: 'P008',
    sampleType: 'tumor',
    diagnosis: 'ALL',
    age: 15,
    sex: 'F',
    mutations: [],
  },
  {
    id: 'S009',
    patientId: 'P009',
    sampleType: 'tumor',
    diagnosis: 'ALL',
    age: 22,
    sex: 'M',
    mutations: [],
  },
  {
    id: 'S010',
    patientId: 'P010',
    sampleType: 'tumor',
    diagnosis: 'AML',
    age: 67,
    sex: 'F',
    mutations: [],
  },

  // Group 3: Low expressors with splice mutations
  {
    id: 'S011',
    patientId: 'P011',
    sampleType: 'tumor',
    diagnosis: 'Neuroblastoma',
    age: 4,
    sex: 'M',
    mutations: ['M004'],
  },
  {
    id: 'S012',
    patientId: 'P012',
    sampleType: 'tumor',
    diagnosis: 'Neuroblastoma',
    age: 6,
    sex: 'F',
    mutations: ['M004', 'M007'],
  },
  {
    id: 'S013',
    patientId: 'P013',
    sampleType: 'tumor',
    diagnosis: 'Neuroblastoma',
    age: 3,
    sex: 'M',
    mutations: ['M007'],
  },
  {
    id: 'S014',
    patientId: 'P014',
    sampleType: 'tumor',
    diagnosis: 'Osteosarcoma',
    age: 16,
    sex: 'F',
    mutations: ['M004'],
  },
  {
    id: 'S015',
    patientId: 'P015',
    sampleType: 'tumor',
    diagnosis: 'Osteosarcoma',
    age: 14,
    sex: 'M',
    mutations: ['M007'],
  },

  // Group 4: Cell lines
  {
    id: 'S016',
    patientId: 'CL001',
    sampleType: 'cell_line',
    diagnosis: 'AML',
    mutations: ['M001', 'M002', 'M003'],
  },
  {
    id: 'S017',
    patientId: 'CL002',
    sampleType: 'cell_line',
    diagnosis: 'ALL',
    mutations: ['M001', 'M005'],
  },
  {
    id: 'S018',
    patientId: 'CL003',
    sampleType: 'cell_line',
    diagnosis: 'Neuroblastoma',
    mutations: ['M004', 'M006'],
  },

  // Group 5: Normal samples
  {
    id: 'S019',
    patientId: 'N001',
    sampleType: 'normal',
    diagnosis: 'Normal',
    age: 30,
    sex: 'M',
    mutations: [],
  },
  {
    id: 'S020',
    patientId: 'N002',
    sampleType: 'normal',
    diagnosis: 'Normal',
    age: 45,
    sex: 'F',
    mutations: [],
  },
  {
    id: 'S021',
    patientId: 'N003',
    sampleType: 'normal',
    diagnosis: 'Normal',
    age: 28,
    sex: 'F',
    mutations: [],
  },
  {
    id: 'S022',
    patientId: 'N004',
    sampleType: 'normal',
    diagnosis: 'Normal',
    age: 52,
    sex: 'M',
    mutations: [],
  },
  {
    id: 'S023',
    patientId: 'N005',
    sampleType: 'normal',
    diagnosis: 'Normal',
    age: 35,
    sex: 'F',
    mutations: [],
  },

  // Group 6: More tumors with various mutations
  {
    id: 'S024',
    patientId: 'P016',
    sampleType: 'tumor',
    diagnosis: 'AML',
    age: 71,
    sex: 'M',
    mutations: ['M002', 'M008'],
  },
  {
    id: 'S025',
    patientId: 'P017',
    sampleType: 'tumor',
    diagnosis: 'AML',
    age: 58,
    sex: 'F',
    mutations: ['M005'],
  },
  {
    id: 'S026',
    patientId: 'P018',
    sampleType: 'tumor',
    diagnosis: 'ALL',
    age: 9,
    sex: 'M',
    mutations: ['M003', 'M008'],
  },
  {
    id: 'S027',
    patientId: 'P019',
    sampleType: 'tumor',
    diagnosis: 'ALL',
    age: 11,
    sex: 'F',
    mutations: ['M006'],
  },
  {
    id: 'S028',
    patientId: 'P020',
    sampleType: 'tumor',
    diagnosis: 'Rhabdomyosarcoma',
    age: 7,
    sex: 'M',
    mutations: ['M001', 'M004'],
  },
  {
    id: 'S029',
    patientId: 'P021',
    sampleType: 'tumor',
    diagnosis: 'Rhabdomyosarcoma',
    age: 13,
    sex: 'F',
    mutations: ['M002'],
  },
  {
    id: 'S030',
    patientId: 'P022',
    sampleType: 'tumor',
    diagnosis: 'Ewing Sarcoma',
    age: 17,
    sex: 'M',
    mutations: ['M008'],
  },

  // Group 7: Xenografts
  { id: 'S031', patientId: 'X001', sampleType: 'xenograft', diagnosis: 'AML', mutations: ['M001'] },
  { id: 'S032', patientId: 'X002', sampleType: 'xenograft', diagnosis: 'ALL', mutations: ['M003'] },
  {
    id: 'S033',
    patientId: 'X003',
    sampleType: 'xenograft',
    diagnosis: 'Neuroblastoma',
    mutations: ['M004'],
  },

  // Group 8: Additional samples for better distribution
  {
    id: 'S034',
    patientId: 'P023',
    sampleType: 'tumor',
    diagnosis: 'AML',
    age: 42,
    sex: 'M',
    mutations: [],
  },
  {
    id: 'S035',
    patientId: 'P024',
    sampleType: 'tumor',
    diagnosis: 'AML',
    age: 51,
    sex: 'F',
    mutations: [],
  },
  {
    id: 'S036',
    patientId: 'P025',
    sampleType: 'tumor',
    diagnosis: 'ALL',
    age: 6,
    sex: 'M',
    mutations: [],
  },
  {
    id: 'S037',
    patientId: 'P026',
    sampleType: 'tumor',
    diagnosis: 'ALL',
    age: 10,
    sex: 'F',
    mutations: [],
  },
  {
    id: 'S038',
    patientId: 'P027',
    sampleType: 'tumor',
    diagnosis: 'Neuroblastoma',
    age: 2,
    sex: 'M',
    mutations: [],
  },
  {
    id: 'S039',
    patientId: 'P028',
    sampleType: 'tumor',
    diagnosis: 'Neuroblastoma',
    age: 5,
    sex: 'F',
    mutations: [],
  },
  {
    id: 'S040',
    patientId: 'P029',
    sampleType: 'tumor',
    diagnosis: 'Osteosarcoma',
    age: 15,
    sex: 'M',
    mutations: [],
  },
];

// TP53 mutations
export const MUTATIONS: Mutation[] = [
  {
    id: 'M001',
    gene: 'TP53',
    position: 175,
    aaChange: 'R175H',
    consequence: 'missense',
    sampleIds: ['S001', 'S002', 'S016', 'S017', 'S028', 'S031'],
    hotspot: true,
  },
  {
    id: 'M002',
    gene: 'TP53',
    position: 248,
    aaChange: 'R248W',
    consequence: 'missense',
    sampleIds: ['S003', 'S016', 'S024', 'S029'],
    hotspot: true,
  },
  {
    id: 'M003',
    gene: 'TP53',
    position: 273,
    aaChange: 'R273H',
    consequence: 'missense',
    sampleIds: ['S004', 'S005', 'S016', 'S026', 'S032'],
    hotspot: true,
  },
  {
    id: 'M004',
    gene: 'TP53',
    position: 125,
    aaChange: 'splice',
    consequence: 'splice',
    sampleIds: ['S011', 'S012', 'S014', 'S018', 'S028', 'S033'],
  },
  {
    id: 'M005',
    gene: 'TP53',
    position: 220,
    aaChange: 'Y220C',
    consequence: 'missense',
    sampleIds: ['S001', 'S017', 'S025'],
    hotspot: false,
  },
  {
    id: 'M006',
    gene: 'TP53',
    position: 282,
    aaChange: 'R282W',
    consequence: 'missense',
    sampleIds: ['S004', 'S018', 'S027'],
    hotspot: true,
  },
  {
    id: 'M007',
    gene: 'TP53',
    position: 196,
    aaChange: 'R196*',
    consequence: 'nonsense',
    sampleIds: ['S012', 'S013', 'S015'],
  },
  {
    id: 'M008',
    gene: 'TP53',
    position: 245,
    aaChange: 'G245S',
    consequence: 'missense',
    sampleIds: ['S024', 'S026', 'S030'],
    hotspot: false,
  },
];

// Expression data for TP53 and related genes
// Values simulate log2(TPM+1) scale
function generateExpressionValues(): GeneExpression[] {
  const expressions: GeneExpression[] = [];

  const geneProfiles: Record<string, { base: number; variance: number }> = {
    TP53: { base: 6.5, variance: 2 },
    MDM2: { base: 5.8, variance: 1.5 },
    MDM4: { base: 4.2, variance: 1.8 },
    CDKN1A: { base: 5.5, variance: 2.2 },
    BAX: { base: 6.0, variance: 1.2 },
  };

  SAMPLES.forEach((sample) => {
    Object.entries(geneProfiles).forEach(([gene, profile]) => {
      let value = profile.base + (Math.random() - 0.5) * profile.variance;

      // Modify expression based on mutation status
      if (sample.mutations.length > 0) {
        if (gene === 'TP53') {
          // Mutant samples often have higher TP53 expression (stable mutant protein)
          value += 1.5 + Math.random();
        } else if (gene === 'CDKN1A' || gene === 'BAX') {
          // Downstream targets often lower in mutant samples
          value -= 1 + Math.random() * 0.5;
        } else if (gene === 'MDM2') {
          // MDM2 may be elevated
          value += 0.5 + Math.random() * 0.5;
        }
      }

      // Add some outliers
      if (sample.id === 'S001' && gene === 'TP53') value = 11.5; // Extreme high
      if (sample.id === 'S016' && gene === 'TP53') value = 12.2; // Extreme high (cell line)
      if (sample.id === 'S011' && gene === 'TP53') value = 2.1; // Extreme low (splice)
      if (sample.id === 'S012' && gene === 'TP53') value = 1.8; // Extreme low (splice)

      // Normal samples cluster tightly
      if (sample.sampleType === 'normal') {
        value = profile.base + (Math.random() - 0.5) * 0.5;
      }

      expressions.push({
        geneId: gene,
        geneName: gene,
        sampleId: sample.id,
        value: Math.max(0, value),
      });
    });
  });

  return expressions;
}

export const EXPRESSIONS: GeneExpression[] = generateExpressionValues();

/**
 * Get expression data for a specific gene
 */
export function getGeneExpression(geneName: string): GeneExpression[] {
  return EXPRESSIONS.filter((e) => e.geneName === geneName);
}

/**
 * Get all expression data for a sample
 */
export function getSampleExpression(sampleId: string): GeneExpression[] {
  return EXPRESSIONS.filter((e) => e.sampleId === sampleId);
}

/**
 * Get sample by ID
 */
export function getSampleById(sampleId: string): Sample | undefined {
  return SAMPLES.find((s) => s.id === sampleId);
}

/**
 * Get mutation by ID
 */
export function getMutationById(mutationId: string): Mutation | undefined {
  return MUTATIONS.find((m) => m.id === mutationId);
}

/**
 * Get samples with a specific mutation
 */
export function getSamplesWithMutation(mutationId: string): Sample[] {
  const mutation = MUTATIONS.find((m) => m.id === mutationId);
  if (!mutation) return [];
  return SAMPLES.filter((s) => mutation.sampleIds.includes(s.id));
}

/**
 * Get mutations for a sample
 */
export function getMutationsForSample(sampleId: string): Mutation[] {
  return MUTATIONS.filter((m) => m.sampleIds.includes(sampleId));
}

/**
 * Get available genes with expression data
 */
export function getAvailableGenes(): string[] {
  return [...new Set(EXPRESSIONS.map((e) => e.geneName))];
}

/**
 * Get diagnosis categories
 */
export function getDiagnoses(): string[] {
  return [...new Set(SAMPLES.map((s) => s.diagnosis))];
}
