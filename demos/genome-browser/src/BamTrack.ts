/**
 * BAM Track - Read Alignment Visualization
 *
 * Displays aligned sequencing reads from BAM files.
 * Features:
 * - Stacked read visualization with proper pileup
 * - Color coding by strand, mapping quality, or pair status
 * - Coverage histogram overlay
 * - Mismatch highlighting
 * - Insert size indicators for paired reads
 */

import * as d3 from 'd3';
import { Track, TrackRenderContext } from './Track';
import type { TrackConfig, GenomicRegion } from './types';

export interface AlignedRead {
  id: string;
  chromosome: string;
  start: number;
  end: number;
  strand: '+' | '-';
  mapq: number; // Mapping quality
  cigar: string;
  sequence?: string;
  mate?: {
    chromosome: string;
    start: number;
    insertSize: number;
  };
  mismatches?: Mismatch[];
  isProperPair?: boolean;
  isDuplicate?: boolean;
  isSecondary?: boolean;
}

export interface Mismatch {
  position: number;
  refBase: string;
  readBase: string;
}

export interface CoveragePoint {
  position: number;
  depth: number;
}

export interface BamTrackData {
  reads: AlignedRead[];
  coverage: CoveragePoint[];
  maxDepth: number;
}

export interface BamTrackConfig extends TrackConfig {
  type: 'bam';
  showCoverage: boolean;
  showReads: boolean;
  colorBy: 'strand' | 'mapq' | 'pairStatus' | 'insertSize';
  minMapq: number;
  maxReadRows: number;
  readHeight: number;
  readGap: number;
}

export class BamTrack extends Track<BamTrackData, BamTrackConfig> {
  private readRows: Map<string, number> = new Map();

  constructor(config: Partial<BamTrackConfig>) {
    super({
      id: 'bam-track',
      type: 'bam',
      name: 'Alignments',
      height: 200,
      visible: true,
      collapsed: false,
      showCoverage: true,
      showReads: true,
      colorBy: 'strand',
      minMapq: 0,
      maxReadRows: 50,
      readHeight: 8,
      readGap: 2,
      ...config,
    } as BamTrackConfig);
  }

  protected renderContent(context: TrackRenderContext): void {
    if (!this.data) return;

    const { svg, width, height, xScale, region } = context;

    // Calculate layout
    const coverageHeight = this.config.showCoverage ? 50 : 0;
    const readsHeight = height - coverageHeight;

    // Render coverage histogram
    if (this.config.showCoverage && this.data.coverage.length > 0) {
      this.renderCoverage(svg, xScale, width, coverageHeight, region);
    }

    // Render reads
    if (this.config.showReads && this.data.reads.length > 0) {
      this.renderReads(svg, xScale, width, readsHeight, coverageHeight, region);
    }
  }

  private renderCoverage(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleLinear<number, number>,
    width: number,
    height: number,
    region: GenomicRegion
  ): void {
    if (!this.data) return;

    const coverageGroup = svg.append('g').attr('class', 'coverage');

    // Filter coverage points in view
    const visibleCoverage = this.data.coverage.filter(
      (p) => p.position >= region.start && p.position <= region.end
    );

    // Y scale for coverage
    const yScale = d3.scaleLinear().domain([0, this.data.maxDepth]).range([height, 0]);

    // Create area generator
    const area = d3
      .area<CoveragePoint>()
      .x((d) => xScale(d.position))
      .y0(height)
      .y1((d) => yScale(d.depth))
      .curve(d3.curveStepAfter);

    // Draw coverage area
    coverageGroup
      .append('path')
      .datum(visibleCoverage)
      .attr('class', 'coverage-area')
      .attr('d', area)
      .attr('fill', '#4a90d9')
      .attr('fill-opacity', 0.3)
      .attr('stroke', '#4a90d9')
      .attr('stroke-width', 1);

    // Add coverage axis
    const yAxis = d3.axisRight(yScale).ticks(3).tickSize(3);

    coverageGroup
      .append('g')
      .attr('class', 'coverage-axis')
      .attr('transform', `translate(${width - 30}, 0)`)
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '9px')
      .attr('fill', '#666');

    // Coverage label
    coverageGroup
      .append('text')
      .attr('x', width - 5)
      .attr('y', 10)
      .attr('text-anchor', 'end')
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text('Coverage');

    // Separator line
    coverageGroup
      .append('line')
      .attr('x1', 0)
      .attr('y1', height)
      .attr('x2', width)
      .attr('y2', height)
      .attr('stroke', '#ddd')
      .attr('stroke-width', 1);
  }

  private renderReads(
    svg: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleLinear<number, number>,
    width: number,
    height: number,
    yOffset: number,
    region: GenomicRegion
  ): void {
    if (!this.data) return;

    const readsGroup = svg
      .append('g')
      .attr('class', 'reads')
      .attr('transform', `translate(0, ${yOffset})`);

    // Filter and sort reads
    const visibleReads = this.data.reads
      .filter((r) => r.end >= region.start && r.start <= region.end)
      .filter((r) => r.mapq >= this.config.minMapq)
      .sort((a, b) => a.start - b.start);

    // Calculate read rows (pileup)
    this.calculateReadRows(visibleReads, xScale);

    const { readHeight, readGap, maxReadRows } = this.config;

    // Draw reads
    visibleReads.forEach((read) => {
      const row = this.readRows.get(read.id) ?? 0;
      if (row >= maxReadRows) return;

      const x = Math.max(0, xScale(read.start));
      const x2 = Math.min(width, xScale(read.end));
      const y = row * (readHeight + readGap);
      const readWidth = Math.max(1, x2 - x);

      // Get read color based on colorBy setting
      const color = this.getReadColor(read);

      // Read rectangle
      const readElement = readsGroup
        .append('rect')
        .attr('class', 'read')
        .attr('x', x)
        .attr('y', y)
        .attr('width', readWidth)
        .attr('height', readHeight)
        .attr('fill', color)
        .attr('stroke', d3.color(color)?.darker(0.5)?.toString() ?? '#333')
        .attr('stroke-width', 0.5)
        .attr('rx', 1)
        .attr('ry', 1)
        .style('cursor', 'pointer');

      // Add strand indicator (arrow)
      if (readWidth > 10) {
        const arrowX = read.strand === '+' ? x2 - 5 : x + 5;
        const arrowPoints =
          read.strand === '+'
            ? `${arrowX - 3},${y + 2} ${arrowX},${y + readHeight / 2} ${arrowX - 3},${y + readHeight - 2}`
            : `${arrowX + 3},${y + 2} ${arrowX},${y + readHeight / 2} ${arrowX + 3},${y + readHeight - 2}`;

        readsGroup
          .append('polyline')
          .attr('points', arrowPoints)
          .attr('fill', 'none')
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .style('pointer-events', 'none');
      }

      // Render mismatches
      if (read.mismatches && read.mismatches.length > 0) {
        this.renderMismatches(readsGroup, read, xScale, y, readHeight);
      }

      // Event handlers
      readElement
        .on('mouseover', (event) => {
          readElement.attr('stroke-width', 2);
          this.onFeatureHover?.(read, event);
        })
        .on('mouseout', () => {
          readElement.attr('stroke-width', 0.5);
        })
        .on('click', (event) => {
          this.onFeatureClick?.(read, event);
        });
    });

    // Render mate connections for visible read pairs
    this.renderMateConnections(readsGroup, visibleReads, xScale, readHeight, readGap, region);

    // Add overflow indicator if too many reads
    const maxY = maxReadRows * (readHeight + readGap);
    if (height > maxY) {
      const overflowCount = visibleReads.filter(
        (r) => (this.readRows.get(r.id) ?? 0) >= maxReadRows
      ).length;

      if (overflowCount > 0) {
        readsGroup
          .append('text')
          .attr('x', width / 2)
          .attr('y', maxY + 15)
          .attr('text-anchor', 'middle')
          .attr('font-size', '10px')
          .attr('fill', '#999')
          .text(`+ ${overflowCount} more reads`);
      }
    }
  }

  private calculateReadRows(reads: AlignedRead[], xScale: d3.ScaleLinear<number, number>): void {
    this.readRows.clear();
    const rowEnds: number[] = [];

    for (const read of reads) {
      const readStart = xScale(read.start);
      const readEnd = xScale(read.end);

      // Find first row where this read fits
      let row = 0;
      while (row < rowEnds.length && rowEnds[row] > readStart - 2) {
        row++;
      }

      this.readRows.set(read.id, row);

      if (row < rowEnds.length) {
        rowEnds[row] = readEnd;
      } else {
        rowEnds.push(readEnd);
      }
    }
  }

  private getReadColor(read: AlignedRead): string {
    switch (this.config.colorBy) {
      case 'strand':
        return read.strand === '+' ? '#e74c3c' : '#3498db';

      case 'mapq':
        // Color by mapping quality (0-60)
        const mapqNorm = Math.min(1, read.mapq / 60);
        return d3.interpolateViridis(mapqNorm);

      case 'pairStatus':
        if (read.isDuplicate) return '#999';
        if (read.isSecondary) return '#aaa';
        if (!read.isProperPair) return '#e67e22';
        return read.strand === '+' ? '#27ae60' : '#2980b9';

      case 'insertSize':
        if (!read.mate) return '#999';
        const insertSize = Math.abs(read.mate.insertSize);
        // Normal insert size ~300-500bp
        if (insertSize < 100) return '#9b59b6'; // Too short
        if (insertSize > 1000) return '#e74c3c'; // Too long
        return '#27ae60'; // Normal

      default:
        return read.strand === '+' ? '#e74c3c' : '#3498db';
    }
  }

  private renderMismatches(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    read: AlignedRead,
    xScale: d3.ScaleLinear<number, number>,
    y: number,
    height: number
  ): void {
    if (!read.mismatches) return;

    const mismatchColors: Record<string, string> = {
      A: '#27ae60',
      T: '#e74c3c',
      G: '#f39c12',
      C: '#3498db',
    };

    for (const mm of read.mismatches) {
      const x = xScale(mm.position);
      const width = Math.max(2, xScale(mm.position + 1) - x);

      group
        .append('rect')
        .attr('class', 'mismatch')
        .attr('x', x)
        .attr('y', y)
        .attr('width', width)
        .attr('height', height)
        .attr('fill', mismatchColors[mm.readBase] ?? '#666');
    }
  }

  private renderMateConnections(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    reads: AlignedRead[],
    xScale: d3.ScaleLinear<number, number>,
    readHeight: number,
    readGap: number,
    region: GenomicRegion
  ): void {
    // Find read pairs where both mates are visible
    for (const read of reads) {
      if (!read.mate || read.mate.chromosome !== region.chromosome) continue;

      // Only draw connection for first read in pair
      if (read.start > read.mate.start) continue;

      const mateStart = read.mate.start;
      if (mateStart < region.start || mateStart > region.end) continue;

      const row = this.readRows.get(read.id) ?? 0;
      const y = row * (readHeight + readGap) + readHeight / 2;

      const x1 = xScale(read.end);
      const x2 = xScale(mateStart);

      if (x2 - x1 > 5) {
        group
          .append('line')
          .attr('class', 'mate-connection')
          .attr('x1', x1)
          .attr('y1', y)
          .attr('x2', x2)
          .attr('y2', y)
          .attr('stroke', '#aaa')
          .attr('stroke-width', 1)
          .attr('stroke-dasharray', '2,2');
      }
    }
  }

  getTooltipContent(feature: unknown): string {
    const read = feature as AlignedRead;
    return `
      <div class="tooltip-title">Read: ${read.id}</div>
      <div class="tooltip-row">
        <span class="tooltip-label">Position:</span>
        <span class="tooltip-value">${read.chromosome}:${read.start.toLocaleString()}-${read.end.toLocaleString()}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Strand:</span>
        <span class="tooltip-value">${read.strand}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">MAPQ:</span>
        <span class="tooltip-value">${read.mapq}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">CIGAR:</span>
        <span class="tooltip-value">${read.cigar}</span>
      </div>
      ${
        read.mate
          ? `
        <div class="tooltip-row">
          <span class="tooltip-label">Insert Size:</span>
          <span class="tooltip-value">${Math.abs(read.mate.insertSize)} bp</span>
        </div>
      `
          : ''
      }
      ${
        read.mismatches && read.mismatches.length > 0
          ? `
        <div class="tooltip-row">
          <span class="tooltip-label">Mismatches:</span>
          <span class="tooltip-value">${read.mismatches.length}</span>
        </div>
      `
          : ''
      }
    `;
  }
}

/**
 * Generate mock BAM data for demonstration
 */
export function generateMockBamData(region: GenomicRegion, readCount: number = 500): BamTrackData {
  const reads: AlignedRead[] = [];
  const coverageMap = new Map<number, number>();
  const readLength = 150;
  const binSize = 10;

  for (let i = 0; i < readCount; i++) {
    const start =
      region.start + Math.floor(Math.random() * (region.end - region.start - readLength));
    const end = start + readLength;
    const strand = Math.random() > 0.5 ? '+' : '-';
    const mapq = Math.floor(Math.random() * 60);

    // Generate CIGAR (simplified)
    const cigar = `${readLength}M`;

    // Generate mismatches (1-3% error rate)
    const mismatches: Mismatch[] = [];
    const mismatchCount = Math.floor(Math.random() * 3);
    const bases = ['A', 'T', 'G', 'C'];
    for (let j = 0; j < mismatchCount; j++) {
      mismatches.push({
        position: start + Math.floor(Math.random() * readLength),
        refBase: bases[Math.floor(Math.random() * 4)],
        readBase: bases[Math.floor(Math.random() * 4)],
      });
    }

    // Generate mate for paired reads
    const hasMate = Math.random() > 0.1;
    const insertSize = 300 + Math.floor(Math.random() * 200);
    const mate = hasMate
      ? {
          chromosome: region.chromosome,
          start: strand === '+' ? start + insertSize : start - insertSize,
          insertSize: strand === '+' ? insertSize : -insertSize,
        }
      : undefined;

    reads.push({
      id: `read_${i}`,
      chromosome: region.chromosome,
      start,
      end,
      strand: strand as '+' | '-',
      mapq,
      cigar,
      mismatches: mismatches.length > 0 ? mismatches : undefined,
      mate,
      isProperPair: hasMate && Math.random() > 0.05,
      isDuplicate: Math.random() < 0.02,
      isSecondary: Math.random() < 0.01,
    });

    // Update coverage
    for (let pos = start; pos < end; pos += binSize) {
      const bin = Math.floor(pos / binSize) * binSize;
      coverageMap.set(bin, (coverageMap.get(bin) ?? 0) + 1);
    }
  }

  // Convert coverage map to array
  const coverage: CoveragePoint[] = Array.from(coverageMap.entries())
    .map(([position, depth]) => ({ position, depth }))
    .sort((a, b) => a.position - b.position);

  const maxDepth = Math.max(...coverage.map((c) => c.depth));

  return { reads, coverage, maxDepth };
}
