/**
 * Tutorial 3.5: Oncoprint Visualization Component
 * Canvas-based mutation matrix for high-performance rendering
 */

import * as d3 from 'd3';
import { MUTATION_TYPES, CLINICAL_FEATURES } from '../data/mutationData.js';

export class Oncoprint {
  constructor(container, options = {}) {
    this.container = d3.select(container);
    this.options = {
      width: options.width || 1000,
      height: options.height || 600,
      cellWidth: options.cellWidth || 8,
      cellHeight: options.cellHeight || 20,
      cellPadding: options.cellPadding || 1,
      geneLabelWidth: options.geneLabelWidth || 80,
      geneFreqWidth: options.geneFreqWidth || 50,
      clinicalHeight: options.clinicalHeight || 12,
      clinicalPadding: options.clinicalPadding || 2,
      showClinical: options.showClinical !== false,
      ...options
    };
    
    this.data = null;
    this.sortedSamples = [];
    this.sortedGenes = [];
    this.geneFrequencies = {};
    
    this.canvas = null;
    this.ctx = null;
    this.tooltip = null;
    
    this.init();
  }
  
  init() {
    // Clear container
    this.container.selectAll('*').remove();
    
    // Create wrapper
    this.wrapper = this.container
      .append('div')
      .attr('class', 'oncoprint-wrapper')
      .style('position', 'relative');
    
    // Create tooltip
    this.tooltip = this.wrapper
      .append('div')
      .attr('class', 'oncoprint-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.85)')
      .style('color', 'white')
      .style('padding', '10px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000)
      .style('max-width', '300px');
    
    // Create SVG for labels and axes
    this.svg = this.wrapper
      .append('svg')
      .attr('class', 'oncoprint-svg')
      .style('position', 'absolute')
      .style('top', 0)
      .style('left', 0)
      .style('pointer-events', 'none');
    
    // Create canvas for mutation matrix
    this.canvas = this.wrapper
      .append('canvas')
      .attr('class', 'oncoprint-canvas')
      .style('position', 'absolute');
    
    this.ctx = this.canvas.node().getContext('2d');
    
    // Event handlers
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    let lastMoveTime = 0;
    const throttleMs = 30;
    
    this.canvas.on('mousemove', (event) => {
      const now = Date.now();
      if (now - lastMoveTime < throttleMs) return;
      lastMoveTime = now;
      
      this.handleMouseMove(event);
    });
    
    this.canvas.on('mouseleave', () => {
      this.tooltip.style('opacity', 0);
    });
    
    this.canvas.on('click', (event) => {
      this.handleClick(event);
    });
  }
  
  handleMouseMove(event) {
    if (!this.data) return;
    
    const rect = this.canvas.node().getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Calculate which cell we're hovering over
    const { geneLabelWidth, geneFreqWidth, cellWidth, cellPadding, clinicalHeight, clinicalPadding } = this.options;
    const matrixX = x - geneLabelWidth - geneFreqWidth;
    
    const clinicalTracks = this.options.showClinical ? Object.keys(CLINICAL_FEATURES).length : 0;
    const clinicalTotalHeight = clinicalTracks * (clinicalHeight + clinicalPadding);
    
    // Check if hovering over clinical track
    if (y < clinicalTotalHeight && matrixX >= 0) {
      const sampleIdx = Math.floor(matrixX / (cellWidth + cellPadding));
      const trackIdx = Math.floor(y / (clinicalHeight + clinicalPadding));
      
      if (sampleIdx < this.sortedSamples.length && trackIdx < clinicalTracks) {
        const sample = this.sortedSamples[sampleIdx];
        const trackKey = Object.keys(CLINICAL_FEATURES)[trackIdx];
        const trackInfo = CLINICAL_FEATURES[trackKey];
        
        this.showTooltip(event, `
          <strong>${sample.id}</strong><br/>
          ${trackInfo.label}: ${sample.clinical[trackKey]}
        `);
        return;
      }
    }
    
    // Check if hovering over mutation matrix
    const matrixY = y - clinicalTotalHeight - 10; // 10px gap after clinical
    if (matrixX >= 0 && matrixY >= 0) {
      const sampleIdx = Math.floor(matrixX / (cellWidth + cellPadding));
      const geneIdx = Math.floor(matrixY / (this.options.cellHeight + cellPadding));
      
      if (sampleIdx < this.sortedSamples.length && geneIdx < this.sortedGenes.length) {
        const sample = this.sortedSamples[sampleIdx];
        const gene = this.sortedGenes[geneIdx];
        const mutation = sample.mutations[gene];
        
        if (mutation) {
          const mutType = MUTATION_TYPES[mutation.type];
          let details = `<strong>${sample.id}</strong><br/><strong>${gene}</strong>: ${mutType.label}`;
          
          if (mutation.change) details += `<br/>Change: ${mutation.change}`;
          if (mutation.vaf) details += `<br/>VAF: ${(mutation.vaf * 100).toFixed(1)}%`;
          if (mutation.copyNumber !== undefined) details += `<br/>Copy Number: ${mutation.copyNumber}`;
          if (mutation.partner) details += `<br/>Partner: ${mutation.partner}`;
          if (mutation.compound) {
            details += `<br/><em>+ ${MUTATION_TYPES[mutation.compound.type].label}</em>`;
          }
          
          this.showTooltip(event, details);
        } else {
          this.showTooltip(event, `<strong>${sample.id}</strong><br/>${gene}: No mutation`);
        }
        return;
      }
    }
    
    this.tooltip.style('opacity', 0);
  }
  
  showTooltip(event, html) {
    const rect = this.container.node().getBoundingClientRect();
    const x = event.clientX - rect.left + 15;
    const y = event.clientY - rect.top - 10;
    
    this.tooltip
      .html(html)
      .style('left', `${x}px`)
      .style('top', `${y}px`)
      .style('opacity', 1);
  }
  
  handleClick(event) {
    // Could implement cell selection, gene/sample filtering, etc.
    console.log('Click event:', event);
  }
  
  setData(data, frequencies) {
    this.data = data;
    this.sortedSamples = [...data.samples];
    this.sortedGenes = [...data.genes];
    this.geneFrequencies = frequencies;
    this.render();
  }
  
  sortSamples(sortFn) {
    if (typeof sortFn === 'function') {
      this.sortedSamples = sortFn(this.sortedSamples);
    }
    this.render();
  }
  
  sortGenes(sortFn) {
    if (typeof sortFn === 'function') {
      this.sortedGenes = sortFn(this.sortedGenes);
    }
    this.render();
  }
  
  calculateDimensions() {
    const {
      cellWidth, cellHeight, cellPadding,
      geneLabelWidth, geneFreqWidth,
      clinicalHeight, clinicalPadding, showClinical
    } = this.options;
    
    const clinicalTracks = showClinical ? Object.keys(CLINICAL_FEATURES).length : 0;
    const clinicalTotalHeight = clinicalTracks * (clinicalHeight + clinicalPadding);
    
    const matrixWidth = this.sortedSamples.length * (cellWidth + cellPadding);
    const matrixHeight = this.sortedGenes.length * (cellHeight + cellPadding);
    
    const totalWidth = geneLabelWidth + geneFreqWidth + matrixWidth + 20;
    const totalHeight = clinicalTotalHeight + 10 + matrixHeight + 20;
    
    return {
      totalWidth,
      totalHeight,
      matrixWidth,
      matrixHeight,
      clinicalTotalHeight,
      matrixStartX: geneLabelWidth + geneFreqWidth,
      matrixStartY: clinicalTotalHeight + 10
    };
  }
  
  render() {
    if (!this.data) return;
    
    const dims = this.calculateDimensions();
    
    // Size canvas and SVG
    this.canvas
      .attr('width', dims.totalWidth)
      .attr('height', dims.totalHeight);
    
    this.svg
      .attr('width', dims.totalWidth)
      .attr('height', dims.totalHeight);
    
    this.wrapper
      .style('width', `${dims.totalWidth}px`)
      .style('height', `${dims.totalHeight}px`);
    
    // Clear canvas
    this.ctx.clearRect(0, 0, dims.totalWidth, dims.totalHeight);
    
    // Draw components
    this.drawClinicalTracks(dims);
    this.drawMutationMatrix(dims);
    this.drawLabels(dims);
  }
  
  drawClinicalTracks(dims) {
    if (!this.options.showClinical) return;
    
    const { cellWidth, cellPadding, clinicalHeight, clinicalPadding } = this.options;
    const ctx = this.ctx;
    
    Object.entries(CLINICAL_FEATURES).forEach(([key, feature], trackIdx) => {
      const y = trackIdx * (clinicalHeight + clinicalPadding);
      
      this.sortedSamples.forEach((sample, sampleIdx) => {
        const x = dims.matrixStartX + sampleIdx * (cellWidth + cellPadding);
        const valueIdx = feature.values.indexOf(sample.clinical[key]);
        const color = feature.colors[valueIdx] || '#cccccc';
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellWidth, clinicalHeight);
      });
    });
  }
  
  drawMutationMatrix(dims) {
    const { cellWidth, cellHeight, cellPadding } = this.options;
    const ctx = this.ctx;
    
    // Draw background (gray for WT)
    ctx.fillStyle = '#e8e8e8';
    this.sortedGenes.forEach((gene, geneIdx) => {
      const y = dims.matrixStartY + geneIdx * (cellHeight + cellPadding);
      this.sortedSamples.forEach((sample, sampleIdx) => {
        const x = dims.matrixStartX + sampleIdx * (cellWidth + cellPadding);
        ctx.fillRect(x, y, cellWidth, cellHeight);
      });
    });
    
    // Draw mutations - batch by type for performance
    Object.entries(MUTATION_TYPES).forEach(([type, info]) => {
      ctx.fillStyle = info.color;
      
      this.sortedGenes.forEach((gene, geneIdx) => {
        const y = dims.matrixStartY + geneIdx * (cellHeight + cellPadding);
        
        this.sortedSamples.forEach((sample, sampleIdx) => {
          const mutation = sample.mutations[gene];
          if (!mutation || mutation.type !== type) return;
          
          const x = dims.matrixStartX + sampleIdx * (cellWidth + cellPadding);
          
          // Different shapes for different mutation types
          if (info.shape === 'rect-full') {
            // Full height for CNV
            ctx.fillRect(x, y, cellWidth, cellHeight);
          } else if (info.shape === 'triangle') {
            // Triangle for fusions
            ctx.beginPath();
            ctx.moveTo(x + cellWidth / 2, y + 2);
            ctx.lineTo(x + cellWidth - 1, y + cellHeight - 2);
            ctx.lineTo(x + 1, y + cellHeight - 2);
            ctx.closePath();
            ctx.fill();
          } else {
            // Small centered rectangle for point mutations
            const rectHeight = cellHeight * 0.6;
            const rectY = y + (cellHeight - rectHeight) / 2;
            ctx.fillRect(x, rectY, cellWidth, rectHeight);
          }
        });
      });
    });
    
    // Draw compound mutations (second bar)
    ctx.globalAlpha = 0.8;
    this.sortedGenes.forEach((gene, geneIdx) => {
      const y = dims.matrixStartY + geneIdx * (cellHeight + cellPadding);
      
      this.sortedSamples.forEach((sample, sampleIdx) => {
        const mutation = sample.mutations[gene];
        if (!mutation || !mutation.compound) return;
        
        const x = dims.matrixStartX + sampleIdx * (cellWidth + cellPadding);
        const compoundInfo = MUTATION_TYPES[mutation.compound.type];
        
        // Draw as small bar at bottom
        ctx.fillStyle = compoundInfo.color;
        ctx.fillRect(x, y + cellHeight * 0.7, cellWidth, cellHeight * 0.25);
      });
    });
    ctx.globalAlpha = 1;
  }
  
  drawLabels(dims) {
    const svg = this.svg;
    const { cellHeight, cellPadding, geneLabelWidth, geneFreqWidth, clinicalHeight, clinicalPadding } = this.options;
    
    // Clear existing labels
    svg.selectAll('*').remove();
    
    // Gene labels
    const geneLabels = svg.append('g').attr('class', 'gene-labels');
    
    this.sortedGenes.forEach((gene, idx) => {
      const y = dims.matrixStartY + idx * (cellHeight + cellPadding) + cellHeight / 2;
      
      // Gene name
      geneLabels.append('text')
        .attr('x', geneLabelWidth - 5)
        .attr('y', y)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('fill', '#333')
        .text(gene);
      
      // Frequency bar
      const freq = this.geneFrequencies[gene];
      if (freq) {
        const barWidth = (parseFloat(freq.percentage) / 100) * (geneFreqWidth - 10);
        
        geneLabels.append('rect')
          .attr('x', geneLabelWidth + 2)
          .attr('y', y - 6)
          .attr('width', barWidth)
          .attr('height', 12)
          .attr('fill', '#3498db')
          .attr('opacity', 0.7);
        
        geneLabels.append('text')
          .attr('x', geneLabelWidth + geneFreqWidth - 5)
          .attr('y', y)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '9px')
          .attr('fill', '#666')
          .text(`${freq.percentage}%`);
      }
    });
    
    // Clinical track labels
    if (this.options.showClinical) {
      Object.entries(CLINICAL_FEATURES).forEach(([key, feature], idx) => {
        const y = idx * (clinicalHeight + clinicalPadding) + clinicalHeight / 2;
        
        svg.append('text')
          .attr('x', geneLabelWidth - 5)
          .attr('y', y)
          .attr('text-anchor', 'end')
          .attr('dominant-baseline', 'middle')
          .attr('font-size', '10px')
          .attr('fill', '#666')
          .text(feature.label);
      });
    }
  }
  
  // Public API methods
  updateCellSize(width, height) {
    this.options.cellWidth = width;
    this.options.cellHeight = height;
    this.render();
  }
  
  toggleClinical(show) {
    this.options.showClinical = show;
    this.render();
  }
  
  highlightGene(gene) {
    // Could implement gene highlighting
    console.log('Highlight gene:', gene);
  }
  
  exportSVG() {
    // Generate full SVG export
    const dims = this.calculateDimensions();
    const svgNS = 'http://www.w3.org/2000/svg';
    
    // Create new SVG element
    const exportSvg = document.createElementNS(svgNS, 'svg');
    exportSvg.setAttribute('width', dims.totalWidth);
    exportSvg.setAttribute('height', dims.totalHeight);
    exportSvg.setAttribute('xmlns', svgNS);
    
    // Add white background
    const bg = document.createElementNS(svgNS, 'rect');
    bg.setAttribute('width', '100%');
    bg.setAttribute('height', '100%');
    bg.setAttribute('fill', 'white');
    exportSvg.appendChild(bg);
    
    // Embed canvas as image
    const img = document.createElementNS(svgNS, 'image');
    img.setAttribute('href', this.canvas.node().toDataURL('image/png'));
    img.setAttribute('width', dims.totalWidth);
    img.setAttribute('height', dims.totalHeight);
    exportSvg.appendChild(img);
    
    // Copy SVG labels
    const labels = this.svg.node().cloneNode(true);
    Array.from(labels.children).forEach(child => {
      exportSvg.appendChild(child.cloneNode(true));
    });
    
    return new XMLSerializer().serializeToString(exportSvg);
  }
  
  destroy() {
    this.container.selectAll('*').remove();
    this.data = null;
  }
}
