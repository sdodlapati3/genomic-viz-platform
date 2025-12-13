/**
 * Tutorial 3.3: Kaplan-Meier Survival Curve Component
 * Simplified working version
 */

import * as d3 from 'd3';

export class SurvivalCurve {
  constructor(container, options = {}) {
    this.container = d3.select(container);
    
    this.config = {
      width: options.width || 800,
      height: options.height || 500,
      margin: options.margin || { top: 40, right: 150, bottom: 100, left: 60 },
      showCI: options.showCI !== false,
      showCensored: options.showCensored !== false,
      showAtRiskTable: options.showAtRiskTable !== false,
      showMedian: options.showMedian !== false,
      xLabel: options.xLabel || 'Time (months)',
      yLabel: options.yLabel || 'Survival Probability',
      title: options.title || 'Kaplan-Meier Survival Curve'
    };

    this.plotWidth = this.config.width - this.config.margin.left - this.config.margin.right;
    this.plotHeight = this.config.height - this.config.margin.top - this.config.margin.bottom;
    
    if (this.config.showAtRiskTable) {
      this.plotHeight -= 60;
    }

    this.groupResults = null;
    this.logRankResult = null;
    this.xScale = null;
    this.yScale = null;
    this.svg = null;
    
    this.init();
  }

  init() {
    this.container.html('');
    
    this.svg = this.container
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height)
      .style('background', '#fafafa');
    
    this.plotGroup = this.svg.append('g')
      .attr('transform', `translate(${this.config.margin.left},${this.config.margin.top})`);

    // Create tooltip
    this.tooltip = this.container
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none');
  }

  setData(groupResults, logRankResult = null) {
    this.groupResults = groupResults;
    this.logRankResult = logRankResult;
    this.setupScales();
    this.render();
  }

  setupScales() {
    let maxTime = 0;
    for (const group of Object.values(this.groupResults)) {
      const groupMax = Math.max(...group.km.map(d => d.time));
      maxTime = Math.max(maxTime, groupMax);
    }
    maxTime *= 1.1;

    this.xScale = d3.scaleLinear().domain([0, maxTime]).range([0, this.plotWidth]);
    this.yScale = d3.scaleLinear().domain([0, 1]).range([this.plotHeight, 0]);
  }

  render() {
    // Clear everything
    this.plotGroup.selectAll('*').remove();
    this.svg.selectAll('.legend').remove();
    this.svg.selectAll('.title').remove();
    this.svg.selectAll('.stats').remove();
    this.svg.selectAll('.at-risk').remove();

    // Render axes first
    this.renderAxes();

    // Render each group
    for (const [groupName, groupData] of Object.entries(this.groupResults)) {
      const { km, color, data } = groupData;
      
      // Confidence interval
      if (this.config.showCI) {
        const area = d3.area()
          .x(d => this.xScale(d.time))
          .y0(d => this.yScale(Math.max(0, d.ciLower || d.survival)))
          .y1(d => this.yScale(Math.min(1, d.ciUpper || d.survival)))
          .curve(d3.curveStepAfter);

        this.plotGroup.append('path')
          .datum(km)
          .attr('d', area)
          .attr('fill', color)
          .attr('opacity', 0.15);
      }

      // Survival curve
      const line = d3.line()
        .x(d => this.xScale(d.time))
        .y(d => this.yScale(d.survival))
        .curve(d3.curveStepAfter);

      this.plotGroup.append('path')
        .datum(km)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2.5);

      // Censoring marks
      if (this.config.showCensored) {
        const censored = data.filter(d => d.event === 0);
        censored.forEach(patient => {
          let survival = 1;
          for (const point of km) {
            if (point.time <= patient.time) survival = point.survival;
            else break;
          }
          this.plotGroup.append('line')
            .attr('x1', this.xScale(patient.time))
            .attr('x2', this.xScale(patient.time))
            .attr('y1', this.yScale(survival) - 5)
            .attr('y2', this.yScale(survival) + 5)
            .attr('stroke', color)
            .attr('stroke-width', 1.5);
        });
      }

      // Median survival line
      if (this.config.showMedian && groupData.medianSurvival) {
        const medianTime = groupData.medianSurvival;
        this.plotGroup.append('line')
          .attr('x1', 0)
          .attr('x2', this.xScale(medianTime))
          .attr('y1', this.yScale(0.5))
          .attr('y2', this.yScale(0.5))
          .attr('stroke', color)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.6);
        this.plotGroup.append('line')
          .attr('x1', this.xScale(medianTime))
          .attr('x2', this.xScale(medianTime))
          .attr('y1', this.yScale(0.5))
          .attr('y2', this.plotHeight)
          .attr('stroke', color)
          .attr('stroke-dasharray', '4,4')
          .attr('opacity', 0.6);
      }
    }

    this.renderLegend();
    this.renderTitle();
    this.renderStats();
    if (this.config.showAtRiskTable) this.renderAtRiskTable();
  }

  renderAxes() {
    // X axis
    this.plotGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.plotHeight})`)
      .call(d3.axisBottom(this.xScale).ticks(10));

    // X label
    this.plotGroup.append('text')
      .attr('x', this.plotWidth / 2)
      .attr('y', this.plotHeight + 40)
      .attr('text-anchor', 'middle')
      .style('font-size', '13px')
      .text(this.config.xLabel);

    // Y axis
    this.plotGroup.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(this.yScale).ticks(5).tickFormat(d3.format('.0%')));

    // Y label
    this.plotGroup.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -this.plotHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .style('font-size', '13px')
      .text(this.config.yLabel);

    // Grid
    this.plotGroup.selectAll('.grid-line')
      .data(this.yScale.ticks(5))
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', this.plotWidth)
      .attr('y1', d => this.yScale(d))
      .attr('y2', d => this.yScale(d))
      .attr('stroke', '#e0e0e0')
      .attr('stroke-dasharray', '2,2');
  }

  renderLegend() {
    const legendX = this.config.margin.left + this.plotWidth + 20;
    const legendY = this.config.margin.top;
    const legend = this.svg.append('g').attr('class', 'legend').attr('transform', `translate(${legendX},${legendY})`);

    Object.entries(this.groupResults).forEach(([name, data], i) => {
      const y = i * 55;
      legend.append('line').attr('x1', 0).attr('x2', 25).attr('y1', y).attr('y2', y)
        .attr('stroke', data.color).attr('stroke-width', 3);
      legend.append('text').attr('x', 32).attr('y', y + 4).style('font-size', '12px').style('font-weight', 'bold').text(name);
      legend.append('text').attr('x', 32).attr('y', y + 18).style('font-size', '10px').style('fill', '#666')
        .text(`n=${data.n}, Events=${data.events}`);
      legend.append('text').attr('x', 32).attr('y', y + 30).style('font-size', '10px').style('fill', '#666')
        .text(`Median: ${data.medianSurvival ? data.medianSurvival.toFixed(1) : 'NR'}`);
    });
  }

  renderTitle() {
    this.svg.append('text')
      .attr('class', 'title')
      .attr('x', this.config.width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(this.config.title);
  }

  renderStats() {
    if (!this.logRankResult) return;
    const stats = this.svg.append('g').attr('class', 'stats').attr('transform', `translate(${this.config.margin.left + 10},${this.config.margin.top + 10})`);
    stats.append('rect').attr('x', -5).attr('y', -12).attr('width', 130).attr('height', 40).attr('fill', 'white').attr('stroke', '#ddd').attr('rx', 4);
    const pText = this.logRankResult.pValue < 0.001 ? 'p < 0.001' : `p = ${this.logRankResult.pValue.toFixed(3)}`;
    stats.append('text').attr('y', 0).style('font-size', '11px').text('Log-rank test');
    stats.append('text').attr('y', 14).style('font-size', '11px').text(`χ² = ${this.logRankResult.chiSquare}, ${pText}`);
  }

  renderAtRiskTable() {
    const tableY = this.config.margin.top + this.plotHeight + 55;
    const table = this.svg.append('g').attr('class', 'at-risk').attr('transform', `translate(${this.config.margin.left},${tableY})`);
    const maxTime = this.xScale.domain()[1];
    const timePoints = d3.range(0, maxTime + 1, Math.ceil(maxTime / 6));

    table.append('text').attr('x', -50).attr('y', 0).style('font-size', '11px').style('font-weight', 'bold').text('At Risk');
    timePoints.forEach(t => {
      table.append('text').attr('x', this.xScale(t)).attr('y', 0).attr('text-anchor', 'middle').style('font-size', '10px').style('fill', '#666').text(Math.round(t));
    });

    Object.entries(this.groupResults).forEach(([name, data], i) => {
      const y = 15 + i * 14;
      table.append('text').attr('x', -50).attr('y', y).style('font-size', '10px').style('fill', data.color).text(name);
      timePoints.forEach(t => {
        const atRisk = data.data.filter(d => d.time >= t).length;
        table.append('text').attr('x', this.xScale(t)).attr('y', y).attr('text-anchor', 'middle').style('font-size', '10px').style('fill', data.color).text(atRisk);
      });
    });
  }

  setShowCI(show) { this.config.showCI = show; this.render(); }
  setShowCensored(show) { this.config.showCensored = show; this.render(); }
  setShowMedian(show) { this.config.showMedian = show; this.render(); }
  setShowAtRiskTable(show) {
    this.config.showAtRiskTable = show;
    this.plotHeight = this.config.height - this.config.margin.top - this.config.margin.bottom;
    if (show) this.plotHeight -= 60;
    this.setupScales();
    this.render();
  }

  destroy() { this.container.html(''); }
}

export default SurvivalCurve;
