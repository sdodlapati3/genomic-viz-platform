/**
 * BAM Track Component
 *
 * Visualizes read alignments from BAM files with:
 * - Coverage histogram
 * - Individual read display (at high zoom)
 * - Read pairing visualization
 * - Color coding by strand, mapping quality, flags
 * - Soft clip / insertion / deletion markers
 */

import * as d3 from 'd3';

export interface BamRead {
  id: string;
  chr: string;
  start: number;
  end: number;
  strand: '+' | '-';
  mapq: number;
  cigar: string;
  sequence?: string;
  quality?: string;
  flags: number;
  mateStart?: number;
  mateChr?: string;
  insertSize?: number;
  // Parsed CIGAR operations
  cigarOps?: CigarOp[];
}

export interface CigarOp {
  op: 'M' | 'I' | 'D' | 'N' | 'S' | 'H' | 'P' | '=' | 'X';
  len: number;
  refStart: number;
  refEnd: number;
}

export interface CoverageData {
  position: number;
  depth: number;
  forward: number;
  reverse: number;
  a: number;
  c: number;
  g: number;
  t: number;
}

export interface BamTrackSettings {
  width: number;
  height: number;
  coverageHeight: number;
  readHeight: number;
  readSpacing: number;
  margin: { top: number; right: number; bottom: number; left: number };
  showCoverage: boolean;
  showReads: boolean;
  colorBy: 'strand' | 'mapq' | 'insertSize' | 'pairOrientation';
  minMapQ: number;
  maxCoverage: number;
  showSoftClips: boolean;
  showMismatches: boolean;
  onReadClick?: (read: BamRead) => void;
}

const DEFAULT_SETTINGS: BamTrackSettings = {
  width: 800,
  height: 300,
  coverageHeight: 60,
  readHeight: 10,
  readSpacing: 2,
  margin: { top: 10, right: 20, bottom: 30, left: 60 },
  showCoverage: true,
  showReads: true,
  colorBy: 'strand',
  minMapQ: 0,
  maxCoverage: 0, // Auto-scale
  showSoftClips: true,
  showMismatches: true,
};

const STRAND_COLORS = {
  forward: '#4a90d9',
  reverse: '#d94a4a',
};

const MAPQ_SCALE = d3.scaleSequential(d3.interpolateViridis).domain([0, 60]);

const BASE_COLORS: Record<string, string> = {
  A: '#22c55e',
  C: '#3b82f6',
  G: '#f59e0b',
  T: '#ef4444',
  N: '#888888',
};

/**
 * BAM Track Visualization
 */
export class BamTrack {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private settings: BamTrackSettings;
  private reads: BamRead[] = [];
  private coverage: CoverageData[] = [];
  private viewRegion: { chr: string; start: number; end: number } | null = null;
  private xScale: d3.ScaleLinear<number, number> | null = null;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;

  constructor(containerId: string, settings?: Partial<BamTrackSettings>) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    this.container = container;
    this.settings = { ...DEFAULT_SETTINGS, ...settings };

    // Create SVG
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.settings.width)
      .attr('height', this.settings.height)
      .attr('class', 'bam-track');

    // Create tooltip
    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'bam-tooltip')
      .style('display', 'none')
      .style('position', 'absolute')
      .style('background', '#1a1a2e')
      .style('border', '1px solid #3498db')
      .style('border-radius', '4px')
      .style('padding', '8px 12px')
      .style('font-size', '12px')
      .style('color', '#e0e0e0')
      .style('z-index', '1000')
      .style('max-width', '300px');
  }

  /**
   * Load alignment data
   */
  public loadData(reads: BamRead[], coverage: CoverageData[]): void {
    this.reads = reads.filter((r) => r.mapq >= this.settings.minMapQ);
    this.coverage = coverage;

    // Parse CIGAR strings
    this.reads.forEach((read) => {
      read.cigarOps = this.parseCigar(read.cigar, read.start);
    });
  }

  /**
   * Set view region
   */
  public setRegion(chr: string, start: number, end: number): void {
    this.viewRegion = { chr, start, end };
    this.render();
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: Partial<BamTrackSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    if (this.viewRegion) {
      this.render();
    }
  }

  /**
   * Parse CIGAR string into operations
   */
  private parseCigar(cigar: string, readStart: number): CigarOp[] {
    const ops: CigarOp[] = [];
    const regex = /(\d+)([MIDNSHP=X])/g;
    let match;
    let refPos = readStart;

    while ((match = regex.exec(cigar)) !== null) {
      const len = parseInt(match[1], 10);
      const op = match[2] as CigarOp['op'];

      const cigarOp: CigarOp = {
        op,
        len,
        refStart: refPos,
        refEnd: refPos,
      };

      // Operations that consume reference
      if (['M', 'D', 'N', '=', 'X'].includes(op)) {
        cigarOp.refEnd = refPos + len;
        refPos += len;
      }

      ops.push(cigarOp);
    }

    return ops;
  }

  /**
   * Main render function
   */
  public render(): void {
    if (!this.viewRegion) return;

    this.svg.selectAll('*').remove();

    const { width, height, margin, coverageHeight, showCoverage, showReads } = this.settings;
    const { chr, start, end } = this.viewRegion;
    const plotWidth = width - margin.left - margin.right;

    // Create main group
    const mainGroup = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create x scale
    this.xScale = d3.scaleLinear().domain([start, end]).range([0, plotWidth]);

    let yOffset = 0;

    // Render coverage
    if (showCoverage && this.coverage.length > 0) {
      this.renderCoverage(mainGroup, yOffset, plotWidth, coverageHeight);
      yOffset += coverageHeight + 10;
    }

    // Render reads
    if (showReads) {
      const readsHeight = height - margin.top - margin.bottom - yOffset;
      this.renderReads(mainGroup, yOffset, plotWidth, readsHeight);
    }

    // Render x-axis
    this.renderAxis(mainGroup, height - margin.top - margin.bottom);

    // Track label
    mainGroup
      .append('text')
      .attr('x', -margin.left + 5)
      .attr('y', 15)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .text('Alignments');
  }

  /**
   * Render coverage histogram
   */
  private renderCoverage(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    yOffset: number,
    plotWidth: number,
    coverageHeight: number
  ): void {
    if (!this.xScale || !this.viewRegion) return;

    const { start, end } = this.viewRegion;

    // Filter coverage to view region
    const visibleCoverage = this.coverage.filter((c) => c.position >= start && c.position <= end);

    if (visibleCoverage.length === 0) return;

    // Y scale for coverage
    const maxDepth = this.settings.maxCoverage || d3.max(visibleCoverage, (d) => d.depth) || 100;
    const yScale = d3.scaleLinear().domain([0, maxDepth]).range([coverageHeight, 0]);

    // Coverage area - forward strand
    const areaForward = d3
      .area<CoverageData>()
      .x((d) => this.xScale!(d.position))
      .y0(coverageHeight)
      .y1((d) => yScale(d.forward));

    // Coverage area - reverse strand
    const areaReverse = d3
      .area<CoverageData>()
      .x((d) => this.xScale!(d.position))
      .y0((d) => yScale(d.forward))
      .y1((d) => yScale(d.depth));

    const coverageGroup = group
      .append('g')
      .attr('class', 'coverage-group')
      .attr('transform', `translate(0, ${yOffset})`);

    // Forward coverage
    coverageGroup
      .append('path')
      .datum(visibleCoverage)
      .attr('class', 'coverage-forward')
      .attr('d', areaForward)
      .attr('fill', STRAND_COLORS.forward)
      .attr('opacity', 0.7);

    // Reverse coverage
    coverageGroup
      .append('path')
      .datum(visibleCoverage)
      .attr('class', 'coverage-reverse')
      .attr('d', areaReverse)
      .attr('fill', STRAND_COLORS.reverse)
      .attr('opacity', 0.7);

    // Y-axis for coverage
    const yAxis = d3.axisLeft(yScale).ticks(4).tickSize(-plotWidth);

    coverageGroup
      .append('g')
      .attr('class', 'coverage-axis')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '10px');

    coverageGroup.selectAll('.domain, .tick line').attr('stroke', '#333');

    // Coverage label
    coverageGroup
      .append('text')
      .attr('x', -5)
      .attr('y', coverageHeight / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#888')
      .attr('font-size', '10px')
      .text('Depth');
  }

  /**
   * Render individual reads
   */
  private renderReads(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    yOffset: number,
    plotWidth: number,
    readsHeight: number
  ): void {
    if (!this.xScale || !this.viewRegion) return;

    const { start, end } = this.viewRegion;
    const { readHeight, readSpacing, colorBy, showSoftClips } = this.settings;

    // Filter reads to view region
    const visibleReads = this.reads.filter(
      (r) => r.chr === this.viewRegion!.chr && r.end >= start && r.start <= end
    );

    // Pack reads into rows to avoid overlap
    const packedReads = this.packReads(visibleReads, start, end);

    const readsGroup = group
      .append('g')
      .attr('class', 'reads-group')
      .attr('transform', `translate(0, ${yOffset})`);

    // Clip path
    readsGroup
      .append('clipPath')
      .attr('id', 'reads-clip')
      .append('rect')
      .attr('width', plotWidth)
      .attr('height', readsHeight);

    const clippedGroup = readsGroup.append('g').attr('clip-path', 'url(#reads-clip)');

    // Render each read
    packedReads.forEach(({ read, row }) => {
      const y = row * (readHeight + readSpacing);
      if (y > readsHeight) return; // Don't render if outside view

      const readGroup = clippedGroup
        .append('g')
        .attr('class', 'read')
        .style('cursor', 'pointer')
        .on('mouseover', (event) => this.showReadTooltip(event, read))
        .on('mouseout', () => this.hideTooltip())
        .on('click', () => this.settings.onReadClick?.(read));

      // Determine read color
      const color = this.getReadColor(read, colorBy);

      // Render CIGAR operations
      if (read.cigarOps) {
        this.renderCigarOps(readGroup, read, y, color);
      } else {
        // Simple rectangle for the read
        const x1 = Math.max(0, this.xScale!(read.start));
        const x2 = Math.min(plotWidth, this.xScale!(read.end));

        readGroup
          .append('rect')
          .attr('x', x1)
          .attr('y', y)
          .attr('width', Math.max(1, x2 - x1))
          .attr('height', readHeight)
          .attr('fill', color)
          .attr('rx', 2);
      }

      // Direction indicator
      const midX = this.xScale!((read.start + read.end) / 2);
      const arrowSize = 3;

      if (read.strand === '+') {
        readGroup
          .append('polygon')
          .attr(
            'points',
            `${midX},${y + readHeight / 2 - arrowSize} ${midX + arrowSize * 2},${y + readHeight / 2} ${midX},${y + readHeight / 2 + arrowSize}`
          )
          .attr('fill', 'rgba(255,255,255,0.5)');
      } else {
        readGroup
          .append('polygon')
          .attr(
            'points',
            `${midX},${y + readHeight / 2 - arrowSize} ${midX - arrowSize * 2},${y + readHeight / 2} ${midX},${y + readHeight / 2 + arrowSize}`
          )
          .attr('fill', 'rgba(255,255,255,0.5)');
      }
    });
  }

  /**
   * Render CIGAR operations for a read
   */
  private renderCigarOps(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    read: BamRead,
    y: number,
    baseColor: string
  ): void {
    if (!this.xScale || !read.cigarOps) return;

    const { readHeight, showSoftClips } = this.settings;

    read.cigarOps.forEach((op) => {
      const x1 = this.xScale!(op.refStart);
      const x2 = this.xScale!(op.refEnd);
      const width = Math.max(1, x2 - x1);

      switch (op.op) {
        case 'M':
        case '=':
          // Match/alignment
          group
            .append('rect')
            .attr('x', x1)
            .attr('y', y)
            .attr('width', width)
            .attr('height', readHeight)
            .attr('fill', baseColor)
            .attr('rx', 1);
          break;

        case 'X':
          // Mismatch
          group
            .append('rect')
            .attr('x', x1)
            .attr('y', y)
            .attr('width', width)
            .attr('height', readHeight)
            .attr('fill', '#e74c3c')
            .attr('rx', 1);
          break;

        case 'I':
          // Insertion marker
          group
            .append('line')
            .attr('x1', x1)
            .attr('y1', y - 2)
            .attr('x2', x1)
            .attr('y2', y + readHeight + 2)
            .attr('stroke', '#9b59b6')
            .attr('stroke-width', 2);
          break;

        case 'D':
        case 'N':
          // Deletion / skip - dashed line
          group
            .append('line')
            .attr('x1', x1)
            .attr('y1', y + readHeight / 2)
            .attr('x2', x2)
            .attr('y2', y + readHeight / 2)
            .attr('stroke', op.op === 'D' ? '#e74c3c' : '#888')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', op.op === 'N' ? '4,2' : 'none');
          break;

        case 'S':
          // Soft clip
          if (showSoftClips) {
            group
              .append('rect')
              .attr('x', x1)
              .attr('y', y)
              .attr('width', width)
              .attr('height', readHeight)
              .attr('fill', '#f39c12')
              .attr('opacity', 0.5)
              .attr('rx', 1);
          }
          break;
      }
    });
  }

  /**
   * Pack reads into rows to avoid overlap
   */
  private packReads(
    reads: BamRead[],
    viewStart: number,
    viewEnd: number
  ): Array<{ read: BamRead; row: number }> {
    // Sort by start position
    const sortedReads = [...reads].sort((a, b) => a.start - b.start);

    const rows: number[] = []; // End position of last read in each row
    const result: Array<{ read: BamRead; row: number }> = [];

    sortedReads.forEach((read) => {
      // Find first available row
      let row = 0;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i] < read.start) {
          row = i;
          break;
        }
        row = i + 1;
      }

      // Assign read to row
      rows[row] = read.end + 5; // Add small gap
      result.push({ read, row });
    });

    return result;
  }

  /**
   * Get color for a read based on color scheme
   */
  private getReadColor(read: BamRead, colorBy: string): string {
    switch (colorBy) {
      case 'strand':
        return read.strand === '+' ? STRAND_COLORS.forward : STRAND_COLORS.reverse;

      case 'mapq':
        return MAPQ_SCALE(read.mapq);

      case 'insertSize':
        if (read.insertSize) {
          const normalRange = [150, 800];
          if (read.insertSize < normalRange[0]) return '#3498db'; // Too short
          if (read.insertSize > normalRange[1]) return '#e74c3c'; // Too long
          return '#2ecc71'; // Normal
        }
        return '#888';

      case 'pairOrientation':
        // Check for abnormal pair orientations
        if (read.mateChr && read.mateChr !== read.chr) return '#9b59b6'; // Inter-chromosomal
        if (read.mateStart && read.strand === '+' && read.mateStart < read.start) return '#e74c3c';
        if (read.mateStart && read.strand === '-' && read.mateStart > read.start) return '#e74c3c';
        return STRAND_COLORS[read.strand === '+' ? 'forward' : 'reverse'];

      default:
        return STRAND_COLORS.forward;
    }
  }

  /**
   * Render x-axis
   */
  private renderAxis(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    yPosition: number
  ): void {
    if (!this.xScale) return;

    const axis = d3
      .axisBottom(this.xScale)
      .ticks(8)
      .tickFormat((d) => this.formatPosition(d as number));

    group
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${yPosition})`)
      .call(axis)
      .selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '10px');

    group.selectAll('.x-axis .domain, .x-axis .tick line').attr('stroke', '#444');
  }

  /**
   * Format genomic position
   */
  private formatPosition(pos: number): string {
    if (pos >= 1e6) return `${(pos / 1e6).toFixed(2)}Mb`;
    if (pos >= 1e3) return `${(pos / 1e3).toFixed(1)}kb`;
    return `${pos}bp`;
  }

  /**
   * Show read tooltip
   */
  private showReadTooltip(event: MouseEvent, read: BamRead): void {
    const flagDescriptions = this.parseSamFlags(read.flags);

    this.tooltip
      .style('display', 'block')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY + 10}px`).html(`
        <div style="font-weight: bold; margin-bottom: 4px;">Read: ${read.id}</div>
        <div><strong>Position:</strong> ${read.chr}:${read.start.toLocaleString()}-${read.end.toLocaleString()}</div>
        <div><strong>Strand:</strong> ${read.strand}</div>
        <div><strong>MAPQ:</strong> ${read.mapq}</div>
        <div><strong>CIGAR:</strong> ${read.cigar}</div>
        ${read.insertSize ? `<div><strong>Insert Size:</strong> ${read.insertSize}</div>` : ''}
        ${read.mateChr ? `<div><strong>Mate:</strong> ${read.mateChr}:${read.mateStart}</div>` : ''}
        <div style="margin-top: 4px; font-size: 10px; color: #888;">${flagDescriptions.join(', ')}</div>
      `);
  }

  /**
   * Parse SAM flags into descriptions
   */
  private parseSamFlags(flags: number): string[] {
    const descriptions: string[] = [];
    if (flags & 0x1) descriptions.push('paired');
    if (flags & 0x2) descriptions.push('proper pair');
    if (flags & 0x4) descriptions.push('unmapped');
    if (flags & 0x8) descriptions.push('mate unmapped');
    if (flags & 0x10) descriptions.push('reverse');
    if (flags & 0x20) descriptions.push('mate reverse');
    if (flags & 0x40) descriptions.push('first in pair');
    if (flags & 0x80) descriptions.push('second in pair');
    if (flags & 0x100) descriptions.push('secondary');
    if (flags & 0x200) descriptions.push('QC fail');
    if (flags & 0x400) descriptions.push('duplicate');
    if (flags & 0x800) descriptions.push('supplementary');
    return descriptions;
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    this.tooltip.style('display', 'none');
  }

  /**
   * Get current reads
   */
  public getReads(): BamRead[] {
    return this.reads;
  }
}

/**
 * CSS styles for BAM Track
 */
export const bamTrackStyles = `
  .bam-track {
    background: #1a1a2e;
    border-radius: 8px;
  }
  
  .bam-track .read:hover rect {
    stroke: #fff;
    stroke-width: 1;
  }
  
  .bam-track .coverage-axis .tick line {
    stroke-opacity: 0.3;
  }
`;

/**
 * Generate sample BAM data for demo
 */
export function generateSampleBamData(
  chr: string,
  start: number,
  end: number,
  numReads: number = 200
): { reads: BamRead[]; coverage: CoverageData[] } {
  const reads: BamRead[] = [];
  const coverageMap = new Map<number, CoverageData>();

  // Initialize coverage
  for (let pos = start; pos <= end; pos += 10) {
    coverageMap.set(pos, {
      position: pos,
      depth: 0,
      forward: 0,
      reverse: 0,
      a: 0,
      c: 0,
      g: 0,
      t: 0,
    });
  }

  // Generate reads
  for (let i = 0; i < numReads; i++) {
    const readLength = 100 + Math.floor(Math.random() * 50);
    const readStart = start + Math.floor(Math.random() * (end - start - readLength));
    const strand = Math.random() > 0.5 ? '+' : '-';
    const mapq = Math.floor(Math.random() * 60);

    // Generate CIGAR (mostly matches with occasional indels)
    let cigar = '';
    let remaining = readLength;

    if (Math.random() > 0.7) {
      // Add soft clip at start
      const clipLen = Math.floor(Math.random() * 10) + 5;
      cigar += `${clipLen}S`;
      remaining -= clipLen;
    }

    if (Math.random() > 0.8 && remaining > 50) {
      // Add deletion
      const match1 = Math.floor(remaining * 0.4);
      const delLen = Math.floor(Math.random() * 20) + 5;
      const match2 = remaining - match1;
      cigar += `${match1}M${delLen}D${match2}M`;
    } else if (Math.random() > 0.9 && remaining > 30) {
      // Add insertion
      const match1 = Math.floor(remaining * 0.5);
      const insLen = Math.floor(Math.random() * 5) + 1;
      const match2 = remaining - match1;
      cigar += `${match1}M${insLen}I${match2}M`;
    } else {
      cigar += `${remaining}M`;
    }

    const read: BamRead = {
      id: `read_${i}`,
      chr,
      start: readStart,
      end: readStart + readLength,
      strand: strand as '+' | '-',
      mapq,
      cigar,
      flags: 0x1 | (strand === '-' ? 0x10 : 0) | (Math.random() > 0.5 ? 0x40 : 0x80),
      insertSize: 200 + Math.floor(Math.random() * 300),
    };

    // Paired read info
    if (Math.random() > 0.3) {
      read.mateChr = chr;
      read.mateStart = readStart + (strand === '+' ? 200 : -200) + Math.floor(Math.random() * 100);
    }

    reads.push(read);

    // Update coverage
    for (let pos = readStart; pos < readStart + readLength; pos += 10) {
      const roundedPos = Math.floor(pos / 10) * 10;
      const cov = coverageMap.get(roundedPos);
      if (cov) {
        cov.depth++;
        if (strand === '+') cov.forward++;
        else cov.reverse++;
      }
    }
  }

  return {
    reads,
    coverage: Array.from(coverageMap.values()).sort((a, b) => a.position - b.position),
  };
}
