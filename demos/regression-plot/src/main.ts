/**
 * Regression Plot Demo - Main Entry Point
 *
 * Demonstrates various regression analysis visualizations:
 * - Linear regression
 * - Polynomial regression
 * - Logistic regression (sigmoid)
 * - Residual analysis
 */

import './styles.css';
import { RegressionPlot, ResidualPlot } from './components/RegressionPlot';
import {
  generateExpressionDataset,
  generateMutationDataset,
  generateAgeDataset,
} from './data/datasets';
import type { RegressionType, RegressionResult } from './types';

class RegressionDemo {
  private regressionPlot: RegressionPlot | null = null;
  private residualPlot: ResidualPlot | null = null;
  private currentDataset: string = 'expression';
  private currentRegression: RegressionType = 'linear';
  private showCI: boolean = true;
  private showResiduals: boolean = true;
  private lastResult: RegressionResult | null = null;

  constructor() {
    this.initializePlots();
    this.setupControls();
    this.updatePlot();
  }

  private initializePlots(): void {
    this.regressionPlot = new RegressionPlot('regression-container', {
      width: 700,
      height: 450,
      showConfidenceInterval: this.showCI,
    });

    this.residualPlot = new ResidualPlot('residual-container', {
      width: 700,
      height: 200,
    });
  }

  private setupControls(): void {
    // Dataset selector
    const datasetSelect = document.getElementById('dataset-select') as HTMLSelectElement;
    datasetSelect?.addEventListener('change', (e) => {
      this.currentDataset = (e.target as HTMLSelectElement).value;
      this.updatePlot();
    });

    // Regression type selector
    const regressionSelect = document.getElementById('regression-select') as HTMLSelectElement;
    regressionSelect?.addEventListener('change', (e) => {
      this.currentRegression = (e.target as HTMLSelectElement).value as RegressionType;
      this.updatePlot();
    });

    // Confidence interval toggle
    const ciCheckbox = document.getElementById('show-ci') as HTMLInputElement;
    ciCheckbox?.addEventListener('change', (e) => {
      this.showCI = (e.target as HTMLInputElement).checked;
      this.regressionPlot?.setShowCI(this.showCI);
      this.updatePlot();
    });

    // Residual plot toggle
    const residualCheckbox = document.getElementById('show-residuals') as HTMLInputElement;
    residualCheckbox?.addEventListener('change', (e) => {
      this.showResiduals = (e.target as HTMLInputElement).checked;
      const residualContainer = document.getElementById('residual-container');
      if (residualContainer) {
        residualContainer.style.display = this.showResiduals ? 'block' : 'none';
      }
      if (this.showResiduals && this.lastResult) {
        this.updateResidualPlot();
      }
    });
  }

  private getDataset() {
    switch (this.currentDataset) {
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

  private updatePlot(): void {
    const dataset = this.getDataset();

    // Update description
    const descriptionEl = document.getElementById('dataset-description');
    if (descriptionEl) {
      descriptionEl.textContent = dataset.description;
    }

    // Update main plot
    if (this.regressionPlot) {
      this.lastResult = this.regressionPlot.update(
        dataset.points,
        dataset.xLabel,
        dataset.yLabel,
        this.currentRegression
      );

      // Update stats panel
      this.updateStats();

      // Update residual plot
      if (this.showResiduals && this.lastResult) {
        this.updateResidualPlot();
      }
    }
  }

  private updateResidualPlot(): void {
    if (this.residualPlot && this.lastResult) {
      this.residualPlot.update(this.lastResult.predicted, this.lastResult.residuals);
    }
  }

  private updateStats(): void {
    if (!this.lastResult) return;

    const statsContainer = document.getElementById('stats-panel');
    if (!statsContainer) return;

    const { rSquared, adjustedRSquared, standardError, pValue, coefficients } = this.lastResult;

    statsContainer.innerHTML = `
      <h3>Regression Statistics</h3>
      <div class="stat-row">
        <span class="stat-label">R²:</span>
        <span class="stat-value">${rSquared.toFixed(4)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Adjusted R²:</span>
        <span class="stat-value">${adjustedRSquared.toFixed(4)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Std. Error:</span>
        <span class="stat-value">${standardError.toFixed(4)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">p-value:</span>
        <span class="stat-value ${pValue < 0.05 ? 'significant' : ''}">${pValue < 0.001 ? '< 0.001' : pValue.toFixed(4)}</span>
      </div>
      <h4>Coefficients</h4>
      <div class="stat-row">
        <span class="stat-label">Intercept:</span>
        <span class="stat-value">${coefficients[0].toFixed(4)}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Slope (β₁):</span>
        <span class="stat-value">${coefficients[1].toFixed(4)}</span>
      </div>
      ${
        coefficients.length > 2
          ? `
      <div class="stat-row">
        <span class="stat-label">β₂ (x²):</span>
        <span class="stat-value">${coefficients[2].toFixed(4)}</span>
      </div>
      `
          : ''
      }
      <h4>Equation</h4>
      <div class="equation">
        ${this.getEquationString(coefficients)}
      </div>
    `;
  }

  private getEquationString(coefficients: number[]): string {
    const formatCoef = (c: number) => {
      const sign = c >= 0 ? '+' : '';
      return sign + c.toFixed(2);
    };

    if (coefficients.length === 2) {
      return `y = ${coefficients[0].toFixed(2)} ${formatCoef(coefficients[1])}x`;
    } else if (coefficients.length === 3) {
      return `y = ${coefficients[0].toFixed(2)} ${formatCoef(coefficients[1])}x ${formatCoef(coefficients[2])}x²`;
    }
    return '';
  }
}

// Initialize demo when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new RegressionDemo();
});
