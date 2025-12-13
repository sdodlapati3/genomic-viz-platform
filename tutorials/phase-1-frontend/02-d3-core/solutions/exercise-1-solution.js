/**
 * Exercise 1 Solution: D3 Selections
 * 
 * Learn D3.js selection patterns
 */

import * as d3 from 'd3';

// Task 1: Select and modify DOM elements
export function task1SelectAndModify() {
  // Select all paragraphs and change their color
  d3.selectAll('p')
    .style('color', '#333')
    .style('font-size', '16px');

  // Select by ID
  d3.select('#main-title')
    .style('font-weight', 'bold')
    .text('Updated Title');

  // Select by class
  d3.selectAll('.highlight')
    .style('background-color', '#fffacd')
    .style('padding', '4px');

  // Chain selections
  d3.select('.container')
    .selectAll('div')
    .style('border', '1px solid #ddd')
    .style('margin', '8px');
}

// Task 2: Create elements with D3
export function task2CreateElements(container) {
  const svg = d3.select(container)
    .append('svg')
    .attr('width', 500)
    .attr('height', 300)
    .style('background', '#f5f5f5');

  // Add a rectangle
  svg.append('rect')
    .attr('x', 50)
    .attr('y', 50)
    .attr('width', 100)
    .attr('height', 80)
    .attr('fill', '#3498db')
    .attr('stroke', '#2980b9')
    .attr('stroke-width', 2);

  // Add a circle
  svg.append('circle')
    .attr('cx', 250)
    .attr('cy', 90)
    .attr('r', 50)
    .attr('fill', '#e74c3c');

  // Add text
  svg.append('text')
    .attr('x', 250)
    .attr('y', 200)
    .attr('text-anchor', 'middle')
    .attr('font-size', '18px')
    .attr('fill', '#333')
    .text('D3 SVG Elements');

  // Add a path (triangle)
  svg.append('path')
    .attr('d', 'M 400 50 L 450 150 L 350 150 Z')
    .attr('fill', '#2ecc71')
    .attr('stroke', '#27ae60')
    .attr('stroke-width', 2);

  return svg.node();
}

// Task 3: Data binding basics
export function task3DataBinding(container) {
  const data = [10, 20, 30, 40, 50];
  
  const svg = d3.select(container)
    .append('svg')
    .attr('width', 500)
    .attr('height', 200);

  // Bind data to circles
  svg.selectAll('circle')
    .data(data)
    .join('circle')
    .attr('cx', (d, i) => 50 + i * 90)
    .attr('cy', 100)
    .attr('r', d => d)
    .attr('fill', (d, i) => d3.schemeCategory10[i])
    .attr('opacity', 0.7);

  // Add labels
  svg.selectAll('text')
    .data(data)
    .join('text')
    .attr('x', (d, i) => 50 + i * 90)
    .attr('y', 180)
    .attr('text-anchor', 'middle')
    .attr('font-size', '14px')
    .text(d => `Value: ${d}`);

  return svg.node();
}

// Task 4: Enter/Update/Exit pattern
export function task4EnterUpdateExit(container) {
  const svg = d3.select(container)
    .append('svg')
    .attr('width', 600)
    .attr('height', 200);

  function update(data) {
    // DATA JOIN
    const bars = svg.selectAll('rect')
      .data(data, d => d.id);

    // EXIT - Remove old elements
    bars.exit()
      .transition()
      .duration(300)
      .attr('width', 0)
      .remove();

    // ENTER - Create new elements
    const barsEnter = bars.enter()
      .append('rect')
      .attr('x', (d, i) => i * 60 + 20)
      .attr('y', 150)
      .attr('width', 50)
      .attr('height', 0)
      .attr('fill', '#3498db');

    // UPDATE + ENTER - Update all elements
    bars.merge(barsEnter)
      .transition()
      .duration(500)
      .attr('x', (d, i) => i * 60 + 20)
      .attr('y', d => 150 - d.value)
      .attr('height', d => d.value)
      .attr('fill', d => d.value > 80 ? '#e74c3c' : '#3498db');
  }

  // Initial data
  let data = [
    { id: 1, value: 40 },
    { id: 2, value: 80 },
    { id: 3, value: 60 },
    { id: 4, value: 100 },
    { id: 5, value: 30 },
  ];

  update(data);

  // Return update function for interactive use
  return {
    svg: svg.node(),
    update,
    addItem: () => {
      const newId = Math.max(...data.map(d => d.id)) + 1;
      data.push({ id: newId, value: Math.random() * 100 });
      update(data);
    },
    removeItem: () => {
      if (data.length > 0) {
        data.pop();
        update(data);
      }
    },
    shuffleData: () => {
      data.forEach(d => d.value = Math.random() * 100);
      update(data);
    },
  };
}

// Task 5: Method chaining and fluent API
export function task5MethodChaining(container) {
  const data = [
    { name: 'TP53', mutations: 42 },
    { name: 'EGFR', mutations: 28 },
    { name: 'KRAS', mutations: 35 },
    { name: 'BRAF', mutations: 18 },
    { name: 'PIK3CA', mutations: 24 },
  ];

  const margin = { top: 20, right: 20, bottom: 40, left: 60 };
  const width = 500 - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Create scales
  const x = d3.scaleBand()
    .domain(data.map(d => d.name))
    .range([0, width])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.mutations)])
    .nice()
    .range([height, 0]);

  // Add axes using method chaining
  svg.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`)
    .call(d3.axisBottom(x))
    .selectAll('text')
    .attr('font-size', '12px');

  svg.append('g')
    .attr('class', 'y-axis')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -40)
    .attr('x', -height / 2)
    .attr('fill', '#333')
    .attr('text-anchor', 'middle')
    .text('Mutation Count');

  // Add bars with method chaining
  svg.selectAll('.bar')
    .data(data)
    .join('rect')
    .attr('class', 'bar')
    .attr('x', d => x(d.name))
    .attr('y', height)
    .attr('width', x.bandwidth())
    .attr('height', 0)
    .attr('fill', '#3498db')
    .attr('rx', 4)
    .transition()
    .duration(800)
    .delay((d, i) => i * 100)
    .attr('y', d => y(d.mutations))
    .attr('height', d => height - y(d.mutations));

  // Add labels
  svg.selectAll('.label')
    .data(data)
    .join('text')
    .attr('class', 'label')
    .attr('x', d => x(d.name) + x.bandwidth() / 2)
    .attr('y', d => y(d.mutations) - 5)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('fill', '#333')
    .attr('opacity', 0)
    .text(d => d.mutations)
    .transition()
    .delay(800)
    .duration(300)
    .attr('opacity', 1);

  return svg.node();
}

export default {
  task1SelectAndModify,
  task2CreateElements,
  task3DataBinding,
  task4EnterUpdateExit,
  task5MethodChaining,
};
