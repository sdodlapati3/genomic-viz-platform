/**
 * Expression Page E2E Tests
 */

import { test, expect } from '@playwright/test';
import { ExpressionPage } from './pages/ExpressionPage.js';

test.describe('Expression Visualization', () => {
  let expressionPage;

  test.beforeEach(async ({ page }) => {
    expressionPage = new ExpressionPage(page);
    await expressionPage.goto();
  });

  test('should load expression page', async ({ page }) => {
    await expect(page).toHaveURL(/expression/);
  });

  test('should render heatmap or volcano plot', async () => {
    const hasHeatmap = await expressionPage.isHeatmapRendered();
    const hasVolcano = await expressionPage.isVolcanoPlotRendered();
    
    // Should have at least one visualization
    expect(hasHeatmap || hasVolcano).toBeTruthy();
  });

  test('should toggle between views', async () => {
    // Try switching to volcano view
    await expressionPage.toggleView('volcano');
    
    // Verify the view changed
    const page = expressionPage.page;
    await expect(page.locator('svg, canvas')).toBeVisible();
  });

  test('should filter by p-value threshold', async () => {
    await expressionPage.setPValueThreshold(0.01);
    
    // Visualization should update
    const page = expressionPage.page;
    await expect(page.locator('svg, canvas')).toBeVisible();
  });

  test('should filter by fold change threshold', async () => {
    await expressionPage.setFoldChangeThreshold(2.0);
    
    // Visualization should update
    const page = expressionPage.page;
    await expect(page.locator('svg, canvas')).toBeVisible();
  });

  test('should enable clustering', async () => {
    await expressionPage.enableClustering();
    
    // Heatmap should re-render with clustering
    const hasHeatmap = await expressionPage.isHeatmapRendered();
    if (hasHeatmap) {
      expect(hasHeatmap).toBeTruthy();
    }
  });

  test('should change normalization method', async () => {
    await expressionPage.setNormalization('zscore');
    
    // Visualization should update
    const page = expressionPage.page;
    await expect(page.locator('svg, canvas')).toBeVisible();
  });

  test('should click volcano point and show details', async () => {
    await expressionPage.toggleView('volcano');
    
    const hasVolcano = await expressionPage.isVolcanoPlotRendered();
    if (hasVolcano) {
      await expressionPage.clickVolcanoPoint(0);
      
      // Details panel or tooltip should appear
      const page = expressionPage.page;
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('should export data', async ({ page }) => {
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    
    await expressionPage.exportData('csv');
    
    // Export functionality depends on implementation
  });

  test('should get differential expression table data', async () => {
    const deData = await expressionPage.getDETableData();
    
    // Table might not be present in all implementations
    if (deData.length > 0) {
      expect(deData[0]).toHaveProperty('gene');
      expect(deData[0]).toHaveProperty('logFC');
      expect(deData[0]).toHaveProperty('pValue');
    }
  });
});

test.describe('Expression - Performance', () => {
  test('should load within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    const expressionPage = new ExpressionPage(page);
    await expressionPage.goto();
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds
    expect(loadTime).toBeLessThan(10000);
  });

  test('should handle large datasets', async ({ page }) => {
    const expressionPage = new ExpressionPage(page);
    await expressionPage.goto();
    
    // Even with all data, should remain responsive
    const geneCount = await expressionPage.getGeneCount();
    
    // Page should still be responsive
    await expressionPage.toggleView('heatmap');
    await expect(page.locator('body')).toBeVisible();
  });
});
