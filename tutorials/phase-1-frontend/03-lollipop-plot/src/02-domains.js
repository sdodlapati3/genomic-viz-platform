/**
 * Module 2: Protein Domain Visualization
 * Rendering functional protein domains along the backbone
 */

import * as d3 from 'd3';

// TP53 protein domains (real data)
const tp53Domains = [
  { name: 'TAD1', start: 1, end: 40, color: '#ef4444', description: 'Transactivation Domain 1' },
  { name: 'TAD2', start: 41, end: 61, color: '#f97316', description: 'Transactivation Domain 2' },
  { name: 'PRD', start: 64, end: 92, color: '#eab308', description: 'Proline-Rich Domain' },
  { name: 'DBD', start: 102, end: 292, color: '#3b82f6', description: 'DNA Binding Domain' },
  { name: 'NLS', start: 305, end: 322, color: '#a855f7', description: 'Nuclear Localization Signal' },
  { name: 'TET', start: 323, end: 356, color: '#22c55e', description: 'Tetramerization Domain' },
  { name: 'REG', start: 363, end: 393, color: '#06b6d4', description: 'Regulatory Domain' }
];

export function initDomainsModule() {
  createDomainsDemo();
  createDomainLegend();
}

function createDomainsDemo() {
  const container = d3.select('#domains-demo');
  container.selectAll('*').remove();
  
  const width = 900;
  const height = 200;
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
    .text('TP53 Protein Structure (393 amino acids)');
  
  const proteinLength = 393;
  
  // Scale
  const xScale = d3.scaleLinear()
    .domain([0, proteinLength])
    .range([0, plotWidth]);
  
  // Backbone Y position
  const backboneY = plotHeight / 2;
  const backboneHeight = 30;
  
  // Draw protein backbone (gray background)
  g.append('rect')
    .attr('class', 'protein-backbone')
    .attr('x', 0)
    .attr('y', backboneY - backboneHeight / 2)
    .attr('width', plotWidth)
    .attr('height', backboneHeight)
    .attr('rx', 4)
    .attr('fill', '#374151');
  
  // Draw domains
  const domainsGroup = g.append('g').attr('class', 'domains');
  
  tp53Domains.forEach(domain => {
    const x = xScale(domain.start);
    const domainWidth = xScale(domain.end) - xScale(domain.start);
    
    // Domain rectangle
    domainsGroup.append('rect')
      .attr('class', 'domain')
      .attr('x', x)
      .attr('y', backboneY - backboneHeight / 2)
      .attr('width', domainWidth)
      .attr('height', backboneHeight)
      .attr('fill', domain.color)
      .attr('rx', 2)
      .on('mouseover', function(event) {
        d3.select(this).attr('opacity', 1);
        showDomainTooltip(event, domain);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.9);
        hideDomainTooltip();
      });
    
    // Domain label (if wide enough)
    if (domainWidth > 40) {
      domainsGroup.append('text')
        .attr('class', 'domain-label')
        .attr('x', x + domainWidth / 2)
        .attr('y', backboneY + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', domainWidth > 60 ? 11 : 9)
        .attr('font-weight', 500)
        .text(domain.name)
        .style('pointer-events', 'none');
    }
  });
  
  // X-axis
  const xAxis = d3.axisBottom(xScale)
    .tickValues([1, 50, 100, 150, 200, 250, 300, 350, 393])
    .tickFormat(d => d);
  
  g.append('g')
    .attr('transform', `translate(0, ${plotHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#9ca3af')
    .attr('font-size', 10);
  
  g.selectAll('.domain line, .domain path')
    .attr('stroke', '#6b7280');
  
  g.append('text')
    .attr('x', plotWidth / 2)
    .attr('y', plotHeight + 40)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', 11)
    .text('Amino Acid Position');
  
  // Add tooltip div if not exists
  if (!document.getElementById('domain-tooltip')) {
    d3.select('body').append('div')
      .attr('id', 'domain-tooltip')
      .attr('class', 'tooltip');
  }
}

function showDomainTooltip(event, domain) {
  const tooltip = d3.select('#domain-tooltip');
  
  tooltip
    .style('left', (event.pageX + 10) + 'px')
    .style('top', (event.pageY - 10) + 'px')
    .classed('visible', true)
    .html(`
      <div class="tooltip-title">${domain.name}</div>
      <div class="tooltip-row">
        <span class="tooltip-label">Full Name:</span>
        <span class="tooltip-value">${domain.description}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Position:</span>
        <span class="tooltip-value">${domain.start} - ${domain.end}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Length:</span>
        <span class="tooltip-value">${domain.end - domain.start + 1} aa</span>
      </div>
    `);
}

function hideDomainTooltip() {
  d3.select('#domain-tooltip').classed('visible', false);
}

function createDomainLegend() {
  const container = d3.select('#domain-legend');
  container.selectAll('*').remove();
  
  const legendContainer = container.append('div')
    .style('display', 'flex')
    .style('flex-wrap', 'wrap')
    .style('gap', '1rem');
  
  tp53Domains.forEach(domain => {
    const item = legendContainer.append('div')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '0.5rem');
    
    item.append('div')
      .style('width', '20px')
      .style('height', '12px')
      .style('background', domain.color)
      .style('border-radius', '2px');
    
    item.append('span')
      .style('font-size', '0.85rem')
      .style('color', '#9ca3af')
      .text(`${domain.name}: ${domain.description}`);
  });
}

export const domainsCode = `// Protein Domain Visualization
const tp53Domains = [
  { name: 'TAD1', start: 1, end: 40, color: '#ef4444' },
  { name: 'DBD', start: 102, end: 292, color: '#3b82f6' },
  { name: 'TET', start: 323, end: 356, color: '#22c55e' },
  // ... more domains
];

const xScale = d3.scaleLinear()
  .domain([0, proteinLength])
  .range([0, plotWidth]);

// Draw backbone first
g.append('rect')
  .attr('class', 'protein-backbone')
  .attr('x', 0)
  .attr('y', backboneY - height/2)
  .attr('width', plotWidth)
  .attr('height', height)
  .attr('fill', '#374151');

// Overlay domains on top
domains.forEach(domain => {
  const x = xScale(domain.start);
  const width = xScale(domain.end) - x;
  
  g.append('rect')
    .attr('class', 'domain')
    .attr('x', x)
    .attr('y', backboneY - height/2)
    .attr('width', width)
    .attr('height', height)
    .attr('fill', domain.color)
    .attr('rx', 2)
    .on('mouseover', showTooltip)
    .on('mouseout', hideTooltip);
  
  // Add label if space permits
  if (width > 40) {
    g.append('text')
      .attr('class', 'domain-label')
      .attr('x', x + width/2)
      .attr('y', backboneY + 4)
      .attr('text-anchor', 'middle')
      .text(domain.name);
  }
});`;

export { tp53Domains };
