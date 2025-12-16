/**
 * Dataset and View Configurations
 *
 * Demo datasets and available visualization views
 */

import type { Dataset, ViewConfig } from './types';

/** Available datasets */
export const DATASETS: Dataset[] = [
  {
    id: 'tcga-pan-cancer',
    name: 'TCGA Pan-Cancer Atlas',
    shortName: 'TCGA',
    description:
      'Comprehensive multi-cancer cohort with genomic, epigenomic, transcriptomic, and proteomic data across 33 cancer types.',
    category: 'cancer',
    sampleCount: 11069,
    geneCount: 20000,
    mutationCount: 3500000,
    features: ['SNV', 'CNV', 'Expression', 'Methylation', 'Clinical'],
    color: '#e74c3c',
    available: true,
  },
  {
    id: 'pcgp',
    name: 'Pediatric Cancer Genome Project',
    shortName: 'PCGP',
    description:
      'St. Jude comprehensive genomic characterization of pediatric cancers including leukemia, brain tumors, and solid tumors.',
    category: 'pediatric',
    sampleCount: 800,
    geneCount: 18000,
    mutationCount: 150000,
    features: ['SNV', 'SV', 'Fusion', 'Expression', 'Clinical'],
    color: '#3498db',
    available: true,
  },
  {
    id: 'target-all',
    name: 'TARGET Acute Lymphoblastic Leukemia',
    shortName: 'TARGET-ALL',
    description:
      'Therapeutically Applicable Research to Generate Effective Treatments for pediatric ALL.',
    category: 'pediatric',
    sampleCount: 2500,
    geneCount: 15000,
    mutationCount: 200000,
    features: ['SNV', 'CNV', 'Expression', 'Survival'],
    color: '#9b59b6',
    available: true,
  },
  {
    id: 'cosmic',
    name: 'COSMIC Cancer Mutations',
    shortName: 'COSMIC',
    description:
      'Catalogue of Somatic Mutations in Cancer - curated database of somatic mutations across many cancer types.',
    category: 'cancer',
    sampleCount: 45000,
    mutationCount: 7000000,
    features: ['SNV', 'CNV', 'Fusion', 'Gene Census'],
    color: '#f39c12',
    available: false, // Coming soon
  },
  {
    id: 'gnomad',
    name: 'gnomAD Population Variants',
    shortName: 'gnomAD',
    description:
      'Genome Aggregation Database - germline variants from >140,000 individuals across diverse populations.',
    category: 'germline',
    sampleCount: 141456,
    mutationCount: 76000000,
    features: ['SNV', 'Indel', 'SV', 'Population Frequencies'],
    color: '#27ae60',
    available: false, // Coming soon
  },
  {
    id: 'custom',
    name: 'Upload Custom Dataset',
    shortName: 'Custom',
    description: 'Upload your own VCF, MAF, or JSON files to visualize with our interactive tools.',
    category: 'custom',
    sampleCount: 0,
    features: ['VCF', 'MAF', 'JSON', 'BED'],
    color: '#95a5a6',
    available: true,
  },
];

/** Available visualization views */
export const VIEWS: ViewConfig[] = [
  {
    id: 'lollipop',
    name: 'Lollipop Plot',
    description:
      'Visualize mutations along protein domains with interactive filtering and sample linking.',
    icon: '🍭',
    supportedDatasets: ['all'],
    demoUrl: 'http://localhost:5180/',
  },
  {
    id: 'oncoprint',
    name: 'Oncoprint Matrix',
    description: 'Gene × Sample mutation matrix showing mutation patterns across cohorts.',
    icon: '📊',
    supportedDatasets: ['all'],
    demoUrl: 'http://localhost:5181/',
  },
  {
    id: 'genome-browser',
    name: 'Genome Browser',
    description: 'Track-based genomic visualization with genes, mutations, and signal data.',
    icon: '🧬',
    supportedDatasets: ['all'],
    demoUrl: 'http://localhost:5182/',
  },
  {
    id: 'scatter',
    name: 'Scatter Plot',
    description: 'Interactive 2D/3D scatter plots for expression, PCA, or custom dimensions.',
    icon: '⚡',
    supportedDatasets: ['tcga-pan-cancer', 'pcgp', 'target-all'],
  },
  {
    id: 'heatmap',
    name: 'Expression Heatmap',
    description: 'Clustered heatmaps for gene expression or methylation data.',
    icon: '🔥',
    supportedDatasets: ['tcga-pan-cancer', 'pcgp'],
  },
  {
    id: 'survival',
    name: 'Survival Analysis',
    description: 'Kaplan-Meier curves with log-rank tests for clinical outcomes.',
    icon: '📈',
    supportedDatasets: ['tcga-pan-cancer', 'target-all'],
  },
  {
    id: 'volcano',
    name: 'Volcano Plot',
    description: 'Differential expression visualization with significance thresholds.',
    icon: '🌋',
    supportedDatasets: ['tcga-pan-cancer', 'pcgp'],
  },
];

/** Category labels and colors */
export const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  cancer: { label: 'Cancer', color: '#e74c3c' },
  pediatric: { label: 'Pediatric', color: '#3498db' },
  germline: { label: 'Germline', color: '#27ae60' },
  adult: { label: 'Adult', color: '#f39c12' },
  custom: { label: 'Custom', color: '#95a5a6' },
  all: { label: 'All Datasets', color: '#7f8c8d' },
};

/** Get datasets by category */
export function getDatasetsByCategory(category: string): Dataset[] {
  if (category === 'all') {
    return DATASETS;
  }
  return DATASETS.filter((d) => d.category === category);
}

/** Search datasets */
export function searchDatasets(query: string): Dataset[] {
  const lowerQuery = query.toLowerCase();
  return DATASETS.filter(
    (d) =>
      d.name.toLowerCase().includes(lowerQuery) ||
      d.shortName.toLowerCase().includes(lowerQuery) ||
      d.description.toLowerCase().includes(lowerQuery) ||
      d.features.some((f) => f.toLowerCase().includes(lowerQuery))
  );
}

/** Get views available for a dataset */
export function getViewsForDataset(datasetId: string): ViewConfig[] {
  return VIEWS.filter(
    (v) => v.supportedDatasets.includes('all') || v.supportedDatasets.includes(datasetId)
  );
}
