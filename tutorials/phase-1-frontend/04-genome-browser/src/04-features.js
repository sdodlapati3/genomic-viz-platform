/**
 * Feature and Variant Tracks
 */
import * as d3 from 'd3';
import { formatPosition } from './01-coordinates.js';

// Sample variant data for TP53
const variantData = [
  { pos: 7673700, ref: 'C', alt: 'T', type: 'missense', aa: 'R175H', count: 892 },
  { pos: 7673781, ref: 'G', alt: 'A', type: 'missense', aa: 'G245S', count: 234 },
  { pos: 7673802, ref: 'G', alt: 'A', type: 'missense', aa: 'R248Q', count: 567 },
  { pos: 7674230, ref: 'G', alt: 'A', type: 'missense', aa: 'R273H', count: 445 },
  { pos: 7674252, ref: 'C', alt: 'T', type: 'missense', aa: 'R282W', count: 312 },
  { pos: 7674872, ref: 'G', alt: 'T', type: 'nonsense', aa: 'E294*', count: 89 },
  { pos: 7676050, ref: 'C', alt: '-', type: 'frameshift', aa: 'fs', count: 45 },
];

// Protein domains for TP53 (in genomic coordinates for this demo)
const domainData = [
  { name: 'TAD1', start: 7687000, end: 7686500, color: '#e74c3c', description: 'Transactivation domain 1' },
  { name: 'TAD2', start: 7686200, end: 7685800, color: '#e67e22', description: 'Transactivation domain 2' },
  { name: 'Proline-rich', start: 7685500, end: 7684800, color: '#f39c12', description: 'Proline-rich region' },
  { name: 'DNA-binding', start: 7684500, end: 7671500, color: '#3498db', description: 'DNA-binding domain' },
  { name: 'Tetramerization', start: 7671000, end: 7670000, color: '#9b59b6', description: 'Tetramerization domain' },
  { name: 'CTD', start: 7669800, end: 7668500, color: '#1abc9c', description: 'C-terminal regulatory domain' },
];

const variantColors = {
  missense: '#e74c3c',
  nonsense: '#2c3e50',
  frameshift: '#9b59b6',
  silent: '#95a5a6',
  splice: '#f39c12'
};

/**
 * Render variant track
 */
function renderVariantTrack(container, variants, region, width, height) {
  const margin = { left: 60, right: 30, top: 30, bottom: 20 };
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  
  const xScale = d3.scaleLinear()
    .domain([region.start, region.end])
    .range([margin.left, width - margin.right]);
  
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(variants, d => d.count)])
    .range([height - margin.bottom - 10, margin.top + 20]);
  
  // Ruler
  const axis = d3.axisTop(xScale)
    .ticks(6)
    .tickFormat(d => formatPosition(d));
  
  svg.append('g')
    .attr('transform', `translate(0, ${margin.top})`)
    .call(axis);
  
  // Track label
  svg.append('text')
    .attr('class', 'track-label')
    .attr('x', 10)
    .attr('y', height / 2)
    .text('Variants');
  
  // Baseline
  svg.append('line')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right)
    .attr('y1', height - margin.bottom)
    .attr('y2', height - margin.bottom)
    .attr('stroke', '#ddd')
    .attr('stroke-width', 1);
  
  // Create tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'browser-tooltip');
  
  // Render variants as lollipops
  variants.forEach(v => {
    const x = xScale(v.pos);
    const stemHeight = yScale(v.count);
    
    // Stem
    svg.append('line')
      .attr('class', 'variant-stem')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', height - margin.bottom)
      .attr('y2', stemHeight)
      .attr('stroke', '#999')
      .attr('stroke-width', 1.5);
    
    // Head
    const radius = Math.min(8, Math.max(4, v.count / 100));
    svg.append('circle')
      .attr('class', 'variant-marker')
      .attr('cx', x)
      .attr('cy', stemHeight)
      .attr('r', radius)
      .attr('fill', variantColors[v.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .on('mouseenter', function(event) {
        d3.select(this).attr('r', radius + 2);
        tooltip.html(`
          <strong>${v.aa}</strong><br>
          Type: ${v.type}<br>
          Position: ${v.pos.toLocaleString()}<br>
          Change: ${v.ref} → ${v.alt}<br>
          Count: ${v.count} samples
        `)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px')
          .classed('visible', true);
      })
      .on('mouseleave', function() {
        d3.select(this).attr('r', radius);
        tooltip.classed('visible', false);
      });
  });
}

/**
 * Render domain track
 */
function renderDomainTrack(container, domains, region, width, height) {
  const margin = { left: 60, right: 30, top: 30, bottom: 20 };
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  
  const xScale = d3.scaleLinear()
    .domain([region.start, region.end])
    .range([margin.left, width - margin.right]);
  
  // Ruler
  const axis = d3.axisTop(xScale)
    .ticks(6)
    .tickFormat(d => formatPosition(d));
  
  svg.append('g')
    .attr('transform', `translate(0, ${margin.top})`)
    .call(axis);
  
  // Track label
  svg.append('text')
    .attr('class', 'track-label')
    .attr('x', 10)
    .attr('y', margin.top + 35)
    .text('Domains');
  
  // Create tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'browser-tooltip');
  
  const trackY = margin.top + 15;
  const domainHeight = 25;
  
  // Domain backbone
  svg.append('rect')
    .attr('x', margin.left)
    .attr('y', trackY + domainHeight / 3)
    .attr('width', width - margin.left - margin.right)
    .attr('height', domainHeight / 3)
    .attr('fill', '#ecf0f1')
    .attr('rx', 3);
  
  // Render domains
  domains.forEach(domain => {
    // Handle reverse strand (start > end in genomic coords)
    const startX = Math.min(xScale(domain.start), xScale(domain.end));
    const domainWidth = Math.abs(xScale(domain.end) - xScale(domain.start));
    
    svg.append('rect')
      .attr('class', 'domain-rect')
      .attr('x', startX)
      .attr('y', trackY)
      .attr('width', domainWidth)
      .attr('height', domainHeight)
      .attr('fill', domain.color)
      .attr('rx', 4)
      .on('mouseenter', function(event) {
        d3.select(this).attr('opacity', 1).attr('stroke', '#333').attr('stroke-width', 2);
        tooltip.html(`
          <strong>${domain.name}</strong><br>
          ${domain.description}<br>
          Position: ${Math.min(domain.start, domain.end).toLocaleString()}-${Math.max(domain.start, domain.end).toLocaleString()}
        `)
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 10 + 'px')
          .classed('visible', true);
      })
      .on('mouseleave', function() {
        d3.select(this).attr('opacity', 0.8).attr('stroke', 'none');
        tooltip.classed('visible', false);
      });
    
    // Domain label (if wide enough)
    if (domainWidth > 40) {
      svg.append('text')
        .attr('x', startX + domainWidth / 2)
        .attr('y', trackY + domainHeight / 2 + 4)
        .attr('text-anchor', 'middle')
        .attr('font-size', 10)
        .attr('fill', 'white')
        .attr('font-weight', 'bold')
        .text(domain.name)
        .style('pointer-events', 'none');
    }
  });
}

/**
 * Initialize feature track demos
 */
export function initFeatureTracks() {
  const region = { start: 7668402, end: 7687550 };
  
  // Variant track
  const variantContainer = d3.select('#variant-track-demo');
  renderVariantTrack(variantContainer, variantData, region, 450, 150);
  
  // Domain track
  const domainContainer = d3.select('#domain-track-demo');
  renderDomainTrack(domainContainer, domainData, region, 450, 100);
  
  // Code snippets
  document.getElementById('variant-track-code').textContent = `// Variant data structure
const variants = [
  { pos: 7673700, type: 'missense', aa: 'R175H', count: 892 },
  { pos: 7674872, type: 'nonsense', aa: 'E294*', count: 89 },
  // ...
];

// Color by variant type
const colors = {
  missense: '#e74c3c',
  nonsense: '#2c3e50',
  frameshift: '#9b59b6'
};

// Render as lollipops (stem + head)
variants.forEach(v => {
  const x = xScale(v.pos);
  const stemHeight = yScale(v.count);
  
  // Vertical stem
  svg.append('line')
    .attr('x1', x).attr('x2', x)
    .attr('y1', baseline).attr('y2', stemHeight);
  
  // Circle head sized by count
  svg.append('circle')
    .attr('cx', x)
    .attr('cy', stemHeight)
    .attr('r', Math.min(8, v.count / 100))
    .attr('fill', colors[v.type]);
});`;

  document.getElementById('domain-track-code').textContent = `// Protein domain data
const domains = [
  { name: 'TAD1', start: 1, end: 40, color: '#e74c3c' },
  { name: 'DNA-binding', start: 100, end: 290, color: '#3498db' },
  // ...
];

// Render as colored rectangles
domains.forEach(domain => {
  svg.append('rect')
    .attr('x', xScale(domain.start))
    .attr('width', xScale(domain.end) - xScale(domain.start))
    .attr('y', trackY)
    .attr('height', domainHeight)
    .attr('fill', domain.color)
    .attr('rx', 4)
    .on('mouseenter', showTooltip)
    .on('mouseleave', hideTooltip);
  
  // Label if wide enough
  if (domainWidth > 40) {
    svg.append('text')
      .attr('x', domainCenter)
      .attr('y', trackY + domainHeight / 2)
      .text(domain.name);
  }
});`;
}

export { variantData, domainData, variantColors, renderVariantTrack, renderDomainTrack };
