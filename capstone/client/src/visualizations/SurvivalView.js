/**
 * Survival View
 * 
 * Displays Kaplan-Meier survival curves
 */

import * as d3 from 'd3';

export class SurvivalView {
  constructor(options) {
    this.container = options.container;
    this.dataService = options.dataService;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('survivalGroupBy')?.addEventListener('change', () => {
      this.render();
    });

    document.getElementById('updateSurvival')?.addEventListener('click', () => {
      this.render();
    });
  }

  render() {
    this.renderKaplanMeier();
    this.renderHazardRatio();
    this.renderSummaryTable();
  }

  calculateKaplanMeier(data) {
    // Sort by time
    const sorted = [...data].sort((a, b) => a.time - b.time);
    
    // Calculate survival probability at each event time
    let nAtRisk = sorted.length;
    let currentSurvival = 1;
    const steps = [{ time: 0, survival: 1, nAtRisk: sorted.length }];
    
    sorted.forEach((d, i) => {
      if (d.event === 1) {
        // Death/event occurred
        const nDeaths = 1;
        currentSurvival = currentSurvival * ((nAtRisk - nDeaths) / nAtRisk);
        steps.push({
          time: d.time,
          survival: currentSurvival,
          nAtRisk: nAtRisk - 1
        });
      }
      nAtRisk--;
    });
    
    // Add final point
    if (sorted.length > 0) {
      const maxTime = d3.max(sorted, d => d.time);
      steps.push({ time: maxTime, survival: currentSurvival, nAtRisk: 0 });
    }
    
    return steps;
  }

  renderKaplanMeier() {
    const container = document.getElementById('survivalPlot');
    if (!container) return;
    
    container.innerHTML = '';
    
    const survivalData = this.dataService.getSurvivalData();
    const groupBy = document.getElementById('survivalGroupBy')?.value || 'all';
    
    const width = container.clientWidth || 700;
    const height = 400;
    const margin = { top: 40, right: 150, bottom: 60, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .attr('fill', '#0f172a')
      .text('Kaplan-Meier Survival Curve');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group data
    let groups = {};
    if (groupBy === 'all') {
      groups = { 'All Patients': survivalData };
    } else if (groupBy === 'cancerType') {
      survivalData.forEach(d => {
        if (!groups[d.cancerType]) groups[d.cancerType] = [];
        groups[d.cancerType].push(d);
      });
    } else if (groupBy === 'mutation') {
      groups = {
        'TP53 Mutant': survivalData.filter(d => d.tp53Mutation),
        'TP53 Wild Type': survivalData.filter(d => !d.tp53Mutation)
      };
    }

    // Colors
    const colorScale = d3.scaleOrdinal(d3.schemeSet2);

    // Calculate KM curves for each group
    const kmCurves = {};
    Object.entries(groups).forEach(([groupName, data]) => {
      kmCurves[groupName] = this.calculateKaplanMeier(data);
    });

    // Get max time for scale
    const maxTime = d3.max(survivalData, d => d.time) || 60;

    // Scales
    const x = d3.scaleLinear()
      .domain([0, maxTime])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);

    // Step line generator
    const stepLine = d3.line()
      .x(d => x(d.time))
      .y(d => y(d.survival))
      .curve(d3.curveStepAfter);

    // Draw curves
    Object.entries(kmCurves).forEach(([groupName, data], i) => {
      const color = colorScale(groupName);
      
      // Line
      g.append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', 2.5)
        .attr('d', stepLine);

      // Confidence band (simplified)
      const areaGenerator = d3.area()
        .x(d => x(d.time))
        .y0(d => y(Math.max(0, d.survival - 0.1)))
        .y1(d => y(Math.min(1, d.survival + 0.1)))
        .curve(d3.curveStepAfter);

      g.append('path')
        .datum(data)
        .attr('fill', color)
        .attr('opacity', 0.1)
        .attr('d', areaGenerator);

      // Censored marks (for patients still alive at last follow-up)
      const groupData = groups[groupName];
      const censored = groupData.filter(d => d.event === 0);
      
      censored.forEach(d => {
        // Find survival at this time
        const curve = data.filter(c => c.time <= d.time);
        const survivalAtTime = curve.length > 0 ? curve[curve.length - 1].survival : 1;
        
        g.append('line')
          .attr('x1', x(d.time) - 3)
          .attr('x2', x(d.time) + 3)
          .attr('y1', y(survivalAtTime))
          .attr('y2', y(survivalAtTime))
          .attr('stroke', color)
          .attr('stroke-width', 2);
      });
    });

    // Axes
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(10))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 45)
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .text('Time (months)');

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y).tickFormat(d3.format('.0%')))
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -50)
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .text('Survival Probability');

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth + 20}, 20)`);

    Object.keys(kmCurves).forEach((groupName, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendItem.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', colorScale(groupName))
        .attr('stroke-width', 2.5);

      legendItem.append('text')
        .attr('x', 30)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .attr('font-size', '12px')
        .attr('fill', '#475569')
        .text(groupName);
    });

    // Add n at risk table
    this.renderNAtRiskTable(g, kmCurves, x, innerHeight, innerWidth, colorScale);
  }

  renderNAtRiskTable(g, kmCurves, xScale, innerHeight, innerWidth, colorScale) {
    const tableY = innerHeight + 60;
    const timePoints = [0, 12, 24, 36, 48, 60];
    
    // Filter time points based on data
    const maxTime = xScale.domain()[1];
    const filteredTimePoints = timePoints.filter(t => t <= maxTime);

    const table = g.append('g')
      .attr('transform', `translate(0, ${tableY})`);

    // Time labels
    table.append('text')
      .attr('x', -10)
      .attr('y', 0)
      .attr('text-anchor', 'end')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('fill', '#64748b')
      .text('N at risk');

    filteredTimePoints.forEach(t => {
      table.append('text')
        .attr('x', xScale(t))
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('fill', '#64748b')
        .text(t);
    });
  }

  renderHazardRatio() {
    const container = document.getElementById('hazardRatioPlot');
    if (!container) return;
    
    container.innerHTML = '';
    
    const width = container.clientWidth || 300;
    const height = 200;
    const margin = { top: 40, right: 40, bottom: 40, left: 120 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', '#0f172a')
      .text('Forest Plot - Hazard Ratios');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Mock hazard ratio data
    const hrData = [
      { variable: 'TP53 Mutation', hr: 2.1, lower: 1.4, upper: 3.2 },
      { variable: 'Age > 10', hr: 1.5, lower: 0.9, upper: 2.4 },
      { variable: 'Stage IV', hr: 1.8, lower: 1.2, upper: 2.7 }
    ];

    const y = d3.scaleBand()
      .domain(hrData.map(d => d.variable))
      .range([0, innerHeight])
      .padding(0.3);

    const x = d3.scaleLog()
      .domain([0.5, 5])
      .range([0, innerWidth]);

    // Reference line at HR = 1
    g.append('line')
      .attr('x1', x(1))
      .attr('x2', x(1))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#94a3b8')
      .attr('stroke-dasharray', '4,4');

    // HR points and CIs
    hrData.forEach(d => {
      const yPos = y(d.variable) + y.bandwidth() / 2;

      // CI line
      g.append('line')
        .attr('x1', x(d.lower))
        .attr('x2', x(d.upper))
        .attr('y1', yPos)
        .attr('y2', yPos)
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 2);

      // Point estimate
      g.append('rect')
        .attr('x', x(d.hr) - 5)
        .attr('y', yPos - 5)
        .attr('width', 10)
        .attr('height', 10)
        .attr('fill', '#3b82f6');
    });

    // Y axis
    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    // X axis
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x)
        .tickValues([0.5, 1, 2, 3, 4, 5])
        .tickFormat(d3.format('.1f')));
  }

  renderSummaryTable() {
    const container = document.getElementById('survivalSummary');
    if (!container) return;
    
    const survivalData = this.dataService.getSurvivalData();
    
    // Calculate summary statistics
    const totalPatients = survivalData.length;
    const events = survivalData.filter(d => d.event === 1).length;
    const censored = survivalData.filter(d => d.event === 0).length;
    const medianSurvival = this.calculateMedianSurvival(survivalData);
    
    container.innerHTML = `
      <div class="summary-stats">
        <h4>Survival Summary</h4>
        <table class="stats-table">
          <tr>
            <td>Total Patients</td>
            <td><strong>${totalPatients}</strong></td>
          </tr>
          <tr>
            <td>Events (Deaths)</td>
            <td><strong>${events}</strong></td>
          </tr>
          <tr>
            <td>Censored</td>
            <td><strong>${censored}</strong></td>
          </tr>
          <tr>
            <td>Median Survival</td>
            <td><strong>${medianSurvival ? medianSurvival.toFixed(1) + ' months' : 'Not reached'}</strong></td>
          </tr>
          <tr>
            <td>Follow-up (median)</td>
            <td><strong>${d3.median(survivalData, d => d.time).toFixed(1)} months</strong></td>
          </tr>
        </table>
      </div>
    `;
  }

  calculateMedianSurvival(data) {
    const km = this.calculateKaplanMeier(data);
    const belowMedian = km.find(d => d.survival < 0.5);
    return belowMedian ? belowMedian.time : null;
  }
}
