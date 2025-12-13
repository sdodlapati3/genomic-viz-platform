/**
 * Bar Chart Component
 * Reusable D3 bar chart for gene expression data
 */

import * as d3 from 'd3';
import type { ProcessedGeneData } from '../utils/dataTransform';
import { createLinearScale, createBandScale, createColorScale } from '../utils/scales';

export interface ChartOptions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  title?: string;
  xLabel?: string;
  yLabel?: string;
  colorScheme?: readonly string[];
  animated?: boolean;
}

const DEFAULT_OPTIONS: ChartOptions = {
  width: 600,
  height: 400,
  margin: { top: 20, right: 20, bottom: 40, left: 60 },
  animated: true,
};

/**
 * Create a bar chart visualization
 */
export function createBarChart(
  container: HTMLElement,
  data: ProcessedGeneData[],
  options: Partial<ChartOptions> = {}
): SVGSVGElement {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, margin } = config;

  // Calculate inner dimensions
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Clear existing content
  container.innerHTML = '';

  // Create SVG
  const svg = d3
    .select(container)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'bar-chart')
    .attr('role', 'img')
    .attr('aria-label', config.title || 'Bar chart');

  // Create chart group
  const chartGroup = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Create scales
  const xScale = createBandScale(
    data.map((d) => d.gene),
    [0, innerWidth],
    { padding: 0.2 }
  );

  const yScale = createLinearScale([0, d3.max(data, (d) => d.expression) || 0], [innerHeight, 0], {
    nice: true,
  });

  const colorScale = createColorScale(
    data.map((d) => d.category || 'default'),
    config.colorScheme || d3.schemeCategory10
  );

  // Create axes
  const xAxis = d3.axisBottom(xScale);
  const yAxis = d3.axisLeft(yScale).ticks(5);

  // Add X axis
  chartGroup
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('transform', 'rotate(-45)')
    .style('text-anchor', 'end')
    .attr('dx', '-0.5em')
    .attr('dy', '0.5em');

  // Add Y axis
  chartGroup.append('g').attr('class', 'y-axis').call(yAxis);

  // Add bars
  const bars = chartGroup
    .selectAll('.bar')
    .data(data)
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', (d) => xScale(d.gene) || 0)
    .attr('width', xScale.bandwidth())
    .attr('fill', (d) => colorScale(d.category || 'default'))
    .attr('rx', 2)
    .attr('ry', 2);

  // Animate bars or set final position
  if (config.animated) {
    bars
      .attr('y', innerHeight)
      .attr('height', 0)
      .transition()
      .duration(750)
      .delay((_, i) => i * 50)
      .attr('y', (d) => yScale(d.expression))
      .attr('height', (d) => innerHeight - yScale(d.expression));
  } else {
    bars.attr('y', (d) => yScale(d.expression)).attr('height', (d) => innerHeight - yScale(d.expression));
  }

  // Add tooltips
  bars
    .on('mouseenter', function (event, d) {
      d3.select(this).attr('opacity', 0.8);

      // Create tooltip
      const tooltip = d3
        .select(container)
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .html(`<strong>${d.gene}</strong><br/>Expression: ${d.expression.toFixed(2)} TPM`);

      const [mouseX, mouseY] = d3.pointer(event, container);
      tooltip.style('left', `${mouseX + 10}px`).style('top', `${mouseY - 10}px`);
    })
    .on('mouseleave', function () {
      d3.select(this).attr('opacity', 1);
      d3.select(container).selectAll('.tooltip').remove();
    });

  // Add title
  if (config.title) {
    svg
      .append('text')
      .attr('class', 'chart-title')
      .attr('x', width / 2)
      .attr('y', margin.top / 2)
      .attr('text-anchor', 'middle')
      .style('font-size', '16px')
      .style('font-weight', 'bold')
      .text(config.title);
  }

  // Add axis labels
  if (config.xLabel) {
    svg
      .append('text')
      .attr('class', 'x-label')
      .attr('x', width / 2)
      .attr('y', height - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(config.xLabel);
  }

  if (config.yLabel) {
    svg
      .append('text')
      .attr('class', 'y-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '12px')
      .text(config.yLabel);
  }

  return svg.node() as SVGSVGElement;
}

/**
 * Update bar chart with new data
 */
export function updateBarChart(
  svg: SVGSVGElement,
  data: ProcessedGeneData[],
  options: Partial<ChartOptions> = {}
): void {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, margin } = config;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const selection = d3.select(svg);
  const chartGroup = selection.select('g');

  // Update scales
  const xScale = createBandScale(
    data.map((d) => d.gene),
    [0, innerWidth],
    { padding: 0.2 }
  );

  const yScale = createLinearScale([0, d3.max(data, (d) => d.expression) || 0], [innerHeight, 0], {
    nice: true,
  });

  // Update axes
  chartGroup
    .select<SVGGElement>('.x-axis')
    .transition()
    .duration(500)
    .call(d3.axisBottom(xScale) as any);

  chartGroup
    .select<SVGGElement>('.y-axis')
    .transition()
    .duration(500)
    .call(d3.axisLeft(yScale).ticks(5) as any);

  // Update bars
  const bars = chartGroup.selectAll<SVGRectElement, ProcessedGeneData>('.bar').data(data);

  // Remove old bars
  bars.exit().transition().duration(300).attr('height', 0).attr('y', innerHeight).remove();

  // Update existing and add new bars
  bars
    .enter()
    .append('rect')
    .attr('class', 'bar')
    .attr('x', (d) => xScale(d.gene) || 0)
    .attr('width', xScale.bandwidth())
    .attr('y', innerHeight)
    .attr('height', 0)
    .merge(bars)
    .transition()
    .duration(500)
    .attr('x', (d) => xScale(d.gene) || 0)
    .attr('width', xScale.bandwidth())
    .attr('y', (d) => yScale(d.expression))
    .attr('height', (d) => innerHeight - yScale(d.expression));
}
