/**
 * Arc Diagram Component
 *
 * Visualizes gene fusions as arcs connecting partner genes.
 * Arc height represents fusion frequency/significance.
 */

import * as d3 from 'd3';

/**
 * Arc Diagram for visualizing gene fusions
 *
 * @class ArcDiagram
 */
export class ArcDiagram {
  /**
   * @param {string|HTMLElement} container - Container selector or element
   * @param {Object} options - Configuration options
   */
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    this.options = {
      width: options.width || 900,
      height: options.height || 400,
      margin: options.margin || { top: 60, right: 40, bottom: 80, left: 40 },
      arcHeightScale: options.arcHeightScale || ((d) => Math.sqrt(d.readSupport || 10) * 8),
      colorScale: options.colorScale || null,
      showLabels: options.showLabels !== false,
      ...options,
    };

    // State
    this.fusions = [];
    this.genes = new Map();
    this.selectedFusion = null;

    // Event callbacks
    this._callbacks = {
      click: [],
      hover: [],
    };

    this._initSVG();
  }

  /**
   * Initialize SVG structure
   * @private
   */
  _initSVG() {
    const { width, height, margin } = this.options;

    // Clear existing
    d3.select(this.container).selectAll('svg').remove();

    // Create SVG
    this.svg = d3.select(this.container).append('svg').attr('width', width).attr('height', height);

    // Calculate plot area
    this.plotArea = {
      x: margin.left,
      y: margin.top,
      width: width - margin.left - margin.right,
      height: height - margin.top - margin.bottom,
    };

    // Create groups
    this.arcGroup = this.svg
      .append('g')
      .attr('class', 'arcs')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.geneGroup = this.svg
      .append('g')
      .attr('class', 'genes')
      .attr('transform', `translate(${margin.left}, ${height - margin.bottom})`);

    this.labelGroup = this.svg
      .append('g')
      .attr('class', 'labels')
      .attr('transform', `translate(${margin.left}, ${height - margin.bottom + 20})`);

    // Default color scale
    if (!this.options.colorScale) {
      this.options.colorScale = d3
        .scaleOrdinal()
        .domain(['in-frame', 'out-of-frame', 'intergenic', 'unknown'])
        .range(['#2ecc71', '#e74c3c', '#9b59b6', '#95a5a6']);
    }

    // Create tooltip
    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'fusion-tooltip')
      .style('display', 'none');
  }

  /**
   * Set fusion data
   * @param {Array} fusions - Array of fusion objects
   */
  setData(fusions) {
    this.fusions = fusions;
    this._extractGenes();
    this._updateScales();
    this.render();
  }

  /**
   * Extract unique genes from fusions
   * @private
   */
  _extractGenes() {
    this.genes.clear();

    for (const fusion of this.fusions) {
      const gene5 = fusion.gene5?.name || fusion.gene5;
      const gene3 = fusion.gene3?.name || fusion.gene3;

      if (gene5 && !this.genes.has(gene5)) {
        this.genes.set(gene5, {
          name: gene5,
          chromosome: fusion.gene5?.chromosome || '',
          fusions: [],
        });
      }
      if (gene3 && !this.genes.has(gene3)) {
        this.genes.set(gene3, {
          name: gene3,
          chromosome: fusion.gene3?.chromosome || '',
          fusions: [],
        });
      }

      if (gene5) this.genes.get(gene5).fusions.push(fusion);
      if (gene3) this.genes.get(gene3).fusions.push(fusion);
    }
  }

  /**
   * Update scales based on data
   * @private
   */
  _updateScales() {
    const geneArray = Array.from(this.genes.keys()).sort();

    this.xScale = d3.scalePoint().domain(geneArray).range([0, this.plotArea.width]).padding(0.5);
  }

  /**
   * Render the arc diagram
   */
  render() {
    this._renderGenes();
    this._renderArcs();
  }

  /**
   * Render gene positions on baseline
   * @private
   */
  _renderGenes() {
    const geneArray = Array.from(this.genes.values());

    // Gene markers
    const markers = this.geneGroup.selectAll('.gene-marker').data(geneArray, (d) => d.name);

    markers
      .enter()
      .append('circle')
      .attr('class', 'gene-marker')
      .attr('r', 6)
      .attr('fill', '#34495e')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .merge(markers)
      .attr('cx', (d) => this.xScale(d.name))
      .attr('cy', 0);

    markers.exit().remove();

    // Gene labels
    if (this.options.showLabels) {
      const labels = this.labelGroup.selectAll('.gene-label').data(geneArray, (d) => d.name);

      labels
        .enter()
        .append('text')
        .attr('class', 'gene-label')
        .attr('text-anchor', 'middle')
        .merge(labels)
        .attr('x', (d) => this.xScale(d.name))
        .attr('y', 0)
        .text((d) => d.name)
        .style('font-size', '10px')
        .attr('transform', (d) => {
          const x = this.xScale(d.name);
          return `rotate(-45, ${x}, 0)`;
        });

      labels.exit().remove();
    }
  }

  /**
   * Render fusion arcs
   * @private
   */
  _renderArcs() {
    const self = this;

    const arcs = this.arcGroup
      .selectAll('.arc-path')
      .data(this.fusions, (d) => d.id || `${d.gene5?.name || d.gene5}-${d.gene3?.name || d.gene3}`);

    // Enter
    const arcsEnter = arcs
      .enter()
      .append('path')
      .attr('class', 'arc-path')
      .attr('fill', 'none')
      .attr('stroke-opacity', 0.7);

    // Enter + Update
    arcsEnter
      .merge(arcs)
      .attr('d', (d) => this._arcPath(d))
      .attr('stroke', (d) => this.options.colorScale(d.type || 'unknown'))
      .attr('stroke-width', (d) => Math.max(1, Math.sqrt(d.readSupport || 1)))
      .on('mouseover', function (event, d) {
        d3.select(this).attr('stroke-opacity', 1).attr('stroke-width', 4);
        self._showTooltip(event, d);
        self._emit('hover', d);
      })
      .on('mouseout', function (event, d) {
        if (self.selectedFusion !== d) {
          d3.select(this)
            .attr('stroke-opacity', 0.7)
            .attr('stroke-width', Math.max(1, Math.sqrt(d.readSupport || 1)));
        }
        self._hideTooltip();
      })
      .on('click', function (event, d) {
        self._selectFusion(d);
        self._emit('click', d);
      });

    // Exit
    arcs.exit().remove();
  }

  /**
   * Generate arc path
   * @private
   */
  _arcPath(fusion) {
    const gene5Name = fusion.gene5?.name || fusion.gene5;
    const gene3Name = fusion.gene3?.name || fusion.gene3;

    const x1 = this.xScale(gene5Name);
    const x2 = this.xScale(gene3Name);

    if (x1 === undefined || x2 === undefined) return '';

    const midX = (x1 + x2) / 2;
    const height = this.options.arcHeightScale(fusion);

    // Baseline is at bottom, so arcs go upward (negative y)
    const baseY = this.plotArea.height;

    // Quadratic bezier curve for arc
    return `M ${x1} ${baseY} Q ${midX} ${baseY - height} ${x2} ${baseY}`;
  }

  /**
   * Select a fusion
   * @private
   */
  _selectFusion(fusion) {
    this.selectedFusion = fusion;

    // Update visual state
    this.arcGroup
      .selectAll('.arc-path')
      .classed('selected', (d) => d === fusion)
      .classed('dimmed', (d) => d !== fusion && fusion !== null)
      .attr('stroke-opacity', (d) => (d === fusion ? 1 : 0.3));
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedFusion = null;
    this.arcGroup
      .selectAll('.arc-path')
      .classed('selected', false)
      .classed('dimmed', false)
      .attr('stroke-opacity', 0.7);
  }

  /**
   * Show tooltip
   * @private
   */
  _showTooltip(event, fusion) {
    const gene5Name = fusion.gene5?.name || fusion.gene5;
    const gene3Name = fusion.gene3?.name || fusion.gene3;

    this.tooltip
      .style('display', 'block')
      .style('left', event.pageX + 15 + 'px')
      .style('top', event.pageY - 10 + 'px').html(`
        <h4>${gene5Name}—${gene3Name}</h4>
        <div class="fusion-tooltip-row">
          <span class="fusion-tooltip-label">Type:</span>
          <span>${fusion.type || 'Unknown'}</span>
        </div>
        <div class="fusion-tooltip-row">
          <span class="fusion-tooltip-label">Read Support:</span>
          <span>${fusion.readSupport || 'N/A'}</span>
        </div>
        <div class="fusion-tooltip-row">
          <span class="fusion-tooltip-label">Spanning:</span>
          <span>${fusion.spanningFrags || 'N/A'}</span>
        </div>
      `);
  }

  /**
   * Hide tooltip
   * @private
   */
  _hideTooltip() {
    this.tooltip.style('display', 'none');
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (this._callbacks[event]) {
      this._callbacks[event].push(callback);
    }
    return this;
  }

  /**
   * Emit event
   * @private
   */
  _emit(event, data) {
    if (this._callbacks[event]) {
      this._callbacks[event].forEach((cb) => cb(data));
    }
  }

  /**
   * Update options
   * @param {Object} options - New options
   */
  updateOptions(options) {
    Object.assign(this.options, options);
    this.render();
  }

  /**
   * Destroy the component
   */
  destroy() {
    this.tooltip.remove();
    this.svg.remove();
  }
}

export default ArcDiagram;
