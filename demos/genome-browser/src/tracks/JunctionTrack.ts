/**
 * Junction Track Component
 *
 * Visualizes splice junctions from RNA-seq data:
 * - Arc diagrams connecting splice sites
 * - Read count annotations
 * - Novel vs known junction distinction
 * - Strandedness visualization
 * - Support for different junction types (canonical, semi-canonical, non-canonical)
 */

import * as d3 from 'd3';

export interface SpliceJunction {
  id: string;
  chr: string;
  start: number; // Donor site (5' splice site)
  end: number; // Acceptor site (3' splice site)
  strand: '+' | '-' | '.';
  readCount: number;
  uniqueReads?: number;
  multiMapReads?: number;
  motif: 'GT-AG' | 'GC-AG' | 'AT-AC' | 'other'; // Splice motif
  isAnnotated: boolean; // Known in reference annotation
  geneId?: string;
  geneName?: string;
  transcriptId?: string;
  // For novel junctions
  novelType?: 'exon_skip' | 'alt_donor' | 'alt_acceptor' | 'novel_intron' | 'novel_exon';
}

export interface JunctionTrackSettings {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  minReads: number;
  maxArcHeight: number;
  colorBy: 'strand' | 'motif' | 'annotated' | 'novelType' | 'readCount';
  showLabels: boolean;
  labelThreshold: number; // Minimum reads to show label
  arcStyle: 'solid' | 'dashed-novel';
  scaleArcByReads: boolean;
  trackName: string;
  onJunctionClick?: (junction: SpliceJunction) => void;
  onJunctionHover?: (junction: SpliceJunction | null) => void;
}

const DEFAULT_SETTINGS: JunctionTrackSettings = {
  width: 800,
  height: 150,
  margin: { top: 20, right: 20, bottom: 30, left: 60 },
  minReads: 1,
  maxArcHeight: 100,
  colorBy: 'annotated',
  showLabels: true,
  labelThreshold: 5,
  arcStyle: 'dashed-novel',
  scaleArcByReads: true,
  trackName: 'Splice Junctions',
};

const COLOR_SCHEMES = {
  strand: {
    '+': '#4a90d9',
    '-': '#d94a4a',
    '.': '#888888',
  },
  motif: {
    'GT-AG': '#27ae60', // Canonical
    'GC-AG': '#f39c12', // Semi-canonical
    'AT-AC': '#9b59b6', // Minor spliceosome
    other: '#e74c3c', // Non-canonical
  },
  annotated: {
    known: '#3498db',
    novel: '#e74c3c',
  },
  novelType: {
    exon_skip: '#e74c3c',
    alt_donor: '#f39c12',
    alt_acceptor: '#9b59b6',
    novel_intron: '#16a085',
    novel_exon: '#2c3e50',
  },
};

/**
 * Junction Track Visualization
 */
export class JunctionTrack {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private settings: JunctionTrackSettings;
  private junctions: SpliceJunction[] = [];
  private viewRegion: { chr: string; start: number; end: number } | null = null;
  private xScale: d3.ScaleLinear<number, number> | null = null;
  private readCountScale: d3.ScaleLinear<number, number> | null = null;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;

  constructor(containerId: string, settings?: Partial<JunctionTrackSettings>) {
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
      .attr('class', 'junction-track');

    // Create tooltip
    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'junction-tooltip')
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
   * Load junction data
   */
  public loadData(junctions: SpliceJunction[]): void {
    this.junctions = junctions.filter((j) => j.readCount >= this.settings.minReads);
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
  public updateSettings(newSettings: Partial<JunctionTrackSettings>): void {
    this.settings = { ...this.settings, ...newSettings };

    if ('minReads' in newSettings) {
      // Re-filter junctions if minReads changed
      this.junctions = this.junctions.filter((j) => j.readCount >= this.settings.minReads);
    }

    if (this.viewRegion) {
      this.render();
    }
  }

  /**
   * Main render function
   */
  public render(): void {
    if (!this.viewRegion) return;

    this.svg.selectAll('*').remove();

    const { width, height, margin, maxArcHeight, scaleArcByReads, trackName } = this.settings;
    const { chr, start, end } = this.viewRegion;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Create main group
    const mainGroup = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Filter junctions to view region
    const visibleJunctions = this.junctions.filter(
      (j) => j.chr === chr && j.end >= start && j.start <= end
    );

    if (visibleJunctions.length === 0) {
      this.renderEmptyState(mainGroup, plotWidth, plotHeight);
      return;
    }

    // Create scales
    this.xScale = d3.scaleLinear().domain([start, end]).range([0, plotWidth]);

    // Create read count scale for arc height
    const maxReads = d3.max(visibleJunctions, (j) => j.readCount) || 100;
    this.readCountScale = d3.scaleLinear().domain([1, maxReads]).range([20, maxArcHeight]);

    // Separate junctions by strand for layering
    const plusJunctions = visibleJunctions.filter((j) => j.strand !== '-');
    const minusJunctions = visibleJunctions.filter((j) => j.strand === '-');

    // Render baseline
    mainGroup
      .append('line')
      .attr('x1', 0)
      .attr('y1', plotHeight / 2)
      .attr('x2', plotWidth)
      .attr('y2', plotHeight / 2)
      .attr('stroke', '#444')
      .attr('stroke-width', 2);

    // Render junctions - plus strand (arcs above baseline)
    this.renderJunctions(
      mainGroup,
      plusJunctions,
      plotHeight / 2,
      true, // Above baseline
      plotWidth
    );

    // Render junctions - minus strand (arcs below baseline)
    this.renderJunctions(
      mainGroup,
      minusJunctions,
      plotHeight / 2,
      false, // Below baseline
      plotWidth
    );

    // Track name
    mainGroup
      .append('text')
      .attr('x', 5)
      .attr('y', -5)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text(trackName);

    // Strand labels
    mainGroup
      .append('text')
      .attr('x', -5)
      .attr('y', plotHeight / 4)
      .attr('text-anchor', 'end')
      .attr('fill', '#4a90d9')
      .attr('font-size', '10px')
      .text('+ strand');

    mainGroup
      .append('text')
      .attr('x', -5)
      .attr('y', (plotHeight * 3) / 4)
      .attr('text-anchor', 'end')
      .attr('fill', '#d94a4a')
      .attr('font-size', '10px')
      .text('− strand');

    // X-axis
    this.renderXAxis(mainGroup, plotHeight, plotWidth);

    // Legend
    this.renderLegend(mainGroup, plotWidth);
  }

  /**
   * Render junctions as arcs
   */
  private renderJunctions(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    junctions: SpliceJunction[],
    baseline: number,
    above: boolean,
    plotWidth: number
  ): void {
    if (!this.xScale || !this.readCountScale) return;

    const { colorBy, arcStyle, scaleArcByReads, showLabels, labelThreshold } = this.settings;

    junctions.forEach((junction) => {
      const x1 = this.xScale!(junction.start);
      const x2 = this.xScale!(junction.end);

      // Skip if outside visible area
      if (x2 < 0 || x1 > plotWidth) return;

      // Calculate arc height based on read count or junction span
      let arcHeight: number;
      if (scaleArcByReads) {
        arcHeight = this.readCountScale!(junction.readCount);
      } else {
        // Scale by span
        const span = junction.end - junction.start;
        arcHeight = Math.min(this.settings.maxArcHeight, 20 + span / 500);
      }

      // Adjust height direction
      const yOffset = above ? -arcHeight : arcHeight;

      // Get color
      const color = this.getJunctionColor(junction);

      // Determine stroke style
      const isDashed = arcStyle === 'dashed-novel' && !junction.isAnnotated;

      // Create arc path
      const midX = (x1 + x2) / 2;
      const arcPath = above
        ? `M ${x1} ${baseline} Q ${midX} ${baseline + yOffset} ${x2} ${baseline}`
        : `M ${x1} ${baseline} Q ${midX} ${baseline + yOffset} ${x2} ${baseline}`;

      // Calculate stroke width based on read count
      const strokeWidth = Math.max(1, Math.min(6, Math.log2(junction.readCount + 1)));

      // Draw arc
      const arcElement = group
        .append('path')
        .attr('class', 'junction-arc')
        .attr('d', arcPath)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', strokeWidth)
        .attr('stroke-dasharray', isDashed ? '5,3' : 'none')
        .attr('opacity', 0.8)
        .style('cursor', 'pointer')
        .on('mouseover', (event) => this.showJunctionTooltip(event, junction))
        .on('mouseout', () => this.hideTooltip())
        .on('click', () => this.settings.onJunctionClick?.(junction));

      // Add hover effect
      arcElement
        .on('mouseenter', function () {
          d3.select(this)
            .attr('stroke-width', strokeWidth + 2)
            .attr('opacity', 1);
        })
        .on('mouseleave', function () {
          d3.select(this).attr('stroke-width', strokeWidth).attr('opacity', 0.8);
        });

      // Splice site dots
      group.append('circle').attr('cx', x1).attr('cy', baseline).attr('r', 3).attr('fill', color);

      group.append('circle').attr('cx', x2).attr('cy', baseline).attr('r', 3).attr('fill', color);

      // Read count label
      if (showLabels && junction.readCount >= labelThreshold) {
        const labelY = above ? baseline + yOffset / 2 - 5 : baseline + yOffset / 2 + 12;

        group
          .append('text')
          .attr('x', midX)
          .attr('y', labelY)
          .attr('text-anchor', 'middle')
          .attr('fill', '#e0e0e0')
          .attr('font-size', '9px')
          .attr('font-weight', 'bold')
          .style('pointer-events', 'none')
          .text(this.formatReadCount(junction.readCount));
      }
    });
  }

  /**
   * Get junction color based on color scheme
   */
  private getJunctionColor(junction: SpliceJunction): string {
    const { colorBy } = this.settings;

    switch (colorBy) {
      case 'strand':
        return COLOR_SCHEMES.strand[junction.strand] || COLOR_SCHEMES.strand['.'];

      case 'motif':
        return COLOR_SCHEMES.motif[junction.motif] || COLOR_SCHEMES.motif.other;

      case 'annotated':
        return junction.isAnnotated ? COLOR_SCHEMES.annotated.known : COLOR_SCHEMES.annotated.novel;

      case 'novelType':
        if (!junction.isAnnotated && junction.novelType) {
          return COLOR_SCHEMES.novelType[junction.novelType] || '#888';
        }
        return COLOR_SCHEMES.annotated.known;

      case 'readCount':
        // Use a color scale based on read count
        const maxReads = d3.max(this.junctions, (j) => j.readCount) || 100;
        const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxReads]);
        return colorScale(junction.readCount);

      default:
        return '#3498db';
    }
  }

  /**
   * Format read count for display
   */
  private formatReadCount(count: number): string {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  }

  /**
   * Render X axis
   */
  private renderXAxis(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    plotHeight: number,
    plotWidth: number
  ): void {
    if (!this.xScale) return;

    const xAxis = d3
      .axisBottom(this.xScale)
      .ticks(8)
      .tickFormat((d) => this.formatPosition(d as number));

    group
      .append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${plotHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '9px');

    group.selectAll('.x-axis .domain, .x-axis .tick line').attr('stroke', '#444');
  }

  /**
   * Render legend
   */
  private renderLegend(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    plotWidth: number
  ): void {
    const { colorBy } = this.settings;
    const legendItems: { color: string; label: string }[] = [];

    switch (colorBy) {
      case 'annotated':
        legendItems.push(
          { color: COLOR_SCHEMES.annotated.known, label: 'Known' },
          { color: COLOR_SCHEMES.annotated.novel, label: 'Novel' }
        );
        break;
      case 'motif':
        legendItems.push(
          { color: COLOR_SCHEMES.motif['GT-AG'], label: 'GT-AG' },
          { color: COLOR_SCHEMES.motif['GC-AG'], label: 'GC-AG' },
          { color: COLOR_SCHEMES.motif['AT-AC'], label: 'AT-AC' },
          { color: COLOR_SCHEMES.motif.other, label: 'Other' }
        );
        break;
    }

    if (legendItems.length === 0) return;

    const legend = group
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${plotWidth - legendItems.length * 60}, -15)`);

    legendItems.forEach((item, i) => {
      const itemGroup = legend.append('g').attr('transform', `translate(${i * 60}, 0)`);

      itemGroup
        .append('line')
        .attr('x1', 0)
        .attr('y1', 5)
        .attr('x2', 15)
        .attr('y2', 5)
        .attr('stroke', item.color)
        .attr('stroke-width', 2);

      itemGroup
        .append('text')
        .attr('x', 18)
        .attr('y', 8)
        .attr('fill', '#888')
        .attr('font-size', '9px')
        .text(item.label);
    });
  }

  /**
   * Render empty state
   */
  private renderEmptyState(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    plotWidth: number,
    plotHeight: number
  ): void {
    group
      .append('text')
      .attr('x', plotWidth / 2)
      .attr('y', plotHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '12px')
      .text('No junctions in this region');
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
   * Show junction tooltip
   */
  private showJunctionTooltip(event: MouseEvent, junction: SpliceJunction): void {
    this.tooltip
      .style('display', 'block')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY + 10}px`).html(`
        <div style="font-weight: bold; margin-bottom: 4px;">
          ${junction.geneName || 'Splice Junction'}
        </div>
        <div><strong>Position:</strong> ${junction.chr}:${junction.start.toLocaleString()}-${junction.end.toLocaleString()}</div>
        <div><strong>Strand:</strong> ${junction.strand}</div>
        <div><strong>Read Count:</strong> ${junction.readCount.toLocaleString()}</div>
        ${junction.uniqueReads ? `<div><strong>Unique Reads:</strong> ${junction.uniqueReads.toLocaleString()}</div>` : ''}
        <div><strong>Motif:</strong> <span style="color: ${COLOR_SCHEMES.motif[junction.motif]}">${junction.motif}</span></div>
        <div><strong>Status:</strong> 
          <span style="color: ${junction.isAnnotated ? COLOR_SCHEMES.annotated.known : COLOR_SCHEMES.annotated.novel}">
            ${junction.isAnnotated ? 'Known' : 'Novel'}
          </span>
        </div>
        ${junction.novelType ? `<div><strong>Novel Type:</strong> ${junction.novelType.replace('_', ' ')}</div>` : ''}
        <div><strong>Span:</strong> ${(junction.end - junction.start).toLocaleString()} bp</div>
      `);

    this.settings.onJunctionHover?.(junction);
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    this.tooltip.style('display', 'none');
    this.settings.onJunctionHover?.(null);
  }

  /**
   * Get current junctions
   */
  public getJunctions(): SpliceJunction[] {
    return this.junctions;
  }

  /**
   * Get junction statistics
   */
  public getStats(): {
    total: number;
    known: number;
    novel: number;
    totalReads: number;
    byMotif: Record<string, number>;
  } {
    const known = this.junctions.filter((j) => j.isAnnotated).length;
    const novel = this.junctions.filter((j) => !j.isAnnotated).length;
    const totalReads = this.junctions.reduce((sum, j) => sum + j.readCount, 0);

    const byMotif: Record<string, number> = {};
    this.junctions.forEach((j) => {
      byMotif[j.motif] = (byMotif[j.motif] || 0) + 1;
    });

    return {
      total: this.junctions.length,
      known,
      novel,
      totalReads,
      byMotif,
    };
  }
}

/**
 * CSS styles for Junction Track
 */
export const junctionTrackStyles = `
  .junction-track {
    background: #1a1a2e;
    border-radius: 4px;
  }
  
  .junction-track .junction-arc {
    transition: stroke-width 0.2s, opacity 0.2s;
  }
`;

/**
 * Generate sample junction data for demo
 */
export function generateSampleJunctionData(
  chr: string,
  start: number,
  end: number,
  numJunctions: number = 50
): SpliceJunction[] {
  const junctions: SpliceJunction[] = [];
  const motifs: Array<'GT-AG' | 'GC-AG' | 'AT-AC' | 'other'> = [
    'GT-AG',
    'GT-AG',
    'GT-AG',
    'GC-AG',
    'AT-AC',
    'other',
  ];
  const novelTypes: Array<
    'exon_skip' | 'alt_donor' | 'alt_acceptor' | 'novel_intron' | 'novel_exon'
  > = ['exon_skip', 'alt_donor', 'alt_acceptor', 'novel_intron', 'novel_exon'];

  for (let i = 0; i < numJunctions; i++) {
    const jStart = start + Math.floor(Math.random() * (end - start - 10000));
    const span = 500 + Math.floor(Math.random() * 50000); // 500bp to 50kb span
    const jEnd = jStart + span;
    const isAnnotated = Math.random() > 0.3; // 70% are annotated
    const strand = Math.random() > 0.5 ? '+' : '-';
    const readCount = Math.floor(Math.pow(10, 1 + Math.random() * 3)); // 10 to 10000

    const junction: SpliceJunction = {
      id: `junction_${i}`,
      chr,
      start: jStart,
      end: jEnd,
      strand: strand as '+' | '-',
      readCount,
      uniqueReads: Math.floor(readCount * 0.85),
      multiMapReads: Math.floor(readCount * 0.15),
      motif: motifs[Math.floor(Math.random() * motifs.length)],
      isAnnotated,
      geneId: `ENSG000000${Math.floor(Math.random() * 99999)
        .toString()
        .padStart(5, '0')}`,
      geneName: `GENE${Math.floor(Math.random() * 1000)}`,
    };

    if (!isAnnotated) {
      junction.novelType = novelTypes[Math.floor(Math.random() * novelTypes.length)];
    }

    junctions.push(junction);
  }

  return junctions;
}
