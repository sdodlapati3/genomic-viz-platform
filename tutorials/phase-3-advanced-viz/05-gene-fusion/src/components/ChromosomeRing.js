/**
 * Chromosome Ring Component
 *
 * Circular visualization showing chromosomes with
 * fusion connections as chords (Circos-style).
 */

import * as d3 from 'd3';

/**
 * Chromosome Ring (Circos-style) for fusion overview
 *
 * @class ChromosomeRing
 */
export class ChromosomeRing {
  /**
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    this.options = {
      size: options.size || 500,
      innerRadius: options.innerRadius || 0.7,
      outerRadius: options.outerRadius || 0.85,
      chromosomeGap: options.chromosomeGap || 0.01,
      colors: {
        chromosome: d3.scaleOrdinal(d3.schemeCategory10),
        fusion: '#e74c3c',
        fusionHighlight: '#f39c12',
        ...options.colors,
      },
      showLabels: options.showLabels !== false,
      ...options,
    };

    // Human chromosome sizes (approximate)
    this.chromosomeSizes = options.chromosomeSizes || {
      1: 249,
      2: 243,
      3: 198,
      4: 191,
      5: 182,
      6: 171,
      7: 159,
      8: 146,
      9: 141,
      10: 136,
      11: 135,
      12: 134,
      13: 115,
      14: 107,
      15: 103,
      16: 90,
      17: 83,
      18: 80,
      19: 59,
      20: 64,
      21: 47,
      22: 51,
      X: 156,
      Y: 57,
    };

    this.fusions = [];
    this.selectedFusion = null;
    this.chromosomeArcs = {};

    this._initSVG();
  }

  /**
   * Initialize SVG structure
   * @private
   */
  _initSVG() {
    const { size } = this.options;

    d3.select(this.container).selectAll('svg').remove();

    this.svg = d3.select(this.container).append('svg').attr('width', size).attr('height', size);

    // Main group centered
    this.g = this.svg.append('g').attr('transform', `translate(${size / 2}, ${size / 2})`);

    // Layer groups
    this.chromosomeGroup = this.g.append('g').attr('class', 'chromosomes');
    this.fusionGroup = this.g.append('g').attr('class', 'fusions');
    this.labelGroup = this.g.append('g').attr('class', 'labels');

    // Calculate radii
    const radius = Math.min(size, size) / 2;
    this.innerRadius = radius * this.options.innerRadius;
    this.outerRadius = radius * this.options.outerRadius;
  }

  /**
   * Set fusion data
   * @param {Array} fusions - Array of fusion objects
   */
  setData(fusions) {
    this.fusions = fusions;
    this._calculateChromosomePositions();
    this.render();
  }

  /**
   * Calculate chromosome arc positions
   * @private
   */
  _calculateChromosomePositions() {
    const { chromosomeGap } = this.options;

    // Get chromosomes involved in fusions
    const involvedChroms = new Set();
    this.fusions.forEach((f) => {
      const chr5 = this._extractChromosome(f.chr5 || f.gene5?.chromosome);
      const chr3 = this._extractChromosome(f.chr3 || f.gene3?.chromosome);
      if (chr5) involvedChroms.add(chr5);
      if (chr3) involvedChroms.add(chr3);
    });

    // If no specific chromosomes, use all
    const chromosomes =
      involvedChroms.size > 0
        ? Array.from(involvedChroms).sort(this._chromosomeSort)
        : Object.keys(this.chromosomeSizes).sort(this._chromosomeSort);

    // Calculate total size
    const totalSize = chromosomes.reduce((sum, chr) => sum + (this.chromosomeSizes[chr] || 100), 0);

    // Calculate gaps
    const totalGap = chromosomeGap * chromosomes.length;
    const availableAngle = 2 * Math.PI - totalGap;

    // Create arc generator
    const arc = d3.arc().innerRadius(this.innerRadius).outerRadius(this.outerRadius);

    // Calculate positions
    let currentAngle = -Math.PI / 2; // Start at top

    this.chromosomeArcs = {};
    chromosomes.forEach((chr) => {
      const size = this.chromosomeSizes[chr] || 100;
      const arcAngle = (size / totalSize) * availableAngle;

      this.chromosomeArcs[chr] = {
        startAngle: currentAngle,
        endAngle: currentAngle + arcAngle,
        arc: arc({
          startAngle: currentAngle,
          endAngle: currentAngle + arcAngle,
        }),
        size,
      };

      currentAngle += arcAngle + chromosomeGap;
    });
  }

  /**
   * Extract chromosome from string
   * @private
   */
  _extractChromosome(chrStr) {
    if (!chrStr) return null;
    const match = String(chrStr).match(/^(?:chr)?(\d+|X|Y)$/i);
    return match ? match[1].toUpperCase() : null;
  }

  /**
   * Chromosome sorting function
   * @private
   */
  _chromosomeSort(a, b) {
    const numA = parseInt(a) || (a === 'X' ? 23 : 24);
    const numB = parseInt(b) || (b === 'X' ? 23 : 24);
    return numA - numB;
  }

  /**
   * Render the ring
   */
  render() {
    this._clear();
    this._renderChromosomes();
    this._renderFusions();

    if (this.options.showLabels) {
      this._renderLabels();
    }
  }

  /**
   * Clear existing elements
   * @private
   */
  _clear() {
    this.chromosomeGroup.selectAll('*').remove();
    this.fusionGroup.selectAll('*').remove();
    this.labelGroup.selectAll('*').remove();
  }

  /**
   * Render chromosome arcs
   * @private
   */
  _renderChromosomes() {
    const { colors } = this.options;

    const chromosomes = Object.entries(this.chromosomeArcs);

    this.chromosomeGroup
      .selectAll('.chromosome-arc')
      .data(chromosomes)
      .enter()
      .append('path')
      .attr('class', 'chromosome-arc')
      .attr('d', (d) => d[1].arc)
      .attr('fill', (d, i) => colors.chromosome(i))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        this._highlightChromosome(d[0]);
      })
      .on('mouseleave', () => {
        this._unhighlightChromosome();
      });
  }

  /**
   * Render fusion chords
   * @private
   */
  _renderFusions() {
    const { colors } = this.options;

    // Filter fusions with valid chromosomes
    const validFusions = this.fusions.filter((f) => {
      const chr5 = this._extractChromosome(f.chr5 || f.gene5?.chromosome);
      const chr3 = this._extractChromosome(f.chr3 || f.gene3?.chromosome);
      return chr5 && chr3 && this.chromosomeArcs[chr5] && this.chromosomeArcs[chr3];
    });

    // Create ribbon generator
    const ribbon = d3.ribbon().radius(this.innerRadius - 5);

    this.fusionGroup
      .selectAll('.fusion-chord')
      .data(validFusions)
      .enter()
      .append('path')
      .attr('class', 'fusion-chord')
      .attr('d', (d) => {
        const chr5 = this._extractChromosome(d.chr5 || d.gene5?.chromosome);
        const chr3 = this._extractChromosome(d.chr3 || d.gene3?.chromosome);
        const arc5 = this.chromosomeArcs[chr5];
        const arc3 = this.chromosomeArcs[chr3];

        // Calculate position within chromosome
        const pos5 = d.breakpoint5
          ? (d.breakpoint5 / (arc5.size * 1e6)) * (arc5.endAngle - arc5.startAngle) +
            arc5.startAngle
          : (arc5.startAngle + arc5.endAngle) / 2;

        const pos3 = d.breakpoint3
          ? (d.breakpoint3 / (arc3.size * 1e6)) * (arc3.endAngle - arc3.startAngle) +
            arc3.startAngle
          : (arc3.startAngle + arc3.endAngle) / 2;

        return ribbon({
          source: { startAngle: pos5 - 0.02, endAngle: pos5 + 0.02 },
          target: { startAngle: pos3 - 0.02, endAngle: pos3 + 0.02 },
        });
      })
      .attr('fill', colors.fusion)
      .attr('fill-opacity', 0.5)
      .attr('stroke', colors.fusion)
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        this._highlightFusion(d);
        this._showTooltip(event, d);
      })
      .on('mouseleave', () => {
        this._unhighlightFusion();
        this._hideTooltip();
      })
      .on('click', (event, d) => {
        this._selectFusion(d);
      });
  }

  /**
   * Render chromosome labels
   * @private
   */
  _renderLabels() {
    const labelRadius = this.outerRadius + 15;

    const chromosomes = Object.entries(this.chromosomeArcs);

    this.labelGroup
      .selectAll('.chromosome-label')
      .data(chromosomes)
      .enter()
      .append('text')
      .attr('class', 'chromosome-label')
      .attr('transform', (d) => {
        const midAngle = (d[1].startAngle + d[1].endAngle) / 2;
        const x = Math.cos(midAngle - Math.PI / 2) * labelRadius;
        const y = Math.sin(midAngle - Math.PI / 2) * labelRadius;
        return `translate(${x}, ${y})`;
      })
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .attr('fill', '#333')
      .text((d) => `chr${d[0]}`);
  }

  /**
   * Highlight chromosome and its fusions
   * @private
   */
  _highlightChromosome(chr) {
    // Dim other chromosomes
    this.chromosomeGroup
      .selectAll('.chromosome-arc')
      .attr('opacity', (d) => (d[0] === chr ? 1 : 0.3));

    // Highlight connected fusions
    this.fusionGroup.selectAll('.fusion-chord').attr('opacity', (d) => {
      const chr5 = this._extractChromosome(d.chr5 || d.gene5?.chromosome);
      const chr3 = this._extractChromosome(d.chr3 || d.gene3?.chromosome);
      return chr5 === chr || chr3 === chr ? 1 : 0.1;
    });
  }

  /**
   * Remove chromosome highlight
   * @private
   */
  _unhighlightChromosome() {
    this.chromosomeGroup.selectAll('.chromosome-arc').attr('opacity', 1);
    this.fusionGroup.selectAll('.fusion-chord').attr('opacity', 0.5);
  }

  /**
   * Highlight specific fusion
   * @private
   */
  _highlightFusion(fusion) {
    this.fusionGroup
      .selectAll('.fusion-chord')
      .attr('fill-opacity', (d) => (d === fusion ? 0.8 : 0.2))
      .attr('stroke-width', (d) => (d === fusion ? 2 : 1));
  }

  /**
   * Remove fusion highlight
   * @private
   */
  _unhighlightFusion() {
    this.fusionGroup.selectAll('.fusion-chord').attr('fill-opacity', 0.5).attr('stroke-width', 1);
  }

  /**
   * Select fusion
   * @private
   */
  _selectFusion(fusion) {
    this.selectedFusion = fusion;

    // Dispatch event
    const event = new CustomEvent('fusionselect', {
      detail: { fusion },
      bubbles: true,
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Show tooltip
   * @private
   */
  _showTooltip(event, fusion) {
    let tooltip = d3.select('.chromosome-ring-tooltip');

    if (tooltip.empty()) {
      tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'chromosome-ring-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.85)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000');
    }

    const gene5 = fusion.gene5?.name || fusion.gene5;
    const gene3 = fusion.gene3?.name || fusion.gene3;

    tooltip
      .style('opacity', 1)
      .style('left', `${event.pageX + 15}px`)
      .style('top', `${event.pageY - 10}px`).html(`
        <strong>${gene5}-${gene3}</strong><br/>
        ${fusion.reads || 0} supporting reads
      `);
  }

  /**
   * Hide tooltip
   * @private
   */
  _hideTooltip() {
    d3.select('.chromosome-ring-tooltip').style('opacity', 0);
  }

  /**
   * Resize the component
   * @param {number} size - New size
   */
  resize(size) {
    this.options.size = size;

    const radius = Math.min(size, size) / 2;
    this.innerRadius = radius * this.options.innerRadius;
    this.outerRadius = radius * this.options.outerRadius;

    this.svg.attr('width', size).attr('height', size);

    this.g.attr('transform', `translate(${size / 2}, ${size / 2})`);

    this._calculateChromosomePositions();
    this.render();
  }

  /**
   * Destroy the component
   */
  destroy() {
    d3.select('.chromosome-ring-tooltip').remove();
    this.svg.remove();
  }
}

export default ChromosomeRing;
