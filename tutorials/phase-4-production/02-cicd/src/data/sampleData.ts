/**
 * Sample Genomic Data
 * Test data for CI/CD pipeline demo
 */

import type { GeneData } from '../utils/dataTransform';

/**
 * Sample gene expression data
 */
export const sampleGeneData: GeneData[] = [
  { gene: 'TP53', expression: 125.4, category: 'tumor-suppressor' },
  { gene: 'BRCA1', expression: 89.2, category: 'tumor-suppressor' },
  { gene: 'BRCA2', expression: 76.8, category: 'tumor-suppressor' },
  { gene: 'EGFR', expression: 234.5, category: 'oncogene' },
  { gene: 'KRAS', expression: 156.3, category: 'oncogene' },
  { gene: 'MYC', expression: 198.7, category: 'oncogene' },
  { gene: 'PIK3CA', expression: 112.4, category: 'oncogene' },
  { gene: 'PTEN', expression: 45.6, category: 'tumor-suppressor' },
  { gene: 'RB1', expression: 67.3, category: 'tumor-suppressor' },
  { gene: 'APC', expression: 34.2, category: 'tumor-suppressor' },
];

/**
 * Sample mutation data for testing
 */
export const sampleMutationData = [
  {
    gene: 'TP53',
    position: 7577120,
    chromosome: '17',
    type: 'missense',
    consequence: 'R175H',
    frequency: 0.045,
  },
  {
    gene: 'KRAS',
    position: 25398284,
    chromosome: '12',
    type: 'missense',
    consequence: 'G12D',
    frequency: 0.032,
  },
  {
    gene: 'EGFR',
    position: 55249071,
    chromosome: '7',
    type: 'inframe_deletion',
    consequence: 'E746_A750del',
    frequency: 0.018,
  },
  {
    gene: 'PIK3CA',
    position: 178936091,
    chromosome: '3',
    type: 'missense',
    consequence: 'H1047R',
    frequency: 0.025,
  },
  {
    gene: 'BRAF',
    position: 140453136,
    chromosome: '7',
    type: 'missense',
    consequence: 'V600E',
    frequency: 0.015,
  },
];

/**
 * Sample clinical data
 */
export const sampleClinicalData = [
  { sampleId: 'TCGA-001', age: 54, gender: 'female', stage: 'III', survival_months: 36 },
  { sampleId: 'TCGA-002', age: 67, gender: 'male', stage: 'II', survival_months: 48 },
  { sampleId: 'TCGA-003', age: 45, gender: 'female', stage: 'IV', survival_months: 18 },
  { sampleId: 'TCGA-004', age: 72, gender: 'male', stage: 'I', survival_months: 60 },
  { sampleId: 'TCGA-005', age: 58, gender: 'female', stage: 'II', survival_months: 52 },
];
