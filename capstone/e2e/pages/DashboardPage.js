/**
 * Dashboard Page Object
 */

import { BasePage } from './BasePage.js';

export class DashboardPage extends BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    super(page);
    
    // Selectors
    this.selectors = {
      header: '[data-testid="dashboard-header"], .dashboard-header, h1',
      statsCards: '[data-testid="stats-card"], .stats-card',
      summaryChart: '[data-testid="summary-chart"], .summary-chart',
      recentMutations: '[data-testid="recent-mutations"], .recent-mutations',
      quickActions: '[data-testid="quick-actions"], .quick-actions',
      navigationLinks: 'nav a, [data-testid="nav-link"]',
      mutationsLink: 'a[href*="mutation"], [data-testid="mutations-link"]',
      expressionLink: 'a[href*="expression"], [data-testid="expression-link"]',
      survivalLink: 'a[href*="survival"], [data-testid="survival-link"]',
      uploadLink: 'a[href*="upload"], [data-testid="upload-link"]',
    };
  }

  /**
   * Navigate to dashboard
   */
  async goto() {
    await super.goto('/');
    await this.waitForLoad();
  }

  /**
   * Get stats cards data
   */
  async getStatsCards() {
    await this.waitFor(this.selectors.statsCards);
    const cards = await this.page.locator(this.selectors.statsCards).all();
    
    const stats = [];
    for (const card of cards) {
      const title = await card.locator('.card-title, h3, [data-testid="card-title"]').textContent();
      const value = await card.locator('.card-value, .value, [data-testid="card-value"]').textContent();
      stats.push({ title, value });
    }
    
    return stats;
  }

  /**
   * Check if summary chart is visible
   */
  async isSummaryChartVisible() {
    return await this.isVisible(this.selectors.summaryChart);
  }

  /**
   * Navigate to mutations page
   */
  async goToMutations() {
    await this.click(this.selectors.mutationsLink);
    await this.waitForLoad();
  }

  /**
   * Navigate to expression page
   */
  async goToExpression() {
    await this.click(this.selectors.expressionLink);
    await this.waitForLoad();
  }

  /**
   * Navigate to survival page
   */
  async goToSurvival() {
    await this.click(this.selectors.survivalLink);
    await this.waitForLoad();
  }

  /**
   * Navigate to upload page
   */
  async goToUpload() {
    await this.click(this.selectors.uploadLink);
    await this.waitForLoad();
  }

  /**
   * Get navigation links
   */
  async getNavigationLinks() {
    const links = await this.page.locator(this.selectors.navigationLinks).all();
    
    const navItems = [];
    for (const link of links) {
      const text = await link.textContent();
      const href = await link.getAttribute('href');
      navItems.push({ text, href });
    }
    
    return navItems;
  }

  /**
   * Check if recent mutations section exists
   */
  async hasRecentMutations() {
    return await this.isVisible(this.selectors.recentMutations);
  }

  /**
   * Get quick action buttons
   */
  async getQuickActions() {
    const actionsContainer = this.page.locator(this.selectors.quickActions);
    const buttons = await actionsContainer.locator('button, a').all();
    
    const actions = [];
    for (const btn of buttons) {
      const text = await btn.textContent();
      actions.push(text?.trim());
    }
    
    return actions;
  }
}
