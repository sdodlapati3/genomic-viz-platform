/**
 * Expression Page Object
 */

import { BasePage } from './BasePage.js';

export class ExpressionPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    
    this.selectors = {
      // Main elements
      heatmap: '[data-testid="heatmap"], .heatmap, svg.expression-heatmap',
      volcanoPlot: '[data-testid="volcano-plot"], .volcano-plot',
      scatterPlot: '[data-testid="scatter-plot"], .scatter-plot',
      
      // Controls
      datasetSelector: '[data-testid="dataset-selector"], select#dataset',
      viewToggle: '[data-testid="view-toggle"], .view-toggle',
      clusteringToggle: '[data-testid="clustering-toggle"], input[name="clustering"]',
      normalizationSelect: '[data-testid="normalization"], select#normalization',
      
      // Filters
      pValueThreshold: '[data-testid="pvalue-threshold"], input[name="pvalue"]',
      foldChangeThreshold: '[data-testid="fc-threshold"], input[name="foldChange"]',
      
      // Data elements
      genes: '[data-testid="gene-row"], .gene-row',
      samples: '[data-testid="sample-col"], .sample-column',
      volcanoPoints: '[data-testid="volcano-point"], circle.point',
      significantGenes: '[data-testid="significant-gene"], .significant',
      
      // Interaction
      tooltip: '[data-testid="expression-tooltip"], .tooltip',
      colorScale: '[data-testid="color-scale"], .color-scale',
      exportButton: '[data-testid="export-btn"], button.export',
      
      // Tables
      deTable: '[data-testid="de-table"], table.differential-expression',
      geneDetails: '[data-testid="gene-details"], .gene-details-panel',
    };
  }

  /**
   * Navigate to expression page
   */
  async goto() {
    await super.goto('/expression');
    await this.waitForLoad();
    await this.waitForLoading();
  }

  /**
   * Select a dataset
   * @param {string} dataset 
   */
  async selectDataset(dataset) {
    await this.page.selectOption(this.selectors.datasetSelector, dataset);
    await this.waitForLoading();
  }

  /**
   * Toggle view (heatmap/volcano/scatter)
   * @param {string} view - 'heatmap' | 'volcano' | 'scatter'
   */
  async toggleView(view) {
    await this.click(`[data-view="${view}"], button[value="${view}"]`);
    await this.waitForLoading();
  }

  /**
   * Check if heatmap is rendered
   */
  async isHeatmapRendered() {
    const heatmap = this.page.locator(this.selectors.heatmap);
    return await heatmap.isVisible();
  }

  /**
   * Check if volcano plot is rendered
   */
  async isVolcanoPlotRendered() {
    const volcano = this.page.locator(this.selectors.volcanoPlot);
    return await volcano.isVisible();
  }

  /**
   * Get gene count in heatmap
   */
  async getGeneCount() {
    return await this.page.locator(this.selectors.genes).count();
  }

  /**
   * Get sample count in heatmap
   */
  async getSampleCount() {
    return await this.page.locator(this.selectors.samples).count();
  }

  /**
   * Set p-value threshold
   * @param {number} value 
   */
  async setPValueThreshold(value) {
    await this.fill(this.selectors.pValueThreshold, value.toString());
    await this.page.keyboard.press('Enter');
    await this.waitForLoading();
  }

  /**
   * Set fold change threshold
   * @param {number} value 
   */
  async setFoldChangeThreshold(value) {
    await this.fill(this.selectors.foldChangeThreshold, value.toString());
    await this.page.keyboard.press('Enter');
    await this.waitForLoading();
  }

  /**
   * Get significant genes count
   */
  async getSignificantGenesCount() {
    return await this.page.locator(this.selectors.significantGenes).count();
  }

  /**
   * Click on a volcano point
   * @param {number} index 
   */
  async clickVolcanoPoint(index = 0) {
    const points = this.page.locator(this.selectors.volcanoPoints);
    await points.nth(index).click();
  }

  /**
   * Enable clustering
   */
  async enableClustering() {
    const checkbox = this.page.locator(this.selectors.clusteringToggle);
    if (!(await checkbox.isChecked())) {
      await checkbox.click();
      await this.waitForLoading();
    }
  }

  /**
   * Set normalization method
   * @param {string} method - 'raw' | 'log2' | 'zscore'
   */
  async setNormalization(method) {
    await this.page.selectOption(this.selectors.normalizationSelect, method);
    await this.waitForLoading();
  }

  /**
   * Get gene details panel content
   */
  async getGeneDetails() {
    await this.waitFor(this.selectors.geneDetails);
    return await this.getText(this.selectors.geneDetails);
  }

  /**
   * Export data
   * @param {string} format - 'csv' | 'json' | 'png'
   */
  async exportData(format = 'csv') {
    await this.click(this.selectors.exportButton);
    await this.click(`[data-format="${format}"]`);
  }

  /**
   * Get differential expression table data
   */
  async getDETableData() {
    const rows = await this.page.locator(`${this.selectors.deTable} tbody tr`).all();
    const data = [];
    
    for (const row of rows) {
      const gene = await row.locator('td:nth-child(1)').textContent();
      const logFC = await row.locator('td:nth-child(2)').textContent();
      const pValue = await row.locator('td:nth-child(3)').textContent();
      
      data.push({
        gene: gene?.trim(),
        logFC: parseFloat(logFC || '0'),
        pValue: parseFloat(pValue || '0'),
      });
    }
    
    return data;
  }
}
