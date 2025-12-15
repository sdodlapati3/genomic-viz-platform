/**
 * Dual Gene View Component
 *
 * Shows two fusion partner genes side-by-side with
 * aligned breakpoints and exon structure.
 */

import * as d3 from 'd3';

/**
 * Dual Gene View for detailed fusion visualization
 *
 * @class DualGeneView
 */
export class DualGeneView {
  /**
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    this.options = {
      width: options.width || 800,
      height: options.height || 250,
      margin: options.margin || { top: 40, right: 20, bottom: 60, left: 20 },
      exonHeight: options.exonHeight || 30,
      geneGap: options.geneGap || 60,
      colors: {
        exon5: '#3498db',
        exon3: '#9b59b6',
        intron: '#bdc3c7',
        breakpoint: '#e74c3c',
        fusedExon: '#2ecc71',
        ...options.colors,
      },
      ...options,
    };

    this.fusion = null;
    this.gene5Data = null;
    this.gene3Data = null;

    this._initSVG();
  }

  /**
   * Initialize SVG structure
   * @private
   */
  _initSVG() {
    const { width, height, margin } = this.options;

    d3.select(this.container).selectAll('svg').remove();

    this.svg = d3.select(this.container).append('svg').attr('width', width).attr('height', height);

    // Calculate plot area
    this.plotArea = {
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };

    // Main group
    this.g = this.svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Groups for each gene
    this.gene5Group = this.g.append('g').attr('class', 'gene5-group');
    this.gene3Group = this.g.append('g').attr('class', 'gene3-group');

    // Breakpoint indicator group
    this.breakpointGroup = this.g.append('g').attr('class', 'breakpoint-group');

    // Labels group
    this.labelsGroup = this.g.append('g').attr('class', 'labels-group');
  }

  /**
   * Set fusion to display
   * @param {Object} fusion - Fusion object with gene5 and gene3
   * @param {Object} gene5Data - Full gene data for 5' partner (with exons)
   * @param {Object} gene3Data - Full gene data for 3' partner (with exons)
   */
  setFusion(fusion, gene5Data = null, gene3Data = null) {
    this.fusion = fusion;
    this.gene5Data = gene5Data || this._generateExonData(fusion.gene5);
    this.gene3Data = gene3Data || this._generateExonData(fusion.gene3);

    this.render();
  }

  /**
   * Generate mock exon data if not provided
   * @private
   */
  _generateExonData(gene) {
    const numExons = gene?.exonCount || Math.floor(Math.random() * 15) + 5;
    const breakpointExon = gene?.exon || Math.floor(numExons / 2);

    const exons = [];
    let pos = 0;

    for (let i = 1; i <= numExons; i++) {
      const exonLength = Math.floor(Math.random() * 200) + 50;
      exons.push({
        number: i,
        start: pos,
        end: pos + exonLength,
        isBreakpoint: i === breakpointExon,
      });
      pos += exonLength + Math.floor(Math.random() * 500) + 100; // intron
    }

    return {
      name: gene?.name || gene,
      chromosome: gene?.chromosome || '',
      strand: gene?.strand || '+',
      exons,
      breakpointExon,
    };
  }

  /**
   * Render the dual gene view
   */
  render() {
    if (!this.fusion) return;

    this._clear();
    this._renderGene5();
    this._renderGene3();
    this._renderBreakpoint();
    this._renderLabels();
    this._renderFusionProduct();
  }

  /**
   * Clear existing elements
   * @private
   */
  _clear() {
    this.gene5Group.selectAll('*').remove();
    this.gene3Group.selectAll('*').remove();
    this.breakpointGroup.selectAll('*').remove();
    this.labelsGroup.selectAll('*').remove();
  }

  /**
   * Render 5' gene partner
   * @private
   */
  _renderGene5() {
    const { exonHeight, colors, geneGap } = this.options;
    const geneWidth = (this.plotArea.width - geneGap) / 2;
    const y = this.plotArea.height / 2;

    // Scale for gene coordinates
    const maxEnd = Math.max(...this.gene5Data.exons.map((e) => e.end));
    const xScale = d3.scaleLinear().domain([0, maxEnd]).range([0, geneWidth]);

    // Intron line
    this.gene5Group
      .append('line')
      .attr('class', 'intron-line')
      .attr('x1', 0)
      .attr('x2', geneWidth)
      .attr('y1', y)
      .attr('y2', y)
      .attr('stroke', colors.intron)
      .attr('stroke-width', 2);

    // Exons
    const exonGroups = this.gene5Group
      .selectAll('.exon-group')
      .data(this.gene5Data.exons)
      .enter()
      .append('g')
      .attr('class', 'exon-group');

    exonGroups
      .append('rect')
      .attr('class', (d) => `exon ${d.isBreakpoint ? 'breakpoint' : ''}`)
      .attr('x', (d) => xScale(d.start))
      .attr('y', y - exonHeight / 2)
      .attr('width', (d) => Math.max(5, xScale(d.end) - xScale(d.start)))
      .attr('height', exonHeight)
      .attr('fill', (d) => (d.isBreakpoint ? colors.breakpoint : colors.exon5))
      .attr('stroke', (d) => (d.isBreakpoint ? '#c0392b' : '#2980b9'))
      .attr('stroke-width', 1)
      .attr('rx', 2);

    // Exon numbers
    exonGroups
      .append('text')
      .attr('x', (d) => xScale((d.start + d.end) / 2))
      .attr('y', y + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text((d) => d.number);

    // Direction arrow
    this.gene5Group
      .append('text')
      .attr('x', geneWidth + 10)
      .attr('y', y + 4)
      .attr('font-size', '16px')
      .text(this.gene5Data.strand === '+' ? '→' : '←');
  }

  /**
   * Render 3' gene partner
   * @private
   */
  _renderGene3() {
    const { exonHeight, colors, geneGap } = this.options;
    const geneWidth = (this.plotArea.width - geneGap) / 2;
    const xOffset = geneWidth + geneGap;
    const y = this.plotArea.height / 2;

    // Scale for gene coordinates
    const maxEnd = Math.max(...this.gene3Data.exons.map((e) => e.end));
    const xScale = d3.scaleLinear().domain([0, maxEnd]).range([0, geneWidth]);

    // Intron line
    this.gene3Group
      .append('line')
      .attr('class', 'intron-line')
      .attr('x1', xOffset)
      .attr('x2', xOffset + geneWidth)
      .attr('y1', y)
      .attr('y2', y)
      .attr('stroke', colors.intron)
      .attr('stroke-width', 2);

    // Exons
    const exonGroups = this.gene3Group
      .selectAll('.exon-group')
      .data(this.gene3Data.exons)
      .enter()
      .append('g')
      .attr('class', 'exon-group');

    exonGroups
      .append('rect')
      .attr('class', (d) => `exon ${d.isBreakpoint ? 'breakpoint' : ''}`)
      .attr('x', (d) => xOffset + xScale(d.start))
      .attr('y', y - exonHeight / 2)
      .attr('width', (d) => Math.max(5, xScale(d.end) - xScale(d.start)))
      .attr('height', exonHeight)
      .attr('fill', (d) => (d.isBreakpoint ? colors.breakpoint : colors.exon3))
      .attr('stroke', (d) => (d.isBreakpoint ? '#c0392b' : '#8e44ad'))
      .attr('stroke-width', 1)
      .attr('rx', 2);

    // Exon numbers
    exonGroups
      .append('text')
      .attr('x', (d) => xOffset + xScale((d.start + d.end) / 2))
      .attr('y', y + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text((d) => d.number);

    // Direction arrow
    this.gene3Group
      .append('text')
      .attr('x', xOffset - 20)
      .attr('y', y + 4)
      .attr('font-size', '16px')
      .text(this.gene3Data.strand === '+' ? '→' : '←');
  }

  /**
   * Render breakpoint indicator
   * @private
   */
  _renderBreakpoint() {
    const { geneGap, colors } = this.options;
    const geneWidth = (this.plotArea.width - geneGap) / 2;
    const midX = geneWidth + geneGap / 2;
    const y = this.plotArea.height / 2;

    // Breakpoint connection line
    this.breakpointGroup
      .append('line')
      .attr('class', 'breakpoint-line')
      .attr('x1', geneWidth)
      .attr('x2', geneWidth + geneGap)
      .attr('y1', y)
      .attr('y2', y)
      .attr('stroke', colors.breakpoint)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3');

    // Fusion symbol
    this.breakpointGroup
      .append('circle')
      .attr('cx', midX)
      .attr('cy', y)
      .attr('r', 12)
      .attr('fill', colors.breakpoint)
      .attr('stroke', 'white')
      .attr('stroke-width', 2);

    this.breakpointGroup
      .append('text')
      .attr('x', midX)
      .attr('y', y + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('⚡');
  }

  /**
   * Render labels
   * @private
   */
  _renderLabels() {
    const { geneGap } = this.options;
    const geneWidth = (this.plotArea.width - geneGap) / 2;

    // 5' Gene label
    this.labelsGroup
      .append('text')
      .attr('x', geneWidth / 2)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#3498db')
      .text(`5' ${this.gene5Data.name}`);

    // Chromosome info
    this.labelsGroup
      .append('text')
      .attr('x', geneWidth / 2)
      .attr('y', this.plotArea.height + 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text(this.gene5Data.chromosome);

    // 3' Gene label
    this.labelsGroup
      .append('text')
      .attr('x', geneWidth + geneGap + geneWidth / 2)
      .attr('y', -15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#9b59b6')
      .text(`3' ${this.gene3Data.name}`);

    // Chromosome info
    this.labelsGroup
      .append('text')
      .attr('x', geneWidth + geneGap + geneWidth / 2)
      .attr('y', this.plotArea.height + 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text(this.gene3Data.chromosome);
  }

  /**
   * Render fusion product preview
   * @private
   */
  _renderFusionProduct() {
    const { geneGap, colors, exonHeight } = this.options;
    const y = this.plotArea.height + 45;
    const productWidth = this.plotArea.width * 0.6;
    const xOffset = (this.plotArea.width - productWidth) / 2;

    // Label
    this.labelsGroup
      .append('text')
      .attr('x', this.plotArea.width / 2)
      .attr('y', y - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .text('Fusion Product');

    // Get exons up to breakpoint from 5' gene
    const exons5 = this.gene5Data.exons.filter((e) => e.number <= this.gene5Data.breakpointExon);

    // Get exons from breakpoint onward from 3' gene
    const exons3 = this.gene3Data.exons.filter((e) => e.number >= this.gene3Data.breakpointExon);

    const totalExons = exons5.length + exons3.length;
    const exonWidth = (productWidth - 4) / totalExons;

    // Render 5' exons
    exons5.forEach((exon, i) => {
      this.labelsGroup
        .append('rect')
        .attr('x', xOffset + i * exonWidth)
        .attr('y', y)
        .attr('width', exonWidth - 2)
        .attr('height', exonHeight * 0.6)
        .attr('fill', colors.exon5)
        .attr('rx', 2);
    });

    // Render 3' exons
    exons3.forEach((exon, i) => {
      this.labelsGroup
        .append('rect')
        .attr('x', xOffset + (exons5.length + i) * exonWidth)
        .attr('y', y)
        .attr('width', exonWidth - 2)
        .attr('height', exonHeight * 0.6)
        .attr('fill', colors.exon3)
        .attr('rx', 2);
    });

    // Junction marker
    const junctionX = xOffset + exons5.length * exonWidth - 1;
    this.labelsGroup
      .append('line')
      .attr('x1', junctionX)
      .attr('x2', junctionX)
      .attr('y1', y - 5)
      .attr('y2', y + exonHeight * 0.6 + 5)
      .attr('stroke', colors.breakpoint)
      .attr('stroke-width', 2);
  }

  /**
   * Highlight specific exon
   * @param {string} gene - 'gene5' or 'gene3'
   * @param {number} exonNumber - Exon number to highlight
   */
  highlightExon(gene, exonNumber) {
    const group = gene === 'gene5' ? this.gene5Group : this.gene3Group;

    group
      .selectAll('.exon')
      .attr('stroke-width', (d) => (d.number === exonNumber ? 3 : 1))
      .attr('stroke', (d) => (d.number === exonNumber ? '#f39c12' : null));
  }

  /**
   * Destroy the component
   */
  destroy() {
    this.svg.remove();
  }
}

export default DualGeneView;
