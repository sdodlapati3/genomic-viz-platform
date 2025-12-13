/**
 * Volcano Plot Visualization
 * 
 * Renders differential expression results as a volcano plot.
 */

import * as d3 from 'd3';
import type { VolcanoPlotConfig } from '../embed/config.schema';

interface VolcanoData {
  group1: string;
  group2: string;
  genes: Array<{
    gene: string;
    log2FoldChange: number;
    pValue: number;
  }>;
}

/**
 * Render volcano plot to SVG
 */
export function renderVolcanoPlot(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: unknown,
  config: VolcanoPlotConfig
): void {
  const volcanoData = data as VolcanoData;
  const { dimensions, pValueThreshold = 0.05, foldChangeThreshold = 2, highlightGenes = [] } = config;
  
  const width = dimensions?.width || 600;
  const height = dimensions?.height || 500;
  const margin = dimensions?.margin || { top: 40, right: 40, bottom: 60, left: 60 };
  
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Calculate -log10(p-value)
  const processedGenes = volcanoData.genes.map(gene => ({
    ...gene,
    negLog10P: -Math.log10(gene.pValue),
  }));

  // Scales
  const maxFC = d3.max(processedGenes, d => Math.abs(d.log2FoldChange)) ?? 4;
  const maxP = d3.max(processedGenes, d => d.negLog10P) ?? 10;

  const x = d3.scaleLinear()
    .domain([-maxFC - 0.5, maxFC + 0.5])
    .range([0, innerWidth]);

  const y = d3.scaleLinear()
    .domain([0, maxP + 0.5])
    .range([innerHeight, 0]);

  // Threshold lines
  const logFCThreshold = Math.log2(foldChangeThreshold);
  const negLog10PThreshold = -Math.log10(pValueThreshold);

  // Horizontal threshold line (p-value)
  g.append('line')
    .attr('x1', 0)
    .attr('x2', innerWidth)
    .attr('y1', y(negLog10PThreshold))
    .attr('y2', y(negLog10PThreshold))
    .attr('stroke', '#999')
    .attr('stroke-dasharray', '5,5');

  // Vertical threshold lines (fold change)
  g.append('line')
    .attr('x1', x(-logFCThreshold))
    .attr('x2', x(-logFCThreshold))
    .attr('y1', 0)
    .attr('y2', innerHeight)
    .attr('stroke', '#999')
    .attr('stroke-dasharray', '5,5');

  g.append('line')
    .attr('x1', x(logFCThreshold))
    .attr('x2', x(logFCThreshold))
    .attr('y1', 0)
    .attr('y2', innerHeight)
    .attr('stroke', '#999')
    .attr('stroke-dasharray', '5,5');

  // Color based on significance
  const getColor = (d: typeof processedGenes[0]) => {
    const isSignificant = d.negLog10P > negLog10PThreshold;
    const isUpregulated = d.log2FoldChange > logFCThreshold;
    const isDownregulated = d.log2FoldChange < -logFCThreshold;

    if (isSignificant && isUpregulated) return '#e74c3c';
    if (isSignificant && isDownregulated) return '#3498db';
    return '#95a5a6';
  };

  // Draw points
  const circles = g.selectAll('.point')
    .data(processedGenes)
    .join('circle')
    .attr('class', 'point')
    .attr('cx', d => x(d.log2FoldChange))
    .attr('cy', d => y(d.negLog10P))
    .attr('r', d => highlightGenes.includes(d.gene) ? 6 : 3)
    .attr('fill', getColor)
    .attr('opacity', 0.7)
    .style('cursor', 'pointer');

  // Tooltips and interactions
  if (config.interactive !== false) {
    const tooltip = d3.select('body')
      .append('div')
      .attr('class', 'volcano-tooltip')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background', 'rgba(0,0,0,0.8)')
      .style('color', 'white')
      .style('padding', '8px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none');

    circles
      .on('mouseover', function(event, d) {
        d3.select(this).attr('r', 6).attr('opacity', 1);
        tooltip
          .html(`
            <strong>${d.gene}</strong><br/>
            log2FC: ${d.log2FoldChange.toFixed(3)}<br/>
            p-value: ${d.pValue.toExponential(2)}
          `)
          .style('visibility', 'visible')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .attr('r', highlightGenes.includes(d.gene) ? 6 : 3)
          .attr('opacity', 0.7);
        tooltip.style('visibility', 'hidden');
      })
      .on('click', function(event, d) {
        if (config.onGeneClick) {
          config.onGeneClick({
            gene: d.gene,
            log2FoldChange: d.log2FoldChange,
            pValue: d.pValue,
          });
        }
      });
  }

  // Labels for top genes
  if (config.showLabels !== false) {
    const topGenes = processedGenes
      .filter(d => d.negLog10P > negLog10PThreshold && Math.abs(d.log2FoldChange) > logFCThreshold)
      .sort((a, b) => b.negLog10P - a.negLog10P)
      .slice(0, config.labelCount || 10);

    g.selectAll('.gene-label')
      .data(topGenes)
      .join('text')
      .attr('class', 'gene-label')
      .attr('x', d => x(d.log2FoldChange))
      .attr('y', d => y(d.negLog10P) - 8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-style', 'italic')
      .text(d => d.gene);
  }

  // X axis
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x))
    .append('text')
    .attr('x', innerWidth / 2)
    .attr('y', 40)
    .attr('fill', '#333')
    .attr('text-anchor', 'middle')
    .text('log2(Fold Change)');

  // Y axis
  g.append('g')
    .call(d3.axisLeft(y))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -45)
    .attr('x', -innerHeight / 2)
    .attr('fill', '#333')
    .attr('text-anchor', 'middle')
    .text('-log10(p-value)');

  // Title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text(`${volcanoData.group1} vs ${volcanoData.group2}`);

  // Legend
  const legend = g.append('g')
    .attr('transform', `translate(${innerWidth - 100}, 20)`);

  [
    { label: 'Up-regulated', color: '#e74c3c' },
    { label: 'Down-regulated', color: '#3498db' },
    { label: 'Not significant', color: '#95a5a6' },
  ].forEach((item, i) => {
    const row = legend.append('g')
      .attr('transform', `translate(0, ${i * 18})`);
    
    row.append('circle')
      .attr('r', 5)
      .attr('fill', item.color);
    
    row.append('text')
      .attr('x', 10)
      .attr('y', 4)
      .attr('font-size', '10px')
      .text(item.label);
  });
}

export default renderVolcanoPlot;
