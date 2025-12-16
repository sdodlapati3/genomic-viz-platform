/**
 * Embedded Visualizations
 *
 * Lightweight, self-contained visualizations that render directly
 * in the Dataset Selector without needing external servers.
 */

import * as d3 from 'd3';
import type { Dataset } from './types';

// Mutation data type
interface Mutation {
  position: number;
  aaChange: string;
  type: 'missense' | 'nonsense' | 'frameshift' | 'splice';
  count: number;
}

// Colors for mutation types
const MUTATION_COLORS: Record<string, string> = {
  missense: '#3b82f6',
  nonsense: '#ef4444',
  frameshift: '#f59e0b',
  splice: '#8b5cf6',
};

/**
 * Render a Lollipop Plot
 */
export function renderLollipopPlot(container: HTMLElement, dataset: Dataset): void {
  container.innerHTML = '';

  const width = container.clientWidth - 40;
  const height = 400;
  const margin = { top: 40, right: 30, bottom: 60, left: 50 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Generate demo mutations based on dataset
  const mutations = generateMutations(dataset);
  const proteinLength = 393; // TP53 length

  const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Title
  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .attr('fill', '#fff')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text(`TP53 Mutations - ${dataset.shortName}`);

  // Scales
  const xScale = d3.scaleLinear().domain([0, proteinLength]).range([0, plotWidth]);

  const maxCount = d3.max(mutations, (d) => d.count) || 10;
  const yScale = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([plotHeight - 50, 0]);

  // Protein backbone
  g.append('rect')
    .attr('x', 0)
    .attr('y', plotHeight - 45)
    .attr('width', plotWidth)
    .attr('height', 30)
    .attr('fill', '#374151')
    .attr('rx', 4);

  // Domain annotations
  const domains = [
    { name: 'TAD', start: 1, end: 67, color: '#10b981' },
    { name: 'DBD', start: 102, end: 292, color: '#6366f1' },
    { name: 'Tet', start: 323, end: 356, color: '#f59e0b' },
  ];

  domains.forEach((domain) => {
    g.append('rect')
      .attr('x', xScale(domain.start))
      .attr('y', plotHeight - 43)
      .attr('width', xScale(domain.end) - xScale(domain.start))
      .attr('height', 26)
      .attr('fill', domain.color)
      .attr('rx', 3);

    g.append('text')
      .attr('x', xScale((domain.start + domain.end) / 2))
      .attr('y', plotHeight - 25)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text(domain.name);
  });

  // Lollipop stems
  g.selectAll('.stem')
    .data(mutations)
    .join('line')
    .attr('class', 'stem')
    .attr('x1', (d) => xScale(d.position))
    .attr('x2', (d) => xScale(d.position))
    .attr('y1', (d) => yScale(d.count))
    .attr('y2', plotHeight - 45)
    .attr('stroke', '#6b7280')
    .attr('stroke-width', 1.5);

  // Lollipop heads
  const heads = g
    .selectAll('.head')
    .data(mutations)
    .join('circle')
    .attr('class', 'head')
    .attr('cx', (d) => xScale(d.position))
    .attr('cy', (d) => yScale(d.count))
    .attr('r', (d) => Math.min(4 + d.count, 12))
    .attr('fill', (d) => MUTATION_COLORS[d.type])
    .attr('stroke', '#fff')
    .attr('stroke-width', 1.5)
    .style('cursor', 'pointer');

  // Tooltip
  const tooltip = d3
    .select(container)
    .append('div')
    .attr('class', 'viz-tooltip')
    .style('position', 'absolute')
    .style('background', '#1f2937')
    .style('border', '1px solid #374151')
    .style('padding', '8px 12px')
    .style('border-radius', '6px')
    .style('font-size', '12px')
    .style('color', '#fff')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('z-index', '100');

  heads
    .on('mouseover', (event, d) => {
      tooltip
        .style('opacity', 1)
        .html(`<strong>${d.aaChange}</strong><br>Type: ${d.type}<br>Count: ${d.count}`)
        .style('left', `${event.offsetX + 10}px`)
        .style('top', `${event.offsetY - 40}px`);
    })
    .on('mouseout', () => {
      tooltip.style('opacity', 0);
    });

  // X axis
  g.append('g')
    .attr('transform', `translate(0,${plotHeight})`)
    .call(d3.axisBottom(xScale).ticks(10))
    .selectAll('text, line, path')
    .attr('stroke', '#9ca3af')
    .attr('fill', '#9ca3af');

  g.append('text')
    .attr('x', plotWidth / 2)
    .attr('y', plotHeight + 40)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', '12px')
    .text('Amino Acid Position');

  // Legend
  const legend = svg.append('g').attr('transform', `translate(${width - 150}, 50)`);

  Object.entries(MUTATION_COLORS).forEach(([type, color], i) => {
    legend
      .append('circle')
      .attr('cx', 0)
      .attr('cy', i * 20)
      .attr('r', 6)
      .attr('fill', color);

    legend
      .append('text')
      .attr('x', 15)
      .attr('y', i * 20 + 4)
      .attr('fill', '#9ca3af')
      .attr('font-size', '11px')
      .text(type.charAt(0).toUpperCase() + type.slice(1));
  });
}

/**
 * Render an Oncoprint Matrix
 */
export function renderOncoprint(container: HTMLElement, dataset: Dataset): void {
  container.innerHTML = '';

  const width = container.clientWidth - 40;
  const height = 450;
  const margin = { top: 50, right: 80, bottom: 30, left: 80 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Generate demo data
  const genes = ['TP53', 'KRAS', 'EGFR', 'BRAF', 'PIK3CA', 'PTEN', 'APC', 'BRCA1'];
  const numSamples = Math.min(30, Math.floor(plotWidth / 15));
  const samples = Array.from({ length: numSamples }, (_, i) => `S${i + 1}`);

  // Generate mutation matrix
  const matrix: { gene: string; sample: string; type: string }[] = [];
  genes.forEach((gene) => {
    const mutationRate = 0.1 + Math.random() * 0.4; // 10-50% mutation rate
    samples.forEach((sample) => {
      if (Math.random() < mutationRate) {
        const types = ['missense', 'nonsense', 'frameshift', 'splice'];
        matrix.push({
          gene,
          sample,
          type: types[Math.floor(Math.random() * types.length)],
        });
      }
    });
  });

  const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Title
  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .attr('fill', '#fff')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text(`Mutation Matrix - ${dataset.shortName}`);

  // Scales
  const xScale = d3.scaleBand().domain(samples).range([0, plotWidth]).padding(0.1);

  const yScale = d3.scaleBand().domain(genes).range([0, plotHeight]).padding(0.15);

  // Background cells
  genes.forEach((gene) => {
    samples.forEach((sample) => {
      g.append('rect')
        .attr('x', xScale(sample)!)
        .attr('y', yScale(gene)!)
        .attr('width', xScale.bandwidth())
        .attr('height', yScale.bandwidth())
        .attr('fill', '#1f2937')
        .attr('rx', 2);
    });
  });

  // Mutation cells
  matrix.forEach((mut) => {
    g.append('rect')
      .attr('x', xScale(mut.sample)! + 1)
      .attr('y', yScale(mut.gene)! + 1)
      .attr('width', xScale.bandwidth() - 2)
      .attr('height', yScale.bandwidth() - 2)
      .attr('fill', MUTATION_COLORS[mut.type])
      .attr('rx', 2);
  });

  // Gene labels
  g.selectAll('.gene-label')
    .data(genes)
    .join('text')
    .attr('class', 'gene-label')
    .attr('x', -10)
    .attr('y', (d) => yScale(d)! + yScale.bandwidth() / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', '11px')
    .text((d) => d);

  // Frequency bars
  const geneFreqs = genes.map((gene) => ({
    gene,
    freq: (matrix.filter((m) => m.gene === gene).length / samples.length) * 100,
  }));

  const freqScale = d3.scaleLinear().domain([0, 100]).range([0, 50]);

  g.selectAll('.freq-bar')
    .data(geneFreqs)
    .join('rect')
    .attr('class', 'freq-bar')
    .attr('x', plotWidth + 10)
    .attr('y', (d) => yScale(d.gene)! + 2)
    .attr('width', (d) => freqScale(d.freq))
    .attr('height', yScale.bandwidth() - 4)
    .attr('fill', '#6366f1')
    .attr('rx', 2);

  g.selectAll('.freq-label')
    .data(geneFreqs)
    .join('text')
    .attr('class', 'freq-label')
    .attr('x', plotWidth + 65)
    .attr('y', (d) => yScale(d.gene)! + yScale.bandwidth() / 2)
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', '10px')
    .text((d) => `${Math.round(d.freq)}%`);

  // Legend
  const legend = svg.append('g').attr('transform', `translate(${width - 100}, ${margin.top})`);

  Object.entries(MUTATION_COLORS).forEach(([type, color], i) => {
    legend
      .append('rect')
      .attr('x', 0)
      .attr('y', i * 18)
      .attr('width', 12)
      .attr('height', 12)
      .attr('fill', color)
      .attr('rx', 2);

    legend
      .append('text')
      .attr('x', 18)
      .attr('y', i * 18 + 10)
      .attr('fill', '#9ca3af')
      .attr('font-size', '10px')
      .text(type);
  });
}

/**
 * Render a Genome Browser
 */
export function renderGenomeBrowser(container: HTMLElement, dataset: Dataset): void {
  container.innerHTML = '';

  const width = container.clientWidth - 40;
  const height = 400;
  const margin = { top: 50, right: 30, bottom: 30, left: 60 };
  const plotWidth = width - margin.left - margin.right;

  const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);

  const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // Title
  svg
    .append('text')
    .attr('x', width / 2)
    .attr('y', 25)
    .attr('text-anchor', 'middle')
    .attr('fill', '#fff')
    .attr('font-size', '16px')
    .attr('font-weight', 'bold')
    .text(`Genome Browser - ${dataset.shortName} - chr17:7,565,097-7,590,856`);

  // Genomic coordinates
  const start = 7565097;
  const end = 7590856;

  const xScale = d3.scaleLinear().domain([start, end]).range([0, plotWidth]);

  // Track heights
  const geneTrackY = 0;
  const geneTrackHeight = 60;
  const mutationTrackY = 80;
  const mutationTrackHeight = 80;
  const signalTrackY = 180;
  const signalTrackHeight = 100;

  // Gene track background
  g.append('rect')
    .attr('x', 0)
    .attr('y', geneTrackY)
    .attr('width', plotWidth)
    .attr('height', geneTrackHeight)
    .attr('fill', '#1f2937');

  g.append('text')
    .attr('x', -10)
    .attr('y', geneTrackY + geneTrackHeight / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', '11px')
    .text('Genes');

  // TP53 gene
  const tp53Start = 7571720;
  const tp53End = 7590868;
  const exons = [
    { start: 7571720, end: 7571787 },
    { start: 7573927, end: 7574033 },
    { start: 7576853, end: 7576926 },
    { start: 7577019, end: 7577155 },
    { start: 7577499, end: 7577608 },
    { start: 7578176, end: 7578289 },
    { start: 7578371, end: 7578554 },
    { start: 7579312, end: 7579590 },
    { start: 7579700, end: 7579721 },
    { start: 7579839, end: 7579940 },
    { start: 7590695, end: 7590868 },
  ];

  // Gene body (intron line)
  g.append('line')
    .attr('x1', xScale(tp53Start))
    .attr('x2', xScale(tp53End))
    .attr('y1', geneTrackY + geneTrackHeight / 2)
    .attr('y2', geneTrackY + geneTrackHeight / 2)
    .attr('stroke', '#6366f1')
    .attr('stroke-width', 2);

  // Exons
  exons.forEach((exon) => {
    g.append('rect')
      .attr('x', xScale(exon.start))
      .attr('y', geneTrackY + geneTrackHeight / 2 - 10)
      .attr('width', Math.max(3, xScale(exon.end) - xScale(exon.start)))
      .attr('height', 20)
      .attr('fill', '#6366f1')
      .attr('rx', 2);
  });

  // Gene name
  g.append('text')
    .attr('x', xScale((tp53Start + tp53End) / 2))
    .attr('y', geneTrackY + 15)
    .attr('text-anchor', 'middle')
    .attr('fill', '#fff')
    .attr('font-size', '12px')
    .attr('font-weight', 'bold')
    .text('TP53 ←');

  // Mutation track background
  g.append('rect')
    .attr('x', 0)
    .attr('y', mutationTrackY)
    .attr('width', plotWidth)
    .attr('height', mutationTrackHeight)
    .attr('fill', '#1f2937');

  g.append('text')
    .attr('x', -10)
    .attr('y', mutationTrackY + mutationTrackHeight / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', '11px')
    .text('Mutations');

  // Generate mutations
  const mutations = generateMutationsForBrowser(start, end);
  const maxCount = d3.max(mutations, (d) => d.count) || 10;
  const mutYScale = d3
    .scaleLinear()
    .domain([0, maxCount])
    .range([mutationTrackHeight - 10, 10]);

  // Mutation lollipops
  mutations.forEach((mut) => {
    const x = xScale(mut.position);
    const y = mutationTrackY + mutYScale(mut.count);

    g.append('line')
      .attr('x1', x)
      .attr('x2', x)
      .attr('y1', y)
      .attr('y2', mutationTrackY + mutationTrackHeight - 5)
      .attr('stroke', '#6b7280')
      .attr('stroke-width', 1);

    g.append('circle')
      .attr('cx', x)
      .attr('cy', y)
      .attr('r', Math.min(4 + mut.count / 2, 8))
      .attr('fill', MUTATION_COLORS[mut.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
  });

  // Signal track background
  g.append('rect')
    .attr('x', 0)
    .attr('y', signalTrackY)
    .attr('width', plotWidth)
    .attr('height', signalTrackHeight)
    .attr('fill', '#1f2937');

  g.append('text')
    .attr('x', -10)
    .attr('y', signalTrackY + signalTrackHeight / 2)
    .attr('text-anchor', 'end')
    .attr('dominant-baseline', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', '11px')
    .text('Coverage');

  // Generate signal data
  const signalData = generateSignalData(start, end, 100);
  const sigYScale = d3
    .scaleLinear()
    .domain([0, d3.max(signalData, (d) => d.value) || 100])
    .range([signalTrackHeight - 5, 5]);

  const area = d3
    .area<{ pos: number; value: number }>()
    .x((d) => xScale(d.pos))
    .y0(signalTrackHeight - 5)
    .y1((d) => sigYScale(d.value))
    .curve(d3.curveMonotoneX);

  g.append('path')
    .datum(signalData)
    .attr('transform', `translate(0, ${signalTrackY})`)
    .attr('fill', 'rgba(99, 102, 241, 0.4)')
    .attr('stroke', '#6366f1')
    .attr('stroke-width', 1)
    .attr('d', area);

  // X axis
  g.append('g')
    .attr('transform', `translate(0, ${signalTrackY + signalTrackHeight + 10})`)
    .call(
      d3
        .axisBottom(xScale)
        .ticks(8)
        .tickFormat((d) => `${((d as number) / 1000000).toFixed(2)}Mb`)
    )
    .selectAll('text, line, path')
    .attr('stroke', '#6b7280')
    .attr('fill', '#6b7280');
}

// Helper functions
function generateMutations(dataset: Dataset): Mutation[] {
  let seed = dataset.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const random = () => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  const hotspots = [175, 245, 248, 249, 273, 282];
  const mutations: Mutation[] = [];
  const types: Array<'missense' | 'nonsense' | 'frameshift' | 'splice'> = [
    'missense',
    'nonsense',
    'frameshift',
    'splice',
  ];

  // Hotspot mutations
  hotspots.forEach((pos) => {
    mutations.push({
      position: pos,
      aaChange: `R${pos}H`,
      type: random() > 0.3 ? 'missense' : types[Math.floor(random() * types.length)],
      count: Math.floor(random() * 15) + 5,
    });
  });

  // Random mutations
  for (let i = 0; i < 15; i++) {
    const pos = Math.floor(random() * 350) + 20;
    if (!hotspots.includes(pos)) {
      mutations.push({
        position: pos,
        aaChange: `X${pos}Y`,
        type: types[Math.floor(random() * types.length)],
        count: Math.floor(random() * 5) + 1,
      });
    }
  }

  return mutations.sort((a, b) => a.position - b.position);
}

function generateMutationsForBrowser(
  start: number,
  end: number
): { position: number; count: number; type: string }[] {
  const mutations: { position: number; count: number; type: string }[] = [];
  const types = ['missense', 'nonsense', 'frameshift', 'splice'];
  const range = end - start;

  // Hotspots around exons
  const hotspots = [7577500, 7578200, 7579400, 7579800];
  hotspots.forEach((pos) => {
    mutations.push({
      position: pos + Math.floor(Math.random() * 100),
      count: Math.floor(Math.random() * 10) + 5,
      type: types[Math.floor(Math.random() * types.length)],
    });
  });

  // Random mutations
  for (let i = 0; i < 12; i++) {
    mutations.push({
      position: start + Math.floor(Math.random() * range),
      count: Math.floor(Math.random() * 5) + 1,
      type: types[Math.floor(Math.random() * types.length)],
    });
  }

  return mutations;
}

function generateSignalData(
  start: number,
  end: number,
  numPoints: number
): { pos: number; value: number }[] {
  const data: { pos: number; value: number }[] = [];
  const range = end - start;
  const step = range / numPoints;

  for (let i = 0; i < numPoints; i++) {
    const pos = start + i * step;
    // Higher signal around exons
    const exonProximity = [7577500, 7578200, 7579400].some((e) => Math.abs(pos - e) < 500) ? 30 : 0;
    const value = 20 + Math.random() * 40 + exonProximity + Math.sin(i * 0.2) * 10;
    data.push({ pos, value: Math.max(0, value) });
  }

  return data;
}
