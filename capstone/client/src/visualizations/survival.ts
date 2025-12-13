/**
 * Survival Plot Visualization
 * 
 * Renders Kaplan-Meier survival curves for cohort comparison.
 */

import * as d3 from 'd3';
import type { SurvivalPlotConfig } from '../embed/config.schema';

interface SurvivalData {
  curves: Array<{
    name: string;
    color: string;
    data: Array<{
      time: number;
      survival: number;
      atRisk: number;
    }>;
  }>;
  logRankPValue?: number;
}

/**
 * Render survival plot to SVG
 */
export function renderSurvivalPlot(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: unknown,
  config: SurvivalPlotConfig
): void {
  const survivalData = data as SurvivalData;
  const { dimensions, timeUnit = 'months', showConfidenceInterval, showAtRisk, showPValue } = config;
  
  const width = dimensions?.width || 600;
  const height = dimensions?.height || 400;
  const margin = dimensions?.margin || { top: 40, right: 40, bottom: 80, left: 60 };
  
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Find max time across all curves
  const maxTime = d3.max(survivalData.curves.flatMap(c => c.data.map(d => d.time))) || 60;

  // Scales
  const x = d3.scaleLinear()
    .domain([0, maxTime])
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0, 1])
    .range([innerHeight, 0]);

  // Line generator (step function for survival)
  const line = d3.line<{ time: number; survival: number }>()
    .x(d => x(d.time))
    .y(d => y(d.survival))
    .curve(d3.curveStepAfter);

  // Draw curves
  survivalData.curves.forEach((curve, idx) => {
    // Main survival line
    g.append('path')
      .datum(curve.data)
      .attr('fill', 'none')
      .attr('stroke', curve.color)
      .attr('stroke-width', 2)
      .attr('d', line);

    // Censoring marks
    g.selectAll(`.censor-${idx}`)
      .data(curve.data.filter((d, i, arr) => i < arr.length - 1))
      .join('line')
      .attr('class', `censor-${idx}`)
      .attr('x1', d => x(d.time))
      .attr('y1', d => y(d.survival) - 3)
      .attr('x2', d => x(d.time))
      .attr('y2', d => y(d.survival) + 3)
      .attr('stroke', curve.color)
      .attr('stroke-width', 1.5);
  });

  // X axis
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(10))
    .append('text')
    .attr('x', innerWidth / 2)
    .attr('y', 35)
    .attr('fill', '#333')
    .attr('text-anchor', 'middle')
    .text(`Time (${timeUnit})`);

  // Y axis
  g.append('g')
    .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(d as number) * 100}%`))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -45)
    .attr('x', -innerHeight / 2)
    .attr('fill', '#333')
    .attr('text-anchor', 'middle')
    .text('Survival Probability');

  // Legend
  const legend = g.append('g')
    .attr('transform', `translate(${innerWidth - 150}, 20)`);

  survivalData.curves.forEach((curve, i) => {
    const item = legend.append('g')
      .attr('transform', `translate(0, ${i * 20})`);
    
    item.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 20)
      .attr('y2', 0)
      .attr('stroke', curve.color)
      .attr('stroke-width', 2);
    
    item.append('text')
      .attr('x', 25)
      .attr('y', 4)
      .attr('font-size', '11px')
      .text(curve.name);
  });

  // P-value display
  if (showPValue !== false && survivalData.logRankPValue !== undefined) {
    g.append('text')
      .attr('x', innerWidth - 10)
      .attr('y', innerHeight - 10)
      .attr('text-anchor', 'end')
      .attr('font-size', '12px')
      .text(`Log-rank p = ${survivalData.logRankPValue.toFixed(4)}`);
  }

  // At-risk table
  if (showAtRisk !== false) {
    const atRiskY = innerHeight + 50;
    const timePoints = [0, 12, 24, 36, 48, 60].filter(t => t <= maxTime);

    survivalData.curves.forEach((curve, i) => {
      // Row label
      g.append('text')
        .attr('x', -5)
        .attr('y', atRiskY + i * 15)
        .attr('text-anchor', 'end')
        .attr('font-size', '10px')
        .attr('fill', curve.color)
        .text(curve.name);

      // At-risk numbers
      timePoints.forEach(t => {
        const dataPoint = curve.data.find(d => d.time >= t);
        g.append('text')
          .attr('x', x(t))
          .attr('y', atRiskY + i * 15)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .text(dataPoint?.atRisk ?? '-');
      });
    });
  }

  // Title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text('Kaplan-Meier Survival Curves');
}

export default renderSurvivalPlot;
