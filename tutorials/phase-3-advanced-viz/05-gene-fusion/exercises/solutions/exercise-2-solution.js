/**
 * Exercise 2 Solution: Multi-Caller Venn Diagram
 *
 * Visualization showing fusion caller concordance
 */

import * as d3 from 'd3';

export class CallerVenn {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;

    this.options = {
      width: options.width || 350,
      height: options.height || 280,
      callers: options.callers || ['STAR-Fusion', 'Arriba', 'FusionCatcher'],
      colors: options.colors || ['#3498db', '#2ecc71', '#9b59b6'],
      opacity: options.opacity || 0.3,
      ...options,
    };

    this.fusions = [];
    this.sets = {};
    this.selectedRegion = null;

    this._initSVG();
  }

  _initSVG() {
    const { width, height } = this.options;

    d3.select(this.container).selectAll('svg').remove();

    this.svg = d3.select(this.container).append('svg').attr('width', width).attr('height', height);

    this.g = this.svg.append('g').attr('transform', `translate(${width / 2}, ${height / 2 - 20})`);

    // Groups
    this.circleGroup = this.g.append('g').attr('class', 'circles');
    this.labelGroup = this.g.append('g').attr('class', 'labels');
    this.countGroup = this.g.append('g').attr('class', 'counts');

    // Title
    this.svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text('Caller Concordance');
  }

  setData(fusions) {
    this.fusions = fusions;
    this.sets = this._calculateSets(fusions);
    this.render();
    this._emitStats();
  }

  /**
   * Calculate set intersections for Venn diagram
   */
  _calculateSets(fusions) {
    const callers = this.options.callers;
    const sets = {
      // Individual sets
      only0: [],
      only1: [],
      only2: [],
      // Pairwise intersections
      '0_1': [],
      '0_2': [],
      '1_2': [],
      // Triple intersection
      '0_1_2': [],
      // All
      all: fusions,
    };

    fusions.forEach((fusion) => {
      const fusionCallers = (fusion.callers || []).map((c) => c.toLowerCase());

      const has = callers.map((caller) =>
        fusionCallers.some((fc) => fc.includes(caller.toLowerCase().replace('-', '')))
      );

      // Triple intersection
      if (has[0] && has[1] && has[2]) {
        sets['0_1_2'].push(fusion);
      }
      // Pairwise (excluding triple)
      else if (has[0] && has[1]) {
        sets['0_1'].push(fusion);
      } else if (has[0] && has[2]) {
        sets['0_2'].push(fusion);
      } else if (has[1] && has[2]) {
        sets['1_2'].push(fusion);
      }
      // Only one caller
      else if (has[0]) {
        sets['only0'].push(fusion);
      } else if (has[1]) {
        sets['only1'].push(fusion);
      } else if (has[2]) {
        sets['only2'].push(fusion);
      }
    });

    return sets;
  }

  render() {
    this._clear();
    this._renderCircles();
    this._renderLabels();
    this._renderCounts();
  }

  _clear() {
    this.circleGroup.selectAll('*').remove();
    this.labelGroup.selectAll('*').remove();
    this.countGroup.selectAll('*').remove();
  }

  _renderCircles() {
    const { callers, colors, opacity } = this.options;
    const radius = 70;
    const offset = 40;

    // Circle positions (120° apart)
    const positions = callers.map((_, i) => ({
      cx: offset * Math.cos((i * 2 * Math.PI) / 3 - Math.PI / 2),
      cy: offset * Math.sin((i * 2 * Math.PI) / 3 - Math.PI / 2),
    }));

    // Draw circles
    positions.forEach((pos, i) => {
      this.circleGroup
        .append('circle')
        .attr('cx', pos.cx)
        .attr('cy', pos.cy)
        .attr('r', radius)
        .attr('fill', colors[i])
        .attr('fill-opacity', opacity)
        .attr('stroke', colors[i])
        .attr('stroke-width', 2);
    });

    // Interactive regions (simplified - actual implementation would use clip paths)
    this._renderClickRegions(positions, radius);
  }

  _renderClickRegions(positions, radius) {
    // Center region (triple intersection)
    this.circleGroup
      .append('circle')
      .attr('cx', 0)
      .attr('cy', 5)
      .attr('r', 20)
      .attr('fill', 'transparent')
      .attr('class', 'click-region')
      .attr('data-region', '0_1_2')
      .style('cursor', 'pointer')
      .on('click', () => this._selectRegion('0_1_2'))
      .on('mouseenter', function () {
        d3.select(this).attr('fill', 'rgba(0,0,0,0.1)');
      })
      .on('mouseleave', function () {
        d3.select(this).attr('fill', 'transparent');
      });
  }

  _renderLabels() {
    const { callers, colors } = this.options;
    const labelRadius = 110;

    // Caller labels
    callers.forEach((caller, i) => {
      const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      const x = labelRadius * Math.cos(angle);
      const y = labelRadius * Math.sin(angle);

      this.labelGroup
        .append('text')
        .attr('x', x)
        .attr('y', y)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .attr('fill', colors[i])
        .text(caller);
    });
  }

  _renderCounts() {
    const sets = this.sets;
    const offset = 40;

    // Position calculations for count labels
    const countPositions = [
      // Only caller 0 (top)
      { key: 'only0', x: 0, y: -70 },
      // Only caller 1 (bottom-left)
      { key: 'only1', x: -60, y: 50 },
      // Only caller 2 (bottom-right)
      { key: 'only2', x: 60, y: 50 },
      // Intersection 0-1 (left)
      { key: '0_1', x: -35, y: -15 },
      // Intersection 0-2 (right)
      { key: '0_2', x: 35, y: -15 },
      // Intersection 1-2 (bottom)
      { key: '1_2', x: 0, y: 40 },
      // Triple intersection (center)
      { key: '0_1_2', x: 0, y: 5 },
    ];

    countPositions.forEach((pos) => {
      const count = sets[pos.key]?.length || 0;
      if (count === 0) return;

      const group = this.countGroup
        .append('g')
        .attr('transform', `translate(${pos.x}, ${pos.y})`)
        .attr('class', 'count-group')
        .attr('data-region', pos.key)
        .style('cursor', 'pointer')
        .on('click', () => this._selectRegion(pos.key));

      // Background circle for readability
      group
        .append('circle')
        .attr('r', count > 99 ? 16 : 12)
        .attr('fill', 'white')
        .attr('stroke', '#333')
        .attr('stroke-width', 1);

      // Count text
      group
        .append('text')
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('font-size', count > 99 ? '10px' : '12px')
        .attr('font-weight', 'bold')
        .text(count);
    });

    // Total count below
    this.countGroup
      .append('text')
      .attr('x', 0)
      .attr('y', 100)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .text(`Total: ${this.fusions.length} fusions`);
  }

  _selectRegion(regionKey) {
    this.selectedRegion = regionKey;

    const fusions = this.sets[regionKey] || [];

    // Dispatch event with filtered fusions
    const event = new CustomEvent('regionselect', {
      detail: {
        region: regionKey,
        fusions: fusions,
        count: fusions.length,
      },
      bubbles: true,
    });
    this.container.dispatchEvent(event);

    // Visual feedback
    this.countGroup.selectAll('.count-group').attr('opacity', (d) => {
      const key = d3.select(this).attr('data-region');
      return key === regionKey ? 1 : 0.5;
    });
  }

  _emitStats() {
    const stats = {
      total: this.fusions.length,
      singleCaller: this.sets.only0.length + this.sets.only1.length + this.sets.only2.length,
      twoCaller: this.sets['0_1'].length + this.sets['0_2'].length + this.sets['1_2'].length,
      threeCaller: this.sets['0_1_2'].length,
    };

    const event = new CustomEvent('vennstats', {
      detail: stats,
      bubbles: true,
    });
    this.container.dispatchEvent(event);
  }

  /**
   * Calculate concordance score for a fusion
   */
  static calculateConcordance(fusion) {
    const callers = fusion.callers || [];
    return {
      count: callers.length,
      score: callers.length >= 3 ? 'high' : callers.length === 2 ? 'medium' : 'low',
      callers: callers,
      color: callers.length >= 3 ? '#27ae60' : callers.length === 2 ? '#f39c12' : '#e74c3c',
    };
  }

  clearSelection() {
    this.selectedRegion = null;
    this.countGroup.selectAll('.count-group').attr('opacity', 1);
  }

  destroy() {
    this.svg.remove();
  }
}

export default CallerVenn;
