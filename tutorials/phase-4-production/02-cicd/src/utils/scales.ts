/**
 * Scale Utilities
 * D3 scale factories for genomic visualizations
 */

import * as d3 from 'd3';

export interface ScaleConfig {
  domain: [number, number] | string[];
  range: [number, number] | string[];
  padding?: number;
  nice?: boolean;
}

/**
 * Create a linear scale for numeric data
 */
export function createLinearScale(
  domain: [number, number],
  range: [number, number],
  options: { nice?: boolean; clamp?: boolean } = {}
): d3.ScaleLinear<number, number> {
  let scale = d3.scaleLinear().domain(domain).range(range);

  if (options.nice) {
    scale = scale.nice();
  }

  if (options.clamp) {
    scale = scale.clamp(true);
  }

  return scale;
}

/**
 * Create a band scale for categorical data
 */
export function createBandScale(
  domain: string[],
  range: [number, number],
  options: { padding?: number; paddingInner?: number; paddingOuter?: number } = {}
): d3.ScaleBand<string> {
  let scale = d3.scaleBand<string>().domain(domain).range(range);

  if (options.padding !== undefined) {
    scale = scale.padding(options.padding);
  } else {
    if (options.paddingInner !== undefined) {
      scale = scale.paddingInner(options.paddingInner);
    }
    if (options.paddingOuter !== undefined) {
      scale = scale.paddingOuter(options.paddingOuter);
    }
  }

  return scale;
}

/**
 * Create a color scale for categorical data
 */
export function createColorScale(
  domain: string[],
  scheme: readonly string[] = d3.schemeCategory10
): d3.ScaleOrdinal<string, string> {
  return d3.scaleOrdinal<string, string>().domain(domain).range(scheme as string[]);
}

/**
 * Create a sequential color scale for numeric data
 */
export function createSequentialColorScale(
  domain: [number, number],
  interpolator: (t: number) => string = d3.interpolateBlues
): d3.ScaleSequential<string> {
  return d3.scaleSequential(interpolator).domain(domain);
}

/**
 * Create a diverging color scale (e.g., for fold changes)
 */
export function createDivergingColorScale(
  domain: [number, number, number],
  interpolator: (t: number) => string = d3.interpolateRdBu
): d3.ScaleDiverging<string> {
  return d3.scaleDiverging(interpolator).domain(domain);
}

/**
 * Create a log scale for data with wide range
 */
export function createLogScale(
  domain: [number, number],
  range: [number, number],
  options: { base?: number; nice?: boolean } = {}
): d3.ScaleLogarithmic<number, number> {
  let scale = d3.scaleLog().domain(domain).range(range);

  if (options.base) {
    scale = scale.base(options.base);
  }

  if (options.nice) {
    scale = scale.nice();
  }

  return scale;
}

/**
 * Create a point scale for ordinal data
 */
export function createPointScale(
  domain: string[],
  range: [number, number],
  options: { padding?: number } = {}
): d3.ScalePoint<string> {
  let scale = d3.scalePoint<string>().domain(domain).range(range);

  if (options.padding !== undefined) {
    scale = scale.padding(options.padding);
  }

  return scale;
}
