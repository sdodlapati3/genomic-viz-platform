/**
 * Tests for BarChart Component
 * Demonstrates testing D3.js visualization components
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BarChart } from '../components/BarChart.js';

describe('BarChart', () => {
  let container;
  let chart;
  
  const sampleData = [
    { label: 'A', value: 10 },
    { label: 'B', value: 25 },
    { label: 'C', value: 15 },
    { label: 'D', value: 30 }
  ];
  
  beforeEach(() => {
    // Create a container element
    container = document.createElement('div');
    container.id = 'chart-container';
    document.body.appendChild(container);
  });
  
  afterEach(() => {
    // Clean up
    if (chart) {
      chart.destroy();
      chart = null;
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });
  
  describe('initialization', () => {
    it('should create an SVG element', () => {
      chart = new BarChart(container);
      
      const svg = container.querySelector('svg');
      expect(svg).not.toBeNull();
    });
    
    it('should use default dimensions', () => {
      chart = new BarChart(container);
      
      const svg = chart.getSvg();
      expect(svg.getAttribute('width')).toBe('400');
      expect(svg.getAttribute('height')).toBe('300');
    });
    
    it('should accept custom dimensions', () => {
      chart = new BarChart(container, { width: 600, height: 400 });
      
      const svg = chart.getSvg();
      expect(svg.getAttribute('width')).toBe('600');
      expect(svg.getAttribute('height')).toBe('400');
    });
    
    it('should accept selector string', () => {
      chart = new BarChart('#chart-container');
      
      expect(chart.getSvg()).not.toBeNull();
    });
    
    it('should create axis groups', () => {
      chart = new BarChart(container);
      
      const xAxis = container.querySelector('.x-axis');
      const yAxis = container.querySelector('.y-axis');
      
      expect(xAxis).not.toBeNull();
      expect(yAxis).not.toBeNull();
    });
  });
  
  describe('data binding', () => {
    it('should render bars for each data point', () => {
      chart = new BarChart(container);
      chart.setData(sampleData);
      
      const bars = chart.getBars();
      expect(bars.length).toBe(4);
    });
    
    it('should update bars when data changes', () => {
      chart = new BarChart(container);
      chart.setData(sampleData);
      
      expect(chart.getBars().length).toBe(4);
      
      chart.setData([{ label: 'X', value: 50 }]);
      expect(chart.getBars().length).toBe(1);
    });
    
    it('should handle empty data', () => {
      chart = new BarChart(container);
      chart.setData([]);
      
      expect(chart.getBars().length).toBe(0);
    });
    
    it('should return this for method chaining', () => {
      chart = new BarChart(container);
      const result = chart.setData(sampleData);
      
      expect(result).toBe(chart);
    });
  });
  
  describe('rendering', () => {
    it('should position bars correctly', () => {
      chart = new BarChart(container, {
        width: 400,
        height: 300,
        margin: { top: 20, right: 20, bottom: 40, left: 50 }
      });
      chart.setData(sampleData);
      
      const barData = chart.getBarData();
      
      // Bars should have x positions >= 0
      expect(barData.every(b => b.x >= 0)).toBe(true);
      
      // Bars should have positive width
      expect(barData.every(b => b.width > 0)).toBe(true);
    });
    
    it('should scale bar heights relative to values', () => {
      chart = new BarChart(container);
      chart.setData(sampleData);
      
      const barData = chart.getBarData();
      
      // Find bars for values 10 and 30
      const barA = barData[0]; // value: 10
      const barD = barData[3]; // value: 30
      
      // Bar D should be taller (have larger height)
      expect(barD.height).toBeGreaterThan(barA.height);
    });
    
    it('should apply custom colors', () => {
      chart = new BarChart(container, {
        colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00']
      });
      chart.setData(sampleData);
      
      const barData = chart.getBarData();
      
      expect(barData[0].fill).toBe('#ff0000');
      expect(barData[1].fill).toBe('#00ff00');
    });
  });
  
  describe('interactions', () => {
    it('should highlight a specific bar', () => {
      chart = new BarChart(container);
      chart.setData(sampleData);
      chart.highlightBar('B');
      
      const bars = chart.getBars();
      const barB = bars[1];
      const barA = bars[0];
      
      expect(barB.getAttribute('opacity')).toBe('1');
      expect(barA.getAttribute('opacity')).toBe('0.3');
    });
    
    it('should reset highlight', () => {
      chart = new BarChart(container);
      chart.setData(sampleData);
      chart.highlightBar('B');
      chart.resetHighlight();
      
      const bars = chart.getBars();
      expect(bars.every(b => b.getAttribute('opacity') === '1')).toBe(true);
    });
  });
  
  describe('lifecycle', () => {
    it('should clean up on destroy', () => {
      chart = new BarChart(container);
      chart.setData(sampleData);
      chart.destroy();
      
      expect(container.querySelector('svg')).toBeNull();
      expect(chart.data).toEqual([]);
    });
  });
  
  describe('options update', () => {
    it('should update options and re-render', () => {
      chart = new BarChart(container, { colors: ['blue'] });
      chart.setData(sampleData);
      
      expect(chart.getBarData()[0].fill).toBe('blue');
      
      chart.updateOptions({ colors: ['red'] });
      
      expect(chart.getBarData()[0].fill).toBe('red');
    });
  });
});
