/**
 * D3 Selections - Selecting and manipulating DOM elements
 */
import * as d3 from 'd3';

export function initSelections() {
  // Demo 1: select() vs selectAll()
  const selectFirst = document.getElementById('select-first');
  const selectAll = document.getElementById('select-all');
  const resetSelection = document.getElementById('reset-selection');
  
  selectFirst?.addEventListener('click', () => {
    d3.selectAll('#selection-demo .box').classed('selected', false);
    d3.select('#selection-demo .box').classed('selected', true);
  });
  
  selectAll?.addEventListener('click', () => {
    d3.selectAll('#selection-demo .box').classed('selected', true);
  });
  
  resetSelection?.addEventListener('click', () => {
    d3.selectAll('#selection-demo .box').classed('selected', false);
  });
  
  // Demo 2: Method Chaining
  const chainingDemo = d3.select('#chaining-demo');
  const svg = chainingDemo.append('svg')
    .attr('width', 400)
    .attr('height', 150);
  
  // Initial circles
  const circles = [
    { cx: 50, cy: 75, r: 30 },
    { cx: 150, cy: 75, r: 30 },
    { cx: 250, cy: 75, r: 30 },
    { cx: 350, cy: 75, r: 30 }
  ];
  
  svg.selectAll('circle')
    .data(circles)
    .join('circle')
    .attr('cx', d => d.cx)
    .attr('cy', d => d.cy)
    .attr('r', d => d.r)
    .attr('fill', '#ecf0f1')
    .attr('stroke', '#bdc3c7')
    .attr('stroke-width', 2);
  
  document.getElementById('run-chain')?.addEventListener('click', () => {
    svg.selectAll('circle')
      .transition()
      .duration(500)
      .attr('fill', '#3498db')
      .attr('r', 40)
      .transition()
      .duration(500)
      .attr('fill', '#e74c3c')
      .attr('r', 25)
      .transition()
      .duration(500)
      .attr('fill', '#2ecc71')
      .attr('r', 30);
  });
  
  // Code snippets
  document.getElementById('selection-code').textContent = `// d3.select() - selects FIRST matching element
d3.select('#selection-demo .box')
  .classed('selected', true);

// d3.selectAll() - selects ALL matching elements
d3.selectAll('#selection-demo .box')
  .classed('selected', true);

// Common selection methods:
d3.select('element')      // by tag
d3.select('.class')       // by class
d3.select('#id')          // by id
d3.select('[attr=val]')   // by attribute

// Selection from existing selection
const parent = d3.select('#container');
const children = parent.selectAll('.item');`;

  document.getElementById('chaining-code').textContent = `// Method chaining - fluent API
svg.selectAll('circle')
  .data(circles)
  .join('circle')           // Create/update/remove
  .attr('cx', d => d.cx)    // Set attributes
  .attr('cy', d => d.cy)
  .attr('r', d => d.r)
  .attr('fill', '#ecf0f1')
  .attr('stroke', '#bdc3c7')
  .attr('stroke-width', 2);

// Chained transitions
svg.selectAll('circle')
  .transition()
  .duration(500)
  .attr('fill', '#3498db')
  .attr('r', 40)
  .transition()            // Chain another transition
  .duration(500)
  .attr('fill', '#e74c3c');`;
}
