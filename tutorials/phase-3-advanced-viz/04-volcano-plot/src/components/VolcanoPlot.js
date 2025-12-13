/**
 * Tutorial 3.4: Volcano Plot Component
 * Canvas-based for handling 20,000+ points
 */

import * as d3 from 'd3';

export class VolcanoPlot {
  constructor(container, options = {}) {
    this.container = d3.select(container);
    this.width = options.width || 800;
    this.height = options.height || 550;
    this.margin = { top: 40, right: 30, bottom: 60, left: 70 };
    this.plotWidth = this.width - this.margin.left - this.margin.right;
    this.plotHeight = this.height - this.margin.top - this.margin.bottom;
    
    this.fcThreshold = options.fcThreshold || 1;
    this.pValueThreshold = options.pValueThreshold || 0.05;
    this.onGeneSelect = options.onGeneSelect || null;
    this.title = options.title || 'Volcano Plot';
    
    this.colors = { up: '#e74c3c', down: '#3498db', none: '#bdc3c7' };
    this.data = [];
    this.processedData = [];
    this.hoveredPoint = null;
    
    this.init();
  }

  init() {
    this.container.html('');
    this.container.style('position', 'relative');

    // Canvas for points (fast rendering)
    this.canvas = this.container.append('canvas')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('position', 'absolute')
      .style('top', '0')
      .style('left', '0');
    
    this.ctx = this.canvas.node().getContext('2d');

    // SVG overlay for axes, labels, interactions
    this.svg = this.container.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .style('position', 'absolute')
      .style('top', '0')
      .style('left', '0');

    this.g = this.svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // SVG layers
    this.thresholdLayer = this.g.append('g');
    this.labelLayer = this.g.append('g');
    this.axisLayer = this.g.append('g');
    
    // Hover circle (SVG for crisp rendering)
    this.hoverCircle = this.g.append('circle')
      .attr('r', 6)
      .attr('fill', 'none')
      .attr('stroke', '#000')
      .attr('stroke-width', 2)
      .style('display', 'none');

    // Tooltip
    this.tooltip = d3.select('body').append('div')
      .style('position', 'absolute')
      .style('background', 'rgba(0,0,0,0.85)')
      .style('color', '#fff')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', '9999');

    // Mouse interaction (throttled)
    this.setupInteraction();
  }

  setupInteraction() {
    const self = this;
    let lastCheck = 0;
    
    this.svg.on('mousemove', function(event) {
      // Throttle to every 50ms
      const now = Date.now();
      if (now - lastCheck < 50) return;
      lastCheck = now;
      
      const [mx, my] = d3.pointer(event);
      const x = mx - self.margin.left;
      const y = my - self.margin.top;
      
      if (x < 0 || x > self.plotWidth || y < 0 || y > self.plotHeight) {
        self.hideHover();
        return;
      }
      
      const nearest = self.findNearest(x, y, 8);
      if (nearest) {
        self.showHover(event, nearest);
      } else {
        self.hideHover();
      }
    });

    this.svg.on('mouseleave', () => self.hideHover());
    
    this.svg.on('click', function(event) {
      const [mx, my] = d3.pointer(event);
      const x = mx - self.margin.left;
      const y = my - self.margin.top;
      const nearest = self.findNearest(x, y, 8);
      if (nearest && self.onGeneSelect) {
        self.onGeneSelect(nearest);
      }
    });
  }

  findNearest(px, py, maxDist) {
    let nearest = null;
    let minDist = maxDist * maxDist; // Compare squared distances (faster)
    
    // Only check points near the cursor for performance
    for (const d of this.processedData) {
      const dx = d.cx - px;
      const dy = d.cy - py;
      const distSq = dx * dx + dy * dy;
      if (distSq < minDist) {
        minDist = distSq;
        nearest = d;
      }
    }
    return nearest;
  }

  showHover(event, d) {
    this.hoveredPoint = d;
    this.hoverCircle
      .attr('cx', d.cx)
      .attr('cy', d.cy)
      .attr('stroke', d.sig ? d.color : '#666')
      .style('display', 'block');
    
    const dir = d.log2FoldChange > 0 ? 'Upregulated' : 'Downregulated';
    const status = d.sig ? `<span style="color:${d.color}">${dir}</span>` : 'Not significant';
    this.tooltip
      .style('opacity', 1)
      .html(`<strong>${d.gene}</strong><br>${status}<br>log₂FC: ${d.log2FoldChange.toFixed(2)}<br>p: ${d.pValue.toExponential(2)}<br>padj: ${d.padj.toExponential(2)}`)
      .style('left', (event.pageX + 15) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  }

  hideHover() {
    this.hoveredPoint = null;
    this.hoverCircle.style('display', 'none');
    this.tooltip.style('opacity', 0);
  }

  setData(data) {
    console.time('setData');
    this.data = data;
    this.setupScales();
    this.processData();
    this.render();
    console.timeEnd('setData');
  }

  setupScales() {
    const xExtent = d3.extent(this.data, d => d.log2FoldChange);
    const xMax = Math.max(Math.abs(xExtent[0]), Math.abs(xExtent[1])) * 1.1;
    this.xScale = d3.scaleLinear().domain([-xMax, xMax]).range([0, this.plotWidth]);

    const yVals = this.data.map(d => -Math.log10(Math.max(d.pValue, 1e-300)));
    const yMax = Math.min(d3.max(yVals) * 1.1, 50);
    this.yScale = d3.scaleLinear().domain([0, yMax]).range([this.plotHeight, 0]);
  }

  processData() {
    console.time('processData');
    this.processedData = this.data.map(d => {
      const negLogP = Math.min(-Math.log10(Math.max(d.pValue, 1e-300)), 50);
      const sig = d.padj < this.pValueThreshold && Math.abs(d.log2FoldChange) > this.fcThreshold;
      let color = this.colors.none;
      if (sig) color = d.log2FoldChange > 0 ? this.colors.up : this.colors.down;
      
      return {
        ...d,
        negLogP,
        sig,
        color,
        cx: this.xScale(d.log2FoldChange),
        cy: this.yScale(negLogP)
      };
    });
    
    // Sort: non-significant first, significant on top
    this.processedData.sort((a, b) => a.sig - b.sig);
    console.timeEnd('processData');
  }

  render() {
    console.time('render');
    this.drawCanvasPoints();
    this.drawThresholds();
    this.drawAxes();
    this.drawTitle();
    this.drawLabels();
    console.timeEnd('render');
  }

  drawCanvasPoints() {
    console.time('drawCanvasPoints');
    const ctx = this.ctx;
    
    // Clear canvas
    ctx.fillStyle = '#fafafa';
    ctx.fillRect(0, 0, this.width, this.height);
    
    ctx.save();
    ctx.translate(this.margin.left, this.margin.top);
    
    // Clip to plot area
    ctx.beginPath();
    ctx.rect(0, 0, this.plotWidth, this.plotHeight);
    ctx.clip();
    
    // Batch draw by color for performance
    const byColor = {};
    this.processedData.forEach(d => {
      const key = d.sig ? d.color : 'gray';
      if (!byColor[key]) byColor[key] = [];
      byColor[key].push(d);
    });
    
    // Draw gray (non-significant) first
    if (byColor.gray) {
      ctx.fillStyle = 'rgba(189,195,199,0.3)';
      ctx.beginPath();
      byColor.gray.forEach(d => {
        ctx.moveTo(d.cx + 1.5, d.cy);
        ctx.arc(d.cx, d.cy, 1.5, 0, Math.PI * 2);
      });
      ctx.fill();
    }
    
    // Draw colored (significant) points
    [this.colors.down, this.colors.up].forEach(color => {
      if (byColor[color]) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        byColor[color].forEach(d => {
          ctx.moveTo(d.cx + 3, d.cy);
          ctx.arc(d.cx, d.cy, 3, 0, Math.PI * 2);
        });
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });
    
    ctx.restore();
    console.timeEnd('drawCanvasPoints');
  }

  drawThresholds() {
    this.thresholdLayer.selectAll('*').remove();
    
    const pY = this.yScale(-Math.log10(this.pValueThreshold));
    
    this.thresholdLayer.append('line')
      .attr('x1', 0).attr('x2', this.plotWidth)
      .attr('y1', pY).attr('y2', pY)
      .attr('stroke', '#e74c3c')
      .attr('stroke-dasharray', '5,5')
      .attr('opacity', 0.6);

    [this.fcThreshold, -this.fcThreshold].forEach(fc => {
      this.thresholdLayer.append('line')
        .attr('x1', this.xScale(fc)).attr('x2', this.xScale(fc))
        .attr('y1', 0).attr('y2', this.plotHeight)
        .attr('stroke', '#e74c3c')
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.6);
    });
    
    // Labels
    this.thresholdLayer.append('text')
      .attr('x', this.plotWidth - 5).attr('y', pY - 5)
      .attr('text-anchor', 'end')
      .attr('fill', '#e74c3c')
      .attr('font-size', '10px')
      .text(`p=${this.pValueThreshold}`);
  }

  drawAxes() {
    this.axisLayer.selectAll('*').remove();
    
    this.axisLayer.append('g')
      .attr('transform', `translate(0,${this.plotHeight})`)
      .call(d3.axisBottom(this.xScale));
    
    this.axisLayer.append('text')
      .attr('x', this.plotWidth / 2)
      .attr('y', this.plotHeight + 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .text('log₂(Fold Change)');

    this.axisLayer.append('g').call(d3.axisLeft(this.yScale));
    
    this.axisLayer.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.plotHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .text('-log₁₀(p-value)');
  }

  drawTitle() {
    this.svg.selectAll('.title').remove();
    this.svg.append('text')
      .attr('class', 'title')
      .attr('x', this.width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text(this.title + ` (${this.data.length.toLocaleString()} genes)`);
  }

  drawLabels() {
    this.labelLayer.selectAll('*').remove();
    
    const top = this.processedData
      .filter(d => d.sig)
      .sort((a, b) => b.negLogP - a.negLogP)
      .slice(0, 12);
    
    this.labelLayer.selectAll('text')
      .data(top)
      .enter()
      .append('text')
      .attr('x', d => d.cx)
      .attr('y', d => d.cy - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text(d => d.gene);
  }

  setFCThreshold(val) {
    this.fcThreshold = val;
    this.processData();
    this.render();
  }

  setPValueThreshold(val) {
    this.pValueThreshold = val;
    this.processData();
    this.render();
  }

  highlightGenes(names) {
    const set = new Set(names.map(n => n.toLowerCase()));
    const matches = this.processedData.filter(d => set.has(d.gene.toLowerCase()));
    
    this.drawCanvasPoints();
    
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this.margin.left, this.margin.top);
    
    matches.forEach(d => {
      ctx.beginPath();
      ctx.arc(d.cx, d.cy, 6, 0, Math.PI * 2);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = d.sig ? d.color : '#999';
      ctx.fill();
    });
    
    ctx.restore();
  }

  resetHighlight() {
    this.drawCanvasPoints();
  }

  destroy() {
    this.tooltip.remove();
    this.container.html('');
  }
}

export default VolcanoPlot;
