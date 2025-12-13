/**
 * Base Page Object
 * 
 * Common functionality for all page objects
 */

export class BasePage {
  /**
   * @param {import('@playwright/test').Page} page
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigate to a path
   * @param {string} path 
   */
  async goto(path = '/') {
    await this.page.goto(path);
  }

  /**
   * Wait for page load
   */
  async waitForLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get page title
   */
  async getTitle() {
    return await this.page.title();
  }

  /**
   * Check if element is visible
   * @param {string} selector 
   */
  async isVisible(selector) {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Click element
   * @param {string} selector 
   */
  async click(selector) {
    await this.page.click(selector);
  }

  /**
   * Fill input
   * @param {string} selector 
   * @param {string} value 
   */
  async fill(selector, value) {
    await this.page.fill(selector, value);
  }

  /**
   * Get text content
   * @param {string} selector 
   */
  async getText(selector) {
    return await this.page.locator(selector).textContent();
  }

  /**
   * Wait for selector
   * @param {string} selector 
   */
  async waitFor(selector) {
    await this.page.waitForSelector(selector);
  }

  /**
   * Take screenshot
   * @param {string} name 
   */
  async screenshot(name) {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }

  /**
   * Check for loading state
   */
  async waitForLoading() {
    // Wait for any loading spinners to disappear
    const loadingSelector = '[data-testid="loading"], .loading, .spinner';
    const loading = this.page.locator(loadingSelector);
    
    if (await loading.count() > 0) {
      await loading.waitFor({ state: 'hidden', timeout: 30000 });
    }
  }

  /**
   * Check for toast notification
   * @param {string} type - 'success' | 'error' | 'warning' | 'info'
   */
  async waitForToast(type = 'success') {
    const toastSelector = `[data-testid="toast-${type}"], .toast-${type}`;
    await this.page.waitForSelector(toastSelector, { state: 'visible' });
  }
}
