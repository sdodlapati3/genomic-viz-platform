/**
 * Navigation - Pan and zoom functionality
 */
import * as d3 from 'd3';
import { formatPosition, parseRegion } from './01-coordinates.js';
import { tp53Gene, renderGene } from './02-tracks.js';

// Navigation state
let currentRegion = {
  chromosome: 'chr17',
  start: 7668402,
  end: 7687550
};

let navSvg, navXScale, navTrackG, navRulerG;
const navWidth = 800;
const navHeight = 180;
const navMargin = { left: 80, right: 40, top: 40, bottom: 30 };

/**
 * Initialize navigation demo
 */
export function initNavigation() {
  const container = d3.select('#navigation-demo');
  
  navSvg = container.append('svg')
    .attr('width', navWidth)
    .attr('height', navHeight)
    .attr('class', 'browser-svg');
  
  // Create groups for different elements
  navRulerG = navSvg.append('g')
    .attr('class', 'ruler-group');
  
  navTrackG = navSvg.append('g')
    .attr('class', 'track-group')
    .attr('transform', `translate(0, ${navMargin.top + 30})`);
  
  // Track label
  navSvg.append('text')
    .attr('class', 'track-label')
    .attr('x', 10)
    .attr('y', navMargin.top + 55)
    .text('TP53');
  
  // Initial render
  updateNavDisplay();
  
  // Button handlers
  document.getElementById('pan-left-far')?.addEventListener('click', () => pan(-0.5));
  document.getElementById('pan-left')?.addEventListener('click', () => pan(-0.25));
  document.getElementById('pan-right')?.addEventListener('click', () => pan(0.25));
  document.getElementById('pan-right-far')?.addEventListener('click', () => pan(0.5));
  document.getElementById('zoom-in')?.addEventListener('click', () => zoom(0.5));
  document.getElementById('zoom-out')?.addEventListener('click', () => zoom(2));
  document.getElementById('zoom-reset')?.addEventListener('click', resetView);
  
  // Drag to pan
  const drag = d3.drag()
    .on('start', function() {
      d3.select(this).style('cursor', 'grabbing');
    })
    .on('drag', function(event) {
      const genomicShift = navXScale.invert(0) - navXScale.invert(event.dx);
      currentRegion.start += genomicShift;
      currentRegion.end += genomicShift;
      updateNavDisplay();
    })
    .on('end', function() {
      d3.select(this).style('cursor', 'grab');
    });
  
  navSvg.call(drag);
  
  // Scroll to zoom
  navSvg.on('wheel', function(event) {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 1.2 : 0.8;
    
    // Zoom centered on mouse position
    const [mouseX] = d3.pointer(event);
    const mouseGenomicPos = navXScale.invert(mouseX);
    
    const newLength = (currentRegion.end - currentRegion.start) * zoomFactor;
    const mouseRatio = (mouseGenomicPos - currentRegion.start) / (currentRegion.end - currentRegion.start);
    
    currentRegion.start = Math.round(mouseGenomicPos - newLength * mouseRatio);
    currentRegion.end = Math.round(mouseGenomicPos + newLength * (1 - mouseRatio));
    
    updateNavDisplay();
  });
  
  // Code snippet
  document.getElementById('navigation-code').textContent = `// Pan by percentage of current view
function pan(fraction) {
  const shift = (region.end - region.start) * fraction;
  region.start += shift;
  region.end += shift;
  updateDisplay();
}

// Zoom by factor (0.5 = zoom in 2x, 2 = zoom out 2x)
function zoom(factor) {
  const center = (region.start + region.end) / 2;
  const newHalfWidth = (region.end - region.start) * factor / 2;
  region.start = Math.round(center - newHalfWidth);
  region.end = Math.round(center + newHalfWidth);
  updateDisplay();
}

// D3 drag for panning
const drag = d3.drag()
  .on('drag', (event) => {
    // Convert pixel delta to genomic delta
    const genomicShift = xScale.invert(0) - xScale.invert(event.dx);
    region.start += genomicShift;
    region.end += genomicShift;
    updateDisplay();
  });

svg.call(drag);

// Scroll wheel zoom (centered on mouse)
svg.on('wheel', (event) => {
  event.preventDefault();
  const zoomFactor = event.deltaY > 0 ? 1.2 : 0.8;
  
  // Get mouse position in genomic coordinates
  const mousePos = xScale.invert(d3.pointer(event)[0]);
  const mouseRatio = (mousePos - region.start) / (region.end - region.start);
  
  // Calculate new region centered on mouse
  const newLength = (region.end - region.start) * zoomFactor;
  region.start = mousePos - newLength * mouseRatio;
  region.end = mousePos + newLength * (1 - mouseRatio);
  
  updateDisplay();
});`;
}

/**
 * Pan the view
 */
function pan(fraction) {
  const shift = (currentRegion.end - currentRegion.start) * fraction;
  currentRegion.start = Math.round(currentRegion.start + shift);
  currentRegion.end = Math.round(currentRegion.end + shift);
  updateNavDisplay();
}

/**
 * Zoom the view
 */
function zoom(factor) {
  const center = (currentRegion.start + currentRegion.end) / 2;
  const newHalfWidth = (currentRegion.end - currentRegion.start) * factor / 2;
  currentRegion.start = Math.round(center - newHalfWidth);
  currentRegion.end = Math.round(center + newHalfWidth);
  updateNavDisplay();
}

/**
 * Reset to original view
 */
function resetView() {
  currentRegion = {
    chromosome: 'chr17',
    start: 7668402,
    end: 7687550
  };
  updateNavDisplay();
}

/**
 * Update the navigation display
 */
function updateNavDisplay() {
  // Update region display
  const regionDisplay = document.getElementById('nav-region');
  if (regionDisplay) {
    regionDisplay.textContent = `${currentRegion.chromosome}:${currentRegion.start.toLocaleString()}-${currentRegion.end.toLocaleString()}`;
  }
  
  // Update scale
  navXScale = d3.scaleLinear()
    .domain([currentRegion.start, currentRegion.end])
    .range([navMargin.left, navWidth - navMargin.right]);
  
  // Update ruler
  navRulerG.selectAll('*').remove();
  const axis = d3.axisTop(navXScale)
    .ticks(8)
    .tickFormat(d => formatPosition(d));
  
  navRulerG.append('g')
    .attr('transform', `translate(0, ${navMargin.top})`)
    .call(axis);
  
  // Update track
  navTrackG.selectAll('*').remove();
  renderGene(navTrackG, tp53Gene, navXScale, 20, 24);
}

export { pan, zoom, resetView };
