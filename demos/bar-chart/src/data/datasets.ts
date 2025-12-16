/**
 * Sample genomic datasets for bar chart visualization
 */
import type { BarChartDataset } from '../types';

// Mutation types by cancer type (grouped data)
export const mutationTypesByCancer: BarChartDataset = {
  id: 'mutation-types',
  name: 'Mutation Types by Cancer',
  groups: ['Missense', 'Nonsense', 'Frameshift', 'Splice'],
  data: [
    // Breast Cancer
    { category: 'Breast Cancer', group: 'Missense', value: 245 },
    { category: 'Breast Cancer', group: 'Nonsense', value: 78 },
    { category: 'Breast Cancer', group: 'Frameshift', value: 56 },
    { category: 'Breast Cancer', group: 'Splice', value: 34 },
    // Lung Cancer
    { category: 'Lung Cancer', group: 'Missense', value: 312 },
    { category: 'Lung Cancer', group: 'Nonsense', value: 95 },
    { category: 'Lung Cancer', group: 'Frameshift', value: 67 },
    { category: 'Lung Cancer', group: 'Splice', value: 45 },
    // Colon Cancer
    { category: 'Colon Cancer', group: 'Missense', value: 198 },
    { category: 'Colon Cancer', group: 'Nonsense', value: 112 },
    { category: 'Colon Cancer', group: 'Frameshift', value: 89 },
    { category: 'Colon Cancer', group: 'Splice', value: 28 },
    // Prostate Cancer
    { category: 'Prostate Cancer', group: 'Missense', value: 156 },
    { category: 'Prostate Cancer', group: 'Nonsense', value: 45 },
    { category: 'Prostate Cancer', group: 'Frameshift', value: 34 },
    { category: 'Prostate Cancer', group: 'Splice', value: 23 },
    // Leukemia
    { category: 'Leukemia', group: 'Missense', value: 287 },
    { category: 'Leukemia', group: 'Nonsense', value: 134 },
    { category: 'Leukemia', group: 'Frameshift', value: 98 },
    { category: 'Leukemia', group: 'Splice', value: 67 },
    // Melanoma
    { category: 'Melanoma', group: 'Missense', value: 423 },
    { category: 'Melanoma', group: 'Nonsense', value: 89 },
    { category: 'Melanoma', group: 'Frameshift', value: 45 },
    { category: 'Melanoma', group: 'Splice', value: 32 },
  ],
};

// Gene mutation frequency (simple data)
export const geneMutationFrequency: BarChartDataset = {
  id: 'gene-frequency',
  name: 'Gene Mutation Frequency',
  data: [
    { category: 'TP53', value: 42.5 },
    { category: 'PIK3CA', value: 28.3 },
    { category: 'KRAS', value: 25.1 },
    { category: 'PTEN', value: 18.7 },
    { category: 'APC', value: 15.4 },
    { category: 'EGFR', value: 14.2 },
    { category: 'BRAF', value: 12.8 },
    { category: 'ATM', value: 11.5 },
    { category: 'BRCA1', value: 9.8 },
    { category: 'BRCA2', value: 8.6 },
    { category: 'CDH1', value: 7.3 },
    { category: 'RB1', value: 6.9 },
  ],
};

// Sample counts per cancer type (simple data)
export const sampleCountsByCancer: BarChartDataset = {
  id: 'sample-counts',
  name: 'Samples per Cancer Type',
  data: [
    { category: 'Breast', value: 1098 },
    { category: 'Lung', value: 1023 },
    { category: 'Colorectal', value: 625 },
    { category: 'Prostate', value: 498 },
    { category: 'Thyroid', value: 507 },
    { category: 'Liver', value: 373 },
    { category: 'Stomach', value: 443 },
    { category: 'Kidney', value: 534 },
    { category: 'Bladder', value: 412 },
    { category: 'Ovarian', value: 379 },
  ],
};

// Get dataset by ID
export function getDataset(id: string): BarChartDataset {
  switch (id) {
    case 'mutation-types':
      return mutationTypesByCancer;
    case 'gene-frequency':
      return geneMutationFrequency;
    case 'sample-counts':
      return sampleCountsByCancer;
    default:
      return mutationTypesByCancer;
  }
}

// Color schemes
export const colorSchemes = {
  categorical: [
    '#60a5fa',
    '#f472b6',
    '#34d399',
    '#fbbf24',
    '#a78bfa',
    '#fb7185',
    '#38bdf8',
    '#4ade80',
  ],
  sequential: [
    '#bfdbfe',
    '#93c5fd',
    '#60a5fa',
    '#3b82f6',
    '#2563eb',
    '#1d4ed8',
    '#1e40af',
    '#1e3a8a',
  ],
  diverging: [
    '#ef4444',
    '#f87171',
    '#fca5a5',
    '#fecaca',
    '#bfdbfe',
    '#93c5fd',
    '#60a5fa',
    '#3b82f6',
  ],
};
