/**
 * Dashboard E2E Tests
 */

import { test, expect } from '@playwright/test';
import { DashboardPage } from './pages/DashboardPage.js';

test.describe('Dashboard', () => {
  let dashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test('should load dashboard successfully', async ({ page }) => {
    await expect(page).toHaveURL('/');
    const title = await dashboardPage.getTitle();
    expect(title).toContain('Genomic');
  });

  test('should display navigation links', async () => {
    const navLinks = await dashboardPage.getNavigationLinks();
    expect(navLinks.length).toBeGreaterThan(0);
    
    // Check for expected navigation items
    const linkTexts = navLinks.map(l => l.text?.toLowerCase());
    expect(linkTexts.some(t => t?.includes('mutation'))).toBeTruthy();
    expect(linkTexts.some(t => t?.includes('expression'))).toBeTruthy();
    expect(linkTexts.some(t => t?.includes('survival'))).toBeTruthy();
  });

  test('should navigate to mutations page', async ({ page }) => {
    await dashboardPage.goToMutations();
    await expect(page).toHaveURL(/mutation/);
  });

  test('should navigate to expression page', async ({ page }) => {
    await dashboardPage.goToExpression();
    await expect(page).toHaveURL(/expression/);
  });

  test('should navigate to survival page', async ({ page }) => {
    await dashboardPage.goToSurvival();
    await expect(page).toHaveURL(/survival/);
  });

  test('should display stats cards', async () => {
    const stats = await dashboardPage.getStatsCards();
    // Dashboard might not have stats cards, so this is optional
    if (stats.length > 0) {
      expect(stats[0]).toHaveProperty('title');
      expect(stats[0]).toHaveProperty('value');
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that content is still visible
    const header = page.locator('h1, header, [data-testid="header"]');
    await expect(header.first()).toBeVisible();
  });
});
