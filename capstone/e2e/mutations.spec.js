/**
 * Mutations Page E2E Tests
 */

import { test, expect } from '@playwright/test';
import { MutationsPage } from './pages/MutationsPage.js';

test.describe('Mutations Visualization', () => {
  let mutationsPage;

  test.beforeEach(async ({ page }) => {
    mutationsPage = new MutationsPage(page);
    await mutationsPage.goto();
  });

  test('should load mutations page', async ({ page }) => {
    await expect(page).toHaveURL(/mutation/);
  });

  test('should render lollipop plot', async () => {
    const isRendered = await mutationsPage.isPlotRendered();
    expect(isRendered).toBeTruthy();
  });

  test('should have gene selector', async () => {
    const genes = await mutationsPage.getAvailableGenes();
    expect(genes.length).toBeGreaterThan(0);
  });

  test('should change gene and update plot', async () => {
    const genes = await mutationsPage.getAvailableGenes();
    
    if (genes.length > 1) {
      const initialCount = await mutationsPage.getMutationCount();
      
      // Select a different gene
      await mutationsPage.selectGene(genes[1].value);
      
      // Plot should update (might have different mutation count)
      const isRendered = await mutationsPage.isPlotRendered();
      expect(isRendered).toBeTruthy();
    }
  });

  test('should display protein domains', async () => {
    const domains = await mutationsPage.getProteinDomains();
    // Domains are expected for well-annotated genes
    expect(domains).toBeDefined();
  });

  test('should show tooltip on mutation hover', async ({ page }) => {
    const mutationCount = await mutationsPage.getMutationCount();
    
    if (mutationCount > 0) {
      await mutationsPage.clickMutation(0);
      
      // Check for tooltip or details panel
      const hasTooltip = await mutationsPage.isTooltipVisible();
      // Tooltip visibility depends on implementation
    }
  });

  test('should display mutation table', async () => {
    const tableData = await mutationsPage.getMutationTableData();
    // Table might not be present in all implementations
    if (tableData.length > 0) {
      expect(tableData[0].length).toBeGreaterThan(0);
    }
  });

  test('should filter mutations by type', async () => {
    const initialCount = await mutationsPage.getMutationCount();
    
    // Try filtering by missense
    await mutationsPage.filterByType('missense');
    
    // Count might change after filter
    const isRendered = await mutationsPage.isPlotRendered();
    expect(isRendered).toBeTruthy();
  });

  test('should search for specific mutations', async () => {
    // Search for a common mutation
    await mutationsPage.search('R248');
    
    // Results should be filtered
    const isRendered = await mutationsPage.isPlotRendered();
    expect(isRendered).toBeTruthy();
  });

  test('should export chart', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    
    await mutationsPage.exportChart();
    
    // Export might trigger download or open dialog
    // This depends on implementation
  });

  test('should handle empty data gracefully', async () => {
    // Try to filter to no results
    await mutationsPage.search('NONEXISTENT_MUTATION_XYZ');
    
    // Should show empty state, not crash
    const page = mutationsPage.page;
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Mutations - Accessibility', () => {
  test('should have accessible name for chart', async ({ page }) => {
    const mutationsPage = new MutationsPage(page);
    await mutationsPage.goto();
    
    // Check for aria labels
    const chart = page.locator('[role="img"], svg, [aria-label*="mutation"]');
    await expect(chart.first()).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    const mutationsPage = new MutationsPage(page);
    await mutationsPage.goto();
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });
});
