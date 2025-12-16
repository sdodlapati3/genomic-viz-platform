/**
 * Junction Track - Splice Junction Visualization
 *
 * Displays splice junctions from RNA-seq data as arcs.
 * Features:
 * - Arc height proportional to read count
 * - Color coding by junction type (known/novel)
 * - Thickness based on read support
 * - Strand-specific rendering
 */

import * as d3 from 'd3';
import { Track, TrackRenderContext } from './Track';
import type { TrackConfig, GenomicRegion } from './types';

export interface SpliceJunction {
  id: string;
  chromosome: string;
  start: number; // Donor position
  end: number; // Acceptor position
  strand: '+' | '-';
  readCount: number;
  isKnown: boolean;
  gene?: string;
  motif?: string; // e.g., 'GT-AG', 'GC-AG'
}

export interface JunctionTrackData {
  junctions: SpliceJunction[];
  maxReadCount: number;
}

export interface JunctionTrackConfig extends TrackConfig {
  type: 'junction';
  colorByType: boolean; // Known vs novel
  knownColor: string;
  novelColor: string;
  minReadCount: number; // Minimum reads to display
  arcStyle: 'bezier' | 'arc';
  showLabels: boolean;
  strandFilter: '+' | '-' | 'both';
}

export class JunctionTrack extends Track<JunctionTrackData, JunctionTrackConfig> {
  constructor(config: Partial<JunctionTrackConfig>) {
    super({
      id: 'junction-track',
      type: 'junction',
      name: 'Splice Junctions',
      height: 100,
      visible: true,
      collapsed: false,
      colorByType: true,
      knownColor: '#3498db',
      novelColor: '#e74c3c',
      minReadCount: 1,
      arcStyle: 'bezier',
      showLabels: true,
      strandFilter: 'both',
      ...config,
    } as JunctionTrackConfig);
  }

  protected renderContent(context: TrackRenderContext): void {
    if (!this.data || this.data.junctions.length === 0) return;

    const { svg, width, height, xScale, region } = context;

    // Filter junctions
    const visibleJunctions = this.data.junctions
      .filter((j) => j.end >= region.start && j.start <= region.end)
      .filter((j) => j.readCount >= this.config.minReadCount)
      .filter((j) => this.config.strandFilter === 'both' || j.strand === this.config.strandFilter)
      .sort((a, b) => b.readCount - a.readCount);

    if (visibleJunctions.length === 0) return;

    // Separate by strand for rendering
    const positiveJunctions = visibleJunctions.filter((j) => j.strand === '+');
    const negativeJunctions = visibleJunctions.filter((j) => j.strand === '-');

    const midY = height / 2;

    // Render positive strand junctions (arcs going up)
    this.renderJunctions(svg, positiveJunctions, xScale, midY, -1, height / 2 - 10);

    // Render negative strand junctions (arcs going down)
    this.renderJunctions(svg, negativeJunctions, xScale, midY, 1, height / 2 - 10);

    // Render center line
    svg
      .append('line')
      .attr('class', 'strand-divider')
      .attr('x1', 0)
      .attr('y1', midY)
      .attr('x2', width)
      .attr('y2', midY)
      .attr('stroke', '#ddd')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,2');

    // Strand labels
    svg
      .append('text')
      .attr('x', 5)
      .attr('y', 15)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text('+ strand');

    svg
      .append('text')
      .attr('x', 5)
      .attr('y', height - 5)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text('- strand');
  }

  private renderJunctions(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    junctions: SpliceJunction[],
    xScale: d3.ScaleLinear<number, number>,
    baseY: number,
    direction: number, // -1 for up, 1 for down
    maxHeight: number
  ): void {
    if (!this.data) return;

    const junctionGroup = svg
      .append('g')
      .attr('class', `junction-group-${direction < 0 ? 'plus' : 'minus'}`);

    // Scale for arc height based on read count
    const heightScale = d3
      .scaleSqrt()
      .domain([1, this.data.maxReadCount])
      .range([10, maxHeight])
      .clamp(true);

    // Scale for stroke width
    const strokeScale = d3
      .scaleLinear()
      .domain([1, this.data.maxReadCount])
      .range([1, 5])
      .clamp(true);

    for (const junction of junctions) {
      const x1 = xScale(junction.start);
      const x2 = xScale(junction.end);
      const arcHeight = heightScale(junction.readCount) * direction;
      const strokeWidth = strokeScale(junction.readCount);

      const color = this.config.colorByType
        ? junction.isKnown
          ? this.config.knownColor
          : this.config.novelColor
        : this.config.knownColor;

      // Create path
      let pathD: string;
      if (this.config.arcStyle === 'bezier') {
        const midX = (x1 + x2) / 2;
        pathD = `M ${x1} ${baseY} Q ${midX} ${baseY + arcHeight} ${x2} ${baseY}`;
      } else {
        // Simple arc
        const rx = (x2 - x1) / 2;
        const ry = Math.abs(arcHeight);
        const sweep = direction < 0 ? 0 : 1;
        pathD = `M ${x1} ${baseY} A ${rx} ${ry} 0 0 ${sweep} ${x2} ${baseY}`;
      }

      const arcPath = junctionGroup
        .append('path')
        .attr('class', 'junction-arc')
        .attr('d', pathD)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', strokeWidth)
        .attr('stroke-opacity', 0.7)
        .style('cursor', 'pointer');

      // Add glow effect on hover
      arcPath
        .on('mouseover', (event) => {
          arcPath.attr('stroke-width', strokeWidth + 2).attr('stroke-opacity', 1);
          this.onFeatureHover?.(junction, event);
        })
        .on('mouseout', () => {
          arcPath.attr('stroke-width', strokeWidth).attr('stroke-opacity', 0.7);
        })
        .on('click', (event) => {
          this.onFeatureClick?.(junction, event);
        });

      // Add read count label
      if (this.config.showLabels && x2 - x1 > 40) {
        const labelX = (x1 + x2) / 2;
        const labelY = baseY + arcHeight * 0.6;

        junctionGroup
          .append('text')
          .attr('class', 'junction-label')
          .attr('x', labelX)
          .attr('y', labelY)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', direction < 0 ? 'auto' : 'hanging')
          .attr('font-size', '9px')
          .attr('fill', color)
          .attr('font-weight', 'bold')
          .text(junction.readCount);
      }

      // Add splice site markers
      this.renderSpliceSites(junctionGroup, junction, xScale, baseY, direction, color);
    }
  }

  private renderSpliceSites(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    junction: SpliceJunction,
    xScale: d3.ScaleLinear<number, number>,
    baseY: number,
    _direction: number,
    color: string
  ): void {
    const markerSize = 4;
    const x1 = xScale(junction.start);
    const x2 = xScale(junction.end);

    // Donor site (start)
    group
      .append('circle')
      .attr('class', 'splice-site-donor')
      .attr('cx', x1)
      .attr('cy', baseY)
      .attr('r', markerSize)
      .attr('fill', color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // Acceptor site (end)
    group
      .append('circle')
      .attr('class', 'splice-site-acceptor')
      .attr('cx', x2)
      .attr('cy', baseY)
      .attr('r', markerSize)
      .attr('fill', color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);
  }

  getTooltipContent(feature: unknown): string {
    const junction = feature as SpliceJunction;
    const intronSize = junction.end - junction.start;

    return `
      <div class="tooltip-title">Splice Junction</div>
      <div class="tooltip-row">
        <span class="tooltip-label">Position:</span>
        <span class="tooltip-value">${junction.chromosome}:${junction.start.toLocaleString()}-${junction.end.toLocaleString()}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Intron Size:</span>
        <span class="tooltip-value">${intronSize.toLocaleString()} bp</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Strand:</span>
        <span class="tooltip-value">${junction.strand}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Read Count:</span>
        <span class="tooltip-value">${junction.readCount.toLocaleString()}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Type:</span>
        <span class="tooltip-value">${junction.isKnown ? 'Known' : 'Novel'}</span>
      </div>
      ${
        junction.motif
          ? `
        <div class="tooltip-row">
          <span class="tooltip-label">Motif:</span>
          <span class="tooltip-value">${junction.motif}</span>
        </div>
      `
          : ''
      }
      ${
        junction.gene
          ? `
        <div class="tooltip-row">
          <span class="tooltip-label">Gene:</span>
          <span class="tooltip-value">${junction.gene}</span>
        </div>
      `
          : ''
      }
    `;
  }
}

/**
 * Generate mock junction data for demonstration
 */
export function generateMockJunctionData(
  region: GenomicRegion,
  _genePositions?: { start: number; end: number }[]
): JunctionTrackData {
  const junctions: SpliceJunction[] = [];
  let maxReadCount = 0;

  // Generate junctions - more likely near gene regions
  const numJunctions = 20 + Math.floor(Math.random() * 30);
  const motifs = ['GT-AG', 'GC-AG', 'AT-AC'];

  for (let i = 0; i < numJunctions; i++) {
    // Junction start position
    let start = region.start + Math.floor(Math.random() * (region.end - region.start - 10000));

    // Intron size follows a distribution (most introns are small, some are large)
    const intronSize =
      Math.random() < 0.7
        ? 100 + Math.floor(Math.random() * 5000) // Small introns
        : 5000 + Math.floor(Math.random() * 50000); // Large introns

    const end = start + intronSize;
    if (end > region.end) continue;

    const strand = Math.random() > 0.5 ? '+' : '-';
    const isKnown = Math.random() > 0.3; // 70% known junctions

    // Read count follows a power law (few high-count, many low-count)
    const readCount = Math.floor(Math.pow(Math.random(), 3) * 1000) + 1;
    maxReadCount = Math.max(maxReadCount, readCount);

    junctions.push({
      id: `junction_${i}`,
      chromosome: region.chromosome,
      start,
      end,
      strand: strand as '+' | '-',
      readCount,
      isKnown,
      motif: isKnown ? 'GT-AG' : motifs[Math.floor(Math.random() * motifs.length)],
      gene: isKnown ? `GENE${Math.floor(Math.random() * 10)}` : undefined,
    });
  }

  return { junctions, maxReadCount };
}
