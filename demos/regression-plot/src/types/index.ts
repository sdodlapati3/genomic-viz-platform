/**
 * Regression Plot Types
 */

export interface DataPoint {
  x: number;
  y: number;
  label?: string;
  group?: string;
}

export interface RegressionResult {
  coefficients: number[]; // [intercept, slope, ...higher order]
  rSquared: number;
  adjustedRSquared: number;
  standardError: number;
  pValue: number;
  fStatistic: number;
  residuals: number[];
  predicted: number[];
  confidenceInterval: {
    lower: number[];
    upper: number[];
  };
}

export interface LogisticRegressionResult {
  coefficients: number[];
  odds: number[];
  probabilities: number[];
  auc: number;
  accuracy: number;
  sensitivity: number;
  specificity: number;
  confusionMatrix: {
    tp: number;
    tn: number;
    fp: number;
    fn: number;
  };
}

export type RegressionType = 'linear' | 'logistic' | 'polynomial';

export interface RegressionSettings {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showConfidenceInterval: boolean;
  showResiduals: boolean;
  confidenceLevel: number; // 0.95 for 95%
  polynomialDegree: number;
  pointColor: string;
  lineColor: string;
  ciColor: string;
}
