/**
 * Oncoprint Matrix Visualization
 *
 * Interactive Gene × Sample mutation landscape visualization
 * Inspired by ProteinPaint's matrix component
 *
 * Features:
 * - Layered mutation rendering (multiple mutations per cell)
 * - Sortable rows (genes) and columns (samples)
 * - Hover tooltips with mutation details
 * - Click selection for linked views
 * - Sample annotations (disease, stage)
 * - Zoom and pan support
 */

import * as d3 from 'd3';
import type {
  OncoprintData,
  OncoprintConfig,
  GeneRow,
  SampleColumn,
  OncoprintCell,
  ConsequenceType,
  SortConfig,
} from './types';
import { MUTATION_COLORS, MUTATION_LABELS, TRUNCATING_TYPES } from './types';

const DEFAULT_CONFIG: OncoprintConfig = {
  width: 1000,
  height: 500,
  cellWidth: 12,
  cellHeight: 20,
  cellPadding: 1,
  labelWidth: 80,
  annotationHeight: 30,
  showAnnotations: true,
  showFrequency: true,
  enableZoom: true,
  transitionDuration: 300,
};

// Disease colors
const DISEASE_COLORS: Record<string, string> = {
  'Lung Adenocarcinoma': '#3498db',
  Colorectal: '#e74c3c',
  Breast: '#e91e63',
  Glioblastoma: '#9c27b0',
  Melanoma: '#795548',
  default: '#95a5a6',
};

export class Oncoprint {
  private container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private svg!: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private config: OncoprintConfig;

  // Data
  private data: OncoprintData | null = null;
  private sortConfig: SortConfig = { field: 'frequency', direction: 'desc' };

  // State
  private selectedGenes: Set<string> = new Set();
  private selectedSamples: Set<string> = new Set();
  private _highlightedCell: OncoprintCell | null = null;

  /** Get the currently highlighted cell (for external access) */
  get currentHighlightedCell(): OncoprintCell | null {
    return this._highlightedCell;
  }

  // Scales
  private xScale!: d3.ScaleBand<string>;
  private yScale!: d3.ScaleBand<string>;

  // Zoom
  private zoom!: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private currentTransform: d3.ZoomTransform = d3.zoomIdentity;

  // Callbacks
  private onSelect?: (genes: string[], samples: string[]) => void;
  private onHover?: (cell: OncoprintCell | null) => void;

  constructor(selector: string, config: Partial<OncoprintConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    const parent = d3.select(selector);
    parent.selectAll('*').remove();

    this.container = parent
      .append('div')
      .attr('class', 'oncoprint-wrapper')
      .style('position', 'relative')
      .style('overflow', 'hidden');

    this.createSVG();
  }

  private createSVG(): void {
    const { width, height } = this.config;

    this.svg = this.container
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('font-family', 'system-ui, -apple-system, sans-serif');

    // Create groups for different layers
    this.svg.append('g').attr('class', 'annotations-layer');
    this.svg.append('g').attr('class', 'labels-layer');
    this.svg.append('g').attr('class', 'cells-layer');
    this.svg.append('g').attr('class', 'frequency-layer');

    // Setup zoom if enabled
    if (this.config.enableZoom) {
      this.setupZoom();
    }
  }

  private setupZoom(): void {
    const { width, height } = this.config;

    this.zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .translateExtent([
        [0, 0],
        [width * 2, height * 2],
      ])
      .on('zoom', (event) => {
        this.currentTransform = event.transform;
        this.updateVisualization();
      });

    this.svg.call(this.zoom);
  }

  /**
   * Set data and render
   */
  setData(data: OncoprintData): void {
    this.data = data;
    this.render();
  }

  /**
   * Set sort configuration
   */
  setSort(config: SortConfig): void {
    this.sortConfig = config;
    if (this.data) {
      this.render();
    }
  }

  /**
   * Set selection callback
   */
  onSelection(callback: (genes: string[], samples: string[]) => void): void {
    this.onSelect = callback;
  }

  /**
   * Set hover callback
   */
  onHoverCell(callback: (cell: OncoprintCell | null) => void): void {
    this.onHover = callback;
  }

  /**
   * Main render function
   */
  render(): void {
    if (!this.data) return;

    const { width, height, labelWidth, annotationHeight, cellWidth, cellHeight, cellPadding } =
      this.config;

    // Calculate dimensions
    const matrixWidth = width - labelWidth - (this.config.showFrequency ? 60 : 0);
    const matrixHeight = height - annotationHeight - 40;

    // Sort data
    const sortedData = this.sortData(this.data);

    // Setup scales
    this.xScale = d3
      .scaleBand<string>()
      .domain(sortedData.samples.map((s) => s.sampleId))
      .range([0, Math.max(matrixWidth, sortedData.samples.length * cellWidth)])
      .padding(cellPadding / cellWidth);

    this.yScale = d3
      .scaleBand<string>()
      .domain(sortedData.genes.map((g) => g.gene))
      .range([0, Math.max(matrixHeight, sortedData.genes.length * cellHeight)])
      .padding(cellPadding / cellHeight);

    // Clear and render
    this.renderAnnotations(sortedData);
    this.renderGeneLabels(sortedData);
    this.renderCells(sortedData);

    if (this.config.showFrequency) {
      this.renderFrequencyBars(sortedData);
    }
  }

  private sortData(data: OncoprintData): OncoprintData {
    const { field, direction } = this.sortConfig;
    // For descending order (default), we want highest values first
    const multiplier = direction === 'desc' ? 1 : -1;

    let sortedGenes = [...data.genes];
    let sortedSamples = [...data.samples];

    switch (field) {
      case 'frequency':
        // Sort genes by mutation frequency (highest first when desc)
        sortedGenes = sortedGenes.sort((a, b) => multiplier * (b.frequency - a.frequency));
        break;
      case 'gene':
        sortedGenes = sortedGenes.sort((a, b) => multiplier * a.gene.localeCompare(b.gene));
        break;
      case 'sample':
        sortedSamples = sortedSamples.sort(
          (a, b) => multiplier * a.sampleId.localeCompare(b.sampleId)
        );
        break;
    }

    // Reorder cells in each gene to match sample order
    const sampleOrder = new Map(sortedSamples.map((s, i) => [s.sampleId, i]));

    for (const gene of sortedGenes) {
      gene.cells = [...gene.cells].sort(
        (a, b) => (sampleOrder.get(a.sampleId) || 0) - (sampleOrder.get(b.sampleId) || 0)
      );
    }

    return {
      ...data,
      genes: sortedGenes,
      samples: sortedSamples,
    };
  }

  /**
   * Render sample annotations (disease type bar)
   */
  private renderAnnotations(data: OncoprintData): void {
    if (!this.config.showAnnotations) return;

    const { labelWidth, annotationHeight } = this.config;
    const annotationsLayer = this.svg.select('.annotations-layer');
    annotationsLayer.selectAll('*').remove();

    const g = annotationsLayer.append('g').attr('transform', `translate(${labelWidth}, 10)`);

    // Disease annotation bar
    g.selectAll('rect.annotation')
      .data(data.samples)
      .join('rect')
      .attr('class', 'annotation')
      .attr('x', (d) => this.xScale(d.sampleId) || 0)
      .attr('y', 0)
      .attr('width', this.xScale.bandwidth())
      .attr('height', annotationHeight - 10)
      .attr('fill', (d) => DISEASE_COLORS[d.disease || ''] || DISEASE_COLORS.default)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => this.showSampleTooltip(event, d))
      .on('mouseout', () => this.hideTooltip());

    // Annotation label
    g.append('text')
      .attr('x', -10)
      .attr('y', (annotationHeight - 10) / 2 + 4)
      .attr('text-anchor', 'end')
      .attr('font-size', 11)
      .attr('fill', '#666')
      .text('Disease');
  }

  /**
   * Render gene labels (row headers)
   */
  private renderGeneLabels(data: OncoprintData): void {
    const { labelWidth, annotationHeight } = this.config;
    const labelsLayer = this.svg.select('.labels-layer');
    labelsLayer.selectAll('*').remove();

    const g = labelsLayer.append('g').attr('transform', `translate(0, ${annotationHeight})`);

    g.selectAll('text.gene-label')
      .data(data.genes)
      .join('text')
      .attr('class', 'gene-label')
      .attr('x', labelWidth - 10)
      .attr('y', (d) => (this.yScale(d.gene) || 0) + this.yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'end')
      .attr('font-size', 12)
      .attr('font-weight', 500)
      .attr('fill', (d) => (this.selectedGenes.has(d.gene) ? '#e74c3c' : '#333'))
      .style('cursor', 'pointer')
      .text((d) => d.gene)
      .on('click', (_event, d) => this.handleGeneClick(d))
      .on('mouseover', (event, d) => this.showGeneTooltip(event, d))
      .on('mouseout', () => this.hideTooltip());
  }

  /**
   * Render mutation cells
   */
  private renderCells(data: OncoprintData): void {
    const { labelWidth, annotationHeight, cellPadding } = this.config;
    const cellsLayer = this.svg.select('.cells-layer');
    cellsLayer.selectAll('*').remove();

    const g = cellsLayer
      .append('g')
      .attr('transform', `translate(${labelWidth}, ${annotationHeight})`);

    // Flatten cells for rendering
    const allCells: OncoprintCell[] = data.genes.flatMap((gene) => gene.cells);

    // Background rectangles (for no-mutation cells)
    g.selectAll('rect.cell-bg')
      .data(allCells)
      .join('rect')
      .attr('class', 'cell-bg')
      .attr('x', (d) => this.xScale(d.sampleId) || 0)
      .attr('y', (d) => this.yScale(d.gene) || 0)
      .attr('width', this.xScale.bandwidth())
      .attr('height', this.yScale.bandwidth())
      .attr('fill', '#f5f5f5')
      .attr('stroke', '#fff')
      .attr('stroke-width', cellPadding);

    // Mutation cells (with layered rendering for multiple mutations)
    const mutatedCells = allCells.filter((c) => c.hasMutation);

    g.selectAll('g.cell')
      .data(mutatedCells)
      .join('g')
      .attr('class', 'cell')
      .attr(
        'transform',
        (d) => `translate(${this.xScale(d.sampleId) || 0}, ${this.yScale(d.gene) || 0})`
      )
      .each((d, i, nodes) => this.renderCellMutations(d3.select(nodes[i] as SVGGElement), d))
      .style('cursor', 'pointer')
      .on('click', (_event, d) => this.handleCellClick(d))
      .on('mouseover', (event, d) => this.handleCellHover(event, d))
      .on('mouseout', () => this.handleCellMouseout());
  }

  /**
   * Render mutations within a single cell (layered)
   */
  private renderCellMutations(
    g: d3.Selection<SVGGElement, OncoprintCell, null, undefined>,
    cell: OncoprintCell
  ): void {
    const width = this.xScale.bandwidth();
    const height = this.yScale.bandwidth();

    // Group mutations by type priority
    const hasTruncating = cell.mutations.some((m) => TRUNCATING_TYPES.includes(m.type));
    const hasMissense = cell.mutations.some((m) => m.type === 'missense');

    // Layer 1: Background (primary mutation type)
    const primaryType = hasTruncating
      ? cell.mutations.find((m) => TRUNCATING_TYPES.includes(m.type))?.type
      : hasMissense
        ? 'missense'
        : cell.mutations[0]?.type || 'other';

    g.append('rect')
      .attr('class', 'mutation-primary')
      .attr('x', 1)
      .attr('y', 1)
      .attr('width', width - 2)
      .attr('height', height - 2)
      .attr('fill', MUTATION_COLORS[primaryType as ConsequenceType] || '#999')
      .attr('rx', 2);

    // Layer 2: Indicator for multiple mutations
    if (cell.mutations.length > 1) {
      // Small triangle in corner
      g.append('polygon')
        .attr('class', 'multi-indicator')
        .attr('points', `${width - 6},1 ${width - 1},1 ${width - 1},6`)
        .attr('fill', '#333');
    }

    // Layer 3: Secondary type indicator (if has both missense and truncating)
    if (hasTruncating && hasMissense) {
      g.append('rect')
        .attr('class', 'mutation-secondary')
        .attr('x', 1)
        .attr('y', height / 2)
        .attr('width', width - 2)
        .attr('height', height / 2 - 1)
        .attr('fill', MUTATION_COLORS.missense)
        .attr('rx', 2);
    }
  }

  /**
   * Render frequency bars (right side)
   */
  private renderFrequencyBars(data: OncoprintData): void {
    const { width, annotationHeight } = this.config;
    const freqLayer = this.svg.select('.frequency-layer');
    freqLayer.selectAll('*').remove();

    const barWidth = 50;
    const startX = width - barWidth - 5;

    const g = freqLayer.append('g').attr('transform', `translate(${startX}, ${annotationHeight})`);

    const maxFreq = d3.max(data.genes, (d) => d.frequency) || 100;
    const freqScale = d3
      .scaleLinear()
      .domain([0, maxFreq])
      .range([0, barWidth - 10]);

    // Bars
    g.selectAll('rect.freq-bar')
      .data(data.genes)
      .join('rect')
      .attr('class', 'freq-bar')
      .attr('x', 0)
      .attr('y', (d) => this.yScale(d.gene) || 0)
      .attr('width', (d) => freqScale(d.frequency))
      .attr('height', this.yScale.bandwidth() - 2)
      .attr('fill', '#4facfe')
      .attr('rx', 2);

    // Labels
    g.selectAll('text.freq-label')
      .data(data.genes)
      .join('text')
      .attr('class', 'freq-label')
      .attr('x', (d) => freqScale(d.frequency) + 3)
      .attr('y', (d) => (this.yScale(d.gene) || 0) + this.yScale.bandwidth() / 2 + 3)
      .attr('font-size', 9)
      .attr('fill', '#666')
      .text((d) => `${d.frequency.toFixed(0)}%`);

    // Header
    g.append('text')
      .attr('x', barWidth / 2)
      .attr('y', -5)
      .attr('text-anchor', 'middle')
      .attr('font-size', 10)
      .attr('fill', '#666')
      .text('Freq');
  }

  /**
   * Update visualization on zoom/pan
   */
  private updateVisualization(): void {
    // Apply transform to cells layer
    const { labelWidth, annotationHeight } = this.config;

    this.svg
      .select('.cells-layer g')
      .attr(
        'transform',
        `translate(${labelWidth + this.currentTransform.x}, ${annotationHeight}) ` +
          `scale(${this.currentTransform.k}, 1)`
      );

    this.svg
      .select('.annotations-layer g')
      .attr(
        'transform',
        `translate(${labelWidth + this.currentTransform.x}, 10) ` +
          `scale(${this.currentTransform.k}, 1)`
      );
  }

  // Event handlers
  private handleGeneClick(gene: GeneRow): void {
    if (this.selectedGenes.has(gene.gene)) {
      this.selectedGenes.delete(gene.gene);
    } else {
      this.selectedGenes.add(gene.gene);
    }

    this.render();
    this.onSelect?.(Array.from(this.selectedGenes), Array.from(this.selectedSamples));
  }

  private handleCellClick(cell: OncoprintCell): void {
    this.selectedGenes.add(cell.gene);
    this.selectedSamples.add(cell.sampleId);

    this.render();
    this.onSelect?.(Array.from(this.selectedGenes), Array.from(this.selectedSamples));
  }

  private handleCellHover(event: MouseEvent, cell: OncoprintCell): void {
    this._highlightedCell = cell;
    this.showCellTooltip(event, cell);
    this.onHover?.(cell);
  }

  private handleCellMouseout(): void {
    this._highlightedCell = null;
    this.hideTooltip();
    this.onHover?.(null);
  }

  // Tooltips
  private showCellTooltip(event: MouseEvent, cell: OncoprintCell): void {
    const tooltip = this.getOrCreateTooltip();

    let html = `
      <div style="font-weight: 600; margin-bottom: 4px;">
        ${cell.gene} - ${cell.sampleId}
      </div>
      <div style="font-size: 12px;">
        <strong>Mutations:</strong> ${cell.mutations.length}<br>
    `;

    for (const mut of cell.mutations.slice(0, 5)) {
      html += `
        <div style="margin: 2px 0; padding-left: 8px;">
          <span style="color: ${MUTATION_COLORS[mut.type]}">●</span>
          ${mut.aaChange} (${MUTATION_LABELS[mut.type]})
        </div>
      `;
    }

    if (cell.mutations.length > 5) {
      html += `<div style="color: #999; padding-left: 8px;">+${cell.mutations.length - 5} more</div>`;
    }

    html += '</div>';

    tooltip
      .html(html)
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .style('opacity', 1);
  }

  private showGeneTooltip(event: MouseEvent, gene: GeneRow): void {
    const tooltip = this.getOrCreateTooltip();

    tooltip
      .html(
        `
        <div style="font-weight: 600; margin-bottom: 4px;">${gene.gene}</div>
        <div style="font-size: 12px;">
          Mutated in ${gene.sampleCount} samples (${gene.frequency.toFixed(1)}%)<br>
          Total mutations: ${gene.mutationCount}
        </div>
      `
      )
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .style('opacity', 1);
  }

  private showSampleTooltip(event: MouseEvent, sample: SampleColumn): void {
    const tooltip = this.getOrCreateTooltip();
    const annotation = this.data?.annotations.find((a) => a.sampleId === sample.sampleId);

    tooltip
      .html(
        `
        <div style="font-weight: 600; margin-bottom: 4px;">${sample.sampleId}</div>
        <div style="font-size: 12px;">
          ${annotation?.disease || 'Unknown'}<br>
          Stage: ${annotation?.stage || 'N/A'}<br>
          Mutations: ${sample.mutationCount}
        </div>
      `
      )
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .style('opacity', 1);
  }

  private hideTooltip(): void {
    d3.select('.oncoprint-tooltip').style('opacity', 0);
  }

  private getOrCreateTooltip(): d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown> {
    let tooltip = d3.select<HTMLDivElement, unknown>('.oncoprint-tooltip');

    if (tooltip.empty()) {
      tooltip = d3
        .select('body')
        .append('div')
        .attr('class', 'oncoprint-tooltip')
        .style('position', 'absolute')
        .style('background', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '8px 12px')
        .style('box-shadow', '0 2px 8px rgba(0,0,0,0.15)')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .style('z-index', '1000')
        .style('font-family', 'system-ui, -apple-system, sans-serif')
        .style('font-size', '13px')
        .style('max-width', '300px');
    }

    return tooltip;
  }

  /**
   * Reset view (zoom and selection)
   */
  reset(): void {
    this.selectedGenes.clear();
    this.selectedSamples.clear();
    this.currentTransform = d3.zoomIdentity;

    this.svg.call(this.zoom.transform, d3.zoomIdentity);
    this.render();
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    this.container.remove();
    d3.select('.oncoprint-tooltip').remove();
  }
}
