/**
 * Survival Page Object
 */

import { BasePage } from './BasePage.js';

export class SurvivalPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    
    this.selectors = {
      // Main chart
      survivalPlot: '[data-testid="survival-plot"], .survival-plot, svg.kaplan-meier',
      survivalCurves: '[data-testid="survival-curve"], path.curve, .km-curve',
      confidenceIntervals: '[data-testid="ci-band"], .confidence-interval',
      riskTable: '[data-testid="risk-table"], .risk-table, table.at-risk',
      
      // Controls
      geneSelector: '[data-testid="gene-selector"], select#gene',
      stratifyBy: '[data-testid="stratify-by"], select#stratify',
      thresholdSlider: '[data-testid="threshold-slider"], input[type="range"]',
      thresholdInput: '[data-testid="threshold-input"], input#threshold',
      
      // Cohort selection
      cohortSelector: '[data-testid="cohort-selector"], .cohort-select',
      cohort1: '[data-testid="cohort-1"], .cohort-high',
      cohort2: '[data-testid="cohort-2"], .cohort-low',
      
      // Statistics
      statsPanel: '[data-testid="stats-panel"], .statistics-panel',
      pValue: '[data-testid="pvalue"], .p-value',
      hazardRatio: '[data-testid="hazard-ratio"], .hazard-ratio',
      medianSurvival: '[data-testid="median-survival"], .median-survival',
      
      // Interaction
      tooltip: '[data-testid="survival-tooltip"], .tooltip',
      legend: '[data-testid="legend"], .legend',
      timeAxis: '.x-axis, [data-testid="time-axis"]',
      probabilityAxis: '.y-axis, [data-testid="probability-axis"]',
      
      // Export
      exportButton: '[data-testid="export-btn"], button.export',
    };
  }

  /**
   * Navigate to survival page
   */
  async goto() {
    await super.goto('/survival');
    await this.waitForLoad();
    await this.waitForLoading();
  }

  /**
   * Select a gene for stratification
   * @param {string} gene 
   */
  async selectGene(gene) {
    await this.page.selectOption(this.selectors.geneSelector, gene);
    await this.waitForLoading();
  }

  /**
   * Set stratification method
   * @param {string} method - 'median' | 'quartile' | 'custom'
   */
  async setStratification(method) {
    await this.page.selectOption(this.selectors.stratifyBy, method);
    await this.waitForLoading();
  }

  /**
   * Set custom threshold value
   * @param {number} value 
   */
  async setThreshold(value) {
    await this.fill(this.selectors.thresholdInput, value.toString());
    await this.page.keyboard.press('Enter');
    await this.waitForLoading();
  }

  /**
   * Check if survival plot is rendered
   */
  async isPlotRendered() {
    const plot = this.page.locator(this.selectors.survivalPlot);
    await plot.waitFor({ state: 'visible' });
    
    // Check for curves
    const curves = await this.page.locator(this.selectors.survivalCurves).count();
    return curves > 0;
  }

  /**
   * Get number of curves displayed
   */
  async getCurveCount() {
    return await this.page.locator(this.selectors.survivalCurves).count();
  }

  /**
   * Get p-value from statistics
   */
  async getPValue() {
    const pValueText = await this.getText(this.selectors.pValue);
    const match = pValueText?.match(/[\d.e-]+/);
    return match ? parseFloat(match[0]) : null;
  }

  /**
   * Get hazard ratio
   */
  async getHazardRatio() {
    const hrText = await this.getText(this.selectors.hazardRatio);
    const match = hrText?.match(/[\d.]+/);
    return match ? parseFloat(match[0]) : null;
  }

  /**
   * Get median survival times
   */
  async getMedianSurvival() {
    const medianText = await this.getText(this.selectors.medianSurvival);
    return medianText?.trim();
  }

  /**
   * Check if confidence intervals are shown
   */
  async hasConfidenceIntervals() {
    return await this.page.locator(this.selectors.confidenceIntervals).count() > 0;
  }

  /**
   * Get risk table data
   */
  async getRiskTableData() {
    const table = this.page.locator(this.selectors.riskTable);
    if (!(await table.isVisible())) return null;
    
    const headers = await table.locator('th').allTextContents();
    const rows = await table.locator('tbody tr').all();
    
    const data = [];
    for (const row of rows) {
      const cells = await row.locator('td').allTextContents();
      data.push(cells);
    }
    
    return { headers, data };
  }

  /**
   * Toggle confidence interval display
   */
  async toggleConfidenceIntervals() {
    await this.click('[data-testid="ci-toggle"], button.toggle-ci');
    await this.waitForLoading();
  }

  /**
   * Hover over curve to show tooltip
   * @param {number} curveIndex 
   */
  async hoverCurve(curveIndex = 0) {
    const curves = this.page.locator(this.selectors.survivalCurves);
    await curves.nth(curveIndex).hover();
  }

  /**
   * Get legend items
   */
  async getLegendItems() {
    const legend = this.page.locator(this.selectors.legend);
    const items = await legend.locator('.legend-item, text').all();
    
    const legendData = [];
    for (const item of items) {
      const text = await item.textContent();
      legendData.push(text?.trim());
    }
    
    return legendData;
  }

  /**
   * Export plot
   * @param {string} format - 'png' | 'svg' | 'pdf'
   */
  async exportPlot(format = 'png') {
    await this.click(this.selectors.exportButton);
    await this.click(`[data-format="${format}"]`);
  }

  /**
   * Get all statistics
   */
  async getStatistics() {
    return {
      pValue: await this.getPValue(),
      hazardRatio: await this.getHazardRatio(),
      medianSurvival: await this.getMedianSurvival(),
    };
  }
}
