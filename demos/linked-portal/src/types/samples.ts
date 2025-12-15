/**
 * Sample Types
 *
 * Clinical and sample metadata
 */

import type { Mutation } from './mutations';

export interface Sample {
  sampleId: string;
  patientId: string;
  sampleType?: 'primary_tumor' | 'metastatic' | 'recurrent' | 'normal';
  tissue?: string;
  isTumor?: boolean;
  disease: string;
  age?: number;
  ageAtDiagnosis?: number;
  sex?: 'male' | 'female' | 'unknown';
  stage?: string;
  survivalTime?: number; // Days
  survivalMonths?: number; // Months
  survivalEvent?: boolean; // True = event occurred (death)
  vitalStatus?: 'alive' | 'deceased' | 'unknown';
  treatmentGroup?: string;
  treatmentStatus?: string;
  metadata?: Record<string, unknown>;
}

export interface SampleWithMutations extends Sample {
  mutations: Mutation[];
  mutationCount: number;
}

/**
 * Disease color palette
 */
export const DISEASE_COLORS: Record<string, string> = {
  Glioblastoma: '#e74c3c',
  'Lung adenocarcinoma': '#3498db',
  'Breast invasive carcinoma': '#e91e63',
  'Colorectal adenocarcinoma': '#9c27b0',
  'Prostate adenocarcinoma': '#00bcd4',
  'Hepatocellular carcinoma': '#ff9800',
  'Pancreatic adenocarcinoma': '#795548',
  'Ovarian serous carcinoma': '#673ab7',
  'Breast Cancer': '#e91e63',
  'Lung Cancer': '#3498db',
  'Colorectal Cancer': '#9c27b0',
  'Ovarian Cancer': '#673ab7',
  Leukemia: '#ff5722',
  default: '#95a5a6',
};

export function getDiseaseColor(disease: string): string {
  return DISEASE_COLORS[disease] || DISEASE_COLORS.default;
}
