/**
 * Toast Notification Component
 */

export class Toast {
  constructor() {
    this.container = document.getElementById('toastContainer');
  }

  /**
   * Show a toast notification
   * @param {string} message - Message to display
   * @param {string} type - Type: 'info', 'success', 'error', 'warning'
   * @param {number} duration - Duration in ms
   */
  show(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    this.container?.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  success(message, duration) {
    this.show(message, 'success', duration);
  }

  error(message, duration) {
    this.show(message, 'error', duration);
  }

  warning(message, duration) {
    this.show(message, 'warning', duration);
  }
}
