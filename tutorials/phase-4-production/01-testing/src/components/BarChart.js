/**
 * Simple Bar Chart Component
 * A minimal D3-based component for testing visualization rendering
 */

import * as d3 from 'd3';

export class BarChart {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      width: options.width || 400,
      height: options.height || 300,
      margin: options.margin || { top: 20, right: 20, bottom: 40, left: 50 },
      colors: options.colors || ['#3498db'],
      ...options
    };
    
    this.data = [];
    this.svg = null;
    this.xScale = null;
    this.yScale = null;
    
    this.init();
  }
  
  init() {
    const { width, height, margin } = this.options;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'bar-chart')
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Initialize scales
    this.xScale = d3.scaleBand()
      .range([0, innerWidth])
      .padding(0.1);
    
    this.yScale = d3.scaleLinear()
      .range([innerHeight, 0]);
    
    // Add axes groups
    this.xAxisGroup = this.svg.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${innerHeight})`);
    
    this.yAxisGroup = this.svg.append('g')
      .attr('class', 'y-axis');
    
    // Add bars group
    this.barsGroup = this.svg.append('g')
      .attr('class', 'bars');
  }
  
  setData(data) {
    this.data = data;
    this.updateScales();
    this.render();
    return this;
  }
  
  updateScales() {
    const { height, margin } = this.options;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Update domains
    this.xScale.domain(this.data.map(d => d.label));
    this.yScale.domain([0, d3.max(this.data, d => d.value) || 0]);
  }
  
  render() {
    const { height, margin, colors } = this.options;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Update axes
    this.xAxisGroup.call(d3.axisBottom(this.xScale));
    this.yAxisGroup.call(d3.axisLeft(this.yScale));
    
    // Bind data to bars
    const bars = this.barsGroup.selectAll('.bar')
      .data(this.data, d => d.label);
    
    // Exit
    bars.exit().remove();
    
    // Enter + Update
    bars.enter()
      .append('rect')
      .attr('class', 'bar')
      .merge(bars)
      .attr('x', d => this.xScale(d.label))
      .attr('y', d => this.yScale(d.value))
      .attr('width', this.xScale.bandwidth())
      .attr('height', d => innerHeight - this.yScale(d.value))
      .attr('fill', (d, i) => colors[i % colors.length]);
    
    return this;
  }
  
  /**
   * Get all bar elements
   */
  getBars() {
    return this.barsGroup.selectAll('.bar').nodes();
  }
  
  /**
   * Get bar data from DOM
   */
  getBarData() {
    return this.getBars().map(bar => ({
      x: parseFloat(bar.getAttribute('x')),
      y: parseFloat(bar.getAttribute('y')),
      width: parseFloat(bar.getAttribute('width')),
      height: parseFloat(bar.getAttribute('height')),
      fill: bar.getAttribute('fill')
    }));
  }
  
  /**
   * Highlight a specific bar
   */
  highlightBar(label) {
    this.barsGroup.selectAll('.bar')
      .attr('opacity', d => d.label === label ? 1 : 0.3);
    return this;
  }
  
  /**
   * Reset highlight
   */
  resetHighlight() {
    this.barsGroup.selectAll('.bar')
      .attr('opacity', 1);
    return this;
  }
  
  /**
   * Update options and re-render
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
    this.render();
    return this;
  }
  
  /**
   * Get SVG element
   */
  getSvg() {
    return this.container.querySelector('svg');
  }
  
  /**
   * Destroy the chart
   */
  destroy() {
    d3.select(this.container).selectAll('*').remove();
    this.data = [];
    this.svg = null;
  }
}
