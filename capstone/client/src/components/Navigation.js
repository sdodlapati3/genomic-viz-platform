/**
 * Navigation Component
 * 
 * Handles main navigation interactions
 */

export class Navigation {
  constructor(options = {}) {
    this.onViewChange = options.onViewChange || (() => {});
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    // Navigation buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.target.dataset.view;
        this.selectView(view);
      });
    });
  }

  selectView(viewName) {
    // Update active state
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Notify parent
    this.onViewChange(viewName);
  }
}
