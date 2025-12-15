/**
 * Gene Structure Component
 *
 * Detailed gene visualization showing exons, introns,
 * and functional domains with zoom capabilities.
 */

import * as d3 from 'd3';

/**
 * Gene Structure visualization component
 *
 * @class GeneStructure
 */
export class GeneStructure {
  /**
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    this.options = {
      width: options.width || 700,
      height: options.height || 150,
      margin: options.margin || { top: 30, right: 20, bottom: 40, left: 60 },
      exonHeight: options.exonHeight || 30,
      domainHeight: options.domainHeight || 20,
      colors: {
        exon: '#3498db',
        intron: '#bdc3c7',
        utr5: '#95a5a6',
        utr3: '#7f8c8d',
        breakpoint: '#e74c3c',
        domain: '#27ae60',
        ...options.colors,
      },
      showDomains: options.showDomains !== false,
      showScale: options.showScale !== false,
      ...options,
    };

    this.gene = null;
    this.domains = [];
    this.xScale = null;
    this.zoom = null;

    this._initSVG();
    this._initZoom();
  }

  /**
   * Initialize SVG structure
   * @private
   */
  _initSVG() {
    const { width, height, margin } = this.options;

    d3.select(this.container).selectAll('svg').remove();

    this.svg = d3.select(this.container).append('svg').attr('width', width).attr('height', height);

    // Clip path for zooming
    this.svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'gene-clip')
      .append('rect')
      .attr('width', width - margin.left - margin.right)
      .attr('height', height - margin.top - margin.bottom);

    this.plotArea = {
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };

    // Main group
    this.g = this.svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Clipped content group
    this.content = this.g
      .append('g')
      .attr('class', 'gene-content')
      .attr('clip-path', 'url(#gene-clip)');

    // Axis group
    this.axisGroup = this.g
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${this.plotArea.height})`);

    // Labels group
    this.labelGroup = this.g.append('g').attr('class', 'labels');

    // Gene name label
    this.nameLabel = this.labelGroup
      .append('text')
      .attr('x', -10)
      .attr('y', this.plotArea.height / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold');
  }

  /**
   * Initialize zoom behavior
   * @private
   */
  _initZoom() {
    this.zoom = d3
      .zoom()
      .scaleExtent([1, 20])
      .translateExtent([
        [0, 0],
        [this.plotArea.width, this.plotArea.height],
      ])
      .extent([
        [0, 0],
        [this.plotArea.width, this.plotArea.height],
      ])
      .on('zoom', (event) => this._onZoom(event));

    this.svg.call(this.zoom);
  }

  /**
   * Handle zoom event
   * @private
   */
  _onZoom(event) {
    const newXScale = event.transform.rescaleX(this.xScale);
    this._updateView(newXScale);
  }

  /**
   * Update view with new scale
   * @private
   */
  _updateView(xScale) {
    // Update exons
    this.content
      .selectAll('.exon')
      .attr('x', (d) => xScale(d.start))
      .attr('width', (d) => Math.max(1, xScale(d.end) - xScale(d.start)));

    // Update introns
    this.content
      .selectAll('.intron')
      .attr('x1', (d) => xScale(d.start))
      .attr('x2', (d) => xScale(d.end));

    // Update domains
    if (this.options.showDomains) {
      this.content
        .selectAll('.domain')
        .attr('x', (d) => xScale(d.start))
        .attr('width', (d) => Math.max(1, xScale(d.end) - xScale(d.start)));
    }

    // Update axis
    this.axisGroup.call(
      d3
        .axisBottom(xScale)
        .ticks(8)
        .tickFormat((d) => `${(d / 1000).toFixed(0)}kb`)
    );
  }

  /**
   * Set gene data
   * @param {Object} gene - Gene data object
   */
  setGene(gene) {
    this.gene = gene;
    this.render();
  }

  /**
   * Set protein domains
   * @param {Array} domains - Array of domain objects
   */
  setDomains(domains) {
    this.domains = domains;
    this._renderDomains();
  }

  /**
   * Render the gene structure
   */
  render() {
    if (!this.gene) return;

    this._clear();
    this._setupScale();
    this._renderIntrons();
    this._renderExons();
    this._renderUTRs();
    this._renderBreakpoint();
    this._renderAxis();
    this._renderLabels();

    if (this.options.showDomains && this.domains.length > 0) {
      this._renderDomains();
    }
  }

  /**
   * Clear existing elements
   * @private
   */
  _clear() {
    this.content.selectAll('*').remove();
  }

  /**
   * Setup x scale
   * @private
   */
  _setupScale() {
    const { exons, start, end } = this.gene;

    const geneStart = start || Math.min(...exons.map((e) => e.start));
    const geneEnd = end || Math.max(...exons.map((e) => e.end));

    this.xScale = d3.scaleLinear().domain([geneStart, geneEnd]).range([0, this.plotArea.width]);
  }

  /**
   * Render intron lines
   * @private
   */
  _renderIntrons() {
    const { exonHeight, colors } = this.options;
    const y = this.plotArea.height / 2;

    // Create intron data between consecutive exons
    const introns = [];
    const sortedExons = [...this.gene.exons].sort((a, b) => a.start - b.start);

    for (let i = 0; i < sortedExons.length - 1; i++) {
      introns.push({
        start: sortedExons[i].end,
        end: sortedExons[i + 1].start,
      });
    }

    // Render intron lines with chevrons
    this.content
      .selectAll('.intron')
      .data(introns)
      .enter()
      .append('line')
      .attr('class', 'intron')
      .attr('x1', (d) => this.xScale(d.start))
      .attr('x2', (d) => this.xScale(d.end))
      .attr('y1', y)
      .attr('y2', y)
      .attr('stroke', colors.intron)
      .attr('stroke-width', 1);
  }

  /**
   * Render exon rectangles
   * @private
   */
  _renderExons() {
    const { exonHeight, colors } = this.options;
    const y = this.plotArea.height / 2 - exonHeight / 2;

    const exonGroups = this.content
      .selectAll('.exon-group')
      .data(this.gene.exons)
      .enter()
      .append('g')
      .attr('class', 'exon-group');

    // Exon rectangles
    exonGroups
      .append('rect')
      .attr('class', 'exon')
      .attr('x', (d) => this.xScale(d.start))
      .attr('y', y)
      .attr('width', (d) => Math.max(3, this.xScale(d.end) - this.xScale(d.start)))
      .attr('height', exonHeight)
      .attr('fill', (d) => (d.isBreakpoint ? colors.breakpoint : colors.exon))
      .attr('stroke', (d) => (d.isBreakpoint ? '#c0392b' : '#2980b9'))
      .attr('stroke-width', 1)
      .attr('rx', 2);

    // Exon numbers
    exonGroups
      .append('text')
      .attr('x', (d) => this.xScale((d.start + d.end) / 2))
      .attr('y', y + exonHeight / 2 + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text((d) => d.number || '');

    // Tooltips
    exonGroups
      .on('mouseenter', (event, d) => {
        this._showTooltip(event, d);
      })
      .on('mouseleave', () => {
        this._hideTooltip();
      });
  }

  /**
   * Render UTR regions
   * @private
   */
  _renderUTRs() {
    const { colors, exonHeight } = this.options;
    const y = this.plotArea.height / 2 - exonHeight / 4;
    const utrHeight = exonHeight / 2;

    if (this.gene.utr5) {
      this.content
        .append('rect')
        .attr('class', 'utr5')
        .attr('x', this.xScale(this.gene.utr5.start))
        .attr('y', y)
        .attr(
          'width',
          Math.max(2, this.xScale(this.gene.utr5.end) - this.xScale(this.gene.utr5.start))
        )
        .attr('height', utrHeight)
        .attr('fill', colors.utr5);
    }

    if (this.gene.utr3) {
      this.content
        .append('rect')
        .attr('class', 'utr3')
        .attr('x', this.xScale(this.gene.utr3.start))
        .attr('y', y)
        .attr(
          'width',
          Math.max(2, this.xScale(this.gene.utr3.end) - this.xScale(this.gene.utr3.start))
        )
        .attr('height', utrHeight)
        .attr('fill', colors.utr3);
    }
  }

  /**
   * Render breakpoint indicator
   * @private
   */
  _renderBreakpoint() {
    if (!this.gene.breakpoint) return;

    const { colors, exonHeight } = this.options;
    const x = this.xScale(this.gene.breakpoint);
    const y = this.plotArea.height / 2;

    // Vertical line
    this.content
      .append('line')
      .attr('class', 'breakpoint-line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', y - exonHeight - 10)
      .attr('y2', y + exonHeight + 10)
      .attr('stroke', colors.breakpoint)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,3');

    // Breakpoint marker
    this.content
      .append('circle')
      .attr('cx', x)
      .attr('cy', y - exonHeight - 15)
      .attr('r', 6)
      .attr('fill', colors.breakpoint);

    // Label
    this.content
      .append('text')
      .attr('x', x)
      .attr('y', y - exonHeight - 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', colors.breakpoint)
      .text('Breakpoint');
  }

  /**
   * Render protein domains
   * @private
   */
  _renderDomains() {
    const { domainHeight, colors, exonHeight } = this.options;
    const y = this.plotArea.height / 2 + exonHeight / 2 + 10;

    const domainGroups = this.content
      .selectAll('.domain-group')
      .data(this.domains)
      .enter()
      .append('g')
      .attr('class', 'domain-group');

    domainGroups
      .append('rect')
      .attr('class', 'domain')
      .attr('x', (d) => this.xScale(d.start))
      .attr('y', y)
      .attr('width', (d) => Math.max(3, this.xScale(d.end) - this.xScale(d.start)))
      .attr('height', domainHeight)
      .attr('fill', (d) => d.color || colors.domain)
      .attr('opacity', 0.7)
      .attr('rx', 3);

    domainGroups
      .append('text')
      .attr('x', (d) => this.xScale((d.start + d.end) / 2))
      .attr('y', y + domainHeight / 2 + 4)
      .attr('text-anchor', 'middle')
      .attr('fill', 'white')
      .attr('font-size', '9px')
      .text((d) => d.name);
  }

  /**
   * Render axis
   * @private
   */
  _renderAxis() {
    if (!this.options.showScale) return;

    this.axisGroup.call(
      d3
        .axisBottom(this.xScale)
        .ticks(8)
        .tickFormat((d) => `${(d / 1000).toFixed(0)}kb`)
    );
  }

  /**
   * Render labels
   * @private
   */
  _renderLabels() {
    this.nameLabel.text(this.gene.name || '').attr('fill', this.options.colors.exon);
  }

  /**
   * Show tooltip
   * @private
   */
  _showTooltip(event, exon) {
    let tooltip = d3.select('.gene-structure-tooltip');

    if (tooltip.empty()) {
      tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'gene-structure-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.85)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
    }

    const length = exon.end - exon.start;

    tooltip
      .style('opacity', 1)
      .style('left', `${event.pageX + 15}px`)
      .style('top', `${event.pageY - 10}px`).html(`
        <strong>Exon ${exon.number || ''}</strong><br/>
        Start: ${exon.start.toLocaleString()}<br/>
        End: ${exon.end.toLocaleString()}<br/>
        Length: ${length.toLocaleString()} bp
        ${exon.isBreakpoint ? '<br/><span style="color: #e74c3c">⚡ Breakpoint</span>' : ''}
      `);
  }

  /**
   * Hide tooltip
   * @private
   */
  _hideTooltip() {
    d3.select('.gene-structure-tooltip').style('opacity', 0);
  }

  /**
   * Reset zoom
   */
  resetZoom() {
    this.svg.transition().duration(500).call(this.zoom.transform, d3.zoomIdentity);
  }

  /**
   * Zoom to specific region
   * @param {number} start - Start position
   * @param {number} end - End position
   */
  zoomToRegion(start, end) {
    const fullDomain = this.xScale.domain();
    const fullRange = fullDomain[1] - fullDomain[0];
    const targetRange = end - start;

    const scale = fullRange / targetRange;
    const translateX = -this.xScale(start) * scale + this.options.margin.left;

    this.svg
      .transition()
      .duration(500)
      .call(this.zoom.transform, d3.zoomIdentity.translate(translateX, 0).scale(scale));
  }

  /**
   * Destroy the component
   */
  destroy() {
    d3.select('.gene-structure-tooltip').remove();
    this.svg.remove();
  }
}

export default GeneStructure;
