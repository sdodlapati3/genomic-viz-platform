/**
 * Exercise 1 Solution: SVG Basics
 * 
 * Create an SVG element with basic shapes
 */

// Task: Create an SVG canvas with a rectangle, circle, and line

export function createBasicSVG() {
  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '400');
  svg.setAttribute('height', '300');
  svg.setAttribute('viewBox', '0 0 400 300');
  svg.style.border = '1px solid #ccc';

  // Create rectangle
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '50');
  rect.setAttribute('y', '50');
  rect.setAttribute('width', '100');
  rect.setAttribute('height', '60');
  rect.setAttribute('fill', '#3498db');
  rect.setAttribute('stroke', '#2980b9');
  rect.setAttribute('stroke-width', '2');
  svg.appendChild(rect);

  // Create circle
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  circle.setAttribute('cx', '250');
  circle.setAttribute('cy', '80');
  circle.setAttribute('r', '40');
  circle.setAttribute('fill', '#e74c3c');
  circle.setAttribute('stroke', '#c0392b');
  circle.setAttribute('stroke-width', '2');
  svg.appendChild(circle);

  // Create line
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '50');
  line.setAttribute('y1', '200');
  line.setAttribute('x2', '350');
  line.setAttribute('y2', '200');
  line.setAttribute('stroke', '#2ecc71');
  line.setAttribute('stroke-width', '3');
  line.setAttribute('stroke-linecap', 'round');
  svg.appendChild(line);

  return svg;
}

// Task: Create a simple bar chart with SVG rectangles
export function createBarChart(data) {
  const width = 400;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 40, left: 40 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', width);
  svg.setAttribute('height', height);

  // Create group for chart area
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);

  // Calculate scales
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = chartWidth / data.length - 10;

  // Create bars
  data.forEach((d, i) => {
    const barHeight = (d.value / maxValue) * chartHeight;
    const x = i * (barWidth + 10);
    const y = chartHeight - barHeight;

    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', x);
    rect.setAttribute('y', y);
    rect.setAttribute('width', barWidth);
    rect.setAttribute('height', barHeight);
    rect.setAttribute('fill', '#3498db');
    rect.setAttribute('class', 'bar');

    // Add label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x + barWidth / 2);
    label.setAttribute('y', chartHeight + 20);
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('font-size', '12');
    label.textContent = d.label;

    g.appendChild(rect);
    g.appendChild(label);
  });

  svg.appendChild(g);
  return svg;
}

// Example usage:
const sampleData = [
  { label: 'A', value: 30 },
  { label: 'B', value: 80 },
  { label: 'C', value: 45 },
  { label: 'D', value: 60 },
  { label: 'E', value: 20 },
];

// document.body.appendChild(createBasicSVG());
// document.body.appendChild(createBarChart(sampleData));
