/**
 * Genome Browser - Main Component
 * 
 * A track-based genome visualization component inspired by ProteinPaint.
 * Supports synchronized tracks with pan/zoom navigation.
 */

import * as d3 from 'd3';
import type {
  BrowserConfig,
  GenomicRegion,
  ViewState,
  TrackConfig,
  NavigationEvent,
  SelectionEvent,
  CHROMOSOME_SIZES_HG38,
} from './types';

// ============================================
// Main Genome Browser Class
// ============================================

export class GenomeBrowser {
  private container: HTMLElement;
  private config: BrowserConfig;
  private viewState: ViewState;
  private tracks: Map<string, TrackInstance> = new Map();
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private trackContainer: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  
  private onNavigate: ((event: NavigationEvent) => void)[] = [];
  private onSelect: ((event: SelectionEvent) => void)[] = [];
  
  private isDragging = false;
  private dragStart: { x: number; region: GenomicRegion } | null = null;

  constructor(container: HTMLElement | string, config: BrowserConfig) {
    // Resolve container
    if (typeof container === 'string') {
      const el = document.querySelector(container);
      if (!el || !(el instanceof HTMLElement)) {
        throw new Error(`Container not found: ${container}`);
      }
      this.container = el;
    } else {
      this.container = container;
    }

    this.config = {
      showNavigation: true,
      showCoordinates: true,
      showCytoband: true,
      minZoom: 1,
      maxZoom: 1000000,
      ...config,
    };

    this.viewState = {
      region: config.initialRegion,
      pixelsPerBase: this.calculatePixelsPerBase(config.initialRegion),
    };

    this.init();
  }

  // ============================================
  // Initialization
  // ============================================

  private init(): void {
    this.container.innerHTML = '';
    this.container.style.position = 'relative';

    // Calculate total height
    const navHeight = this.config.showNavigation ? 40 : 0;
    const coordHeight = this.config.showCoordinates ? 30 : 0;
    const tracksHeight = this.config.tracks.reduce((sum, t) => sum + (t.visible ? t.height : 0), 0);
    const totalHeight = navHeight + coordHeight + tracksHeight + 20;

    // Create main SVG
    this.svg = d3.select(this.container)
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', totalHeight)
      .attr('class', 'genome-browser');

    let currentY = 0;

    // Navigation bar
    if (this.config.showNavigation) {
      this.renderNavigationBar(currentY);
      currentY += navHeight;
    }

    // Coordinate axis
    if (this.config.showCoordinates) {
      this.renderCoordinateAxis(currentY);
      currentY += coordHeight;
    }

    // Track container
    this.trackContainer = this.svg.append('g')
      .attr('class', 'tracks')
      .attr('transform', `translate(0, ${currentY})`);

    // Initialize tracks
    this.initTracks();

    // Set up interactions
    this.setupInteractions();
  }

  private calculatePixelsPerBase(region: GenomicRegion): number {
    const bases = region.end - region.start;
    return this.config.width / bases;
  }

  // ============================================
  // Navigation Bar
  // ============================================

  private renderNavigationBar(y: number): void {
    const nav = this.svg!.append('g')
      .attr('class', 'navigation')
      .attr('transform', `translate(0, ${y})`);

    // Background
    nav.append('rect')
      .attr('width', this.config.width)
      .attr('height', 35)
      .attr('fill', '#f8f9fa')
      .attr('stroke', '#dee2e6');

    // Chromosome selector
    nav.append('text')
      .attr('x', 10)
      .attr('y', 22)
      .attr('font-size', '12px')
      .attr('fill', '#333')
      .text(`${this.viewState.region.chromosome}:`);

    // Position display
    const posText = nav.append('text')
      .attr('class', 'position-display')
      .attr('x', 70)
      .attr('y', 22)
      .attr('font-size', '12px')
      .attr('font-family', 'monospace')
      .attr('fill', '#333')
      .text(this.formatRegion(this.viewState.region));

    // Zoom controls
    const zoomGroup = nav.append('g')
      .attr('transform', `translate(${this.config.width - 120}, 5)`);

    // Zoom out button
    this.createButton(zoomGroup, 0, '−', () => this.zoom(0.5));
    
    // Zoom in button
    this.createButton(zoomGroup, 35, '+', () => this.zoom(2));

    // Reset button
    this.createButton(zoomGroup, 70, '⟲', () => this.resetView());
  }

  private createButton(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    x: number,
    text: string,
    onClick: () => void
  ): void {
    const btn = parent.append('g')
      .attr('transform', `translate(${x}, 0)`)
      .style('cursor', 'pointer')
      .on('click', onClick);

    btn.append('rect')
      .attr('width', 28)
      .attr('height', 25)
      .attr('rx', 4)
      .attr('fill', '#fff')
      .attr('stroke', '#ccc');

    btn.append('text')
      .attr('x', 14)
      .attr('y', 17)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .attr('fill', '#333')
      .text(text);

    btn.on('mouseover', function() {
      d3.select(this).select('rect').attr('fill', '#e9ecef');
    }).on('mouseout', function() {
      d3.select(this).select('rect').attr('fill', '#fff');
    });
  }

  // ============================================
  // Coordinate Axis
  // ============================================

  private renderCoordinateAxis(y: number): void {
    const axis = this.svg!.append('g')
      .attr('class', 'coordinate-axis')
      .attr('transform', `translate(0, ${y})`);

    this.updateCoordinateAxis();
  }

  private updateCoordinateAxis(): void {
    const axis = this.svg!.select('.coordinate-axis');
    axis.selectAll('*').remove();

    const { region } = this.viewState;
    const width = this.config.width;

    // Scale
    const x = d3.scaleLinear()
      .domain([region.start, region.end])
      .range([0, width]);

    // Determine appropriate tick format based on zoom level
    const span = region.end - region.start;
    let tickFormat: (d: number) => string;
    let numTicks: number;

    if (span > 10000000) {
      tickFormat = (d) => `${(d / 1000000).toFixed(1)}Mb`;
      numTicks = 10;
    } else if (span > 1000000) {
      tickFormat = (d) => `${(d / 1000000).toFixed(2)}Mb`;
      numTicks = 10;
    } else if (span > 10000) {
      tickFormat = (d) => `${(d / 1000).toFixed(0)}kb`;
      numTicks = 10;
    } else {
      tickFormat = (d) => d.toLocaleString();
      numTicks = 8;
    }

    // Axis
    const axisGen = d3.axisBottom(x)
      .ticks(numTicks)
      .tickFormat(tickFormat as any);

    axis.append('g')
      .attr('transform', 'translate(0, 5)')
      .call(axisGen)
      .selectAll('text')
      .attr('font-size', '10px');
  }

  // ============================================
  // Track Management
  // ============================================

  private initTracks(): void {
    let currentY = 0;

    for (const trackConfig of this.config.tracks) {
      if (!trackConfig.visible) continue;

      const track = new TrackInstance(
        this.trackContainer!,
        trackConfig,
        currentY,
        this.config.width,
        this.viewState
      );

      this.tracks.set(trackConfig.id, track);
      currentY += trackConfig.height;
    }
  }

  private updateTracks(): void {
    for (const track of this.tracks.values()) {
      track.update(this.viewState);
    }
  }

  // ============================================
  // Interactions
  // ============================================

  private setupInteractions(): void {
    const svg = this.svg!;

    // Pan with drag
    svg.on('mousedown', (event: MouseEvent) => {
      if (event.button !== 0) return; // Left click only
      this.isDragging = true;
      this.dragStart = {
        x: event.clientX,
        region: { ...this.viewState.region },
      };
      svg.style('cursor', 'grabbing');
    });

    svg.on('mousemove', (event: MouseEvent) => {
      if (!this.isDragging || !this.dragStart) return;

      const dx = event.clientX - this.dragStart.x;
      const basesPerPixel = 1 / this.viewState.pixelsPerBase;
      const shift = Math.round(-dx * basesPerPixel);

      const newRegion: GenomicRegion = {
        chromosome: this.dragStart.region.chromosome,
        start: this.dragStart.region.start + shift,
        end: this.dragStart.region.end + shift,
      };

      this.navigateTo(newRegion, 'user', false);
    });

    svg.on('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.dragStart = null;
        svg.style('cursor', 'default');
      }
    });

    svg.on('mouseleave', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.dragStart = null;
        svg.style('cursor', 'default');
      }
    });

    // Zoom with wheel
    svg.on('wheel', (event: WheelEvent) => {
      event.preventDefault();
      const zoomFactor = event.deltaY > 0 ? 0.8 : 1.25;
      this.zoomAtPoint(zoomFactor, event.offsetX);
    });
  }

  // ============================================
  // Navigation Methods
  // ============================================

  public navigateTo(
    region: GenomicRegion,
    source: 'user' | 'api' = 'api',
    notify = true
  ): void {
    // Clamp to chromosome bounds
    const chromSize = this.getChromosomeSize(region.chromosome);
    const span = region.end - region.start;
    
    let start = Math.max(0, region.start);
    let end = Math.min(chromSize, region.end);
    
    // Maintain span if possible
    if (end - start < span) {
      if (start === 0) {
        end = Math.min(chromSize, start + span);
      } else {
        start = Math.max(0, end - span);
      }
    }

    this.viewState.region = { chromosome: region.chromosome, start, end };
    this.viewState.pixelsPerBase = this.calculatePixelsPerBase(this.viewState.region);

    this.updateCoordinateAxis();
    this.updatePositionDisplay();
    this.updateTracks();

    if (notify) {
      const event: NavigationEvent = {
        type: 'jump',
        region: this.viewState.region,
        source,
      };
      this.onNavigate.forEach(cb => cb(event));
    }
  }

  public zoom(factor: number): void {
    const { region } = this.viewState;
    const center = (region.start + region.end) / 2;
    const currentSpan = region.end - region.start;
    const newSpan = Math.round(currentSpan / factor);

    // Check zoom limits
    if (newSpan < this.config.minZoom! || newSpan > this.config.maxZoom!) {
      return;
    }

    const newRegion: GenomicRegion = {
      chromosome: region.chromosome,
      start: Math.round(center - newSpan / 2),
      end: Math.round(center + newSpan / 2),
    };

    this.navigateTo(newRegion, 'user');
  }

  private zoomAtPoint(factor: number, x: number): void {
    const { region } = this.viewState;
    const basesPerPixel = 1 / this.viewState.pixelsPerBase;
    const centerBase = region.start + x * basesPerPixel;

    const currentSpan = region.end - region.start;
    const newSpan = Math.round(currentSpan / factor);

    // Check zoom limits
    if (newSpan < this.config.minZoom! || newSpan > this.config.maxZoom!) {
      return;
    }

    // Keep the mouse position fixed
    const ratio = x / this.config.width;
    const newRegion: GenomicRegion = {
      chromosome: region.chromosome,
      start: Math.round(centerBase - newSpan * ratio),
      end: Math.round(centerBase + newSpan * (1 - ratio)),
    };

    this.navigateTo(newRegion, 'user');
  }

  public resetView(): void {
    this.navigateTo(this.config.initialRegion, 'user');
  }

  // ============================================
  // Event Subscriptions
  // ============================================

  public onNavigationChange(callback: (event: NavigationEvent) => void): () => void {
    this.onNavigate.push(callback);
    return () => {
      this.onNavigate = this.onNavigate.filter(cb => cb !== callback);
    };
  }

  public onSelection(callback: (event: SelectionEvent) => void): () => void {
    this.onSelect.push(callback);
    return () => {
      this.onSelect = this.onSelect.filter(cb => cb !== callback);
    };
  }

  // ============================================
  // Utility Methods
  // ============================================

  private formatRegion(region: GenomicRegion): string {
    return `${region.start.toLocaleString()}-${region.end.toLocaleString()}`;
  }

  private updatePositionDisplay(): void {
    this.svg?.select('.position-display')
      .text(this.formatRegion(this.viewState.region));
  }

  private getChromosomeSize(chrom: string): number {
    const sizes: Record<string, number> = {
      chr1: 248956422, chr2: 242193529, chr3: 198295559, chr4: 190214555,
      chr5: 181538259, chr6: 170805979, chr7: 159345973, chr8: 145138636,
      chr9: 138394717, chr10: 133797422, chr11: 135086622, chr12: 133275309,
      chr13: 114364328, chr14: 107043718, chr15: 101991189, chr16: 90338345,
      chr17: 83257441, chr18: 80373285, chr19: 58617616, chr20: 64444167,
      chr21: 46709983, chr22: 50818468, chrX: 156040895, chrY: 57227415,
      chrM: 16569,
    };
    return sizes[chrom] || 100000000;
  }

  public getViewState(): ViewState {
    return { ...this.viewState };
  }

  public destroy(): void {
    this.container.innerHTML = '';
    this.tracks.clear();
    this.onNavigate = [];
    this.onSelect = [];
  }
}

// ============================================
// Track Instance Class
// ============================================

class TrackInstance {
  private group: d3.Selection<SVGGElement, unknown, null, undefined>;
  private config: TrackConfig;
  private width: number;
  private data: unknown[] = [];

  constructor(
    parent: d3.Selection<SVGGElement, unknown, null, undefined>,
    config: TrackConfig,
    y: number,
    width: number,
    viewState: ViewState
  ) {
    this.config = config;
    this.width = width;

    this.group = parent.append('g')
      .attr('class', `track track-${config.type}`)
      .attr('transform', `translate(0, ${y})`);

    // Track background
    this.group.append('rect')
      .attr('class', 'track-bg')
      .attr('width', width)
      .attr('height', config.height)
      .attr('fill', '#fff')
      .attr('stroke', '#eee');

    // Track label
    this.group.append('text')
      .attr('class', 'track-label')
      .attr('x', 5)
      .attr('y', 12)
      .attr('font-size', '10px')
      .attr('fill', '#666')
      .text(config.label);

    // Content group
    this.group.append('g')
      .attr('class', 'track-content')
      .attr('transform', 'translate(0, 15)');

    // Load initial data
    this.loadData(viewState);
  }

  public update(viewState: ViewState): void {
    this.loadData(viewState);
    this.render(viewState);
  }

  private async loadData(viewState: ViewState): Promise<void> {
    // In production, this would fetch from API
    // For now, generate mock data based on track type
    switch (this.config.type) {
      case 'gene':
        this.data = this.generateMockGenes(viewState);
        break;
      case 'mutation':
        this.data = this.generateMockMutations(viewState);
        break;
      case 'ruler':
        this.data = [];
        break;
      default:
        this.data = [];
    }
    this.render(viewState);
  }

  private render(viewState: ViewState): void {
    const content = this.group.select('.track-content');
    content.selectAll('*').remove();

    switch (this.config.type) {
      case 'gene':
        this.renderGeneTrack(content, viewState);
        break;
      case 'mutation':
        this.renderMutationTrack(content, viewState);
        break;
      case 'ruler':
        this.renderRulerTrack(content, viewState);
        break;
    }
  }

  // ============================================
  // Gene Track Renderer
  // ============================================

  private renderGeneTrack(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    viewState: ViewState
  ): void {
    const { region, pixelsPerBase } = viewState;
    const genes = this.data as any[];
    const trackHeight = this.config.height - 20;

    const x = d3.scaleLinear()
      .domain([region.start, region.end])
      .range([0, this.width]);

    genes.forEach((gene, i) => {
      const geneGroup = container.append('g')
        .attr('class', 'gene')
        .style('cursor', 'pointer');

      const geneStart = Math.max(region.start, gene.start);
      const geneEnd = Math.min(region.end, gene.end);
      const y = (i % 3) * 15 + 5;

      // Gene body (intron line)
      geneGroup.append('line')
        .attr('x1', x(geneStart))
        .attr('x2', x(geneEnd))
        .attr('y1', y + 5)
        .attr('y2', y + 5)
        .attr('stroke', gene.strand === '+' ? '#3498db' : '#e74c3c')
        .attr('stroke-width', 2);

      // Exons
      gene.exons?.forEach((exon: any) => {
        const exonStart = Math.max(region.start, exon.start);
        const exonEnd = Math.min(region.end, exon.end);
        if (exonStart < exonEnd) {
          geneGroup.append('rect')
            .attr('x', x(exonStart))
            .attr('y', y)
            .attr('width', Math.max(1, x(exonEnd) - x(exonStart)))
            .attr('height', 10)
            .attr('fill', gene.strand === '+' ? '#3498db' : '#e74c3c')
            .attr('rx', 2);
        }
      });

      // Gene label (if zoomed in enough)
      const geneWidth = x(geneEnd) - x(geneStart);
      if (geneWidth > 30) {
        geneGroup.append('text')
          .attr('x', x(geneStart) + 5)
          .attr('y', y + 8)
          .attr('font-size', '9px')
          .attr('fill', '#fff')
          .text(gene.symbol);
      }

      // Tooltip
      geneGroup.append('title')
        .text(`${gene.symbol}\n${gene.chromosome}:${gene.start}-${gene.end}`);
    });
  }

  // ============================================
  // Mutation Track Renderer
  // ============================================

  private renderMutationTrack(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    viewState: ViewState
  ): void {
    const { region, pixelsPerBase } = viewState;
    const mutations = this.data as any[];

    const x = d3.scaleLinear()
      .domain([region.start, region.end])
      .range([0, this.width]);

    const colorScale = d3.scaleOrdinal<string>()
      .domain(['missense', 'nonsense', 'frameshift', 'splice', 'silent'])
      .range(['#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#95a5a6']);

    mutations.forEach(mut => {
      if (mut.position < region.start || mut.position > region.end) return;

      const mutGroup = container.append('g')
        .attr('class', 'mutation')
        .style('cursor', 'pointer');

      // Lollipop stem
      mutGroup.append('line')
        .attr('x1', x(mut.position))
        .attr('x2', x(mut.position))
        .attr('y1', this.config.height - 25)
        .attr('y2', 5 + Math.min(mut.count, 10) * 2)
        .attr('stroke', '#666')
        .attr('stroke-width', 1);

      // Lollipop head
      mutGroup.append('circle')
        .attr('cx', x(mut.position))
        .attr('cy', 5)
        .attr('r', Math.min(3 + mut.count, 8))
        .attr('fill', colorScale(mut.type))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1);

      // Tooltip
      mutGroup.append('title')
        .text(`${mut.aaChange || mut.type}\nCount: ${mut.count}`);
    });
  }

  // ============================================
  // Ruler Track Renderer
  // ============================================

  private renderRulerTrack(
    container: d3.Selection<SVGGElement, unknown, null, undefined>,
    viewState: ViewState
  ): void {
    const { region } = viewState;
    
    const x = d3.scaleLinear()
      .domain([region.start, region.end])
      .range([0, this.width]);

    // Determine tick spacing based on zoom level
    const span = region.end - region.start;
    let tickInterval: number;
    
    if (span > 10000000) tickInterval = 1000000;
    else if (span > 1000000) tickInterval = 100000;
    else if (span > 100000) tickInterval = 10000;
    else if (span > 10000) tickInterval = 1000;
    else tickInterval = 100;

    const startTick = Math.ceil(region.start / tickInterval) * tickInterval;

    for (let pos = startTick; pos < region.end; pos += tickInterval) {
      const major = pos % (tickInterval * 10) === 0;
      
      container.append('line')
        .attr('x1', x(pos))
        .attr('x2', x(pos))
        .attr('y1', 0)
        .attr('y2', major ? 15 : 8)
        .attr('stroke', '#999')
        .attr('stroke-width', major ? 1.5 : 1);
    }
  }

  // ============================================
  // Mock Data Generators
  // ============================================

  private generateMockGenes(viewState: ViewState): any[] {
    const { region } = viewState;
    const genes = [];
    const numGenes = Math.floor(Math.random() * 5) + 2;

    for (let i = 0; i < numGenes; i++) {
      const geneStart = region.start + Math.random() * (region.end - region.start) * 0.8;
      const geneLength = Math.random() * (region.end - region.start) * 0.3 + 1000;
      
      const exons = [];
      let exonStart = geneStart;
      const numExons = Math.floor(Math.random() * 8) + 2;
      
      for (let j = 0; j < numExons; j++) {
        const exonLength = Math.random() * 500 + 100;
        exons.push({
          number: j + 1,
          start: exonStart,
          end: exonStart + exonLength,
          type: 'exon',
        });
        exonStart += exonLength + Math.random() * 2000 + 500;
      }

      genes.push({
        id: `gene_${i}`,
        symbol: ['TP53', 'BRCA1', 'EGFR', 'KRAS', 'PIK3CA', 'BRAF'][i % 6],
        chromosome: region.chromosome,
        start: geneStart,
        end: Math.min(region.end, geneStart + geneLength),
        strand: Math.random() > 0.5 ? '+' : '-',
        exons,
      });
    }

    return genes;
  }

  private generateMockMutations(viewState: ViewState): any[] {
    const { region } = viewState;
    const mutations = [];
    const numMutations = Math.floor(Math.random() * 15) + 5;
    const types = ['missense', 'nonsense', 'frameshift', 'splice', 'silent'];

    for (let i = 0; i < numMutations; i++) {
      mutations.push({
        id: `mut_${i}`,
        position: region.start + Math.random() * (region.end - region.start),
        type: types[Math.floor(Math.random() * types.length)],
        count: Math.floor(Math.random() * 20) + 1,
        aaChange: `R${Math.floor(Math.random() * 400)}${['H', 'Q', 'W', 'C'][Math.floor(Math.random() * 4)]}`,
      });
    }

    return mutations;
  }
}

export default GenomeBrowser;
