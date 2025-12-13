/**
 * Module 1: Lollipop Plot Basics
 * Understanding the anatomy and structure of a lollipop plot
 */

import * as d3 from 'd3';

export function initBasicsModule() {
  createBasicLollipopDemo();
}

function createBasicLollipopDemo() {
  const container = d3.select('#basic-lollipop-demo');
  container.selectAll('*').remove();
  
  const width = 900;
  const height = 400;
  const margin = { top: 60, right: 40, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  // Title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('fill', '#e4e4e7')
    .attr('font-size', 16)
    .attr('font-weight', 600)
    .text('Anatomy of a Lollipop Plot');
  
  // Sample data - simplified mutations
  const proteinLength = 393; // TP53 length
  const mutations = [
    { position: 72, count: 45, type: 'Missense' },
    { position: 175, count: 350, type: 'Missense' },
    { position: 248, count: 420, type: 'Missense' },
    { position: 273, count: 380, type: 'Missense' },
    { position: 282, count: 280, type: 'Nonsense' }
  ];
  
  // Scales
  const xScale = d3.scaleLinear()
    .domain([0, proteinLength])
    .range([0, plotWidth]);
  
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(mutations, d => d.count) * 1.2])
    .range([plotHeight - 50, 0]);
  
  const radiusScale = d3.scaleSqrt()
    .domain([0, d3.max(mutations, d => d.count)])
    .range([5, 20]);
  
  // Color scale for mutation types
  const colorScale = d3.scaleOrdinal()
    .domain(['Missense', 'Nonsense', 'Frameshift', 'Splice'])
    .range(['#3b82f6', '#ef4444', '#22c55e', '#f59e0b']);
  
  // Backbone Y position
  const backboneY = plotHeight - 30;
  
  // Draw protein backbone with annotation
  const backboneGroup = g.append('g').attr('class', 'backbone-annotation');
  
  backboneGroup.append('rect')
    .attr('class', 'protein-backbone')
    .attr('x', 0)
    .attr('y', backboneY - 8)
    .attr('width', plotWidth)
    .attr('height', 16)
    .attr('rx', 3);
  
  // Annotation arrow and label for backbone
  backboneGroup.append('path')
    .attr('d', `M ${plotWidth + 20} ${backboneY} L ${plotWidth + 5} ${backboneY}`)
    .attr('stroke', '#fbbf24')
    .attr('stroke-width', 2)
    .attr('marker-end', 'url(#arrowhead)');
  
  backboneGroup.append('text')
    .attr('x', plotWidth + 25)
    .attr('y', backboneY + 4)
    .attr('fill', '#fbbf24')
    .attr('font-size', 12)
    .text('Protein Backbone');
  
  // Arrow marker definition
  svg.append('defs').append('marker')
    .attr('id', 'arrowhead')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 0)
    .attr('refY', 0)
    .attr('markerWidth', 6)
    .attr('markerHeight', 6)
    .attr('orient', 'auto')
    .append('path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#fbbf24');
  
  // X-axis
  const xAxis = d3.axisBottom(xScale)
    .ticks(10)
    .tickFormat(d => d);
  
  g.append('g')
    .attr('transform', `translate(0, ${plotHeight})`)
    .call(xAxis)
    .selectAll('text, line, path')
    .attr('stroke', '#6b7280')
    .attr('fill', '#9ca3af');
  
  g.append('text')
    .attr('x', plotWidth / 2)
    .attr('y', plotHeight + 45)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', 12)
    .text('Amino Acid Position');
  
  // Draw lollipops with annotations
  const lollipopGroup = g.append('g').attr('class', 'lollipops');
  
  mutations.forEach((mut, i) => {
    const x = xScale(mut.position);
    const y = yScale(mut.count);
    const radius = radiusScale(mut.count);
    
    // Stem
    lollipopGroup.append('line')
      .attr('class', 'lollipop-stem')
      .attr('x1', x)
      .attr('y1', backboneY - 8)
      .attr('x2', x)
      .attr('y2', y);
    
    // Head
    lollipopGroup.append('circle')
      .attr('class', 'lollipop-head')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', radius)
      .attr('fill', colorScale(mut.type));
    
    // Add annotation for first mutation
    if (i === 0) {
      // Stem annotation
      g.append('line')
        .attr('x1', x + 30)
        .attr('y1', (backboneY + y) / 2)
        .attr('x2', x + 5)
        .attr('y2', (backboneY + y) / 2)
        .attr('stroke', '#a78bfa')
        .attr('stroke-width', 1.5);
      
      g.append('text')
        .attr('x', x + 35)
        .attr('y', (backboneY + y) / 2 + 4)
        .attr('fill', '#a78bfa')
        .attr('font-size', 11)
        .text('Stem (connects to backbone)');
    }
    
    // Add annotation for largest mutation
    if (i === 2) {
      g.append('line')
        .attr('x1', x + radius + 25)
        .attr('y1', y)
        .attr('x2', x + radius + 5)
        .attr('y2', y)
        .attr('stroke', '#34d399')
        .attr('stroke-width', 1.5);
      
      g.append('text')
        .attr('x', x + radius + 30)
        .attr('y', y + 4)
        .attr('fill', '#34d399')
        .attr('font-size', 11)
        .text('Head (size = frequency)');
    }
  });
  
  // Legend
  const legend = g.append('g')
    .attr('transform', `translate(${plotWidth - 150}, 10)`);
  
  legend.append('rect')
    .attr('x', -10)
    .attr('y', -10)
    .attr('width', 140)
    .attr('height', 70)
    .attr('fill', 'rgba(0,0,0,0.3)')
    .attr('rx', 4);
  
  legend.append('text')
    .attr('x', 0)
    .attr('y', 5)
    .attr('fill', '#9ca3af')
    .attr('font-size', 10)
    .attr('font-weight', 600)
    .text('MUTATION TYPE');
  
  const types = ['Missense', 'Nonsense'];
  types.forEach((type, i) => {
    const row = legend.append('g')
      .attr('transform', `translate(0, ${25 + i * 20})`);
    
    row.append('circle')
      .attr('cx', 8)
      .attr('cy', 0)
      .attr('r', 6)
      .attr('fill', colorScale(type));
    
    row.append('text')
      .attr('x', 22)
      .attr('y', 4)
      .attr('fill', '#d1d5db')
      .attr('font-size', 11)
      .text(type);
  });
}

export const basicLollipopCode = `// Basic Lollipop Plot Structure
const svg = d3.select('#container')
  .append('svg')
  .attr('width', 900)
  .attr('height', 400);

const g = svg.append('g')
  .attr('transform', 'translate(60, 60)');

// Scales for positioning
const xScale = d3.scaleLinear()
  .domain([0, proteinLength])  // Amino acid range
  .range([0, plotWidth]);

const yScale = d3.scaleLinear()
  .domain([0, maxCount])       // Mutation frequency
  .range([plotHeight, 0]);

const radiusScale = d3.scaleSqrt()
  .domain([0, maxCount])
  .range([5, 20]);             // Head size range

// 1. Draw protein backbone
g.append('rect')
  .attr('class', 'protein-backbone')
  .attr('x', 0)
  .attr('y', backboneY - 8)
  .attr('width', plotWidth)
  .attr('height', 16)
  .attr('rx', 3);

// 2. Draw lollipops for each mutation
mutations.forEach(mut => {
  const x = xScale(mut.position);
  const y = yScale(mut.count);
  
  // Stem - vertical line from backbone to head
  g.append('line')
    .attr('class', 'lollipop-stem')
    .attr('x1', x)
    .attr('y1', backboneY - 8)
    .attr('x2', x)
    .attr('y2', y);
  
  // Head - circle sized by frequency
  g.append('circle')
    .attr('class', 'lollipop-head')
    .attr('cx', x)
    .attr('cy', y)
    .attr('r', radiusScale(mut.count))
    .attr('fill', colorScale(mut.type));
});`;
