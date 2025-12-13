/**
 * Tests for Scale Utilities
 */

import { describe, it, expect } from 'vitest';
import * as d3 from 'd3';
import {
  createLinearScale,
  createBandScale,
  createColorScale,
  createSequentialColorScale,
  createDivergingColorScale,
  createLogScale,
  createPointScale,
} from './scales';

describe('createLinearScale', () => {
  it('should create a linear scale with domain and range', () => {
    const scale = createLinearScale([0, 100], [0, 500]);

    expect(scale(0)).toBe(0);
    expect(scale(100)).toBe(500);
    expect(scale(50)).toBe(250);
  });

  it('should apply nice option', () => {
    const scale = createLinearScale([0, 97], [0, 500], { nice: true });

    // Nice should round the domain
    const domain = scale.domain();
    expect(domain[1]).toBe(100); // or close to a nice number
  });

  it('should apply clamp option', () => {
    const scale = createLinearScale([0, 100], [0, 500], { clamp: true });

    expect(scale(150)).toBe(500); // clamped to max
    expect(scale(-50)).toBe(0); // clamped to min
  });
});

describe('createBandScale', () => {
  it('should create a band scale for categories', () => {
    const scale = createBandScale(['A', 'B', 'C'], [0, 300]);

    expect(scale('A')).toBeDefined();
    expect(scale('B')).toBeDefined();
    expect(scale('C')).toBeDefined();
    expect(scale.bandwidth()).toBeGreaterThan(0);
  });

  it('should apply padding', () => {
    const noPaddingScale = createBandScale(['A', 'B'], [0, 100]);
    const paddedScale = createBandScale(['A', 'B'], [0, 100], { padding: 0.5 });

    expect(paddedScale.bandwidth()).toBeLessThan(noPaddingScale.bandwidth());
  });

  it('should apply inner and outer padding separately', () => {
    const scale = createBandScale(['A', 'B', 'C'], [0, 300], {
      paddingInner: 0.2,
      paddingOuter: 0.1,
    });

    expect(scale.paddingInner()).toBe(0.2);
    expect(scale.paddingOuter()).toBe(0.1);
  });
});

describe('createColorScale', () => {
  it('should create an ordinal color scale', () => {
    const scale = createColorScale(['A', 'B', 'C']);

    expect(scale('A')).toBeDefined();
    expect(scale('B')).toBeDefined();
    expect(scale('C')).toBeDefined();
    // Colors should be different
    expect(scale('A')).not.toBe(scale('B'));
  });

  it('should use custom color scheme', () => {
    const customColors = ['#ff0000', '#00ff00', '#0000ff'] as const;
    const scale = createColorScale(['A', 'B', 'C'], customColors);

    expect(scale('A')).toBe('#ff0000');
    expect(scale('B')).toBe('#00ff00');
    expect(scale('C')).toBe('#0000ff');
  });
});

describe('createSequentialColorScale', () => {
  it('should create a sequential color scale', () => {
    const scale = createSequentialColorScale([0, 100]);

    const color0 = scale(0);
    const color50 = scale(50);
    const color100 = scale(100);

    expect(color0).toBeDefined();
    expect(color50).toBeDefined();
    expect(color100).toBeDefined();
    expect(color0).not.toBe(color100);
  });

  it('should use custom interpolator', () => {
    const scale = createSequentialColorScale([0, 100], d3.interpolateViridis);

    expect(scale(50)).toBeDefined();
  });
});

describe('createDivergingColorScale', () => {
  it('should create a diverging color scale with midpoint', () => {
    const scale = createDivergingColorScale([-10, 0, 10]);

    const colorNeg = scale(-10);
    const colorMid = scale(0);
    const colorPos = scale(10);

    expect(colorNeg).toBeDefined();
    expect(colorMid).toBeDefined();
    expect(colorPos).toBeDefined();
  });
});

describe('createLogScale', () => {
  it('should create a logarithmic scale', () => {
    const scale = createLogScale([1, 1000], [0, 300]);

    expect(scale(1)).toBe(0);
    expect(scale(1000)).toBe(300);
    expect(scale(10)).toBeCloseTo(100, 0);
  });

  it('should apply custom base', () => {
    const scale = createLogScale([1, 100], [0, 200], { base: 10 });

    expect(scale.base()).toBe(10);
  });

  it('should apply nice option', () => {
    const scale = createLogScale([1, 85], [0, 300], { nice: true });

    const domain = scale.domain();
    expect(domain[1]).toBeGreaterThanOrEqual(85);
  });
});

describe('createPointScale', () => {
  it('should create a point scale', () => {
    const scale = createPointScale(['A', 'B', 'C'], [0, 200]);

    expect(scale('A')).toBeDefined();
    expect(scale('B')).toBeDefined();
    expect(scale('C')).toBeDefined();
    expect(scale.step()).toBeGreaterThan(0);
  });

  it('should apply padding', () => {
    const noPaddingScale = createPointScale(['A', 'B'], [0, 100]);
    const paddedScale = createPointScale(['A', 'B'], [0, 100], { padding: 0.5 });

    expect(paddedScale.step()).toBeLessThan(noPaddingScale.step());
  });
});
