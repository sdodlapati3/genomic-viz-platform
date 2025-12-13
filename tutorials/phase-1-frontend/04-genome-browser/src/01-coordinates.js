/**
 * Genomic Coordinate Systems - Region parsing and scale creation
 */
import * as d3 from 'd3';

/**
 * Parse a genomic region string into components
 * @param {string} regionStr - Region string like "chr17:7668402-7687550"
 * @returns {Object} Parsed region object
 */
export function parseRegion(regionStr) {
  const match = regionStr.match(/^(chr\w+):(\d+)-(\d+)$/i);
  if (!match) {
    throw new Error(`Invalid region format: "${regionStr}". Expected format: chr1:12345-67890`);
  }
  
  const chromosome = match[1];
  const start = parseInt(match[2], 10);
  const end = parseInt(match[3], 10);
  
  if (start >= end) {
    throw new Error('Start position must be less than end position');
  }
  
  return {
    chromosome,
    start,
    end,
    length: end - start,
    toString() {
      return `${this.chromosome}:${this.start.toLocaleString()}-${this.end.toLocaleString()}`;
    }
  };
}

/**
 * Format genomic position with appropriate units
 * @param {number} pos - Position in base pairs
 * @returns {string} Formatted position
 */
export function formatPosition(pos) {
  if (pos >= 1e9) return `${(pos / 1e9).toFixed(2)}Gb`;
  if (pos >= 1e6) return `${(pos / 1e6).toFixed(2)}Mb`;
  if (pos >= 1e3) return `${(pos / 1e3).toFixed(2)}kb`;
  return `${pos}bp`;
}

/**
 * Create a coordinate scale for genomic positions
 * @param {Object} region - Region object with start/end
 * @param {number} width - Pixel width
 * @returns {d3.ScaleLinear} D3 linear scale
 */
export function createCoordinateScale(region, width) {
  return d3.scaleLinear()
    .domain([region.start, region.end])
    .range([0, width]);
}

/**
 * Initialize the coordinates demo section
 */
export function initCoordinates() {
  // Demo 1: Region Parser
  const parseButton = document.getElementById('parse-region');
  const regionInput = document.getElementById('region-input');
  const resultDiv = document.getElementById('parsed-result');
  
  function parseAndDisplay() {
    try {
      const region = parseRegion(regionInput.value);
      resultDiv.innerHTML = `
        <strong>Parsed Region:</strong><br>
        Chromosome: ${region.chromosome}<br>
        Start: ${region.start.toLocaleString()} bp<br>
        End: ${region.end.toLocaleString()} bp<br>
        Length: ${formatPosition(region.length)}<br>
        <br>
        <strong>Display:</strong> ${region.toString()}
      `;
      resultDiv.style.borderColor = '#27ae60';
      renderRuler(region);
    } catch (err) {
      resultDiv.innerHTML = `<span style="color: #e74c3c;">Error: ${err.message}</span>`;
      resultDiv.style.borderColor = '#e74c3c';
    }
  }
  
  parseButton?.addEventListener('click', parseAndDisplay);
  regionInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') parseAndDisplay();
  });
  
  // Initial parse
  parseAndDisplay();
  
  // Demo 2: Coordinate Scale
  initScaleDemo();
  
  // Code snippets
  document.getElementById('coordinates-code').textContent = `// Parse genomic region string
function parseRegion(regionStr) {
  // Match format: chr17:7668402-7687550
  const match = regionStr.match(/^(chr\\w+):(\\d+)-(\\d+)$/i);
  if (!match) throw new Error('Invalid format');
  
  return {
    chromosome: match[1],
    start: parseInt(match[2]),
    end: parseInt(match[3]),
    length: end - start
  };
}

// Format position with units
function formatPosition(pos) {
  if (pos >= 1e6) return \`\${(pos / 1e6).toFixed(2)}Mb\`;
  if (pos >= 1e3) return \`\${(pos / 1e3).toFixed(2)}kb\`;
  return \`\${pos}bp\`;
}

// Usage
const region = parseRegion("chr17:7668402-7687550");
// → { chromosome: "chr17", start: 7668402, end: 7687550 }`;

  document.getElementById('scale-code').textContent = `// Create coordinate scale (genomic → pixel)
const xScale = d3.scaleLinear()
  .domain([region.start, region.end])  // Genomic coords
  .range([0, width]);                   // Pixel coords

// Convert genomic position to pixel
const pixelX = xScale(7670000);  // → 127.5

// Convert pixel back to genomic (on click)
canvas.on('click', (event) => {
  const mouseX = event.offsetX;
  const genomicPos = xScale.invert(mouseX);
  console.log(\`Clicked at \${genomicPos.toFixed(0)} bp\`);
});

// Create axis with formatted ticks
const axis = d3.axisTop(xScale)
  .ticks(10)
  .tickFormat(d => formatPosition(d));`;
}

/**
 * Render coordinate ruler
 */
function renderRuler(region) {
  const container = d3.select('#coordinate-ruler');
  container.selectAll('*').remove();
  
  const width = 500;
  const height = 60;
  const margin = { left: 10, right: 10 };
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  
  const xScale = d3.scaleLinear()
    .domain([region.start, region.end])
    .range([margin.left, width - margin.right]);
  
  // Axis
  const axis = d3.axisBottom(xScale)
    .ticks(6)
    .tickFormat(d => formatPosition(d));
  
  svg.append('g')
    .attr('transform', `translate(0, 25)`)
    .call(axis);
  
  // Region label
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 55)
    .attr('text-anchor', 'middle')
    .attr('font-size', 11)
    .attr('fill', '#666')
    .text(region.toString());
}

/**
 * Initialize coordinate scale demo
 */
function initScaleDemo() {
  const container = d3.select('#scale-demo');
  const infoDiv = document.getElementById('scale-info');
  
  const width = 500;
  const height = 100;
  const margin = { left: 40, right: 40, top: 30, bottom: 30 };
  
  const region = { start: 7668402, end: 7687550 };
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('cursor', 'crosshair');
  
  const xScale = d3.scaleLinear()
    .domain([region.start, region.end])
    .range([margin.left, width - margin.right]);
  
  // Background
  svg.append('rect')
    .attr('x', margin.left)
    .attr('y', margin.top)
    .attr('width', width - margin.left - margin.right)
    .attr('height', height - margin.top - margin.bottom)
    .attr('fill', '#f8f9fa')
    .attr('stroke', '#ddd');
  
  // Axis
  const axis = d3.axisBottom(xScale)
    .ticks(6)
    .tickFormat(d => formatPosition(d));
  
  svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(axis);
  
  // Vertical line indicator
  const indicator = svg.append('line')
    .attr('y1', margin.top)
    .attr('y2', height - margin.bottom)
    .attr('stroke', '#e74c3c')
    .attr('stroke-width', 2)
    .attr('stroke-dasharray', '4,4')
    .style('opacity', 0);
  
  // Mouse interaction
  svg.on('mousemove', (event) => {
    const [mouseX] = d3.pointer(event);
    
    if (mouseX >= margin.left && mouseX <= width - margin.right) {
      const genomicPos = xScale.invert(mouseX);
      
      indicator
        .attr('x1', mouseX)
        .attr('x2', mouseX)
        .style('opacity', 1);
      
      infoDiv.innerHTML = `
        <strong>Pixel X:</strong> ${mouseX.toFixed(0)}px<br>
        <strong>Genomic Position:</strong> ${Math.round(genomicPos).toLocaleString()} bp<br>
        <strong>Formatted:</strong> chr17:${formatPosition(Math.round(genomicPos))}
      `;
    }
  });
  
  svg.on('mouseleave', () => {
    indicator.style('opacity', 0);
    infoDiv.innerHTML = '<em>Hover over the ruler to see coordinate conversion</em>';
  });
  
  infoDiv.innerHTML = '<em>Hover over the ruler to see coordinate conversion</em>';
}
