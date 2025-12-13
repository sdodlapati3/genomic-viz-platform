/**
 * Complete Genomic Chart Example - Mutation Frequency
 */
import * as d3 from 'd3';

export function initGenomicChart() {
  // TP53 mutation data (simplified)
  const mutationData = [
    { position: 125, count: 45, aa: 'R125' },
    { position: 132, count: 23, aa: 'K132' },
    { position: 151, count: 67, aa: 'P151' },
    { position: 158, count: 34, aa: 'R158' },
    { position: 175, count: 892, aa: 'R175' },
    { position: 179, count: 123, aa: 'H179' },
    { position: 196, count: 45, aa: 'R196' },
    { position: 213, count: 89, aa: 'R213' },
    { position: 220, count: 56, aa: 'Y220' },
    { position: 245, count: 234, aa: 'G245' },
    { position: 248, count: 567, aa: 'R248' },
    { position: 249, count: 189, aa: 'R249' },
    { position: 273, count: 445, aa: 'R273' },
    { position: 275, count: 78, aa: 'C275' },
    { position: 282, count: 312, aa: 'R282' },
    { position: 286, count: 45, aa: 'E286' },
  ];
  
  const container = d3.select('#genomic-chart-demo');
  
  // Dimensions
  const margin = { top: 40, right: 40, bottom: 60, left: 70 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;
  
  // Create SVG
  const svg = container.append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Tooltip
  const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip');
  
  // Scales
  const x = d3.scaleLinear()
    .domain([100, 300])
    .range([0, width]);
  
  const y = d3.scaleLinear()
    .domain([0, d3.max(mutationData, d => d.count) * 1.1])
    .range([height, 0]);
  
  // Grid
  g.append('g')
    .attr('class', 'grid')
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat(''))
    .selectAll('line')
    .attr('stroke', '#eee');
  
  // Axes
  const xAxis = g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(10));
  
  xAxis.append('text')
    .attr('x', width / 2)
    .attr('y', 45)
    .attr('fill', '#333')
    .attr('font-size', 13)
    .attr('text-anchor', 'middle')
    .text('Amino Acid Position');
  
  const yAxis = g.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(y));
  
  yAxis.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -height / 2)
    .attr('y', -50)
    .attr('fill', '#333')
    .attr('font-size', 13)
    .attr('text-anchor', 'middle')
    .text('Mutation Count');
  
  // Title
  svg.append('text')
    .attr('x', (width + margin.left + margin.right) / 2)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .attr('font-size', 16)
    .attr('font-weight', 'bold')
    .attr('fill', '#2c3e50')
    .text('TP53 Mutation Frequency by Position');
  
  // Chart content group
  const chartContent = g.append('g').attr('class', 'chart-content');
  
  // Line generator
  const line = d3.line()
    .x(d => x(d.position))
    .y(d => y(d.count))
    .curve(d3.curveMonotoneX);
  
  // Area generator
  const area = d3.area()
    .x(d => x(d.position))
    .y0(height)
    .y1(d => y(d.count))
    .curve(d3.curveMonotoneX);
  
  function drawChart(type) {
    // Clear previous
    chartContent.selectAll('*').remove();
    
    if (type === 'bar') {
      // Bar chart
      const barWidth = width / mutationData.length * 0.6;
      
      chartContent.selectAll('.bar')
        .data(mutationData)
        .join('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.position) - barWidth / 2)
        .attr('y', height)
        .attr('width', barWidth)
        .attr('height', 0)
        .attr('fill', d => d.count > 400 ? '#e74c3c' : '#3498db')
        .attr('rx', 2)
        .on('mouseenter', function(event, d) {
          d3.select(this).attr('fill', '#2c3e50');
          tooltip
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 10 + 'px')
            .classed('visible', true)
            .html(`<strong>${d.aa}</strong><br>Position: ${d.position}<br>Count: ${d.count}`);
        })
        .on('mouseleave', function(event, d) {
          d3.select(this).attr('fill', d.count > 400 ? '#e74c3c' : '#3498db');
          tooltip.classed('visible', false);
        })
        .transition()
        .duration(600)
        .delay((d, i) => i * 40)
        .attr('y', d => y(d.count))
        .attr('height', d => height - y(d.count));
        
    } else if (type === 'line') {
      // Line chart
      chartContent.append('path')
        .datum(mutationData)
        .attr('class', 'line-path')
        .attr('d', line);
      
      chartContent.selectAll('.dot')
        .data(mutationData)
        .join('circle')
        .attr('class', 'dot')
        .attr('cx', d => x(d.position))
        .attr('cy', d => y(d.count))
        .attr('r', 5)
        .on('mouseenter', function(event, d) {
          d3.select(this).attr('r', 8);
          tooltip
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 10 + 'px')
            .classed('visible', true)
            .html(`<strong>${d.aa}</strong><br>Position: ${d.position}<br>Count: ${d.count}`);
        })
        .on('mouseleave', function() {
          d3.select(this).attr('r', 5);
          tooltip.classed('visible', false);
        });
        
    } else if (type === 'area') {
      // Area chart
      chartContent.append('path')
        .datum(mutationData)
        .attr('class', 'area-path')
        .attr('d', area);
      
      chartContent.selectAll('.dot')
        .data(mutationData)
        .join('circle')
        .attr('class', 'dot')
        .attr('cx', d => x(d.position))
        .attr('cy', d => y(d.count))
        .attr('r', 4)
        .on('mouseenter', function(event, d) {
          d3.select(this).attr('r', 7);
          tooltip
            .style('left', event.pageX + 10 + 'px')
            .style('top', event.pageY - 10 + 'px')
            .classed('visible', true)
            .html(`<strong>${d.aa}</strong><br>Position: ${d.position}<br>Count: ${d.count}`);
        })
        .on('mouseleave', function() {
          d3.select(this).attr('r', 4);
          tooltip.classed('visible', false);
        });
    }
  }
  
  // Initial draw
  drawChart('bar');
  
  // Chart type selector
  document.getElementById('update-chart')?.addEventListener('click', () => {
    const type = document.getElementById('chart-type').value;
    drawChart(type);
  });
  
  // Code snippet
  document.getElementById('genomic-chart-code').textContent = `// Complete D3 chart setup for genomic data
const mutationData = [
  { position: 175, count: 892, aa: 'R175' },
  { position: 248, count: 567, aa: 'R248' },
  // ... more data
];

// Setup dimensions
const margin = { top: 40, right: 40, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create scales
const x = d3.scaleLinear()
  .domain([100, 300])            // Amino acid range
  .range([0, width]);

const y = d3.scaleLinear()
  .domain([0, d3.max(data, d => d.count)])
  .range([height, 0]);

// Line generator with curve
const line = d3.line()
  .x(d => x(d.position))
  .y(d => y(d.count))
  .curve(d3.curveMonotoneX);     // Smooth curve

// Area generator
const area = d3.area()
  .x(d => x(d.position))
  .y0(height)                    // Baseline
  .y1(d => y(d.count))
  .curve(d3.curveMonotoneX);

// Draw bars with transitions
svg.selectAll('.bar')
  .data(data)
  .join('rect')
  .attr('x', d => x(d.position) - barWidth/2)
  .attr('y', height)             // Start from bottom
  .attr('height', 0)
  .transition()
  .duration(600)
  .delay((d, i) => i * 40)       // Stagger
  .attr('y', d => y(d.count))
  .attr('height', d => height - y(d.count));

// Tooltip on hover
bar.on('mouseenter', (event, d) => {
  tooltip.html(\`<strong>\${d.aa}</strong><br>Count: \${d.count}\`)
    .style('left', event.pageX + 'px')
    .style('top', event.pageY + 'px')
    .classed('visible', true);
});`;
}
