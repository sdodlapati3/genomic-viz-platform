/**
 * Tests for Scale Utilities
 * Demonstrates testing custom scales for genomic visualizations
 */

import { describe, it, expect } from 'vitest';
import {
  linearScale,
  logScale,
  chromosomeScale,
  colorScale,
  parseColor
} from '../utils/scales.js';

describe('linearScale', () => {
  it('should map domain values to range', () => {
    const scale = linearScale([0, 100], [0, 500]);
    
    expect(scale(0)).toBe(0);
    expect(scale(50)).toBe(250);
    expect(scale(100)).toBe(500);
  });
  
  it('should handle negative domains', () => {
    const scale = linearScale([-100, 100], [0, 200]);
    
    expect(scale(-100)).toBe(0);
    expect(scale(0)).toBe(100);
    expect(scale(100)).toBe(200);
  });
  
  it('should handle inverted range', () => {
    const scale = linearScale([0, 100], [500, 0]);
    
    expect(scale(0)).toBe(500);
    expect(scale(50)).toBe(250);
    expect(scale(100)).toBe(0);
  });
  
  it('should extrapolate outside domain', () => {
    const scale = linearScale([0, 100], [0, 500]);
    
    expect(scale(150)).toBe(750);
    expect(scale(-50)).toBe(-250);
  });
  
  it('should provide invert function', () => {
    const scale = linearScale([0, 100], [0, 500]);
    
    expect(scale.invert(250)).toBe(50);
    expect(scale.invert(0)).toBe(0);
    expect(scale.invert(500)).toBe(100);
  });
  
  it('should expose domain and range', () => {
    const scale = linearScale([0, 100], [0, 500]);
    
    expect(scale.domain()).toEqual([0, 100]);
    expect(scale.range()).toEqual([0, 500]);
  });
  
  it('should handle zero-width domain', () => {
    const scale = linearScale([50, 50], [0, 500]);
    
    expect(scale(50)).toBe(0); // Returns range start
    expect(scale(100)).toBe(0);
  });
});

describe('logScale', () => {
  it('should map domain values logarithmically', () => {
    const scale = logScale([1, 1000], [0, 300]);
    
    expect(scale(1)).toBe(0);
    expect(scale(10)).toBeCloseTo(100, 5);
    expect(scale(100)).toBeCloseTo(200, 5);
    expect(scale(1000)).toBe(300);
  });
  
  it('should handle p-values', () => {
    // Typical p-value range
    const scale = logScale([0.001, 1], [0, 100]);
    
    expect(scale(0.001)).toBe(0);
    expect(scale(0.01)).toBeCloseTo(33.33, 1);
    expect(scale(1)).toBe(100);
  });
  
  it('should provide invert function', () => {
    const scale = logScale([1, 1000], [0, 300]);
    
    expect(scale.invert(0)).toBeCloseTo(1, 5);
    expect(scale.invert(100)).toBeCloseTo(10, 1);
    expect(scale.invert(200)).toBeCloseTo(100, 1);
    expect(scale.invert(300)).toBeCloseTo(1000, 1);
  });
  
  it('should throw for non-positive domain', () => {
    expect(() => logScale([0, 100], [0, 500])).toThrow();
    expect(() => logScale([-10, 100], [0, 500])).toThrow();
  });
  
  it('should handle values <= 0 gracefully', () => {
    const scale = logScale([1, 1000], [0, 300]);
    
    expect(scale(0)).toBe(0); // Returns range start
    expect(scale(-5)).toBe(0);
  });
});

describe('chromosomeScale', () => {
  const chromosomes = [
    { name: '1', length: 249250621 },
    { name: '2', length: 243199373 },
    { name: '3', length: 198022430 }
  ];
  
  const width = 1000;
  const gap = 10;
  
  it('should create scale with correct chromosome offsets', () => {
    const scale = chromosomeScale(chromosomes, width, gap);
    const chrInfo = scale.chromosomes();
    
    expect(chrInfo).toHaveLength(3);
    expect(chrInfo[0].name).toBe('1');
    expect(chrInfo[0].pixelStart).toBe(0);
  });
  
  it('should map genomic position to pixels', () => {
    const scale = chromosomeScale(chromosomes, width, gap);
    
    const pixel = scale.toPixel('1', 0);
    expect(pixel).toBe(0);
    
    // Middle of chromosome 1
    const midPixel = scale.toPixel('1', chromosomes[0].length / 2);
    expect(midPixel).toBeGreaterThan(0);
  });
  
  it('should map pixels back to genomic positions', () => {
    const scale = chromosomeScale(chromosomes, width, gap);
    
    const genomic = scale.toGenome(0);
    expect(genomic.chromosome).toBe('1');
    expect(genomic.position).toBe(0);
  });
  
  it('should return null for invalid chromosome', () => {
    const scale = chromosomeScale(chromosomes, width, gap);
    
    expect(scale.toPixel('99', 1000)).toBeNull();
  });
  
  it('should return null for pixel outside range', () => {
    const scale = chromosomeScale(chromosomes, width, gap);
    
    expect(scale.toGenome(-100)).toBeNull();
    expect(scale.toGenome(2000)).toBeNull();
  });
  
  it('should get individual chromosome info', () => {
    const scale = chromosomeScale(chromosomes, width, gap);
    
    const chr2 = scale.getChromosome('2');
    expect(chr2).toBeDefined();
    expect(chr2.name).toBe('2');
    expect(chr2.length).toBe(243199373);
  });
});

describe('colorScale', () => {
  describe('linear interpolation', () => {
    it('should interpolate between two colors', () => {
      const scale = colorScale([0, 100], ['#000000', '#ffffff']);
      
      expect(scale(0)).toBe('rgb(0, 0, 0)');
      expect(scale(50)).toBe('rgb(128, 128, 128)');
      expect(scale(100)).toBe('rgb(255, 255, 255)');
    });
    
    it('should interpolate between multiple colors', () => {
      const scale = colorScale([0, 100], ['#ff0000', '#00ff00', '#0000ff']);
      
      expect(scale(0)).toBe('rgb(255, 0, 0)');
      expect(scale(50)).toBe('rgb(0, 255, 0)');
      expect(scale(100)).toBe('rgb(0, 0, 255)');
    });
    
    it('should clamp values outside domain', () => {
      const scale = colorScale([0, 100], ['#000000', '#ffffff']);
      
      expect(scale(-50)).toBe('rgb(0, 0, 0)');
      expect(scale(150)).toBe('rgb(255, 255, 255)');
    });
  });
  
  describe('discrete mapping', () => {
    it('should map values to discrete colors', () => {
      // Domain specifies thresholds, colors has n+1 entries
      // Values < first threshold -> first color
      // Values >= last threshold -> last color
      const scale = colorScale([25, 50], ['green', 'yellow', 'red'], 'discrete');
      
      expect(scale(10)).toBe('green');   // < 25
      expect(scale(30)).toBe('yellow');  // >= 25, < 50  
      expect(scale(60)).toBe('red');     // >= 50
    });
  });
});

describe('parseColor', () => {
  it('should parse 6-digit hex color', () => {
    const color = parseColor('#ff5500');
    
    expect(color.r).toBe(255);
    expect(color.g).toBe(85);
    expect(color.b).toBe(0);
  });
  
  it('should parse 3-digit hex color', () => {
    const color = parseColor('#f50');
    
    expect(color.r).toBe(255);
    expect(color.g).toBe(85);
    expect(color.b).toBe(0);
  });
  
  it('should parse rgb color', () => {
    const color = parseColor('rgb(100, 150, 200)');
    
    expect(color.r).toBe(100);
    expect(color.g).toBe(150);
    expect(color.b).toBe(200);
  });
  
  it('should return black for invalid color', () => {
    const color = parseColor('invalid');
    
    expect(color).toEqual({ r: 0, g: 0, b: 0 });
  });
});
