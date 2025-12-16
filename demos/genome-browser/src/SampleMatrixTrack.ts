/**
 * Sample Matrix Track (svcnv)
 *
 * Multi-sample structural variant and copy number visualization
 * Shows CNV segments and SVs across multiple samples in a genome browser context
 */

import * as d3 from 'd3';

export interface SampleCnv {
  chr: string;
  start: number;
  end: number;
  value: number; // log2 ratio
  type: 'gain' | 'loss' | 'neutral';
}

export interface SampleSv {
  id: string;
  chrA: string;
  posA: number;
  chrB: string;
  posB: number;
  svType: 'DEL' | 'DUP' | 'INV' | 'TRA' | 'BND';
}

export interface SampleData {
  sampleId: string;
  displayName?: string;
  cnvs: SampleCnv[];
  svs: SampleSv[];
  metadata?: Record<string, string | number>;
}

export interface SampleMatrixSettings {
  width: number;
  rowHeight: number;
  margin: { top: number; right: number; bottom: number; left: number };
  showCnv: boolean;
  showSv: boolean;
  cnvColorScale: 'redblue' | 'redgreen' | 'diverging';
  svColors: Record<string, string>;
  onSampleClick?: (sample: SampleData) => void;
  onRegionClick?: (chr: string, start: number, end: number) => void;
}

const DEFAULT_SV_COLORS: Record<string, string> = {
  DEL: '#3498db',
  DUP: '#e74c3c',
  INV: '#9b59b6',
  TRA: '#2ecc71',
  BND: '#f39c12',
};

/**
 * Sample Matrix Track Component
 */
export class SampleMatrixTrack {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private settings: SampleMatrixSettings;
  private samples: SampleData[] = [];
  private viewRegion: { chr: string; start: number; end: number } | null = null;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private xScale: d3.ScaleLinear<number, number> | null = null;

  constructor(containerId: string, settings?: Partial<SampleMatrixSettings>) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);

    this.container = container;

    this.settings = {
      width: 800,
      rowHeight: 30,
      margin: { top: 40, right: 20, bottom: 30, left: 120 },
      showCnv: true,
      showSv: true,
      cnvColorScale: 'redblue',
      svColors: DEFAULT_SV_COLORS,
      ...settings,
    };

    // Create SVG
    this.svg = d3.select(this.container).append('svg').attr('width', this.settings.width);

    // Create tooltip
    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'sample-matrix-tooltip')
      .style('display', 'none')
      .style('position', 'absolute')
      .style('background', '#1a1a2e')
      .style('border', '1px solid #3498db')
      .style('border-radius', '4px')
      .style('padding', '8px 12px')
      .style('font-size', '12px')
      .style('color', '#e0e0e0')
      .style('z-index', '1000');
  }

  /**
   * Load sample data
   */
  public loadData(samples: SampleData[]): void {
    this.samples = samples;
    this.updateHeight();
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
  public updateSettings(newSettings: Partial<SampleMatrixSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.updateHeight();
    this.render();
  }

  /**
   * Update SVG height based on sample count
   */
  private updateHeight(): void {
    const { rowHeight, margin } = this.settings;
    const height = margin.top + this.samples.length * rowHeight + margin.bottom;
    this.svg.attr('height', height);
  }

  /**
   * Main render function
   */
  public render(): void {
    if (!this.viewRegion || this.samples.length === 0) return;

    this.svg.selectAll('*').remove();

    const { width, rowHeight, margin } = this.settings;
    const { chr, start, end } = this.viewRegion;
    const plotWidth = width - margin.left - margin.right;

    // Create main group
    const mainGroup = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create x scale
    this.xScale = d3.scaleLinear().domain([start, end]).range([0, plotWidth]);

    // Render header
    this.renderHeader(mainGroup, chr, start, end);

    // Render each sample row
    this.samples.forEach((sample, i) => {
      const rowGroup = mainGroup.append('g').attr('transform', `translate(0, ${i * rowHeight})`);

      this.renderSampleRow(rowGroup, sample, i);
    });

    // Render axis
    this.renderAxis(mainGroup);
  }

  /**
   * Render header with chromosome position
   */
  private renderHeader(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    chr: string,
    start: number,
    end: number
  ): void {
    const { width, margin } = this.settings;
    const plotWidth = width - margin.left - margin.right;

    group
      .append('text')
      .attr('x', -margin.left + 10)
      .attr('y', -20)
      .attr('fill', '#e0e0e0')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .text(`${chr}:${this.formatPosition(start)}-${this.formatPosition(end)}`);

    // Region size
    const regionSize = end - start;
    group
      .append('text')
      .attr('x', plotWidth)
      .attr('y', -20)
      .attr('text-anchor', 'end')
      .attr('fill', '#888')
      .attr('font-size', '12px')
      .text(`${(regionSize / 1e6).toFixed(2)} Mb`);
  }

  /**
   * Render a single sample row
   */
  private renderSampleRow(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    sample: SampleData,
    index: number
  ): void {
    const { rowHeight, margin, showCnv, showSv } = this.settings;
    const { chr, start, end } = this.viewRegion!;
    const plotWidth = this.settings.width - margin.left - margin.right;

    // Background
    group
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', plotWidth)
      .attr('height', rowHeight - 2)
      .attr('fill', index % 2 === 0 ? '#1a1a2e' : '#16213e')
      .attr('rx', 2);

    // Sample label
    group
      .append('text')
      .attr('x', -10)
      .attr('y', rowHeight / 2)
      .attr('text-anchor', 'end')
      .attr('dominant-baseline', 'middle')
      .attr('fill', '#e0e0e0')
      .attr('font-size', '11px')
      .style('cursor', 'pointer')
      .text(sample.displayName || sample.sampleId)
      .on('click', () => this.settings.onSampleClick?.(sample))
      .on('mouseover', function () {
        d3.select(this).attr('fill', '#3498db');
      })
      .on('mouseout', function () {
        d3.select(this).attr('fill', '#e0e0e0');
      });

    // Render CNVs
    if (showCnv) {
      this.renderCnvSegments(group, sample, chr, start, end, rowHeight);
    }

    // Render SVs
    if (showSv) {
      this.renderSvMarkers(group, sample, chr, start, end, rowHeight);
    }
  }

  /**
   * Render CNV segments for a sample
   */
  private renderCnvSegments(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    sample: SampleData,
    chr: string,
    regionStart: number,
    regionEnd: number,
    rowHeight: number
  ): void {
    if (!this.xScale) return;

    // Filter CNVs to current region
    const visibleCnvs = sample.cnvs.filter(
      (cnv) => cnv.chr === chr && cnv.end >= regionStart && cnv.start <= regionEnd
    );

    const cnvHeight = rowHeight * 0.6;
    const yOffset = (rowHeight - cnvHeight) / 2;

    visibleCnvs.forEach((cnv) => {
      const x = Math.max(0, this.xScale!(Math.max(cnv.start, regionStart)));
      const width = Math.min(
        this.xScale!(Math.min(cnv.end, regionEnd)) - x,
        this.settings.width - this.settings.margin.left - this.settings.margin.right - x
      );

      if (width < 1) return; // Skip if too small to see

      const color = this.getCnvColor(cnv.value);

      group
        .append('rect')
        .attr('x', x)
        .attr('y', yOffset)
        .attr('width', width)
        .attr('height', cnvHeight)
        .attr('fill', color)
        .attr('opacity', 0.8)
        .style('cursor', 'pointer')
        .on('mouseover', (event) => this.showCnvTooltip(event, sample, cnv))
        .on('mouseout', () => this.hideTooltip())
        .on('click', () => {
          this.settings.onRegionClick?.(cnv.chr, cnv.start, cnv.end);
        });
    });
  }

  /**
   * Render SV markers for a sample
   */
  private renderSvMarkers(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    sample: SampleData,
    chr: string,
    regionStart: number,
    regionEnd: number,
    rowHeight: number
  ): void {
    if (!this.xScale) return;

    // Filter SVs to current region (either endpoint in view)
    const visibleSvs = sample.svs.filter(
      (sv) =>
        (sv.chrA === chr && sv.posA >= regionStart && sv.posA <= regionEnd) ||
        (sv.chrB === chr && sv.posB >= regionStart && sv.posB <= regionEnd)
    );

    visibleSvs.forEach((sv) => {
      const isBreakendA = sv.chrA === chr && sv.posA >= regionStart && sv.posA <= regionEnd;
      const isBreakendB = sv.chrB === chr && sv.posB >= regionStart && sv.posB <= regionEnd;

      const color = this.settings.svColors[sv.svType] || '#888';

      // Draw breakend markers
      if (isBreakendA) {
        this.renderSvMarker(group, sv.posA, sv, color, rowHeight, 'A');
      }

      if (isBreakendB) {
        this.renderSvMarker(group, sv.posB, sv, color, rowHeight, 'B');
      }

      // If both endpoints visible, draw connecting line
      if (isBreakendA && isBreakendB) {
        const x1 = this.xScale!(sv.posA);
        const x2 = this.xScale!(sv.posB);
        const y = rowHeight / 2;

        group
          .append('line')
          .attr('x1', x1)
          .attr('y1', y)
          .attr('x2', x2)
          .attr('y2', y)
          .attr('stroke', color)
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', sv.svType === 'INV' ? '3,2' : 'none')
          .attr('opacity', 0.6);
      }
    });
  }

  /**
   * Render a single SV marker
   */
  private renderSvMarker(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    position: number,
    sv: SampleSv,
    color: string,
    rowHeight: number,
    breakend: 'A' | 'B'
  ): void {
    if (!this.xScale) return;

    const x = this.xScale(position);
    const markerSize = 6;

    // Diamond marker
    const points = [
      [x, rowHeight / 2 - markerSize],
      [x + markerSize, rowHeight / 2],
      [x, rowHeight / 2 + markerSize],
      [x - markerSize, rowHeight / 2],
    ];

    group
      .append('polygon')
      .attr('points', points.map((p) => p.join(',')).join(' '))
      .attr('fill', color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('mouseover', (event) => this.showSvTooltip(event, sv))
      .on('mouseout', () => this.hideTooltip());
  }

  /**
   * Render x-axis
   */
  private renderAxis(group: d3.Selection<SVGGElement, unknown, null, undefined>): void {
    if (!this.xScale) return;

    const { rowHeight } = this.settings;
    const yPosition = this.samples.length * rowHeight;

    const axis = d3
      .axisBottom(this.xScale)
      .ticks(8)
      .tickFormat((d) => this.formatPosition(d as number));

    group
      .append('g')
      .attr('transform', `translate(0, ${yPosition})`)
      .call(axis)
      .selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '10px');

    group.selectAll('.domain, .tick line').attr('stroke', '#444');
  }

  /**
   * Get CNV color based on log2 ratio
   */
  private getCnvColor(value: number): string {
    const { cnvColorScale } = this.settings;

    // Clamp value to reasonable range
    const clampedValue = Math.max(-2, Math.min(2, value));

    if (cnvColorScale === 'redblue') {
      if (clampedValue >= 0) {
        // Gain: red
        return d3.interpolateReds(clampedValue / 2 + 0.3);
      } else {
        // Loss: blue
        return d3.interpolateBlues(-clampedValue / 2 + 0.3);
      }
    } else if (cnvColorScale === 'diverging') {
      return d3.interpolateRdBu(0.5 - clampedValue / 4);
    }

    // Default red/green
    if (clampedValue >= 0) {
      return d3.interpolateReds(clampedValue / 2 + 0.3);
    } else {
      return d3.interpolateGreens(-clampedValue / 2 + 0.3);
    }
  }

  /**
   * Format genomic position
   */
  private formatPosition(pos: number): string {
    if (pos >= 1e6) {
      return `${(pos / 1e6).toFixed(1)}Mb`;
    } else if (pos >= 1e3) {
      return `${(pos / 1e3).toFixed(1)}kb`;
    }
    return `${pos}bp`;
  }

  /**
   * Show CNV tooltip
   */
  private showCnvTooltip(event: MouseEvent, sample: SampleData, cnv: SampleCnv): void {
    this.tooltip
      .style('display', 'block')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY + 10}px`).html(`
        <div><strong>${sample.displayName || sample.sampleId}</strong></div>
        <div>Region: ${cnv.chr}:${this.formatPosition(cnv.start)}-${this.formatPosition(cnv.end)}</div>
        <div>Log2 Ratio: ${cnv.value.toFixed(2)}</div>
        <div>Type: <span style="color: ${cnv.type === 'gain' ? '#e74c3c' : '#3498db'}">${cnv.type.toUpperCase()}</span></div>
        <div>Size: ${this.formatPosition(cnv.end - cnv.start)}</div>
      `);
  }

  /**
   * Show SV tooltip
   */
  private showSvTooltip(event: MouseEvent, sv: SampleSv): void {
    const color = this.settings.svColors[sv.svType] || '#888';

    this.tooltip
      .style('display', 'block')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY + 10}px`).html(`
        <div><strong style="color: ${color}">${sv.svType}</strong></div>
        <div>Breakend A: ${sv.chrA}:${this.formatPosition(sv.posA)}</div>
        <div>Breakend B: ${sv.chrB}:${this.formatPosition(sv.posB)}</div>
        ${sv.chrA === sv.chrB ? `<div>Size: ${this.formatPosition(Math.abs(sv.posB - sv.posA))}</div>` : ''}
      `);
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    this.tooltip.style('display', 'none');
  }

  /**
   * Get currently visible samples
   */
  public getSamples(): SampleData[] {
    return this.samples;
  }

  /**
   * Sort samples by metadata field
   */
  public sortSamples(field: string, ascending: boolean = true): void {
    this.samples.sort((a, b) => {
      const valA = a.metadata?.[field];
      const valB = b.metadata?.[field];

      if (valA === undefined && valB === undefined) return 0;
      if (valA === undefined) return 1;
      if (valB === undefined) return -1;

      const comparison = valA < valB ? -1 : valA > valB ? 1 : 0;
      return ascending ? comparison : -comparison;
    });

    this.render();
  }
}

/**
 * CSS styles for Sample Matrix Track
 */
export const sampleMatrixStyles = `
  .sample-matrix-container {
    background: #1a1a2e;
    border-radius: 8px;
    padding: 1rem;
    overflow-x: auto;
  }
  
  .sample-matrix-container svg {
    display: block;
  }
  
  .sample-matrix-legend {
    display: flex;
    gap: 1rem;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid #0f3460;
  }
  
  .sample-matrix-legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 11px;
    color: #e0e0e0;
  }
  
  .sample-matrix-legend-color {
    width: 16px;
    height: 16px;
    border-radius: 3px;
  }
`;
