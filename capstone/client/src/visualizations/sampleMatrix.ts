/**
 * Sample Matrix Visualization
 * 
 * Renders a genes × samples matrix showing mutation status.
 * Similar to cBioPortal's OncoPrint visualization.
 */

import * as d3 from 'd3';
import type { SampleMatrixConfig } from '../embed/config.schema';

interface SampleMatrixData {
  genes: string[];
  samples: string[];
  matrix: (string | null)[][];
}

/**
 * Render sample matrix to SVG
 */
export function renderSampleMatrix(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: unknown,
  config: SampleMatrixConfig
): void {
  const matrixData = data as SampleMatrixData;
  const { dimensions, cellSize = 15, cellPadding = 1 } = config;
  
  const width = dimensions?.width || 800;
  const height = dimensions?.height || 600;
  const margin = dimensions?.margin || { top: 100, right: 40, bottom: 60, left: 120 };
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Color scale for mutation types
  const colorScale = d3.scaleOrdinal<string>()
    .domain(['missense', 'nonsense', 'frameshift', 'splice', 'silent', 'amplification', 'deletion'])
    .range(['#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#95a5a6', '#e91e63', '#00bcd4']);

  // Draw cells
  matrixData.genes.forEach((gene, geneIdx) => {
    matrixData.samples.forEach((sample, sampleIdx) => {
      const mutation = matrixData.matrix[geneIdx]?.[sampleIdx];
      
      const cell = g.append('rect')
        .attr('x', sampleIdx * (cellSize + cellPadding))
        .attr('y', geneIdx * (cellSize + cellPadding))
        .attr('width', cellSize)
        .attr('height', cellSize)
        .attr('fill', mutation ? colorScale(mutation) : '#f5f5f5')
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .style('cursor', mutation ? 'pointer' : 'default');

      if (mutation && config.interactive !== false) {
        cell
          .on('mouseover', function(event) {
            d3.select(this).attr('stroke', '#333').attr('stroke-width', 2);
            // Show tooltip
          })
          .on('mouseout', function() {
            d3.select(this).attr('stroke', '#fff').attr('stroke-width', 0.5);
          })
          .on('click', function(event) {
            if (config.onSelect) {
              config.onSelect({ genes: [gene], samples: [sample] });
            }
          });
      }
    });
  });

  // Gene labels (rows)
  if (config.showGeneAnnotations !== false) {
    g.selectAll('.gene-label')
      .data(matrixData.genes)
      .join('text')
      .attr('class', 'gene-label')
      .attr('x', -5)
      .attr('y', (d, i) => i * (cellSize + cellPadding) + cellSize / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('font-size', '11px')
      .attr('font-style', 'italic')
      .text(d => d);
  }

  // Sample labels (columns)
  if (config.showSampleAnnotations !== false) {
    g.selectAll('.sample-label')
      .data(matrixData.samples)
      .join('text')
      .attr('class', 'sample-label')
      .attr('x', (d, i) => i * (cellSize + cellPadding) + cellSize / 2)
      .attr('y', -5)
      .attr('transform', (d, i) => {
        const x = i * (cellSize + cellPadding) + cellSize / 2;
        return `rotate(-45, ${x}, -5)`;
      })
      .attr('text-anchor', 'start')
      .attr('font-size', '10px')
      .text(d => d);
  }

  // Title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text('Mutation Matrix');

  // Legend
  const legendItems = ['missense', 'nonsense', 'frameshift', 'silent'];
  const legend = svg.append('g')
    .attr('transform', `translate(${width - 100}, ${margin.top})`);

  legendItems.forEach((type, i) => {
    const item = legend.append('g')
      .attr('transform', `translate(0, ${i * 18})`);
    
    item.append('rect')
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', colorScale(type));
    
    item.append('text')
      .attr('x', 16)
      .attr('y', 10)
      .attr('font-size', '10px')
      .text(type);
  });
}

export default renderSampleMatrix;
