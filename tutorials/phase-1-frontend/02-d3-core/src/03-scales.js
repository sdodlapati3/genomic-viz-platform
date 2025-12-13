/**
 * D3 Scales & Axes - Transforming data to visual values
 */
import * as d3 from 'd3';

export function initScales() {
  // Demo 1: Linear & Log Scales
  const scalesContainer = d3.select('#scales-demo');
  const svg = scalesContainer.append('svg')
    .attr('width', 450)
    .attr('height', 250);
  
  const margin = { top: 30, right: 30, bottom: 50, left: 60 };
  const width = 450 - margin.left - margin.right;
  const height = 250 - margin.top - margin.bottom;
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Sample data (mutation counts by position)
  const data = [
    { pos: 0, linear: 10, log: 10 },
    { pos: 50, linear: 100, log: 100 },
    { pos: 100, linear: 500, log: 500 },
    { pos: 150, linear: 1000, log: 1000 },
    { pos: 200, linear: 5000, log: 5000 },
    { pos: 250, linear: 10000, log: 10000 }
  ];
  
  // X scale (position)
  const x = d3.scaleLinear()
    .domain([0, 250])
    .range([0, width]);
  
  // Y scales - Linear vs Log
  const yLinear = d3.scaleLinear()
    .domain([0, 10000])
    .range([height, 0]);
  
  const yLog = d3.scaleLog()
    .domain([10, 10000])
    .range([height, 0]);
  
  // Linear line
  const lineLinear = d3.line()
    .x(d => x(d.pos))
    .y(d => yLinear(d.linear));
  
  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#3498db')
    .attr('stroke-width', 2)
    .attr('d', lineLinear);
  
  // Log line
  const lineLog = d3.line()
    .x(d => x(d.pos))
    .y(d => yLog(d.log));
  
  g.append('path')
    .datum(data)
    .attr('fill', 'none')
    .attr('stroke', '#e74c3c')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '5,5')
    .attr('d', lineLog);
  
  // Axes
  g.append('g')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5));
  
  g.append('g')
    .call(d3.axisLeft(yLinear).ticks(5))
    .attr('class', 'linear-axis');
  
  // Legend
  const legend = g.append('g').attr('transform', `translate(${width - 100}, 0)`);
  legend.append('line').attr('x1', 0).attr('x2', 20).attr('y1', 0).attr('y2', 0)
    .attr('stroke', '#3498db').attr('stroke-width', 2);
  legend.append('text').attr('x', 25).attr('y', 4).text('Linear').attr('font-size', 11);
  legend.append('line').attr('x1', 0).attr('x2', 20).attr('y1', 20).attr('y2', 20)
    .attr('stroke', '#e74c3c').attr('stroke-width', 2).attr('stroke-dasharray', '5,5');
  legend.append('text').attr('x', 25).attr('y', 24).text('Log').attr('font-size', 11);
  
  // Demo 2: Color Scales
  const colorContainer = d3.select('#color-scales-demo');
  const colorSvg = colorContainer.append('svg')
    .attr('width', 450)
    .attr('height', 200);
  
  const colorScales = [
    { name: 'Sequential', scale: d3.scaleSequential(d3.interpolateBlues) },
    { name: 'Diverging', scale: d3.scaleSequential(d3.interpolateRdYlBu) },
    { name: 'Viridis', scale: d3.scaleSequential(d3.interpolateViridis) },
    { name: 'Categorical', scale: d3.scaleOrdinal(d3.schemeCategory10) }
  ];
  
  colorScales.forEach((cs, row) => {
    const y = 20 + row * 45;
    
    // Label
    colorSvg.append('text')
      .attr('x', 10)
      .attr('y', y + 15)
      .attr('font-size', 12)
      .text(cs.name);
    
    // Color swatches
    const n = cs.name === 'Categorical' ? 10 : 20;
    for (let i = 0; i < n; i++) {
      const color = cs.name === 'Categorical' 
        ? cs.scale(i) 
        : cs.scale(i / (n - 1));
      
      colorSvg.append('rect')
        .attr('x', 100 + i * 17)
        .attr('y', y)
        .attr('width', 16)
        .attr('height', 25)
        .attr('fill', color);
    }
  });
  
  // Demo 3: Axes
  const axesContainer = d3.select('#axes-demo');
  const axesSvg = axesContainer.append('svg')
    .attr('width', 450)
    .attr('height', 250);
  
  const axesG = axesSvg.append('g')
    .attr('transform', `translate(60, 30)`);
  
  // Different axis types
  const axisWidth = 350;
  
  // Bottom axis with custom ticks
  const xScale = d3.scaleLinear().domain([0, 100]).range([0, axisWidth]);
  axesG.append('g')
    .attr('transform', `translate(0, 50)`)
    .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => d + '%'));
  axesG.append('text').attr('x', axisWidth / 2).attr('y', 85).attr('text-anchor', 'middle')
    .attr('font-size', 11).text('axisBottom with custom format');
  
  // Time axis
  const timeScale = d3.scaleTime()
    .domain([new Date(2020, 0, 1), new Date(2024, 0, 1)])
    .range([0, axisWidth]);
  axesG.append('g')
    .attr('transform', `translate(0, 140)`)
    .call(d3.axisBottom(timeScale).ticks(5));
  axesG.append('text').attr('x', axisWidth / 2).attr('y', 175).attr('text-anchor', 'middle')
    .attr('font-size', 11).text('scaleTime for dates');
  
  // Code snippets
  document.getElementById('scales-code').textContent = `// Linear scale - proportional mapping
const yLinear = d3.scaleLinear()
  .domain([0, 10000])     // Data range
  .range([height, 0]);    // Pixel range (inverted for SVG)

// Log scale - for exponential data
const yLog = d3.scaleLog()
  .domain([10, 10000])    // Must be > 0
  .range([height, 0]);

// Band scale - for categories (bar charts)
const xBand = d3.scaleBand()
  .domain(['A', 'B', 'C', 'D'])
  .range([0, width])
  .padding(0.2);          // Gap between bars

// Time scale
const timeScale = d3.scaleTime()
  .domain([startDate, endDate])
  .range([0, width]);`;

  document.getElementById('color-scales-code').textContent = `// Sequential (continuous)
const blueScale = d3.scaleSequential(d3.interpolateBlues)
  .domain([0, 100]);
color = blueScale(50);  // Returns mid-blue

// Diverging (two-sided)
const divScale = d3.scaleSequential(d3.interpolateRdYlBu)
  .domain([-1, 1]);     // Negative = red, positive = blue

// Categorical (discrete)
const catScale = d3.scaleOrdinal(d3.schemeCategory10);
color = catScale('Group A');  // Consistent color per key

// Custom color scale
const customScale = d3.scaleLinear()
  .domain([0, 50, 100])
  .range(['green', 'yellow', 'red']);`;

  document.getElementById('axes-code').textContent = `// Create axis generators
const xAxis = d3.axisBottom(xScale)
  .ticks(10)                    // Number of ticks
  .tickFormat(d => d + '%');    // Custom format

const yAxis = d3.axisLeft(yScale)
  .tickValues([0, 25, 50, 100]) // Specific values
  .tickSize(-width);            // Grid lines

// Render axes
svg.append('g')
  .attr('class', 'x-axis')
  .attr('transform', \`translate(0,\${height})\`)
  .call(xAxis);

svg.append('g')
  .attr('class', 'y-axis')
  .call(yAxis);

// Axis positions: axisTop, axisBottom, axisLeft, axisRight`;
}
