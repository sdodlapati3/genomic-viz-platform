/**
 * Gene Track Rendering - Visualize gene structures
 */
import * as d3 from 'd3';
import { formatPosition } from './01-coordinates.js';

// Sample gene data - TP53
const tp53Gene = {
  name: 'TP53',
  chromosome: 'chr17',
  start: 7668402,
  end: 7687550,
  strand: '-',
  exons: [
    { start: 7687377, end: 7687550, type: 'utr' },       // 5' UTR (exon 1)
    { start: 7676594, end: 7676622, type: 'coding' },   // Exon 2
    { start: 7676381, end: 7676403, type: 'coding' },   // Exon 3
    { start: 7675994, end: 7676272, type: 'coding' },   // Exon 4
    { start: 7675053, end: 7675236, type: 'coding' },   // Exon 5
    { start: 7674858, end: 7674971, type: 'coding' },   // Exon 6
    { start: 7674180, end: 7674290, type: 'coding' },   // Exon 7
    { start: 7673701, end: 7673837, type: 'coding' },   // Exon 8
    { start: 7673535, end: 7673608, type: 'coding' },   // Exon 9
    { start: 7670609, end: 7670715, type: 'coding' },   // Exon 10
    { start: 7668402, end: 7669690, type: 'utr' }       // 3' UTR (exon 11)
  ]
};

// Multiple genes for demo
const multiGeneData = [
  {
    name: 'GENE_A',
    start: 1000,
    end: 5000,
    strand: '+',
    exons: [
      { start: 1000, end: 1200, type: 'utr' },
      { start: 1800, end: 2200, type: 'coding' },
      { start: 3000, end: 3500, type: 'coding' },
      { start: 4200, end: 4500, type: 'coding' },
      { start: 4800, end: 5000, type: 'utr' }
    ]
  },
  {
    name: 'GENE_B',
    start: 6000,
    end: 9000,
    strand: '-',
    exons: [
      { start: 6000, end: 6300, type: 'utr' },
      { start: 6800, end: 7200, type: 'coding' },
      { start: 7800, end: 8300, type: 'coding' },
      { start: 8700, end: 9000, type: 'utr' }
    ]
  },
  {
    name: 'GENE_C',
    start: 2500,
    end: 4500,
    strand: '+',
    row: 1, // Different row to handle overlap
    exons: [
      { start: 2500, end: 2700, type: 'utr' },
      { start: 3200, end: 3600, type: 'coding' },
      { start: 4100, end: 4500, type: 'utr' }
    ]
  }
];

/**
 * Render a single gene track
 */
function renderGene(g, gene, xScale, y, exonHeight = 20, tooltip) {
  const intronY = y + exonHeight / 2;
  
  // Draw intron line (gene backbone)
  g.append('line')
    .attr('class', 'intron')
    .attr('x1', xScale(gene.start))
    .attr('x2', xScale(gene.end))
    .attr('y1', intronY)
    .attr('y2', intronY);
  
  // Draw exons
  gene.exons.forEach((exon, i) => {
    const x = xScale(exon.start);
    const width = xScale(exon.end) - xScale(exon.start);
    const height = exon.type === 'coding' ? exonHeight : exonHeight * 0.6;
    const yPos = y + (exonHeight - height) / 2;
    
    g.append('rect')
      .attr('class', `exon ${exon.type}`)
      .attr('x', x)
      .attr('y', yPos)
      .attr('width', Math.max(1, width))
      .attr('height', height)
      .attr('rx', 2)
      .on('mouseenter', function(event) {
        if (tooltip) {
          tooltip.innerHTML = `
            <strong>Exon ${i + 1}</strong><br>
            Type: ${exon.type === 'coding' ? 'Coding (CDS)' : 'UTR'}<br>
            Position: ${exon.start.toLocaleString()}-${exon.end.toLocaleString()}<br>
            Length: ${(exon.end - exon.start).toLocaleString()} bp
          `;
          tooltip.style.left = event.pageX + 10 + 'px';
          tooltip.style.top = event.pageY - 10 + 'px';
          tooltip.classList.add('visible');
        }
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseleave', function() {
        if (tooltip) tooltip.classList.remove('visible');
        d3.select(this).attr('opacity', 1);
      });
  });
  
  // Draw direction arrow
  const arrowSize = 8;
  const arrowX = gene.strand === '+' ? xScale(gene.end) + 5 : xScale(gene.start) - 5;
  const arrowPath = gene.strand === '+' 
    ? `M${arrowX},${intronY} L${arrowX + arrowSize},${intronY} L${arrowX + arrowSize/2},${intronY - arrowSize/2} M${arrowX + arrowSize},${intronY} L${arrowX + arrowSize/2},${intronY + arrowSize/2}`
    : `M${arrowX},${intronY} L${arrowX - arrowSize},${intronY} L${arrowX - arrowSize/2},${intronY - arrowSize/2} M${arrowX - arrowSize},${intronY} L${arrowX - arrowSize/2},${intronY + arrowSize/2}`;
  
  g.append('path')
    .attr('class', 'gene-arrow')
    .attr('d', arrowPath)
    .attr('stroke', '#666')
    .attr('stroke-width', 2)
    .attr('fill', 'none');
  
  // Gene name label
  const labelX = gene.strand === '+' ? xScale(gene.start) - 5 : xScale(gene.end) + 5;
  g.append('text')
    .attr('class', 'gene-name')
    .attr('x', labelX)
    .attr('y', intronY + 4)
    .attr('text-anchor', gene.strand === '+' ? 'end' : 'start')
    .text(gene.name);
}

/**
 * Initialize gene track demos
 */
export function initGeneTracks() {
  // Demo 1: Single gene structure
  const container = d3.select('#gene-track-demo');
  
  const width = 800;
  const height = 150;
  const margin = { left: 80, right: 40, top: 30, bottom: 30 };
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  
  const xScale = d3.scaleLinear()
    .domain([tp53Gene.start, tp53Gene.end])
    .range([margin.left, width - margin.right]);
  
  // Ruler
  const axis = d3.axisTop(xScale)
    .ticks(8)
    .tickFormat(d => formatPosition(d));
  
  svg.append('g')
    .attr('class', 'ruler')
    .attr('transform', `translate(0, ${margin.top})`)
    .call(axis);
  
  // Track label
  svg.append('text')
    .attr('class', 'track-label')
    .attr('x', 10)
    .attr('y', 85)
    .text('Genes');
  
  // Gene track
  const trackG = svg.append('g')
    .attr('transform', `translate(0, ${margin.top + 30})`);
  
  renderGene(trackG, tp53Gene, xScale, 20, 24);
  
  // Demo 2: Multiple genes with overlap handling
  initMultiGeneDemo();
  
  // Code snippets
  document.getElementById('gene-track-code').textContent = `// Gene data structure
const gene = {
  name: 'TP53',
  chromosome: 'chr17',
  start: 7668402,
  end: 7687550,
  strand: '-',
  exons: [
    { start: 7687377, end: 7687550, type: 'utr' },
    { start: 7676594, end: 7676622, type: 'coding' },
    // ... more exons
  ]
};

// Render gene track
function renderGene(g, gene, xScale, y) {
  const intronY = y + exonHeight / 2;
  
  // Intron line (gene backbone)
  g.append('line')
    .attr('x1', xScale(gene.start))
    .attr('x2', xScale(gene.end))
    .attr('y1', intronY)
    .attr('y2', intronY)
    .attr('stroke', '#999');
  
  // Exons as rectangles
  gene.exons.forEach(exon => {
    const height = exon.type === 'coding' 
      ? exonHeight 
      : exonHeight * 0.6;  // UTRs are thinner
    
    g.append('rect')
      .attr('x', xScale(exon.start))
      .attr('width', xScale(exon.end) - xScale(exon.start))
      .attr('y', y + (exonHeight - height) / 2)
      .attr('height', height)
      .attr('fill', exon.type === 'coding' 
        ? '#4169E1'   // Royal blue for CDS
        : '#87CEEB'); // Sky blue for UTR
  });
  
  // Direction arrow
  const arrowPath = gene.strand === '+' 
    ? \`M\${xScale(gene.end)}...\`  // Right arrow
    : \`M\${xScale(gene.start)}...\`; // Left arrow
}`;

  document.getElementById('multi-gene-code').textContent = `// Handle overlapping genes
function layoutGenes(genes) {
  const rows = [];
  
  genes.forEach(gene => {
    // Find first row where gene fits
    let placed = false;
    for (let i = 0; i < rows.length; i++) {
      const lastGene = rows[i][rows[i].length - 1];
      if (gene.start > lastGene.end + padding) {
        rows[i].push(gene);
        gene.row = i;
        placed = true;
        break;
      }
    }
    if (!placed) {
      gene.row = rows.length;
      rows.push([gene]);
    }
  });
  
  return genes;
}

// Render with row offset
genes.forEach(gene => {
  const y = baseY + gene.row * rowHeight;
  renderGene(g, gene, xScale, y);
});`;
}

/**
 * Initialize multi-gene demo
 */
function initMultiGeneDemo() {
  const container = d3.select('#multi-gene-demo');
  
  const width = 500;
  const height = 200;
  const margin = { left: 60, right: 30, top: 30, bottom: 20 };
  
  const svg = container.append('svg')
    .attr('width', width)
    .attr('height', height);
  
  const xScale = d3.scaleLinear()
    .domain([0, 10000])
    .range([margin.left, width - margin.right]);
  
  // Ruler
  const axis = d3.axisTop(xScale)
    .ticks(5)
    .tickFormat(d => `${d/1000}kb`);
  
  svg.append('g')
    .attr('transform', `translate(0, ${margin.top})`)
    .call(axis);
  
  // Track label
  svg.append('text')
    .attr('class', 'track-label')
    .attr('x', 10)
    .attr('y', 75)
    .text('Genes');
  
  // Render genes with row handling
  const trackG = svg.append('g');
  const rowHeight = 45;
  
  multiGeneData.forEach(gene => {
    const row = gene.row || 0;
    const y = margin.top + 20 + row * rowHeight;
    renderGene(trackG, gene, xScale, y, 16);
  });
}

export { tp53Gene, renderGene };
