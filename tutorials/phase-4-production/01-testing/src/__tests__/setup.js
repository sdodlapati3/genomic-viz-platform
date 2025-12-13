/**
 * Test Setup File
 * Configures the test environment before each test runs
 */

import { expect, afterEach, vi } from 'vitest';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  // Clear document body for DOM tests
  document.body.innerHTML = '';
  vi.clearAllMocks();
});

// Mock canvas context for visualization tests
class MockCanvasRenderingContext2D {
  constructor() {
    this.fillStyle = '';
    this.strokeStyle = '';
    this.lineWidth = 1;
    this.font = '10px sans-serif';
    this.textAlign = 'start';
    this.textBaseline = 'alphabetic';
    this.globalAlpha = 1;
    this._calls = [];
  }
  
  _track(method, ...args) {
    this._calls.push({ method, args });
  }
  
  fillRect(x, y, w, h) { this._track('fillRect', x, y, w, h); }
  strokeRect(x, y, w, h) { this._track('strokeRect', x, y, w, h); }
  clearRect(x, y, w, h) { this._track('clearRect', x, y, w, h); }
  fillText(text, x, y) { this._track('fillText', text, x, y); }
  strokeText(text, x, y) { this._track('strokeText', text, x, y); }
  beginPath() { this._track('beginPath'); }
  closePath() { this._track('closePath'); }
  moveTo(x, y) { this._track('moveTo', x, y); }
  lineTo(x, y) { this._track('lineTo', x, y); }
  arc(x, y, r, start, end) { this._track('arc', x, y, r, start, end); }
  fill() { this._track('fill'); }
  stroke() { this._track('stroke'); }
  save() { this._track('save'); }
  restore() { this._track('restore'); }
  translate(x, y) { this._track('translate', x, y); }
  scale(x, y) { this._track('scale', x, y); }
  rotate(angle) { this._track('rotate', angle); }
  measureText(text) { return { width: text.length * 6 }; }
  setTransform() { this._track('setTransform', ...arguments); }
  getImageData(x, y, w, h) { return { data: new Uint8ClampedArray(w * h * 4) }; }
  putImageData() { this._track('putImageData', ...arguments); }
  createLinearGradient() { return { addColorStop: () => {} }; }
  createRadialGradient() { return { addColorStop: () => {} }; }
}

// Mock HTMLCanvasElement.getContext
HTMLCanvasElement.prototype.getContext = function(type) {
  if (type === '2d') {
    if (!this._context2d) {
      this._context2d = new MockCanvasRenderingContext2D();
    }
    return this._context2d;
  }
  return null;
};

// Global test utilities
global.createTestContainer = () => {
  const container = document.createElement('div');
  container.id = 'test-container';
  document.body.appendChild(container);
  return container;
};

global.removeTestContainer = () => {
  const container = document.getElementById('test-container');
  if (container) {
    container.remove();
  }
};
