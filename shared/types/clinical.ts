/**
 * Clinical Types
 * Type definitions for clinical and sample data
 */

// =============================================================================
// Sample Types
// =============================================================================

export interface Sample {
  /** Unique sample identifier */
  sampleId: string;
  /** Patient/donor identifier */
  patientId: string;
  /** Sample type */
  sampleType: SampleType;
  /** Tissue of origin */
  tissue?: string;
  /** Is this a tumor sample? */
  isTumor: boolean;
  /** Collection date */
  collectionDate?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

export type SampleType =
  | 'primary_tumor'
  | 'recurrent_tumor'
  | 'metastatic'
  | 'normal_tissue'
  | 'blood_normal'
  | 'cell_line'
  | 'xenograft'
  | 'organoid';

// =============================================================================
// Patient Types
// =============================================================================

export interface Patient {
  /** Unique patient identifier */
  patientId: string;
  /** Age at diagnosis (years) */
  ageAtDiagnosis?: number;
  /** Sex */
  sex?: 'male' | 'female' | 'other' | 'unknown';
  /** Race/ethnicity */
  race?: string;
  /** Ethnicity */
  ethnicity?: string;
  /** Vital status */
  vitalStatus?: 'alive' | 'deceased' | 'unknown';
  /** Primary diagnosis */
  diagnosis?: Diagnosis;
  /** Treatment history */
  treatments?: Treatment[];
  /** Associated samples */
  samples?: Sample[];
}

export interface Diagnosis {
  /** Disease/cancer type */
  disease: string;
  /** ICD-10 code */
  icd10Code?: string;
  /** OncoTree code */
  oncotreeCode?: string;
  /** Disease stage */
  stage?: string;
  /** Disease grade */
  grade?: string;
  /** Histological type */
  histology?: string;
  /** Primary site */
  primarySite?: string;
  /** Diagnosis date */
  diagnosisDate?: string;
}

export interface Treatment {
  /** Treatment type */
  type: TreatmentType;
  /** Treatment name/regimen */
  name: string;
  /** Start date */
  startDate?: string;
  /** End date */
  endDate?: string;
  /** Response */
  response?: TreatmentResponse;
  /** Additional details */
  details?: string;
}

export type TreatmentType =
  | 'chemotherapy'
  | 'radiation'
  | 'surgery'
  | 'immunotherapy'
  | 'targeted_therapy'
  | 'hormone_therapy'
  | 'stem_cell_transplant'
  | 'other';

export type TreatmentResponse =
  | 'complete_response'
  | 'partial_response'
  | 'stable_disease'
  | 'progressive_disease'
  | 'not_evaluated';

// =============================================================================
// Cohort Types
// =============================================================================

export interface Cohort {
  /** Cohort identifier */
  cohortId: string;
  /** Cohort name */
  name: string;
  /** Description */
  description?: string;
  /** Number of samples */
  sampleCount: number;
  /** Number of patients */
  patientCount: number;
  /** Disease types included */
  diseases?: string[];
  /** Data types available */
  dataTypes?: DataType[];
  /** Creation date */
  createdAt: string;
  /** Last updated */
  updatedAt: string;
}

export type DataType =
  | 'wgs'           // Whole genome sequencing
  | 'wes'           // Whole exome sequencing
  | 'rna_seq'       // RNA sequencing
  | 'methylation'   // DNA methylation
  | 'proteomics'    // Protein expression
  | 'clinical'      // Clinical data
  | 'imaging';      // Medical imaging

// =============================================================================
// Survival Types
// =============================================================================

export interface SurvivalData {
  /** Patient or sample ID */
  id: string;
  /** Time to event (in days, months, or years) */
  time: number;
  /** Time unit */
  timeUnit: 'days' | 'months' | 'years';
  /** Event occurred? (false = censored) */
  event: boolean;
  /** Event type */
  eventType?: SurvivalEventType;
  /** Group/strata for comparison */
  group?: string;
  /** Additional covariates */
  covariates?: Record<string, unknown>;
}

export type SurvivalEventType =
  | 'death'
  | 'relapse'
  | 'progression'
  | 'metastasis'
  | 'last_followup';

export interface SurvivalCurve {
  /** Time points */
  time: number[];
  /** Survival probability at each time point */
  survival: number[];
  /** Lower confidence interval */
  ciLower: number[];
  /** Upper confidence interval */
  ciUpper: number[];
  /** Number at risk at each time point */
  nRisk: number[];
  /** Number of events at each time point */
  nEvent: number[];
  /** Group name (for stratified analysis) */
  group?: string;
  /** Median survival time */
  medianSurvival?: number;
}

export interface SurvivalAnalysisResult {
  /** Survival curves for each group */
  curves: SurvivalCurve[];
  /** Log-rank test p-value */
  logRankPValue?: number;
  /** Cox regression results */
  coxResults?: CoxRegressionResult;
}

export interface CoxRegressionResult {
  /** Hazard ratio */
  hazardRatio: number;
  /** 95% CI lower bound */
  ciLower: number;
  /** 95% CI upper bound */
  ciUpper: number;
  /** p-value */
  pValue: number;
  /** Coefficient */
  coefficient: number;
  /** Standard error */
  standardError: number;
}

// =============================================================================
// Expression Types
// =============================================================================

export interface ExpressionData {
  /** Gene symbol or ID */
  gene: string;
  /** Sample ID */
  sampleId: string;
  /** Expression value */
  value: number;
  /** Value type */
  valueType: ExpressionValueType;
}

export type ExpressionValueType =
  | 'raw_counts'
  | 'tpm'           // Transcripts per million
  | 'fpkm'          // Fragments per kilobase million
  | 'rpkm'          // Reads per kilobase million
  | 'log2'          // Log2 transformed
  | 'zscore';       // Z-score normalized

export interface ExpressionMatrix {
  /** Gene identifiers (rows) */
  genes: string[];
  /** Sample identifiers (columns) */
  samples: string[];
  /** Expression values (genes x samples) */
  values: number[][];
  /** Value type */
  valueType: ExpressionValueType;
}

export interface DifferentialExpressionResult {
  /** Gene symbol or ID */
  gene: string;
  /** Log2 fold change */
  log2FoldChange: number;
  /** Raw p-value */
  pValue: number;
  /** Adjusted p-value (FDR) */
  padj: number;
  /** Base mean expression */
  baseMean?: number;
  /** Standard error */
  lfcSE?: number;
  /** Significance flag */
  isSignificant?: boolean;
}
