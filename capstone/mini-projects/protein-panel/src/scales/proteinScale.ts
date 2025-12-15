/**
 * Protein Scale Utilities
 *
 * D3 scale helpers for protein coordinate transformations
 */

import * as d3 from 'd3';

/**
 * Configuration for protein scale
 */
export interface ProteinScaleConfig {
  /** Protein length in amino acids */
  proteinLength: number;
  /** Available width in pixels */
  width: number;
  /** Margin from edges */
  margin?: { left: number; right: number };
  /** Minimum visible range (AA) */
  minRange?: number;
}

/**
 * Protein coordinate scale with zoom support
 */
export class ProteinScale {
  private scale: d3.ScaleLinear<number, number>;
  private proteinLength: number;
  private width: number;
  private margin: { left: number; right: number };
  private currentDomain: [number, number];

  constructor(config: ProteinScaleConfig) {
    this.proteinLength = config.proteinLength;
    this.width = config.width;
    this.margin = config.margin || { left: 0, right: 0 };

    const innerWidth = this.width - this.margin.left - this.margin.right;
    this.currentDomain = [1, config.proteinLength];

    this.scale = d3
      .scaleLinear()
      .domain(this.currentDomain)
      .range([this.margin.left, this.margin.left + innerWidth]);
  }

  /**
   * Convert amino acid position to pixel
   */
  toPixel(position: number): number {
    return this.scale(position);
  }

  /**
   * Convert pixel to amino acid position
   */
  toPosition(pixel: number): number {
    return Math.round(this.scale.invert(pixel));
  }

  /**
   * Get width in pixels for a range of amino acids
   */
  rangeWidth(start: number, end: number): number {
    return this.scale(end) - this.scale(start);
  }

  /**
   * Get the current visible domain
   */
  getDomain(): [number, number] {
    return [...this.currentDomain] as [number, number];
  }

  /**
   * Set a new domain (for zooming)
   */
  setDomain(domain: [number, number]): void {
    this.currentDomain = domain;
    this.scale.domain(domain);
  }

  /**
   * Reset to full protein view
   */
  reset(): void {
    this.setDomain([1, this.proteinLength]);
  }

  /**
   * Zoom to a specific region
   */
  zoomTo(start: number, end: number, padding: number = 10): void {
    const paddedStart = Math.max(1, start - padding);
    const paddedEnd = Math.min(this.proteinLength, end + padding);
    this.setDomain([paddedStart, paddedEnd]);
  }

  /**
   * Get the underlying D3 scale for axis rendering
   */
  getD3Scale(): d3.ScaleLinear<number, number> {
    return this.scale;
  }

  /**
   * Get pixel range
   */
  getRange(): [number, number] {
    return this.scale.range() as [number, number];
  }

  /**
   * Get inner width (excluding margins)
   */
  getInnerWidth(): number {
    const [start, end] = this.getRange();
    return end - start;
  }

  /**
   * Create tick values for axis
   */
  getTicks(maxTicks: number = 10): number[] {
    return this.scale.ticks(maxTicks).map(Math.round);
  }

  /**
   * Check if a position is in current view
   */
  isInView(position: number): boolean {
    const [start, end] = this.currentDomain;
    return position >= start && position <= end;
  }

  /**
   * Get zoom level (1 = full view)
   */
  getZoomLevel(): number {
    const visibleRange = this.currentDomain[1] - this.currentDomain[0];
    return this.proteinLength / visibleRange;
  }

  /**
   * Clone the scale
   */
  clone(): ProteinScale {
    const cloned = new ProteinScale({
      proteinLength: this.proteinLength,
      width: this.width,
      margin: this.margin,
    });
    cloned.setDomain(this.currentDomain);
    return cloned;
  }
}

/**
 * Create a simple protein scale
 */
export function createProteinScale(
  proteinLength: number,
  width: number,
  margin: { left: number; right: number } = { left: 50, right: 20 }
): ProteinScale {
  return new ProteinScale({ proteinLength, width, margin });
}

/**
 * Scale for lollipop heights based on mutation count
 */
export function createCountScale(
  maxCount: number,
  maxHeight: number,
  minHeight: number = 20
): d3.ScaleLinear<number, number> {
  return d3
    .scaleLinear()
    .domain([1, Math.max(maxCount, 1)])
    .range([minHeight, maxHeight])
    .clamp(true);
}

/**
 * Scale for lollipop radius based on mutation count
 */
export function createRadiusScale(
  maxCount: number,
  maxRadius: number = 12,
  minRadius: number = 4
): d3.ScaleSqrt<number, number> {
  return d3
    .scaleSqrt()
    .domain([1, Math.max(maxCount, 1)])
    .range([minRadius, maxRadius])
    .clamp(true);
}
