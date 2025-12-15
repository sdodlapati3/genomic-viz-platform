/**
 * Exercise 1 Solution: Custom Arc Styling
 *
 * Enhanced ArcDiagram with clinical significance coloring
 */

import * as d3 from 'd3';

export class ClinicalArcDiagram {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    this.options = {
      width: options.width || 800,
      height: options.height || 400,
      margin: options.margin || { top: 80, right: 40, bottom: 80, left: 40 },
      arcPadding: options.arcPadding || 10,
      clinicalColors: {
        level1: '#e74c3c',
        level2a: '#f39c12',
        level2b: '#f1c40f',
        level3: '#95a5a6',
        unknown: '#bdc3c7',
        ...options.clinicalColors,
      },
      showLegend: options.showLegend !== false,
      showDrugIndicators: options.showDrugIndicators !== false,
      ...options,
    };

    this.fusions = [];
    this.xScale = null;

    this._initSVG();
  }

  _initSVG() {
    const { width, height, margin } = this.options;

    d3.select(this.container).selectAll('svg').remove();

    this.svg = d3.select(this.container).append('svg').attr('width', width).attr('height', height);

    this.plotArea = {
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };

    this.g = this.svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Layer groups
    this.arcGroup = this.g.append('g').attr('class', 'arcs');
    this.geneGroup = this.g.append('g').attr('class', 'genes');
    this.legendGroup = this.g.append('g').attr('class', 'legend');

    // Render legend
    if (this.options.showLegend) {
      this._renderLegend();
    }
  }

  /**
   * Get color based on clinical level
   */
  _getClinicalColor(fusion) {
    const { clinicalColors } = this.options;
    const level = fusion.clinical?.level?.toLowerCase()?.replace(/\s+/g, '') || '';

    if (level.includes('level1') || level === '1') {
      return clinicalColors.level1;
    } else if (level.includes('level2a') || level.includes('2a')) {
      return clinicalColors.level2a;
    } else if (level.includes('level2b') || level.includes('2b')) {
      return clinicalColors.level2b;
    } else if (level.includes('level3') || level.includes('3')) {
      return clinicalColors.level3;
    }

    return clinicalColors.unknown;
  }

  /**
   * Get arc stroke properties based on clinical significance
   */
  _getArcStyle(fusion) {
    const level = fusion.clinical?.level?.toLowerCase() || '';
    const hasTherapy = fusion.clinical?.drugs?.length > 0;

    if (level.includes('level1') || level.includes('1')) {
      return {
        strokeWidth: 4,
        strokeDasharray: 'none',
        filter: 'url(#glow)',
      };
    } else if (level.includes('level2')) {
      return {
        strokeWidth: 3,
        strokeDasharray: 'none',
        filter: 'none',
      };
    }

    return {
      strokeWidth: 2,
      strokeDasharray: '5,3',
      filter: 'none',
    };
  }

  /**
   * Render clinical legend
   */
  _renderLegend() {
    const { clinicalColors } = this.options;
    const legendData = [
      { level: 'Level 1', color: clinicalColors.level1, description: 'FDA-approved therapy' },
      { level: 'Level 2A', color: clinicalColors.level2a, description: 'Standard care' },
      { level: 'Level 2B/3', color: clinicalColors.level2b, description: 'Clinical evidence' },
      { level: 'Unknown', color: clinicalColors.unknown, description: 'Uncertain significance' },
    ];

    const legend = this.legendGroup.attr(
      'transform',
      `translate(${this.plotArea.width - 150}, 10)`
    );

    // Background
    legend
      .append('rect')
      .attr('x', -10)
      .attr('y', -10)
      .attr('width', 160)
      .attr('height', legendData.length * 22 + 20)
      .attr('fill', 'white')
      .attr('stroke', '#ddd')
      .attr('rx', 4);

    // Title
    legend
      .append('text')
      .attr('x', 0)
      .attr('y', 5)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Clinical Significance');

    // Legend items
    const items = legend
      .selectAll('.legend-item')
      .data(legendData)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => `translate(0, ${20 + i * 22})`);

    items
      .append('rect')
      .attr('width', 14)
      .attr('height', 14)
      .attr('fill', (d) => d.color)
      .attr('rx', 2);

    items
      .append('text')
      .attr('x', 20)
      .attr('y', 11)
      .attr('font-size', '10px')
      .text((d) => d.level);
  }

  /**
   * Add glow filter for Level 1 fusions
   */
  _addGlowFilter() {
    const defs = this.svg.append('defs');

    const filter = defs
      .append('filter')
      .attr('id', 'glow')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');

    filter.append('feGaussianBlur').attr('stdDeviation', '2').attr('result', 'coloredBlur');

    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
  }

  setData(fusions) {
    this.fusions = fusions;
    this._addGlowFilter();
    this.render();
  }

  render() {
    if (this.fusions.length === 0) return;

    this._clear();
    this._setupScale();
    this._renderArcs();
    this._renderGenes();
  }

  _clear() {
    this.arcGroup.selectAll('*').remove();
    this.geneGroup.selectAll('*').remove();
  }

  _setupScale() {
    // Extract unique genes
    const genes = new Set();
    this.fusions.forEach((f) => {
      genes.add(f.gene5?.name || f.gene5);
      genes.add(f.gene3?.name || f.gene3);
    });

    this.xScale = d3
      .scalePoint()
      .domain(Array.from(genes))
      .range([0, this.plotArea.width])
      .padding(0.5);
  }

  _renderArcs() {
    const baseY = this.plotArea.height;
    const maxArcHeight = this.plotArea.height - 50;

    // Sort by read count for layering
    const sortedFusions = [...this.fusions].sort((a, b) => b.reads - a.reads);

    // Arc generator
    const arcPath = (fusion, index) => {
      const gene5 = fusion.gene5?.name || fusion.gene5;
      const gene3 = fusion.gene3?.name || fusion.gene3;

      const x1 = this.xScale(gene5);
      const x2 = this.xScale(gene3);

      const midX = (x1 + x2) / 2;
      const height = Math.min(Math.abs(x2 - x1) * 0.5, maxArcHeight);

      return `M ${x1} ${baseY} Q ${midX} ${baseY - height} ${x2} ${baseY}`;
    };

    // Render arcs with clinical styling
    const arcs = this.arcGroup
      .selectAll('.fusion-arc')
      .data(sortedFusions)
      .enter()
      .append('g')
      .attr('class', 'fusion-arc-group');

    arcs
      .append('path')
      .attr('class', 'fusion-arc')
      .attr('d', arcPath)
      .attr('fill', 'none')
      .attr('stroke', (d) => this._getClinicalColor(d))
      .attr('stroke-width', (d) => this._getArcStyle(d).strokeWidth)
      .attr('stroke-dasharray', (d) => this._getArcStyle(d).strokeDasharray)
      .attr('filter', (d) => this._getArcStyle(d).filter)
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => this._onArcHover(event, d))
      .on('mouseleave', () => this._onArcLeave())
      .on('click', (event, d) => this._onArcClick(d));

    // Add drug indicators for Level 1 fusions
    if (this.options.showDrugIndicators) {
      this._renderDrugIndicators(sortedFusions);
    }
  }

  _renderDrugIndicators(fusions) {
    const baseY = this.plotArea.height;

    const level1Fusions = fusions.filter((f) => {
      const level = f.clinical?.level?.toLowerCase() || '';
      return level.includes('level1') || level.includes('1');
    });

    level1Fusions.forEach((fusion) => {
      const gene5 = fusion.gene5?.name || fusion.gene5;
      const gene3 = fusion.gene3?.name || fusion.gene3;
      const x1 = this.xScale(gene5);
      const x2 = this.xScale(gene3);
      const midX = (x1 + x2) / 2;
      const height = Math.min(Math.abs(x2 - x1) * 0.5, this.plotArea.height - 50);

      // Drug icon at arc peak
      this.arcGroup
        .append('text')
        .attr('x', midX)
        .attr('y', baseY - height - 10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '14px')
        .text('💊')
        .style('cursor', 'pointer')
        .append('title')
        .text(`Therapies: ${fusion.clinical?.drugs?.join(', ') || 'Available'}`);
    });
  }

  _renderGenes() {
    const baseY = this.plotArea.height;
    const genes = Array.from(this.xScale.domain());

    const geneGroups = this.geneGroup
      .selectAll('.gene')
      .data(genes)
      .enter()
      .append('g')
      .attr('class', 'gene')
      .attr('transform', (d) => `translate(${this.xScale(d)}, ${baseY})`);

    geneGroups.append('circle').attr('r', 6).attr('fill', '#2c3e50');

    geneGroups
      .append('text')
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text((d) => d);
  }

  _onArcHover(event, fusion) {
    const level = fusion.clinical?.level || 'Unknown';
    const drugs = fusion.clinical?.drugs?.join(', ') || 'None';
    const gene5 = fusion.gene5?.name || fusion.gene5;
    const gene3 = fusion.gene3?.name || fusion.gene3;

    // Show tooltip
    let tooltip = d3.select('.clinical-arc-tooltip');
    if (tooltip.empty()) {
      tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'clinical-arc-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0,0,0,0.9)')
        .style('color', 'white')
        .style('padding', '10px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('z-index', '1000');
    }

    tooltip
      .style('opacity', 1)
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`).html(`
        <strong>${gene5}-${gene3}</strong><br/>
        Clinical Level: ${level}<br/>
        Reads: ${fusion.reads}<br/>
        ${drugs !== 'None' ? `<br/>Therapies: ${drugs}` : ''}
      `);

    // Highlight arc
    d3.select(event.target).attr('stroke-width', (d) => this._getArcStyle(d).strokeWidth + 2);
  }

  _onArcLeave() {
    d3.select('.clinical-arc-tooltip').style('opacity', 0);

    this.arcGroup
      .selectAll('.fusion-arc')
      .attr('stroke-width', (d) => this._getArcStyle(d).strokeWidth);
  }

  _onArcClick(fusion) {
    const event = new CustomEvent('fusionselect', {
      detail: { fusion },
      bubbles: true,
    });
    this.container.dispatchEvent(event);
  }

  destroy() {
    d3.select('.clinical-arc-tooltip').remove();
    this.svg.remove();
  }
}

export default ClinicalArcDiagram;
