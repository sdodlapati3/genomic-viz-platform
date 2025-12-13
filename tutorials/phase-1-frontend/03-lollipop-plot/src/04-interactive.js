/**
 * Module 4: Interactive Features
 * Tooltips, hover effects, filtering, and zoom
 */

import * as d3 from 'd3';
import { tp53Domains } from './02-domains.js';
import { tp53Mutations, mutationColors } from './03-mutations.js';

let currentFilters = {
  type: 'all',
  minCount: 1,
  posStart: 1,
  posEnd: 393
};

export function initInteractiveModule() {
  setupFilterControls();
  createInteractivePlot();
}

function setupFilterControls() {
  // Type filter
  d3.select('#type-filter').on('change', function() {
    currentFilters.type = this.value;
    updatePlot();
  });
  
  // Count filter
  d3.select('#count-filter').on('input', function() {
    currentFilters.minCount = +this.value;
    d3.select('#count-value').text(this.value);
    updatePlot();
  });
  
  // Position range filter
  d3.select('#apply-range').on('click', () => {
    currentFilters.posStart = +d3.select('#pos-start').property('value');
    currentFilters.posEnd = +d3.select('#pos-end').property('value');
    updatePlot();
  });
}

function filterMutations(mutations) {
  return mutations.filter(mut => {
    // Type filter
    if (currentFilters.type !== 'all' && mut.type !== currentFilters.type) {
      return false;
    }
    // Count filter
    if (mut.count < currentFilters.minCount) {
      return false;
    }
    // Position filter
    if (mut.position < currentFilters.posStart || mut.position > currentFilters.posEnd) {
      return false;
    }
    return true;
  });
}

function updatePlot() {
  createInteractivePlot();
}

function createInteractivePlot() {
  const container = d3.select('#interactive-demo');
  container.selectAll('*').remove();
  
  const width = 900;
  const height = 350;
  const margin = { top: 40, right: 40, bottom: 50, left: 60 };
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
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .attr('fill', '#e4e4e7')
    .attr('font-size', 14)
    .attr('font-weight', 600)
    .text('Interactive TP53 Lollipop Plot');
  
  // Filter mutations
  const filteredMutations = filterMutations(tp53Mutations);
  const clusteredMutations = clusterMutations(filteredMutations);
  
  const proteinLength = 393;
  
  // Scales
  const xScale = d3.scaleLinear()
    .domain([currentFilters.posStart, currentFilters.posEnd])
    .range([0, plotWidth]);
  
  const maxCount = Math.max(d3.max(clusteredMutations, d => d.totalCount) || 100, 100);
  const yScale = d3.scaleLinear()
    .domain([0, maxCount * 1.1])
    .range([plotHeight - 50, 0]);
  
  const radiusScale = d3.scaleSqrt()
    .domain([0, maxCount])
    .range([4, 18]);
  
  const colorScale = d3.scaleOrdinal()
    .domain(Object.keys(mutationColors))
    .range(Object.values(mutationColors));
  
  const backboneY = plotHeight - 30;
  const backboneHeight = 20;
  
  // Draw backbone
  g.append('rect')
    .attr('class', 'protein-backbone')
    .attr('x', 0)
    .attr('y', backboneY - backboneHeight / 2)
    .attr('width', plotWidth)
    .attr('height', backboneHeight)
    .attr('rx', 3)
    .attr('fill', '#374151');
  
  // Draw domains (only visible parts)
  tp53Domains.forEach(domain => {
    const domainStart = Math.max(domain.start, currentFilters.posStart);
    const domainEnd = Math.min(domain.end, currentFilters.posEnd);
    
    if (domainStart < domainEnd) {
      const x = xScale(domainStart);
      const domainWidth = xScale(domainEnd) - x;
      
      g.append('rect')
        .attr('class', 'domain')
        .attr('x', x)
        .attr('y', backboneY - backboneHeight / 2)
        .attr('width', domainWidth)
        .attr('height', backboneHeight)
        .attr('fill', domain.color)
        .attr('rx', 2)
        .attr('opacity', 0.8);
    }
  });
  
  // Draw lollipops with interactivity
  const lollipopsGroup = g.append('g').attr('class', 'lollipops');
  
  clusteredMutations.forEach(cluster => {
    const x = xScale(cluster.position);
    const y = yScale(cluster.totalCount);
    const radius = radiusScale(cluster.totalCount);
    
    // Stem
    lollipopsGroup.append('line')
      .attr('class', 'lollipop-stem')
      .attr('x1', x)
      .attr('y1', backboneY - backboneHeight / 2)
      .attr('x2', x)
      .attr('y2', y + radius);
    
    // Head - interactive circle
    const head = lollipopsGroup.append('circle')
      .attr('class', 'lollipop-head')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', radius)
      .attr('fill', colorScale(cluster.types[0].type))
      .style('cursor', 'pointer');
    
    // Add interactivity
    head
      .on('mouseover', function(event) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', radius * 1.3)
          .attr('stroke-width', 2);
        
        showTooltip(event, cluster);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', radius)
          .attr('stroke-width', 1.5);
        
        hideTooltip();
      })
      .on('click', function(event, d) {
        highlightMutation(cluster, lollipopsGroup);
      });
  });
  
  // Axes
  const yAxis = d3.axisLeft(yScale).ticks(5);
  g.append('g')
    .call(yAxis)
    .selectAll('text')
    .attr('fill', '#9ca3af')
    .attr('font-size', 10);
  
  g.selectAll('.domain line, .domain path')
    .attr('stroke', '#6b7280');
  
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(plotHeight - 50) / 2)
    .attr('y', -45)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', 11)
    .text('Mutation Count');
  
  const xAxis = d3.axisBottom(xScale).ticks(10);
  g.append('g')
    .attr('transform', `translate(0, ${plotHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#9ca3af')
    .attr('font-size', 10);
  
  g.append('text')
    .attr('x', plotWidth / 2)
    .attr('y', plotHeight + 40)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', 11)
    .text('Amino Acid Position');
  
  // Show mutation count
  svg.append('text')
    .attr('x', width - margin.right)
    .attr('y', margin.top - 10)
    .attr('text-anchor', 'end')
    .attr('fill', '#6b7280')
    .attr('font-size', 11)
    .text(`Showing ${filteredMutations.length} mutations`);
}

function clusterMutations(mutations) {
  const positionMap = new Map();
  
  mutations.forEach(mut => {
    if (!positionMap.has(mut.position)) {
      positionMap.set(mut.position, {
        position: mut.position,
        types: [],
        totalCount: 0
      });
    }
    
    const cluster = positionMap.get(mut.position);
    cluster.types.push({
      type: mut.type,
      aaChange: mut.aaChange,
      count: mut.count
    });
    cluster.totalCount += mut.count;
  });
  
  return Array.from(positionMap.values());
}

function showTooltip(event, cluster) {
  const tooltip = d3.select('#lollipop-tooltip');
  
  // Find domain at this position
  const domain = tp53Domains.find(d => 
    cluster.position >= d.start && cluster.position <= d.end
  );
  
  let mutationsList = cluster.types
    .map(t => `<div class="tooltip-row"><span class="tooltip-label">${t.aaChange}:</span><span class="tooltip-value">${t.count}</span></div>`)
    .join('');
  
  tooltip
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 10) + 'px')
    .classed('visible', true)
    .html(`
      <div class="tooltip-title">Position ${cluster.position}</div>
      <div class="tooltip-row">
        <span class="tooltip-label">Domain:</span>
        <span class="tooltip-value">${domain ? domain.name : 'Linker'}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Total Count:</span>
        <span class="tooltip-value">${cluster.totalCount}</span>
      </div>
      <hr style="border-color: #374151; margin: 8px 0;">
      <div style="font-size: 0.8rem; color: #9ca3af; margin-bottom: 4px;">Mutations:</div>
      ${mutationsList}
    `);
}

function hideTooltip() {
  d3.select('#lollipop-tooltip').classed('visible', false);
}

function highlightMutation(cluster, container) {
  // Dim all other lollipops
  container.selectAll('.lollipop-head')
    .transition()
    .duration(200)
    .attr('opacity', 0.3);
  
  // Reset after delay
  setTimeout(() => {
    container.selectAll('.lollipop-head')
      .transition()
      .duration(200)
      .attr('opacity', 1);
  }, 1500);
}

export const interactiveCode = `// Interactive Features
function showTooltip(event, cluster) {
  const tooltip = d3.select('#tooltip');
  
  // Find domain at this position
  const domain = domains.find(d => 
    cluster.position >= d.start && cluster.position <= d.end
  );
  
  tooltip
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 10) + 'px')
    .classed('visible', true)
    .html(\`
      <div class="tooltip-title">Position \${cluster.position}</div>
      <div>Domain: \${domain?.name || 'Linker'}</div>
      <div>Total Count: \${cluster.totalCount}</div>
      <div>Mutations:</div>
      \${cluster.types.map(t => 
        \`<div>\${t.aaChange}: \${t.count}</div>\`
      ).join('')}
    \`);
}

// Filter mutations
function filterMutations(mutations) {
  return mutations.filter(mut => {
    if (filters.type !== 'all' && mut.type !== filters.type) 
      return false;
    if (mut.count < filters.minCount) 
      return false;
    if (mut.position < filters.posStart || mut.position > filters.posEnd) 
      return false;
    return true;
  });
}

// Hover effects
head
  .on('mouseover', function(event) {
    d3.select(this)
      .transition()
      .duration(150)
      .attr('r', radius * 1.3);
    showTooltip(event, cluster);
  })
  .on('mouseout', function() {
    d3.select(this)
      .transition()
      .duration(150)
      .attr('r', radius);
    hideTooltip();
  });`;
