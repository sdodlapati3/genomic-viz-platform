/**
 * Module 3: Mutation Rendering
 * Displaying mutations with proper sizing, coloring, and clustering
 */

import * as d3 from 'd3';
import { tp53Domains } from './02-domains.js';

// Sample TP53 mutations data (simplified from real COSMIC data)
export const tp53Mutations = [
  // Hotspot mutations in DBD
  { position: 175, aaChange: 'R175H', count: 350, type: 'Missense' },
  { position: 248, aaChange: 'R248Q', count: 420, type: 'Missense' },
  { position: 248, aaChange: 'R248W', count: 280, type: 'Missense' },
  { position: 249, aaChange: 'R249S', count: 180, type: 'Missense' },
  { position: 273, aaChange: 'R273H', count: 380, type: 'Missense' },
  { position: 273, aaChange: 'R273C', count: 220, type: 'Missense' },
  { position: 282, aaChange: 'R282W', count: 280, type: 'Missense' },
  
  // Other DBD mutations
  { position: 158, aaChange: 'R158H', count: 85, type: 'Missense' },
  { position: 179, aaChange: 'H179R', count: 95, type: 'Missense' },
  { position: 196, aaChange: 'R196*', count: 45, type: 'Nonsense' },
  { position: 213, aaChange: 'R213*', count: 120, type: 'Nonsense' },
  { position: 220, aaChange: 'Y220C', count: 150, type: 'Missense' },
  { position: 234, aaChange: 'Y234C', count: 65, type: 'Missense' },
  { position: 245, aaChange: 'G245S', count: 140, type: 'Missense' },
  
  // TAD mutations
  { position: 22, aaChange: 'E22fs', count: 35, type: 'Frameshift' },
  { position: 47, aaChange: 'T47fs', count: 25, type: 'Frameshift' },
  
  // Splice mutations
  { position: 125, aaChange: 'splice', count: 55, type: 'Splice' },
  { position: 224, aaChange: 'splice', count: 75, type: 'Splice' },
  { position: 307, aaChange: 'splice', count: 40, type: 'Splice' },
  
  // TET domain
  { position: 337, aaChange: 'R337C', count: 65, type: 'Missense' },
  { position: 342, aaChange: 'L344P', count: 45, type: 'Missense' }
];

// Color scheme for mutation types
export const mutationColors = {
  'Missense': '#3b82f6',
  'Nonsense': '#ef4444',
  'Frameshift': '#22c55e',
  'Splice': '#f59e0b',
  'Inframe': '#8b5cf6'
};

export function initMutationsModule() {
  createMutationsDemo();
  createMutationLegend();
}

function createMutationsDemo() {
  const container = d3.select('#mutations-demo');
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
    .text('TP53 Mutations with Clustering');
  
  const proteinLength = 393;
  
  // Cluster mutations at same position
  const clusteredMutations = clusterMutations(tp53Mutations);
  
  // Scales
  const xScale = d3.scaleLinear()
    .domain([0, proteinLength])
    .range([0, plotWidth]);
  
  const maxCount = d3.max(clusteredMutations, d => d.totalCount);
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
  
  // Draw domains
  tp53Domains.forEach(domain => {
    const x = xScale(domain.start);
    const domainWidth = xScale(domain.end) - xScale(domain.start);
    
    g.append('rect')
      .attr('class', 'domain')
      .attr('x', x)
      .attr('y', backboneY - backboneHeight / 2)
      .attr('width', domainWidth)
      .attr('height', backboneHeight)
      .attr('fill', domain.color)
      .attr('rx', 2)
      .attr('opacity', 0.8);
  });
  
  // Draw lollipops
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
    
    // If multiple mutation types at same position, draw pie chart
    if (cluster.types.length > 1) {
      drawPieHead(lollipopsGroup, x, y, radius, cluster, colorScale);
    } else {
      // Single mutation type - simple circle
      lollipopsGroup.append('circle')
        .attr('class', 'lollipop-head')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius)
        .attr('fill', colorScale(cluster.types[0].type));
    }
    
    // Show count label for large mutations
    if (cluster.totalCount > 200) {
      lollipopsGroup.append('text')
        .attr('x', x)
        .attr('y', y - radius - 5)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .attr('font-size', 9)
        .text(cluster.totalCount);
    }
  });
  
  // Y-axis
  const yAxis = d3.axisLeft(yScale)
    .ticks(5)
    .tickFormat(d => d);
  
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
  
  // X-axis
  const xAxis = d3.axisBottom(xScale)
    .ticks(10);
  
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
}

// Cluster mutations at the same position
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

// Draw pie chart head for multiple mutation types
function drawPieHead(container, x, y, radius, cluster, colorScale) {
  const pie = d3.pie()
    .value(d => d.count)
    .sort(null);
  
  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);
  
  const pieGroup = container.append('g')
    .attr('transform', `translate(${x}, ${y})`);
  
  const arcs = pieGroup.selectAll('.arc')
    .data(pie(cluster.types))
    .enter()
    .append('path')
    .attr('class', 'lollipop-head')
    .attr('d', arc)
    .attr('fill', d => colorScale(d.data.type))
    .attr('stroke', 'white')
    .attr('stroke-width', 1);
}

function createMutationLegend() {
  const container = d3.select('#mutation-legend');
  container.selectAll('*').remove();
  
  Object.entries(mutationColors).forEach(([type, color]) => {
    const item = container.append('div')
      .attr('class', 'legend-item');
    
    item.append('div')
      .attr('class', 'legend-dot')
      .style('background', color);
    
    item.append('span')
      .attr('class', 'legend-text')
      .text(type);
  });
}

export const mutationsCode = `// Mutation Clustering and Rendering
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

// Draw lollipops with pie chart heads for clusters
clusteredMutations.forEach(cluster => {
  const x = xScale(cluster.position);
  const y = yScale(cluster.totalCount);
  const radius = radiusScale(cluster.totalCount);
  
  // Stem
  g.append('line')
    .attr('class', 'lollipop-stem')
    .attr('x1', x)
    .attr('y1', backboneY)
    .attr('x2', x)
    .attr('y2', y + radius);
  
  // Multiple types? Use pie chart
  if (cluster.types.length > 1) {
    const pie = d3.pie().value(d => d.count);
    const arc = d3.arc()
      .innerRadius(0)
      .outerRadius(radius);
    
    g.selectAll('.arc')
      .data(pie(cluster.types))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => colorScale(d.data.type))
      .attr('transform', \`translate(\${x}, \${y})\`);
  } else {
    g.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', radius)
      .attr('fill', colorScale(cluster.types[0].type));
  }
});`;
