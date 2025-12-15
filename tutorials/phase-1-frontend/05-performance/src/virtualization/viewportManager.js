/**
 * Viewport Manager
 *
 * Manages the visible region of genomic data,
 * handling zoom, pan, and virtualization.
 */

/**
 * Manages viewport state and transformations
 *
 * @class ViewportManager
 */
export class ViewportManager {
  /**
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    // Container dimensions
    this.containerWidth = options.containerWidth || 1200;
    this.containerHeight = options.containerHeight || 400;

    // Zoom constraints
    this.minBpPerPixel = options.minBpPerPixel || 0.1; // Max zoom in
    this.maxBpPerPixel = options.maxBpPerPixel || 100000; // Max zoom out

    // Current state
    this.chromosome = options.chromosome || 'chr1';
    this.chromosomeLength = options.chromosomeLength || 248956422; // chr1 default
    this.center = this.chromosomeLength / 2;
    this.bpPerPixel = 1000; // Initial zoom level

    // Event listeners
    this._listeners = new Map();

    // Debounce timer
    this._debounceTimer = null;

    // Calculate initial region
    this._updateRegion();
  }

  /**
   * Update the current region based on center and zoom
   * @private
   */
  _updateRegion() {
    const halfWidth = (this.containerWidth / 2) * this.bpPerPixel;

    this.start = Math.max(0, Math.floor(this.center - halfWidth));
    this.end = Math.min(this.chromosomeLength, Math.ceil(this.center + halfWidth));

    // Adjust center if we hit bounds
    if (this.start === 0) {
      this.center = halfWidth;
      this.end = Math.min(this.chromosomeLength, this.center + halfWidth);
    }
    if (this.end === this.chromosomeLength) {
      this.center = this.chromosomeLength - halfWidth;
      this.start = Math.max(0, this.center - halfWidth);
    }
  }

  /**
   * Get current viewport state
   * @returns {Object} Current viewport state
   */
  getState() {
    return {
      chromosome: this.chromosome,
      start: this.start,
      end: this.end,
      center: this.center,
      bpPerPixel: this.bpPerPixel,
      width: this.end - this.start,
    };
  }

  /**
   * Set the chromosome and optionally its length
   * @param {string} chromosome - Chromosome name
   * @param {number} [length] - Chromosome length in bp
   */
  setChromosome(chromosome, length = null) {
    this.chromosome = chromosome;
    if (length) {
      this.chromosomeLength = length;
    }

    // Reset to center of chromosome
    this.center = this.chromosomeLength / 2;
    this._updateRegion();
    this._emitChange();
  }

  /**
   * Set the visible region directly
   * @param {number} start - Start position
   * @param {number} end - End position
   */
  setRegion(start, end) {
    const width = end - start;

    this.center = start + width / 2;
    this.bpPerPixel = width / this.containerWidth;

    // Clamp to zoom limits
    this.bpPerPixel = Math.max(this.minBpPerPixel, Math.min(this.maxBpPerPixel, this.bpPerPixel));

    this._updateRegion();
    this._emitChange();
  }

  /**
   * Pan by pixel delta
   * @param {number} deltaX - Horizontal pixel offset (positive = pan right)
   */
  pan(deltaX) {
    const bpDelta = deltaX * this.bpPerPixel;
    this.center += bpDelta;

    // Clamp to chromosome bounds
    const halfWidth = (this.containerWidth / 2) * this.bpPerPixel;
    this.center = Math.max(halfWidth, Math.min(this.chromosomeLength - halfWidth, this.center));

    this._updateRegion();
    this._emitChange();
  }

  /**
   * Zoom by a factor, centered on a point
   * @param {number} factor - Zoom factor (>1 = zoom in, <1 = zoom out)
   * @param {number} [centerX] - X coordinate of zoom center (pixels from left)
   */
  zoom(factor, centerX = null) {
    // If no center provided, zoom around current center
    if (centerX === null) {
      centerX = this.containerWidth / 2;
    }

    // Calculate the genomic position at the zoom center
    const zoomCenterBp = this.start + centerX * this.bpPerPixel;

    // Apply zoom factor
    const newBpPerPixel = this.bpPerPixel / factor;

    // Clamp to limits
    this.bpPerPixel = Math.max(this.minBpPerPixel, Math.min(this.maxBpPerPixel, newBpPerPixel));

    // Adjust center to keep zoom point stable
    const newHalfWidth = (this.containerWidth / 2) * this.bpPerPixel;
    const centerOffset = (centerX - this.containerWidth / 2) * this.bpPerPixel;
    this.center = zoomCenterBp - centerOffset;

    this._updateRegion();
    this._emitChange();
  }

  /**
   * Zoom to fit a specific region
   * @param {number} start - Start position
   * @param {number} end - End position
   * @param {number} [padding=0.1] - Padding as fraction of region
   */
  zoomToRegion(start, end, padding = 0.1) {
    const width = end - start;
    const paddedStart = start - width * padding;
    const paddedEnd = end + width * padding;

    this.setRegion(paddedStart, paddedEnd);
  }

  /**
   * Reset to full chromosome view
   */
  reset() {
    this.center = this.chromosomeLength / 2;
    this.bpPerPixel = this.chromosomeLength / this.containerWidth;

    this._updateRegion();
    this._emitChange();
  }

  /**
   * Convert pixel position to genomic position
   * @param {number} x - X coordinate in pixels
   * @returns {number} Genomic position in bp
   */
  pixelToBp(x) {
    return this.start + x * this.bpPerPixel;
  }

  /**
   * Convert genomic position to pixel position
   * @param {number} bp - Genomic position in bp
   * @returns {number} X coordinate in pixels
   */
  bpToPixel(bp) {
    return (bp - this.start) / this.bpPerPixel;
  }

  /**
   * Check if a position is visible
   * @param {number} bp - Genomic position
   * @returns {boolean} True if visible
   */
  isVisible(bp) {
    return bp >= this.start && bp <= this.end;
  }

  /**
   * Check if a range overlaps the visible region
   * @param {number} start - Range start
   * @param {number} end - Range end
   * @returns {boolean} True if overlapping
   */
  isRangeVisible(start, end) {
    return start <= this.end && end >= this.start;
  }

  /**
   * Add event listener
   * @param {string} event - Event name ('change')
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback to remove
   */
  off(event, callback) {
    if (!this._listeners.has(event)) return;

    const listeners = this._listeners.get(event);
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Emit change event (debounced)
   * @private
   */
  _emitChange() {
    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
    }

    this._debounceTimer = setTimeout(() => {
      const listeners = this._listeners.get('change') || [];
      const state = this.getState();

      for (const callback of listeners) {
        callback(state);
      }
    }, 10);
  }

  /**
   * Resize the container
   * @param {number} width - New width
   * @param {number} height - New height
   */
  resize(width, height) {
    this.containerWidth = width;
    this.containerHeight = height;

    this._updateRegion();
    this._emitChange();
  }
}

export default ViewportManager;
