/**
 * Sample genomic datasets for box plot visualization
 */
import type { BoxDataset } from '../types';

// Helper to generate random values with normal distribution
function normalRandom(mean: number, std: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * std + mean;
}

// Generate expression by molecular subtype
function generateExpressionBySubtype(): BoxDataset {
  const groups = ['Luminal A', 'Luminal B', 'HER2+', 'Triple Negative', 'Normal-like'];
  const means = [9.2, 10.5, 11.8, 8.1, 7.5];
  const stds = [1.8, 2.2, 2.5, 2.0, 1.5];
  const counts = [42, 38, 28, 35, 22];

  const data: BoxDataset['data'] = [];

  groups.forEach((group, i) => {
    for (let j = 0; j < counts[i]; j++) {
      let value = normalRandom(means[i], stds[i]);
      // Add some outliers
      if (Math.random() < 0.05) {
        value = means[i] + (Math.random() > 0.5 ? 1 : -1) * stds[i] * (3 + Math.random() * 2);
      }
      data.push({
        group,
        value: Math.max(0, value),
        sampleId: `${group.replace(/[^A-Z]/g, '')}_${String(j + 1).padStart(3, '0')}`,
      });
    }
  });

  return {
    id: 'expression-by-subtype',
    name: 'Expression by Molecular Subtype',
    yLabel: 'Expression Level (log2)',
    data,
  };
}

// Generate TMB by cancer type
function generateTmbByCancer(): BoxDataset {
  const groups = ['Melanoma', 'Lung', 'Bladder', 'Colorectal', 'Breast', 'Prostate'];
  const means = [18, 12, 8, 15, 3, 2];
  const stds = [12, 8, 5, 10, 2, 1.5];
  const counts = [35, 45, 30, 40, 50, 38];

  const data: BoxDataset['data'] = [];

  groups.forEach((group, i) => {
    for (let j = 0; j < counts[i]; j++) {
      let value = normalRandom(means[i], stds[i]);
      // Add some outliers (hypermutated samples)
      if (Math.random() < 0.08) {
        value = means[i] + stds[i] * (4 + Math.random() * 4);
      }
      data.push({
        group,
        value: Math.max(0, value),
        sampleId: `TMB_${String(data.length + 1).padStart(3, '0')}`,
      });
    }
  });

  return {
    id: 'tmb-by-cancer',
    name: 'Tumor Mutation Burden by Cancer Type',
    yLabel: 'Mutations per Megabase',
    data,
  };
}

// Generate age by stage
function generateAgeByStage(): BoxDataset {
  const groups = ['Stage I', 'Stage II', 'Stage III', 'Stage IV'];
  const means = [55, 60, 65, 68];
  const stds = [12, 11, 10, 9];
  const counts = [52, 48, 45, 35];

  const data: BoxDataset['data'] = [];

  groups.forEach((group, i) => {
    for (let j = 0; j < counts[i]; j++) {
      const value = normalRandom(means[i], stds[i]);
      data.push({
        group,
        value: Math.max(18, Math.min(95, value)),
        sampleId: `P_${String(data.length + 1).padStart(3, '0')}`,
      });
    }
  });

  return {
    id: 'age-by-stage',
    name: 'Patient Age by Cancer Stage',
    yLabel: 'Age (years)',
    data,
  };
}

// Cache datasets
const datasets: Record<string, BoxDataset> = {
  'expression-by-subtype': generateExpressionBySubtype(),
  'tmb-by-cancer': generateTmbByCancer(),
  'age-by-stage': generateAgeByStage(),
};

export function getDataset(id: string): BoxDataset {
  return datasets[id] || datasets['expression-by-subtype'];
}

// Color schemes
export const colorSchemes = {
  categorical: ['#34d399', '#60a5fa', '#f472b6', '#fbbf24', '#a78bfa', '#fb7185'],
};
