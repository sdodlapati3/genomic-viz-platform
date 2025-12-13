/**
 * Exercise 1 Solution: Basic Lollipop Plot
 * 
 * Create a simple lollipop plot for mutation visualization
 */

import * as d3 from 'd3';

// Task: Create a basic lollipop plot showing mutations on a protein
export function createBasicLollipopPlot(container, data) {
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  // Clear existing content
  d3.select(container).selectAll('*').remove();

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Sample data if not provided
  const mutations = data || [
    { position: 72, count: 5, type: 'missense', aa: 'R72P' },
    { position: 175, count: 12, type: 'missense', aa: 'R175H' },
    { position: 220, count: 3, type: 'nonsense', aa: 'Y220*' },
    { position: 248, count: 18, type: 'missense', aa: 'R248Q' },
    { position: 273, count: 15, type: 'missense', aa: 'R273H' },
    { position: 282, count: 8, type: 'missense', aa: 'R282W' },
    { position: 337, count: 4, type: 'frameshift', aa: 'G337fs' },
  ];

  const proteinLength = 393; // TP53 protein length

  // Create scales
  const x = d3.scaleLinear()
    .domain([0, proteinLength])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(mutations, d => d.count)])
    .nice()
    .range([height - 50, 20]);

  // Color scale by mutation type
  const colorScale = d3.scaleOrdinal()
    .domain(['missense', 'nonsense', 'frameshift', 'splice'])
    .range(['#e74c3c', '#2ecc71', '#3498db', '#9b59b6']);

  // Draw protein backbone (gray rectangle)
  svg.append('rect')
    .attr('x', 0)
    .attr('y', height - 40)
    .attr('width', width)
    .attr('height', 20)
    .attr('fill', '#bdc3c7')
    .attr('rx', 5);

  // Add protein label
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', height - 25)
    .attr('text-anchor', 'middle')
    .attr('fill', '#fff')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text('TP53 Protein');

  // Draw lollipop sticks (lines)
  svg.selectAll('.stick')
    .data(mutations)
    .join('line')
    .attr('class', 'stick')
    .attr('x1', d => x(d.position))
    .attr('y1', height - 40)
    .attr('x2', d => x(d.position))
    .attr('y2', d => y(d.count))
    .attr('stroke', '#999')
    .attr('stroke-width', 2);

  // Draw lollipop heads (circles)
  svg.selectAll('.head')
    .data(mutations)
    .join('circle')
    .attr('class', 'head')
    .attr('cx', d => x(d.position))
    .attr('cy', d => y(d.count))
    .attr('r', 8)
    .attr('fill', d => colorScale(d.type))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer');

  // Add X axis
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(10))
    .append('text')
    .attr('x', width / 2)
    .attr('y', 40)
    .attr('fill', '#333')
    .attr('text-anchor', 'middle')
    .text('Amino Acid Position');

  // Add Y axis
  svg.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -40)
    .attr('x', -height / 2)
    .attr('fill', '#333')
    .attr('text-anchor', 'middle')
    .text('Mutation Count');

  // Add title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', -10)
    .attr('text-anchor', 'middle')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text('TP53 Mutation Lollipop Plot');

  // Add legend
  const legend = svg.append('g')
    .attr('transform', `translate(${width - 100}, 0)`);

  const legendItems = ['missense', 'nonsense', 'frameshift'];
  legendItems.forEach((type, i) => {
    const g = legend.append('g')
      .attr('transform', `translate(0, ${i * 20})`);
    
    g.append('circle')
      .attr('r', 6)
      .attr('fill', colorScale(type));
    
    g.append('text')
      .attr('x', 12)
      .attr('y', 4)
      .attr('font-size', '11px')
      .text(type);
  });

  return svg.node();
}

// Task: Add interactivity to lollipop plot
export function createInteractiveLollipopPlot(container, data) {
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  d3.select(container).selectAll('*').remove();

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const mutations = data || [
    { position: 72, count: 5, type: 'missense', aa: 'R72P', samples: ['S001', 'S002'] },
    { position: 175, count: 12, type: 'missense', aa: 'R175H', samples: ['S003', 'S004', 'S005'] },
    { position: 248, count: 18, type: 'missense', aa: 'R248Q', samples: ['S006', 'S007'] },
    { position: 273, count: 15, type: 'missense', aa: 'R273H', samples: ['S008', 'S009'] },
    { position: 282, count: 8, type: 'missense', aa: 'R282W', samples: ['S010'] },
  ];

  const proteinLength = 393;

  const x = d3.scaleLinear()
    .domain([0, proteinLength])
    .range([0, width]);

  const y = d3.scaleLinear()
    .domain([0, d3.max(mutations, d => d.count)])
    .nice()
    .range([height - 50, 20]);

  const colorScale = d3.scaleOrdinal()
    .domain(['missense', 'nonsense', 'frameshift'])
    .range(['#e74c3c', '#2ecc71', '#3498db']);

  // Protein backbone
  svg.append('rect')
    .attr('x', 0)
    .attr('y', height - 40)
    .attr('width', width)
    .attr('height', 20)
    .attr('fill', '#bdc3c7')
    .attr('rx', 5);

  // Create tooltip
  const tooltip = d3.select(container)
    .append('div')
    .attr('class', 'tooltip')
    .style('position', 'absolute')
    .style('visibility', 'hidden')
    .style('background', 'rgba(0,0,0,0.8)')
    .style('color', 'white')
    .style('padding', '8px 12px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none');

  // Draw sticks
  svg.selectAll('.stick')
    .data(mutations)
    .join('line')
    .attr('class', 'stick')
    .attr('x1', d => x(d.position))
    .attr('y1', height - 40)
    .attr('x2', d => x(d.position))
    .attr('y2', d => y(d.count))
    .attr('stroke', '#999')
    .attr('stroke-width', 2);

  // Draw interactive heads
  svg.selectAll('.head')
    .data(mutations)
    .join('circle')
    .attr('class', 'head')
    .attr('cx', d => x(d.position))
    .attr('cy', d => y(d.count))
    .attr('r', 8)
    .attr('fill', d => colorScale(d.type))
    .attr('stroke', '#fff')
    .attr('stroke-width', 2)
    .style('cursor', 'pointer')
    .on('mouseover', function(event, d) {
      // Highlight
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 12)
        .attr('stroke-width', 3);

      // Show tooltip
      tooltip
        .html(`
          <strong>${d.aa}</strong><br/>
          Position: ${d.position}<br/>
          Type: ${d.type}<br/>
          Count: ${d.count}<br/>
          Samples: ${d.samples?.join(', ') || 'N/A'}
        `)
        .style('visibility', 'visible')
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', function() {
      d3.select(this)
        .transition()
        .duration(200)
        .attr('r', 8)
        .attr('stroke-width', 2);

      tooltip.style('visibility', 'hidden');
    })
    .on('click', function(event, d) {
      console.log('Mutation clicked:', d);
      alert(`Selected mutation: ${d.aa} at position ${d.position}`);
    });

  // Axes
  svg.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x));

  svg.append('g')
    .call(d3.axisLeft(y));

  return { svg: svg.node(), tooltip };
}

export default {
  createBasicLollipopPlot,
  createInteractiveLollipopPlot,
};
