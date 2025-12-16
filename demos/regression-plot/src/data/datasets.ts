/**
 * Mock datasets for regression analysis
 */

import type { DataPoint } from '../types';

export interface Dataset {
  name: string;
  xLabel: string;
  yLabel: string;
  points: DataPoint[];
  description: string;
}

/**
 * Gene Expression vs Drug Response
 * Typical positive correlation
 */
export function generateExpressionDataset(): Dataset {
  const points: DataPoint[] = [];
  const n = 100;

  for (let i = 0; i < n; i++) {
    const x = Math.random() * 10; // Expression level (log2 TPM)
    // Linear relationship with noise
    const noise = (Math.random() - 0.5) * 2;
    const y = 0.5 + 0.8 * x + noise; // Drug response (IC50)

    points.push({
      x,
      y: Math.max(0, y),
      label: `Sample_${i + 1}`,
      group: Math.random() > 0.5 ? 'Responder' : 'Non-responder',
    });
  }

  return {
    name: 'expression',
    xLabel: 'Gene Expression (log2 TPM)',
    yLabel: 'Drug Response (IC50 μM)',
    points,
    description: 'Relationship between target gene expression and drug sensitivity',
  };
}

/**
 * Mutation Load vs Survival
 * Negative correlation
 */
export function generateMutationDataset(): Dataset {
  const points: DataPoint[] = [];
  const n = 80;

  for (let i = 0; i < n; i++) {
    const x = Math.random() * 500; // Mutation count
    // Negative relationship with noise
    const noise = (Math.random() - 0.5) * 10;
    const y = 60 - 0.05 * x + noise; // Survival months

    points.push({
      x,
      y: Math.max(1, y),
      label: `Patient_${i + 1}`,
      group: x > 250 ? 'High TMB' : 'Low TMB',
    });
  }

  return {
    name: 'mutation',
    xLabel: 'Tumor Mutation Burden',
    yLabel: 'Overall Survival (months)',
    points,
    description: 'Impact of tumor mutation burden on patient survival',
  };
}

/**
 * Age vs Biomarker
 * Nonlinear (polynomial) relationship
 */
export function generateAgeDataset(): Dataset {
  const points: DataPoint[] = [];
  const n = 120;

  for (let i = 0; i < n; i++) {
    const x = 20 + Math.random() * 60; // Age
    // Polynomial relationship (increases then decreases)
    const noise = (Math.random() - 0.5) * 5;
    const y = -0.02 * Math.pow(x - 50, 2) + 25 + noise; // Biomarker level

    points.push({
      x,
      y: Math.max(0, y),
      label: `Subject_${i + 1}`,
      group: x < 40 ? 'Young' : x < 60 ? 'Middle' : 'Senior',
    });
  }

  return {
    name: 'age',
    xLabel: 'Age (years)',
    yLabel: 'Biomarker Level',
    points,
    description: 'Age-related changes in biomarker concentration',
  };
}

/**
 * Binary outcome dataset for logistic regression
 */
export function generateBinaryDataset(): Dataset {
  const points: DataPoint[] = [];
  const n = 100;

  for (let i = 0; i < n; i++) {
    const x = Math.random() * 10; // Predictor
    // Logistic probability
    const logit = -3 + 0.8 * x;
    const prob = 1 / (1 + Math.exp(-logit));
    const y = Math.random() < prob ? 1 : 0; // Binary outcome

    points.push({
      x,
      y,
      label: `Sample_${i + 1}`,
      group: y === 1 ? 'Positive' : 'Negative',
    });
  }

  return {
    name: 'binary',
    xLabel: 'Risk Score',
    yLabel: 'Outcome (0/1)',
    points,
    description: 'Binary classification based on continuous predictor',
  };
}

export function getDataset(name: string): Dataset {
  switch (name) {
    case 'expression':
      return generateExpressionDataset();
    case 'mutation':
      return generateMutationDataset();
    case 'age':
      return generateAgeDataset();
    default:
      return generateExpressionDataset();
  }
}
