/**
 * Sample genomic datasets for violin plot visualization
 */
import type { ViolinDataset } from '../types';

// Helper to generate random values with normal distribution
function normalRandom(mean: number, std: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
}

// Generate gene expression data
function generateGeneExpressionData(): ViolinDataset {
  const groups = ['Breast', 'Lung', 'Colon', 'Prostate', 'Leukemia'];
  const means = [8.5, 7.2, 9.1, 6.8, 10.2];
  const stds = [1.5, 2.0, 1.2, 1.8, 2.5];
  const counts = [45, 52, 38, 41, 55];

  const data: ViolinDataset['data'] = [];

  groups.forEach((group, i) => {
    for (let j = 0; j < counts[i]; j++) {
      data.push({
        group,
        value: Math.max(0, normalRandom(means[i], stds[i])),
        sampleId: `${group.substring(0, 2).toUpperCase()}_${String(j + 1).padStart(3, '0')}`,
      });
    }
  });

  return {
    id: 'gene-expression',
    name: 'Gene Expression by Cancer Type',
    yLabel: 'Expression Level (log2 TPM)',
    data,
  };
}

// Generate mutation burden data
function generateMutationBurdenData(): ViolinDataset {
  const groups = ['MSI-High', 'MSI-Low', 'MSS'];
  const means = [150, 45, 20];
  const stds = [80, 25, 12];
  const counts = [35, 48, 62];

  const data: ViolinDataset['data'] = [];

  groups.forEach((group, i) => {
    for (let j = 0; j < counts[i]; j++) {
      data.push({
        group,
        value: Math.max(0, normalRandom(means[i], stds[i])),
        sampleId: `S_${String(data.length + 1).padStart(3, '0')}`,
      });
    }
  });

  return {
    id: 'mutation-burden',
    name: 'Mutation Burden Distribution',
    yLabel: 'Mutations per Megabase',
    data,
  };
}

// Generate survival time data
function generateSurvivalTimeData(): ViolinDataset {
  const groups = ['Stage I', 'Stage II', 'Stage III', 'Stage IV'];
  const means = [48, 36, 24, 12];
  const stds = [15, 12, 10, 8];
  const counts = [40, 45, 50, 38];

  const data: ViolinDataset['data'] = [];

  groups.forEach((group, i) => {
    for (let j = 0; j < counts[i]; j++) {
      data.push({
        group,
        value: Math.max(1, normalRandom(means[i], stds[i])),
        sampleId: `P_${String(data.length + 1).padStart(3, '0')}`,
      });
    }
  });

  return {
    id: 'survival-time',
    name: 'Survival Time by Stage',
    yLabel: 'Survival (months)',
    data,
  };
}

// Cache datasets
const datasets: Record<string, ViolinDataset> = {
  'gene-expression': generateGeneExpressionData(),
  'mutation-burden': generateMutationBurdenData(),
  'survival-time': generateSurvivalTimeData(),
};

export function getDataset(id: string): ViolinDataset {
  return datasets[id] || datasets['gene-expression'];
}

// Color schemes
export const colorSchemes = {
  categorical: ['#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#60a5fa', '#fb7185'],
};
