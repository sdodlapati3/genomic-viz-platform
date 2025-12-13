/**
 * Heatmap Visualization
 * 
 * Renders gene expression data as a clustered heatmap.
 */

import * as d3 from 'd3';
import type { HeatmapConfig } from '../embed/config.schema';

interface HeatmapData {
  genes: string[];
  samples: string[];
  values: number[][];
}

/**
 * Render heatmap to SVG
 */
export function renderHeatmap(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: unknown,
  config: HeatmapConfig
): void {
  const heatmapData = data as HeatmapData;
  const { dimensions, colorScale: colorScaleName = 'RdBu', colorCenter = 0 } = config;
  
  const width = dimensions?.width || 800;
  const height = dimensions?.height || 600;
  const margin = dimensions?.margin || { top: 100, right: 100, bottom: 60, left: 100 };
  
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Cell dimensions
  const cellWidth = innerWidth / heatmapData.samples.length;
  const cellHeight = innerHeight / heatmapData.genes.length;

  // Find data range
  const allValues = heatmapData.values.flat();
  const minVal = d3.min(allValues) ?? -3;
  const maxVal = d3.max(allValues) ?? 3;
  const absMax = Math.max(Math.abs(minVal), Math.abs(maxVal));

  // Color scale
  const colorScale = d3.scaleSequential()
    .domain([-absMax, absMax])
    .interpolator(d3.interpolateRdBu);

  // Draw cells
  heatmapData.genes.forEach((gene, geneIdx) => {
    heatmapData.samples.forEach((sample, sampleIdx) => {
      const value = heatmapData.values[geneIdx]?.[sampleIdx] ?? 0;
      
      g.append('rect')
        .attr('x', sampleIdx * cellWidth)
        .attr('y', geneIdx * cellHeight)
        .attr('width', cellWidth - 1)
        .attr('height', cellHeight - 1)
        .attr('fill', colorScale(value))
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
          d3.select(this).attr('stroke', '#333').attr('stroke-width', 2);
        })
        .on('mouseout', function() {
          d3.select(this).attr('stroke', 'none');
        });
    });
  });

  // Gene labels
  if (config.showRowLabels !== false && cellHeight > 8) {
    g.selectAll('.gene-label')
      .data(heatmapData.genes)
      .join('text')
      .attr('class', 'gene-label')
      .attr('x', -5)
      .attr('y', (d, i) => i * cellHeight + cellHeight / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', Math.min(cellHeight - 2, 10))
      .attr('font-style', 'italic')
      .text(d => d);
  }

  // Sample labels
  if (config.showColumnLabels !== false && cellWidth > 8) {
    g.selectAll('.sample-label')
      .data(heatmapData.samples)
      .join('text')
      .attr('class', 'sample-label')
      .attr('x', (d, i) => i * cellWidth + cellWidth / 2)
      .attr('y', -5)
      .attr('transform', (d, i) => {
        const x = i * cellWidth + cellWidth / 2;
        return `rotate(-45, ${x}, -5)`;
      })
      .attr('text-anchor', 'start')
      .attr('font-size', Math.min(cellWidth - 2, 10))
      .text(d => d);
  }

  // Color legend
  const legendWidth = 100;
  const legendHeight = 15;
  const legendX = innerWidth + 20;
  const legendY = innerHeight / 2 - 50;

  const legendScale = d3.scaleLinear()
    .domain([-absMax, absMax])
    .range([0, legendWidth]);

  const legendAxis = d3.axisBottom(legendScale).ticks(5);

  const legendGradient = svg.append('defs')
    .append('linearGradient')
    .attr('id', 'heatmap-legend-gradient')
    .attr('x1', '0%')
    .attr('x2', '100%');

  const numStops = 10;
  for (let i = 0; i <= numStops; i++) {
    const t = i / numStops;
    const val = -absMax + t * 2 * absMax;
    legendGradient.append('stop')
      .attr('offset', `${t * 100}%`)
      .attr('stop-color', colorScale(val));
  }

  const legend = g.append('g')
    .attr('transform', `translate(${legendX},${legendY})`);

  legend.append('rect')
    .attr('width', legendWidth)
    .attr('height', legendHeight)
    .attr('fill', 'url(#heatmap-legend-gradient)');

  legend.append('g')
    .attr('transform', `translate(0,${legendHeight})`)
    .call(legendAxis);

  legend.append('text')
    .attr('x', legendWidth / 2)
    .attr('y', -5)
    .attr('text-anchor', 'middle')
    .attr('font-size', '11px')
    .text('Expression (z-score)');

  // Title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text('Gene Expression Heatmap');
}

export default renderHeatmap;
