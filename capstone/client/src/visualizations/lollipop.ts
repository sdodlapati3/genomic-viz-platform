/**
 * Lollipop Plot Visualization
 * 
 * Renders mutation data as a lollipop plot on a protein backbone.
 * This is a core ProteinPaint-style visualization.
 */

import * as d3 from 'd3';
import type { GeneViewConfig } from '../embed/config.schema';

interface LollipopData {
  gene: {
    symbol: string;
    name: string;
    chromosome: string;
    proteinLength: number;
  };
  mutations: Array<{
    position: number;
    count: number;
    type: string;
    aaChange: string;
  }>;
  domains: Array<{
    name: string;
    start: number;
    end: number;
    color: string;
  }>;
}

/**
 * Render lollipop plot to SVG
 */
export function renderLollipopPlot(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  data: unknown,
  config: GeneViewConfig
): void {
  const lollipopData = data as LollipopData;
  const { dimensions, style, showDomains, showMutations, highlightPositions } = config;
  
  const width = dimensions?.width || 800;
  const height = dimensions?.height || 400;
  const margin = dimensions?.margin || { top: 40, right: 40, bottom: 60, left: 60 };
  
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // Scales
  const x = d3.scaleLinear()
    .domain([0, lollipopData.gene.proteinLength])
    .range([0, innerWidth]);

  const maxCount = d3.max(lollipopData.mutations, d => d.count) || 1;
  const y = d3.scaleLinear()
    .domain([0, maxCount])
    .nice()
    .range([innerHeight - 50, 20]);

  // Color scale for mutation types
  const colorScale = d3.scaleOrdinal<string>()
    .domain(['missense', 'nonsense', 'frameshift', 'splice', 'silent'])
    .range(['#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#95a5a6']);

  // Draw protein backbone
  const backboneY = innerHeight - 30;
  const backboneHeight = 20;
  
  g.append('rect')
    .attr('x', 0)
    .attr('y', backboneY)
    .attr('width', innerWidth)
    .attr('height', backboneHeight)
    .attr('fill', '#bdc3c7')
    .attr('rx', 5);

  // Draw domains if enabled
  if (showDomains && lollipopData.domains) {
    g.selectAll('.domain')
      .data(lollipopData.domains)
      .join('rect')
      .attr('class', 'domain')
      .attr('x', d => x(d.start))
      .attr('y', backboneY)
      .attr('width', d => x(d.end) - x(d.start))
      .attr('height', backboneHeight)
      .attr('fill', d => d.color || '#3498db')
      .attr('rx', 3)
      .style('opacity', 0.8);

    // Domain labels
    g.selectAll('.domain-label')
      .data(lollipopData.domains)
      .join('text')
      .attr('class', 'domain-label')
      .attr('x', d => (x(d.start) + x(d.end)) / 2)
      .attr('y', backboneY + backboneHeight / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .text(d => {
        const width = x(d.end) - x(d.start);
        return width > 30 ? d.name : '';
      });
  }

  // Draw mutations if enabled
  if (showMutations && lollipopData.mutations) {
    // Stems
    g.selectAll('.stem')
      .data(lollipopData.mutations)
      .join('line')
      .attr('class', 'stem')
      .attr('x1', d => x(d.position))
      .attr('y1', backboneY)
      .attr('x2', d => x(d.position))
      .attr('y2', d => y(d.count))
      .attr('stroke', '#666')
      .attr('stroke-width', 2);

    // Mutation circles
    const circles = g.selectAll('.mutation')
      .data(lollipopData.mutations)
      .join('circle')
      .attr('class', 'mutation')
      .attr('cx', d => x(d.position))
      .attr('cy', d => y(d.count))
      .attr('r', 8)
      .attr('fill', d => colorScale(d.type))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    // Highlight specific positions
    if (highlightPositions && highlightPositions.length > 0) {
      circles
        .filter(d => highlightPositions.includes(d.position))
        .attr('r', 12)
        .attr('stroke', '#f39c12')
        .attr('stroke-width', 3);
    }

    // Tooltips
    if (config.tooltips !== false) {
      const tooltip = d3.select('body')
        .append('div')
        .attr('class', 'lollipop-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background', 'rgba(0,0,0,0.8)')
        .style('color', 'white')
        .style('padding', '8px 12px')
        .style('border-radius', '4px')
        .style('font-size', '12px')
        .style('pointer-events', 'none')
        .style('z-index', '1000');

      circles
        .on('mouseover', function(event, d) {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 12);

          tooltip
            .html(`
              <strong>${d.aaChange}</strong><br/>
              Position: ${d.position}<br/>
              Type: ${d.type}<br/>
              Count: ${d.count}
            `)
            .style('visibility', 'visible')
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(200)
            .attr('r', 8);
          tooltip.style('visibility', 'hidden');
        })
        .on('click', function(event, d) {
          if (config.onClick) {
            config.onClick({ position: d.position, mutation: d });
          }
        });
    }
  }

  // X axis
  g.append('g')
    .attr('transform', `translate(0,${innerHeight})`)
    .call(d3.axisBottom(x).ticks(10))
    .append('text')
    .attr('x', innerWidth / 2)
    .attr('y', 35)
    .attr('fill', '#333')
    .attr('text-anchor', 'middle')
    .text('Amino Acid Position');

  // Y axis
  g.append('g')
    .call(d3.axisLeft(y).ticks(5))
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', -40)
    .attr('x', -innerHeight / 2)
    .attr('fill', '#333')
    .attr('text-anchor', 'middle')
    .text('Mutation Count');

  // Title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 20)
    .attr('text-anchor', 'middle')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text(`${lollipopData.gene.symbol} - ${lollipopData.gene.name}`);

  // Legend
  if (config.showLegend !== false) {
    const legendItems = ['missense', 'nonsense', 'frameshift', 'splice'];
    const legend = svg.append('g')
      .attr('transform', `translate(${width - 120}, 40)`);

    legendItems.forEach((type, i) => {
      const item = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      item.append('circle')
        .attr('r', 6)
        .attr('fill', colorScale(type));
      
      item.append('text')
        .attr('x', 12)
        .attr('y', 4)
        .attr('font-size', '11px')
        .text(type);
    });
  }
}

export default renderLollipopPlot;
