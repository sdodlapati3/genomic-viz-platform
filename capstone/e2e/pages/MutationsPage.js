/**
 * Mutations Page Object
 */

import { BasePage } from './BasePage.js';

export class MutationsPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    
    this.selectors = {
      // Main elements
      lollipopPlot: '[data-testid="lollipop-plot"], .lollipop-plot, svg.mutation-plot',
      geneSelector: '[data-testid="gene-selector"], select#gene, .gene-select',
      mutationTable: '[data-testid="mutation-table"], table.mutations, .mutation-list',
      mutationRows: '[data-testid="mutation-row"], tr.mutation, .mutation-item',
      
      // Filters
      filterPanel: '[data-testid="filter-panel"], .filter-panel',
      mutationTypeFilter: '[data-testid="type-filter"], select[name="type"]',
      consequenceFilter: '[data-testid="consequence-filter"], select[name="consequence"]',
      searchInput: '[data-testid="search-input"], input[type="search"]',
      
      // Chart elements
      proteinDomains: '[data-testid="protein-domain"], .protein-domain, rect.domain',
      mutationMarkers: '[data-testid="mutation-marker"], .mutation-marker, circle.mutation',
      xAxis: '.x-axis, [data-testid="x-axis"]',
      yAxis: '.y-axis, [data-testid="y-axis"]',
      
      // Interaction
      tooltip: '[data-testid="tooltip"], .tooltip, .mutation-tooltip',
      zoomControls: '[data-testid="zoom-controls"], .zoom-controls',
      exportButton: '[data-testid="export-btn"], button.export',
    };
  }

  /**
   * Navigate to mutations page
   */
  async goto() {
    await super.goto('/mutations');
    await this.waitForLoad();
    await this.waitForLoading();
  }

  /**
   * Select a gene
   * @param {string} gene - Gene symbol (e.g., 'TP53')
   */
  async selectGene(gene) {
    await this.page.selectOption(this.selectors.geneSelector, gene);
    await this.waitForLoading();
  }

  /**
   * Get available genes
   */
  async getAvailableGenes() {
    const options = await this.page.locator(`${this.selectors.geneSelector} option`).all();
    const genes = [];
    
    for (const option of options) {
      const value = await option.getAttribute('value');
      const text = await option.textContent();
      if (value) genes.push({ value, text: text?.trim() });
    }
    
    return genes;
  }

  /**
   * Get mutation count from markers
   */
  async getMutationCount() {
    return await this.page.locator(this.selectors.mutationMarkers).count();
  }

  /**
   * Get protein domains
   */
  async getProteinDomains() {
    const domains = await this.page.locator(this.selectors.proteinDomains).all();
    const domainData = [];
    
    for (const domain of domains) {
      const name = await domain.getAttribute('data-name') || await domain.textContent();
      domainData.push(name?.trim());
    }
    
    return domainData;
  }

  /**
   * Click on a mutation marker
   * @param {number} index - Index of marker to click
   */
  async clickMutation(index = 0) {
    const markers = this.page.locator(this.selectors.mutationMarkers);
    await markers.nth(index).click();
  }

  /**
   * Check if tooltip is visible
   */
  async isTooltipVisible() {
    return await this.isVisible(this.selectors.tooltip);
  }

  /**
   * Get tooltip content
   */
  async getTooltipContent() {
    await this.waitFor(this.selectors.tooltip);
    return await this.getText(this.selectors.tooltip);
  }

  /**
   * Filter by mutation type
   * @param {string} type - Mutation type
   */
  async filterByType(type) {
    await this.page.selectOption(this.selectors.mutationTypeFilter, type);
    await this.waitForLoading();
  }

  /**
   * Search mutations
   * @param {string} query 
   */
  async search(query) {
    await this.fill(this.selectors.searchInput, query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoading();
  }

  /**
   * Export chart
   */
  async exportChart() {
    await this.click(this.selectors.exportButton);
  }

  /**
   * Get mutation table data
   */
  async getMutationTableData() {
    const rows = await this.page.locator(this.selectors.mutationRows).all();
    const data = [];
    
    for (const row of rows) {
      const cells = await row.locator('td').all();
      const rowData = [];
      
      for (const cell of cells) {
        const text = await cell.textContent();
        rowData.push(text?.trim());
      }
      
      data.push(rowData);
    }
    
    return data;
  }

  /**
   * Check if lollipop plot is rendered
   */
  async isPlotRendered() {
    const plot = this.page.locator(this.selectors.lollipopPlot);
    await plot.waitFor({ state: 'visible' });
    
    // Check for SVG content
    const svgElements = await plot.locator('svg').count();
    return svgElements > 0;
  }
}
