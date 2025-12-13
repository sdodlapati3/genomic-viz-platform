/**
 * Complete Genome Browser - Full-featured mini browser
 */
import * as d3 from 'd3';
import { parseRegion, formatPosition } from './01-coordinates.js';

// Gene data for multiple regions
const geneData = {
  'chr17:7668402-7687550': {
    name: 'TP53',
    chromosome: 'chr17',
    start: 7668402,
    end: 7687550,
    strand: '-',
    exons: [
      { start: 7687377, end: 7687550, type: 'utr' },
      { start: 7676594, end: 7676622, type: 'coding' },
      { start: 7676381, end: 7676403, type: 'coding' },
      { start: 7675994, end: 7676272, type: 'coding' },
      { start: 7675053, end: 7675236, type: 'coding' },
      { start: 7674858, end: 7674971, type: 'coding' },
      { start: 7674180, end: 7674290, type: 'coding' },
      { start: 7673701, end: 7673837, type: 'coding' },
      { start: 7673535, end: 7673608, type: 'coding' },
      { start: 7670609, end: 7670715, type: 'coding' },
      { start: 7668402, end: 7669690, type: 'utr' }
    ],
    variants: [
      { pos: 7673700, type: 'missense', aa: 'R175H', count: 892 },
      { pos: 7673781, type: 'missense', aa: 'G245S', count: 234 },
      { pos: 7673802, type: 'missense', aa: 'R248Q', count: 567 },
      { pos: 7674230, type: 'missense', aa: 'R273H', count: 445 },
      { pos: 7674252, type: 'missense', aa: 'R282W', count: 312 },
      { pos: 7674872, type: 'nonsense', aa: 'E294*', count: 89 }
    ]
  },
  'chr12:25205246-25250936': {
    name: 'KRAS',
    chromosome: 'chr12',
    start: 25205246,
    end: 25250936,
    strand: '-',
    exons: [
      { start: 25250800, end: 25250936, type: 'utr' },
      { start: 25245350, end: 25245395, type: 'coding' },
      { start: 25227234, end: 25227412, type: 'coding' },
      { start: 25225614, end: 25225773, type: 'coding' },
      { start: 25209798, end: 25209911, type: 'coding' },
      { start: 25205246, end: 25205500, type: 'utr' }
    ],
    variants: [
      { pos: 25245350, type: 'missense', aa: 'G12D', count: 1245 },
      { pos: 25245351, type: 'missense', aa: 'G12V', count: 987 },
      { pos: 25245352, type: 'missense', aa: 'G12C', count: 756 },
      { pos: 25245380, type: 'missense', aa: 'G13D', count: 432 },
      { pos: 25227300, type: 'missense', aa: 'Q61H', count: 234 }
    ]
  },
  'chr7:55019017-55211628': {
    name: 'EGFR',
    chromosome: 'chr7',
    start: 55019017,
    end: 55211628,
    strand: '+',
    exons: [
      { start: 55019017, end: 55019365, type: 'utr' },
      { start: 55142286, end: 55142437, type: 'coding' },
      { start: 55143305, end: 55143488, type: 'coding' },
      { start: 55146606, end: 55146760, type: 'coding' },
      { start: 55151294, end: 55151362, type: 'coding' },
      { start: 55152546, end: 55152664, type: 'coding' },
      { start: 55154010, end: 55154152, type: 'coding' },
      { start: 55155827, end: 55155946, type: 'coding' },
      { start: 55156533, end: 55156658, type: 'coding' },
      { start: 55157645, end: 55157753, type: 'coding' },
      { start: 55160139, end: 55160338, type: 'coding' },
      { start: 55165280, end: 55165437, type: 'coding' },
      { start: 55191717, end: 55191901, type: 'coding' },
      { start: 55198717, end: 55198863, type: 'coding' },
      { start: 55200316, end: 55200481, type: 'coding' },
      { start: 55209979, end: 55210130, type: 'coding' },
      { start: 55210998, end: 55211628, type: 'utr' }
    ],
    variants: [
      { pos: 55154010, type: 'missense', aa: 'L858R', count: 876 },
      { pos: 55155827, type: 'missense', aa: 'T790M', count: 654 },
      { pos: 55156533, type: 'frameshift', aa: 'del', count: 543 },
      { pos: 55191717, type: 'missense', aa: 'G719A', count: 234 }
    ]
  }
};

const variantColors = {
  missense: '#e74c3c',
  nonsense: '#2c3e50',
  frameshift: '#9b59b6',
  silent: '#95a5a6'
};

// Browser state
let browserState = {
  region: parseRegion('chr17:7668402-7687550'),
  originalRegion: parseRegion('chr17:7668402-7687550'),
  geneKey: 'chr17:7668402-7687550'
};

let browserSvg, xScale;
const width = 900;
const height = 350;
const margin = { left: 80, right: 40, top: 20, bottom: 20 };

/**
 * Initialize the complete browser
 */
export function initCompleteBrowser() {
  const container = d3.select('#genome-browser');
  
  browserSvg = container.append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'browser-svg');
  
  // Initial render
  renderBrowser();
  
  // Setup controls
  setupBrowserControls();
  
  // Setup interactions
  setupBrowserInteractions();
}

/**
 * Render the complete browser
 */
function renderBrowser() {
  browserSvg.selectAll('*').remove();
  
  const gene = geneData[browserState.geneKey];
  if (!gene) return;
  
  // Update scale
  xScale = d3.scaleLinear()
    .domain([browserState.region.start, browserState.region.end])
    .range([margin.left, width - margin.right]);
  
  // Background
  browserSvg.append('rect')
    .attr('width', width)
    .attr('height', height)
    .attr('fill', '#fafbfc');
  
  // Track positions
  const rulerY = margin.top + 20;
  const geneTrackY = rulerY + 50;
  const variantTrackY = geneTrackY + 80;
  
  // Render ruler
  renderRuler(rulerY);
  
  // Render gene track
  renderGeneTrack(gene, geneTrackY);
  
  // Render variant track
  renderVariants(gene.variants, variantTrackY);
  
  // Track labels
  browserSvg.append('text')
    .attr('class', 'track-label')
    .attr('x', 10)
    .attr('y', geneTrackY + 20)
    .text('Gene');
  
  browserSvg.append('text')
    .attr('class', 'track-label')
    .attr('x', 10)
    .attr('y', variantTrackY + 40)
    .text('Variants');
}

/**
 * Render coordinate ruler
 */
function renderRuler(y) {
  const axis = d3.axisTop(xScale)
    .ticks(10)
    .tickFormat(d => formatPosition(d));
  
  browserSvg.append('g')
    .attr('class', 'ruler')
    .attr('transform', `translate(0, ${y})`)
    .call(axis);
  
  // Region label
  browserSvg.append('text')
    .attr('x', width / 2)
    .attr('y', y - 25)
    .attr('text-anchor', 'middle')
    .attr('font-size', 14)
    .attr('font-weight', 'bold')
    .attr('fill', '#2c3e50')
    .text(`${browserState.region.chromosome}:${browserState.region.start.toLocaleString()}-${browserState.region.end.toLocaleString()}`);
}

/**
 * Render gene track
 */
function renderGeneTrack(gene, y) {
  const trackG = browserSvg.append('g')
    .attr('class', 'gene-track');
  
  const exonHeight = 24;
  const intronY = y + exonHeight / 2;
  
  // Gene name
  trackG.append('text')
    .attr('class', 'gene-name')
    .attr('x', margin.left)
    .attr('y', y - 8)
    .attr('font-size', 14)
    .attr('font-weight', 'bold')
    .text(`${gene.name} (${gene.strand === '+' ? 'forward' : 'reverse'} strand)`);
  
  // Intron line
  trackG.append('line')
    .attr('class', 'intron')
    .attr('x1', Math.max(margin.left, xScale(gene.start)))
    .attr('x2', Math.min(width - margin.right, xScale(gene.end)))
    .attr('y1', intronY)
    .attr('y2', intronY)
    .attr('stroke', '#999')
    .attr('stroke-width', 2);
  
  // Tooltip
  const tooltip = document.getElementById('browser-tooltip');
  
  // Exons
  gene.exons.forEach((exon, i) => {
    const x1 = xScale(exon.start);
    const x2 = xScale(exon.end);
    
    // Skip if out of view
    if (x2 < margin.left || x1 > width - margin.right) return;
    
    const clippedX1 = Math.max(margin.left, x1);
    const clippedX2 = Math.min(width - margin.right, x2);
    const exonWidth = clippedX2 - clippedX1;
    
    if (exonWidth < 1) return;
    
    const height = exon.type === 'coding' ? exonHeight : exonHeight * 0.5;
    const yPos = y + (exonHeight - height) / 2;
    
    trackG.append('rect')
      .attr('class', `exon ${exon.type}`)
      .attr('x', clippedX1)
      .attr('y', yPos)
      .attr('width', exonWidth)
      .attr('height', height)
      .attr('rx', 2)
      .attr('fill', exon.type === 'coding' ? '#4169E1' : '#87CEEB')
      .attr('stroke', '#2c3e50')
      .attr('stroke-width', 1)
      .on('mouseenter', function(event) {
        d3.select(this).attr('opacity', 0.8);
        tooltip.innerHTML = `
          <strong>Exon ${i + 1}</strong><br>
          Type: ${exon.type === 'coding' ? 'Coding (CDS)' : 'UTR'}<br>
          Position: ${exon.start.toLocaleString()}-${exon.end.toLocaleString()}<br>
          Length: ${(exon.end - exon.start).toLocaleString()} bp
        `;
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY - 10 + 'px';
        tooltip.classList.add('visible');
      })
      .on('mouseleave', function() {
        d3.select(this).attr('opacity', 1);
        tooltip.classList.remove('visible');
      });
  });
  
  // Direction arrows
  const arrowSpacing = 100;
  const numArrows = Math.floor((width - margin.left - margin.right) / arrowSpacing);
  
  for (let i = 0; i < numArrows; i++) {
    const arrowX = margin.left + (i + 0.5) * arrowSpacing;
    const arrowPath = gene.strand === '+' 
      ? `M${arrowX - 5},${intronY - 4} L${arrowX},${intronY} L${arrowX - 5},${intronY + 4}`
      : `M${arrowX + 5},${intronY - 4} L${arrowX},${intronY} L${arrowX + 5},${intronY + 4}`;
    
    trackG.append('path')
      .attr('d', arrowPath)
      .attr('stroke', '#666')
      .attr('stroke-width', 1.5)
      .attr('fill', 'none');
  }
}

/**
 * Render variant track
 */
function renderVariants(variants, y) {
  const trackG = browserSvg.append('g')
    .attr('class', 'variant-track');
  
  const tooltip = document.getElementById('browser-tooltip');
  const trackHeight = 80;
  
  // Baseline
  trackG.append('line')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right)
    .attr('y1', y + trackHeight)
    .attr('y2', y + trackHeight)
    .attr('stroke', '#ddd')
    .attr('stroke-width', 1);
  
  // Scale for variant counts
  const maxCount = d3.max(variants, d => d.count) || 1;
  const yVariantScale = d3.scaleLinear()
    .domain([0, maxCount])
    .range([y + trackHeight - 5, y + 10]);
  
  // Render variants
  variants.forEach(v => {
    const x = xScale(v.pos);
    
    // Skip if out of view
    if (x < margin.left || x > width - margin.right) return;
    
    const stemY = yVariantScale(v.count);
    const radius = Math.min(8, Math.max(4, v.count / 100));
    
    // Stem
    trackG.append('line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', y + trackHeight)
      .attr('y2', stemY)
      .attr('stroke', '#bbb')
      .attr('stroke-width', 1.5);
    
    // Head
    trackG.append('circle')
      .attr('class', 'variant-marker')
      .attr('cx', x)
      .attr('cy', stemY)
      .attr('r', radius)
      .attr('fill', variantColors[v.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .on('mouseenter', function(event) {
        d3.select(this).attr('r', radius + 2);
        tooltip.innerHTML = `
          <strong>${v.aa}</strong><br>
          Type: ${v.type}<br>
          Position: ${v.pos.toLocaleString()}<br>
          Sample count: ${v.count}
        `;
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY - 10 + 'px';
        tooltip.classList.add('visible');
      })
      .on('mouseleave', function() {
        d3.select(this).attr('r', radius);
        tooltip.classList.remove('visible');
      });
  });
}

/**
 * Setup browser controls
 */
function setupBrowserControls() {
  // Region selector
  document.getElementById('preset-regions')?.addEventListener('change', (e) => {
    const regionStr = e.target.value;
    browserState.region = parseRegion(regionStr);
    browserState.originalRegion = parseRegion(regionStr);
    browserState.geneKey = regionStr;
    renderBrowser();
  });
  
  // Custom region input
  document.getElementById('go-to-region')?.addEventListener('click', () => {
    const input = document.getElementById('custom-region');
    if (input?.value) {
      try {
        browserState.region = parseRegion(input.value);
        renderBrowser();
      } catch (err) {
        alert(err.message);
      }
    }
  });
  
  // Pan controls
  document.getElementById('browser-pan-left-far')?.addEventListener('click', () => panBrowser(-0.5));
  document.getElementById('browser-pan-left')?.addEventListener('click', () => panBrowser(-0.25));
  document.getElementById('browser-pan-right')?.addEventListener('click', () => panBrowser(0.25));
  document.getElementById('browser-pan-right-far')?.addEventListener('click', () => panBrowser(0.5));
  
  // Zoom controls
  document.getElementById('browser-zoom-in')?.addEventListener('click', () => zoomBrowser(0.5));
  document.getElementById('browser-zoom-out')?.addEventListener('click', () => zoomBrowser(2));
  document.getElementById('browser-zoom-reset')?.addEventListener('click', resetBrowser);
}

/**
 * Setup browser interactions
 */
function setupBrowserInteractions() {
  // Drag to pan
  const drag = d3.drag()
    .on('start', function() {
      d3.select(this).style('cursor', 'grabbing');
    })
    .on('drag', function(event) {
      const genomicShift = xScale.invert(0) - xScale.invert(event.dx);
      browserState.region.start = Math.round(browserState.region.start + genomicShift);
      browserState.region.end = Math.round(browserState.region.end + genomicShift);
      renderBrowser();
    })
    .on('end', function() {
      d3.select(this).style('cursor', 'grab');
    });
  
  browserSvg.call(drag);
  
  // Scroll to zoom
  browserSvg.on('wheel', function(event) {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 1.15 : 0.85;
    
    const [mouseX] = d3.pointer(event);
    const mouseGenomicPos = xScale.invert(mouseX);
    
    const currentLength = browserState.region.end - browserState.region.start;
    const newLength = currentLength * zoomFactor;
    const mouseRatio = (mouseGenomicPos - browserState.region.start) / currentLength;
    
    browserState.region.start = Math.round(mouseGenomicPos - newLength * mouseRatio);
    browserState.region.end = Math.round(mouseGenomicPos + newLength * (1 - mouseRatio));
    
    renderBrowser();
  });
}

/**
 * Pan the browser
 */
function panBrowser(fraction) {
  const shift = (browserState.region.end - browserState.region.start) * fraction;
  browserState.region.start = Math.round(browserState.region.start + shift);
  browserState.region.end = Math.round(browserState.region.end + shift);
  renderBrowser();
}

/**
 * Zoom the browser
 */
function zoomBrowser(factor) {
  const center = (browserState.region.start + browserState.region.end) / 2;
  const newHalfWidth = (browserState.region.end - browserState.region.start) * factor / 2;
  browserState.region.start = Math.round(center - newHalfWidth);
  browserState.region.end = Math.round(center + newHalfWidth);
  renderBrowser();
}

/**
 * Reset browser view
 */
function resetBrowser() {
  browserState.region = { ...browserState.originalRegion };
  renderBrowser();
}
