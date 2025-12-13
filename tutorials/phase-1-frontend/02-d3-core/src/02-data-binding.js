/**
 * D3 Data Binding - Enter/Update/Exit pattern
 */
import * as d3 from 'd3';

export function initDataBinding() {
  // Demo 1: Enter/Update/Exit
  let data = [30, 50, 80, 40, 60];
  
  const container = d3.select('#data-binding-demo');
  const svg = container.append('svg')
    .attr('width', 450)
    .attr('height', 200);
  
  const margin = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 450 - margin.left - margin.right;
  const height = 200 - margin.top - margin.bottom;
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);
  
  // Scales
  const x = d3.scaleBand().range([0, width]).padding(0.2);
  const y = d3.scaleLinear().range([height, 0]);
  
  // Axes groups
  const xAxisG = g.append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${height})`);
  const yAxisG = g.append('g')
    .attr('class', 'y-axis');
  
  function updateChart(newData) {
    data = newData;
    document.getElementById('current-data').textContent = JSON.stringify(data);
    
    // Update scales
    x.domain(data.map((_, i) => i));
    y.domain([0, d3.max(data) * 1.1]);
    
    // Update axes
    xAxisG.call(d3.axisBottom(x).tickFormat(i => `Item ${i + 1}`));
    yAxisG.call(d3.axisLeft(y));
    
    // Data join with key function
    const bars = g.selectAll('.bar')
      .data(data, (d, i) => i);
    
    // EXIT - remove old elements
    bars.exit()
      .classed('exit', true)
      .transition()
      .duration(300)
      .attr('y', height)
      .attr('height', 0)
      .remove();
    
    // ENTER - create new elements
    const barsEnter = bars.enter()
      .append('rect')
      .attr('class', 'bar enter')
      .attr('x', (d, i) => x(i))
      .attr('width', x.bandwidth())
      .attr('y', height)
      .attr('height', 0);
    
    // UPDATE + ENTER - update all elements
    barsEnter.merge(bars)
      .transition()
      .duration(500)
      .attr('class', 'bar')
      .attr('x', (d, i) => x(i))
      .attr('width', x.bandwidth())
      .attr('y', d => y(d))
      .attr('height', d => height - y(d));
  }
  
  // Initial render
  updateChart(data);
  
  // Button handlers
  document.getElementById('add-data')?.addEventListener('click', () => {
    const newVal = Math.floor(Math.random() * 80) + 20;
    updateChart([...data, newVal]);
  });
  
  document.getElementById('remove-data')?.addEventListener('click', () => {
    if (data.length > 1) {
      updateChart(data.slice(0, -1));
    }
  });
  
  document.getElementById('update-data')?.addEventListener('click', () => {
    updateChart(data.map(() => Math.floor(Math.random() * 80) + 20));
  });
  
  document.getElementById('reset-data')?.addEventListener('click', () => {
    updateChart([30, 50, 80, 40, 60]);
  });
  
  // Demo 2: join() - Modern approach
  const joinContainer = d3.select('#join-demo');
  const joinSvg = joinContainer.append('svg')
    .attr('width', 450)
    .attr('height', 150);
  
  let joinData = [1, 2, 3, 4, 5, 6, 7, 8];
  
  function updateJoinDemo() {
    const circles = joinSvg.selectAll('circle')
      .data(joinData, d => d);
    
    circles.join(
      // ENTER
      enter => enter.append('circle')
        .attr('cx', (d, i) => 30 + i * 50)
        .attr('cy', 75)
        .attr('r', 0)
        .attr('fill', '#2ecc71')
        .call(enter => enter.transition().duration(500)
          .attr('r', d => 10 + d * 2)),
      
      // UPDATE
      update => update
        .attr('fill', '#3498db')
        .call(update => update.transition().duration(500)
          .attr('cx', (d, i) => 30 + i * 50)
          .attr('r', d => 10 + d * 2)),
      
      // EXIT
      exit => exit
        .attr('fill', '#e74c3c')
        .call(exit => exit.transition().duration(300)
          .attr('r', 0)
          .remove())
    );
  }
  
  updateJoinDemo();
  
  document.getElementById('randomize-join')?.addEventListener('click', () => {
    // Random subset with random values
    const count = Math.floor(Math.random() * 6) + 3;
    joinData = Array.from({ length: count }, () => Math.floor(Math.random() * 10) + 1);
    updateJoinDemo();
  });
  
  // Code snippets
  document.getElementById('data-binding-code').textContent = `// Classic Enter/Update/Exit pattern
const bars = svg.selectAll('.bar')
  .data(data, (d, i) => i);  // Key function

// EXIT - remove elements no longer in data
bars.exit()
  .transition()
  .duration(300)
  .attr('height', 0)
  .remove();

// ENTER - create elements for new data
const barsEnter = bars.enter()
  .append('rect')
  .attr('class', 'bar')
  .attr('y', height)
  .attr('height', 0);

// UPDATE + ENTER - update all
barsEnter.merge(bars)
  .transition()
  .duration(500)
  .attr('y', d => y(d))
  .attr('height', d => height - y(d));`;

  document.getElementById('join-code').textContent = `// Modern join() method (D3 v5+)
svg.selectAll('circle')
  .data(data, d => d)  // Key function
  .join(
    // ENTER - new elements
    enter => enter.append('circle')
      .attr('r', 0)
      .attr('fill', '#2ecc71')
      .call(el => el.transition()
        .attr('r', d => d * 2)),
    
    // UPDATE - existing elements
    update => update
      .attr('fill', '#3498db')
      .call(el => el.transition()
        .attr('r', d => d * 2)),
    
    // EXIT - removed elements
    exit => exit
      .attr('fill', '#e74c3c')
      .call(el => el.transition()
        .attr('r', 0)
        .remove())
  );`;
}
