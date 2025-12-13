/**
 * D3 Transitions - Smooth animations
 */
import * as d3 from 'd3';

export function initTransitions() {
  // Demo 1: Basic Transitions
  const container = d3.select('#transitions-demo');
  const svg = container.append('svg')
    .attr('width', 450)
    .attr('height', 150);
  
  // Create shapes
  const shapes = [
    { type: 'circle', x: 60, y: 75 },
    { type: 'rect', x: 150, y: 50 },
    { type: 'circle', x: 280, y: 75 },
    { type: 'rect', x: 370, y: 50 }
  ];
  
  shapes.forEach((s, i) => {
    if (s.type === 'circle') {
      svg.append('circle')
        .attr('class', `shape-${i}`)
        .attr('cx', s.x)
        .attr('cy', s.y)
        .attr('r', 30)
        .attr('fill', '#ecf0f1')
        .attr('stroke', '#bdc3c7')
        .attr('stroke-width', 2);
    } else {
      svg.append('rect')
        .attr('class', `shape-${i}`)
        .attr('x', s.x)
        .attr('y', s.y)
        .attr('width', 50)
        .attr('height', 50)
        .attr('fill', '#ecf0f1')
        .attr('stroke', '#bdc3c7')
        .attr('stroke-width', 2);
    }
  });
  
  let animated = false;
  
  document.getElementById('run-transition')?.addEventListener('click', () => {
    animated = !animated;
    
    svg.select('.shape-0')
      .transition()
      .duration(800)
      .ease(d3.easeElastic)
      .attr('r', animated ? 45 : 30)
      .attr('fill', animated ? '#3498db' : '#ecf0f1');
    
    svg.select('.shape-1')
      .transition()
      .duration(800)
      .ease(d3.easeBounce)
      .attr('y', animated ? 20 : 50)
      .attr('fill', animated ? '#e74c3c' : '#ecf0f1');
    
    svg.select('.shape-2')
      .transition()
      .duration(800)
      .ease(d3.easeBack)
      .attr('cx', animated ? 320 : 280)
      .attr('fill', animated ? '#2ecc71' : '#ecf0f1');
    
    svg.select('.shape-3')
      .transition()
      .duration(800)
      .ease(d3.easeCubicInOut)
      .attr('transform', animated ? 'rotate(45, 395, 75)' : 'rotate(0, 395, 75)')
      .attr('fill', animated ? '#9b59b6' : '#ecf0f1');
  });
  
  // Demo 2: Staggered Transitions
  const staggeredContainer = d3.select('#staggered-demo');
  const staggeredSvg = staggeredContainer.append('svg')
    .attr('width', 450)
    .attr('height', 200);
  
  const barData = [65, 45, 80, 35, 90, 55, 70, 40, 85, 50];
  const barWidth = 35;
  const barGap = 10;
  const maxHeight = 180;
  
  const bars = staggeredSvg.selectAll('rect')
    .data(barData)
    .join('rect')
    .attr('x', (d, i) => 10 + i * (barWidth + barGap))
    .attr('y', maxHeight)
    .attr('width', barWidth)
    .attr('height', 0)
    .attr('fill', '#3498db')
    .attr('rx', 3);
  
  let staggerAnimated = false;
  
  document.getElementById('run-staggered')?.addEventListener('click', () => {
    staggerAnimated = !staggerAnimated;
    
    bars.transition()
      .duration(600)
      .delay((d, i) => i * 80)  // Stagger by index
      .ease(d3.easeCubicOut)
      .attr('y', d => staggerAnimated ? maxHeight - (d / 100 * maxHeight) : maxHeight)
      .attr('height', d => staggerAnimated ? (d / 100 * maxHeight) : 0)
      .attr('fill', (d, i) => staggerAnimated 
        ? d3.interpolateViridis(i / barData.length) 
        : '#3498db');
  });
  
  // Code snippets
  document.getElementById('transitions-code').textContent = `// Basic transition
d3.select('circle')
  .transition()              // Start transition
  .duration(800)             // 800ms
  .ease(d3.easeElastic)      // Easing function
  .attr('r', 45)             // End state
  .attr('fill', '#3498db');

// Easing functions:
// d3.easeLinear     - constant speed
// d3.easeElastic    - springy overshoot
// d3.easeBounce     - bouncing effect
// d3.easeBack       - slight overshoot
// d3.easeCubicInOut - smooth acceleration

// Chained transitions
d3.select('rect')
  .transition()
  .duration(500)
  .attr('width', 100)
  .transition()          // Starts after first completes
  .duration(500)
  .attr('height', 100);`;

  document.getElementById('staggered-code').textContent = `// Staggered transitions
svg.selectAll('rect')
  .data(data)
  .transition()
  .duration(600)
  .delay((d, i) => i * 80)    // Each bar delayed by index
  .ease(d3.easeCubicOut)
  .attr('y', d => height - scale(d))
  .attr('height', d => scale(d));

// Transition callbacks
d3.select('circle')
  .transition()
  .on('start', () => console.log('Started'))
  .on('end', () => console.log('Completed'))
  .attr('r', 50);

// Interrupt ongoing transition
d3.select('circle')
  .interrupt()     // Stop current transition
  .transition()    // Start new one
  .attr('r', 30);`;
}
