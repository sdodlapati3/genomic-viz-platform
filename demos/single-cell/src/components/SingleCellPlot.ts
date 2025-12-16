import * as d3 from 'd3';
import { SingleCellDataset, SingleCellConfig, Cell, SelectionState } from '../types';

export class SingleCellPlot {
  private config: SingleCellConfig;
  private dataset: SingleCellDataset;
  private svg!: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private plotArea!: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private xScale!: d3.ScaleLinear<number, number>;
  private yScale!: d3.ScaleLinear<number, number>;
  private colorScale!: d3.ScaleOrdinal<string, string> | d3.ScaleSequential<string>;
  private selection: SelectionState = {
    selectedCells: new Set(),
    highlightedCluster: null,
    highlightedCellType: null,
  };
  private brush!: d3.BrushBehavior<unknown>;
  private tooltip!: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;

  constructor(config: SingleCellConfig, dataset: SingleCellDataset) {
    this.config = config;
    this.dataset = dataset;
    this.tooltip = d3.select('#tooltip');
    this.initPlot();
  }

  private initPlot(): void {
    const container = d3.select(this.config.container);
    container.selectAll('*').remove();

    this.svg = container
      .append('svg')
      .attr('viewBox', `0 0 ${this.config.width} ${this.config.height}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');

    // Background
    this.svg
      .append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'transparent');

    const { margin } = this.config;
    const plotWidth = this.config.width - margin.left - margin.right;
    const plotHeight = this.config.height - margin.top - margin.bottom;

    this.plotArea = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Initialize scales
    this.initScales(plotWidth, plotHeight);

    // Draw axes
    if (this.config.showAxes) {
      this.drawAxes(plotWidth, plotHeight);
    }

    // Initialize brush for selection
    this.initBrush(plotWidth, plotHeight);

    // Draw cells
    this.drawCells();

    // Update legend
    this.updateLegend();

    // Update stats
    this.updateStats();
  }

  private initScales(width: number, height: number): void {
    const reduction = this.config.reduction;
    const coords = this.dataset.cells.map((c) => c[reduction]);

    const xExtent = d3.extent(coords, (d) => d[0]) as [number, number];
    const yExtent = d3.extent(coords, (d) => d[1]) as [number, number];

    // Add padding
    const xPadding = (xExtent[1] - xExtent[0]) * 0.05;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.05;

    this.xScale = d3
      .scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([0, width]);

    this.yScale = d3
      .scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([height, 0]);

    // Color scale based on color mode
    this.updateColorScale();
  }

  private updateColorScale(): void {
    if (this.config.colorBy === 'cluster') {
      const clusterColors = new Map(this.dataset.clusters.map((c) => [c.id.toString(), c.color]));
      this.colorScale = d3
        .scaleOrdinal<string, string>()
        .domain(this.dataset.clusters.map((c) => c.id.toString()))
        .range(this.dataset.clusters.map((c) => c.color));
    } else if (this.config.colorBy === 'celltype') {
      this.colorScale = d3
        .scaleOrdinal<string, string>()
        .domain(this.dataset.cellTypes.map((ct) => ct.name))
        .range(this.dataset.cellTypes.map((ct) => ct.color));
    } else if (this.config.colorBy === 'expression' && this.config.gene) {
      const gene = this.config.gene;
      const values = this.dataset.cells.map((c) => c.expression[gene] || 0);
      const maxVal = d3.max(values) || 1;

      this.colorScale = d3.scaleSequential(d3.interpolateViridis).domain([0, maxVal]);
    }
  }

  private drawAxes(width: number, height: number): void {
    const reduction = this.config.reduction.toUpperCase();

    // X axis
    const xAxis = d3.axisBottom(this.xScale).ticks(5);
    this.plotArea
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis);

    // X axis label
    this.plotArea
      .append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .text(`${reduction}_1`);

    // Y axis
    const yAxis = d3.axisLeft(this.yScale).ticks(5);
    this.plotArea.append('g').attr('class', 'axis y-axis').call(yAxis);

    // Y axis label
    this.plotArea
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .text(`${reduction}_2`);
  }

  private initBrush(width: number, height: number): void {
    this.brush = d3
      .brush()
      .extent([
        [0, 0],
        [width, height],
      ])
      .on('end', (event) => this.handleBrush(event));

    this.plotArea.append('g').attr('class', 'brush').call(this.brush);
  }

  private handleBrush(event: d3.D3BrushEvent<unknown>): void {
    if (!event.selection) return;

    const [[x0, y0], [x1, y1]] = event.selection as [[number, number], [number, number]];
    const reduction = this.config.reduction;

    this.selection.selectedCells.clear();

    this.dataset.cells.forEach((cell) => {
      const cx = this.xScale(cell[reduction][0]);
      const cy = this.yScale(cell[reduction][1]);

      if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) {
        this.selection.selectedCells.add(cell.id);
      }
    });

    this.updateCellSelection();
    this.updateSelectionInfo();

    // Clear brush
    this.plotArea.select('.brush').call(this.brush.move, null);
  }

  private drawCells(): void {
    const reduction = this.config.reduction;
    const cellsGroup = this.plotArea.append('g').attr('class', 'cells');

    // Sort cells for better rendering (selected cells on top)
    const sortedCells = [...this.dataset.cells].sort((a, b) => {
      if (this.selection.selectedCells.has(a.id)) return 1;
      if (this.selection.selectedCells.has(b.id)) return -1;
      return 0;
    });

    const points = cellsGroup
      .selectAll('.cell-point')
      .data(sortedCells, (d: any) => d.id)
      .enter()
      .append('circle')
      .attr('class', 'cell-point')
      .attr('cx', (d) => this.xScale(d[reduction][0]))
      .attr('cy', (d) => this.yScale(d[reduction][1]))
      .attr('r', 0)
      .attr('fill', (d) => this.getCellColor(d))
      .attr('opacity', this.config.opacity / 100)
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip())
      .on('click', (event, d) => this.handleCellClick(event, d));

    // Animate entrance
    points
      .transition()
      .duration(500)
      .delay((_, i) => i * 0.5)
      .attr('r', this.config.pointSize);
  }

  private getCellColor(cell: Cell): string {
    if (this.config.colorBy === 'cluster') {
      return (this.colorScale as d3.ScaleOrdinal<string, string>)(cell.cluster.toString());
    } else if (this.config.colorBy === 'celltype') {
      return (this.colorScale as d3.ScaleOrdinal<string, string>)(cell.cellType);
    } else if (this.config.colorBy === 'expression' && this.config.gene) {
      const value = cell.expression[this.config.gene] || 0;
      return (this.colorScale as d3.ScaleSequential<string>)(value);
    }
    return '#888';
  }

  private showTooltip(event: MouseEvent, cell: Cell): void {
    const gene = this.config.gene;
    let content = `
      <div class="tooltip-title">${cell.barcode}</div>
      <div class="tooltip-row"><span>Cluster:</span><span>${cell.cluster}</span></div>
      <div class="tooltip-row"><span>Cell Type:</span><span>${cell.cellType}</span></div>
      <div class="tooltip-row"><span>nGenes:</span><span>${cell.nGenes.toLocaleString()}</span></div>
      <div class="tooltip-row"><span>nUMI:</span><span>${cell.nUMI.toLocaleString()}</span></div>
      <div class="tooltip-row"><span>% Mito:</span><span>${cell.percentMito.toFixed(2)}%</span></div>
    `;

    if (gene && cell.expression[gene] !== undefined) {
      content += `<div class="tooltip-row"><span>${gene}:</span><span>${cell.expression[gene].toFixed(2)}</span></div>`;
    }

    this.tooltip
      .html(content)
      .style('left', event.pageX + 10 + 'px')
      .style('top', event.pageY - 10 + 'px')
      .classed('visible', true);
  }

  private hideTooltip(): void {
    this.tooltip.classed('visible', false);
  }

  private handleCellClick(event: MouseEvent, cell: Cell): void {
    event.stopPropagation();

    if (event.shiftKey) {
      // Add to selection
      if (this.selection.selectedCells.has(cell.id)) {
        this.selection.selectedCells.delete(cell.id);
      } else {
        this.selection.selectedCells.add(cell.id);
      }
    } else {
      // Single selection
      this.selection.selectedCells.clear();
      this.selection.selectedCells.add(cell.id);
    }

    this.updateCellSelection();
    this.updateSelectionInfo();
  }

  private updateCellSelection(): void {
    const hasSelection = this.selection.selectedCells.size > 0;

    this.plotArea
      .selectAll('.cell-point')
      .classed('selected', (d: any) => this.selection.selectedCells.has(d.id))
      .classed('muted', (d: any) => hasSelection && !this.selection.selectedCells.has(d.id));
  }

  private updateLegend(): void {
    const legendContainer = d3.select('#legend');
    legendContainer.html('');

    if (this.config.colorBy === 'cluster') {
      this.dataset.clusters.forEach((cluster) => {
        const item = legendContainer
          .append('div')
          .attr('class', 'legend-item')
          .on('click', () => this.highlightCluster(cluster.id));

        item.append('div').attr('class', 'legend-color').style('background-color', cluster.color);

        item.append('span').attr('class', 'legend-label').text(cluster.name);

        item.append('span').attr('class', 'legend-count').text(cluster.cellCount);
      });
    } else if (this.config.colorBy === 'celltype') {
      this.dataset.cellTypes.forEach((cellType) => {
        const item = legendContainer
          .append('div')
          .attr('class', 'legend-item')
          .on('click', () => this.highlightCellType(cellType.name));

        item.append('div').attr('class', 'legend-color').style('background-color', cellType.color);

        item.append('span').attr('class', 'legend-label').text(cellType.name);

        item.append('span').attr('class', 'legend-count').text(cellType.cellCount);
      });
    } else if (this.config.colorBy === 'expression') {
      // Gradient legend for expression
      const gradientDiv = legendContainer.append('div').attr('class', 'gradient-legend');

      gradientDiv
        .append('div')
        .attr('class', 'gradient-bar')
        .style('background', 'linear-gradient(to right, #440154, #21918c, #fde725)');

      const labels = gradientDiv.append('div').attr('class', 'gradient-labels');

      labels.append('span').text('Low');
      labels.append('span').text(this.config.gene || '');
      labels.append('span').text('High');
    }
  }

  private highlightCluster(clusterId: number): void {
    if (this.selection.highlightedCluster === clusterId) {
      this.selection.highlightedCluster = null;
      this.plotArea.selectAll('.cell-point').classed('muted', false);
    } else {
      this.selection.highlightedCluster = clusterId;
      this.plotArea.selectAll('.cell-point').classed('muted', (d: any) => d.cluster !== clusterId);
    }
  }

  private highlightCellType(cellType: string): void {
    if (this.selection.highlightedCellType === cellType) {
      this.selection.highlightedCellType = null;
      this.plotArea.selectAll('.cell-point').classed('muted', false);
    } else {
      this.selection.highlightedCellType = cellType;
      this.plotArea.selectAll('.cell-point').classed('muted', (d: any) => d.cellType !== cellType);
    }
  }

  private updateStats(): void {
    const statsContainer = d3.select('#stats');
    statsContainer.html('');

    const stats = [
      { label: 'Total Cells', value: this.dataset.metadata.nCells.toLocaleString() },
      { label: 'Genes', value: this.dataset.metadata.nGenes.toLocaleString() },
      { label: 'Clusters', value: this.dataset.clusters.length },
      { label: 'Cell Types', value: this.dataset.cellTypes.length },
      { label: 'Organism', value: this.dataset.metadata.organism },
      { label: 'Tissue', value: this.dataset.metadata.tissue },
    ];

    stats.forEach((stat) => {
      const row = statsContainer.append('div').attr('class', 'stat-row');
      row.append('span').attr('class', 'stat-label').text(stat.label);
      row.append('span').attr('class', 'stat-value').text(stat.value);
    });
  }

  private updateSelectionInfo(): void {
    const infoContainer = d3.select('#selection-info');
    const count = this.selection.selectedCells.size;

    if (count === 0) {
      infoContainer.html('<p>Click or drag to select cells</p>');
      return;
    }

    // Calculate selection statistics
    const selectedCells = this.dataset.cells.filter((c) => this.selection.selectedCells.has(c.id));

    const clusterCounts = new Map<number, number>();
    const cellTypeCounts = new Map<string, number>();

    selectedCells.forEach((cell) => {
      clusterCounts.set(cell.cluster, (clusterCounts.get(cell.cluster) || 0) + 1);
      cellTypeCounts.set(cell.cellType, (cellTypeCounts.get(cell.cellType) || 0) + 1);
    });

    // Find most common
    const topCluster = [...clusterCounts.entries()].sort((a, b) => b[1] - a[1])[0];
    const topCellType = [...cellTypeCounts.entries()].sort((a, b) => b[1] - a[1])[0];

    infoContainer.html(`
      <div class="selected-stats">
        <p><span class="highlight">${count}</span> cells selected</p>
        <p>Top cluster: <span class="highlight">${topCluster?.[0]}</span> (${topCluster?.[1]} cells)</p>
        <p>Top type: <span class="highlight">${topCellType?.[0]}</span></p>
      </div>
    `);
  }

  // Public methods for updates
  public updateConfig(newConfig: Partial<SingleCellConfig>): void {
    this.config = { ...this.config, ...newConfig };

    if ('colorBy' in newConfig || 'gene' in newConfig) {
      this.updateColorScale();
      this.plotArea
        .selectAll('.cell-point')
        .transition()
        .duration(300)
        .attr('fill', (d: any) => this.getCellColor(d));
      this.updateLegend();
    }

    if ('pointSize' in newConfig) {
      this.plotArea
        .selectAll('.cell-point')
        .transition()
        .duration(200)
        .attr('r', this.config.pointSize);
    }

    if ('opacity' in newConfig) {
      this.plotArea
        .selectAll('.cell-point')
        .transition()
        .duration(200)
        .attr('opacity', this.config.opacity / 100);
    }

    if ('reduction' in newConfig) {
      this.animateReductionChange();
    }
  }

  private animateReductionChange(): void {
    const reduction = this.config.reduction;
    const coords = this.dataset.cells.map((c) => c[reduction]);

    const xExtent = d3.extent(coords, (d) => d[0]) as [number, number];
    const yExtent = d3.extent(coords, (d) => d[1]) as [number, number];

    const xPadding = (xExtent[1] - xExtent[0]) * 0.05;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.05;

    this.xScale.domain([xExtent[0] - xPadding, xExtent[1] + xPadding]);
    this.yScale.domain([yExtent[0] - yPadding, yExtent[1] + yPadding]);

    // Animate cells to new positions
    this.plotArea
      .selectAll('.cell-point')
      .transition()
      .duration(800)
      .ease(d3.easeCubicInOut)
      .attr('cx', (d: any) => this.xScale(d[reduction][0]))
      .attr('cy', (d: any) => this.yScale(d[reduction][1]));

    // Update axis labels
    const reductionLabel = reduction.toUpperCase();
    this.plotArea
      .selectAll('.axis-label')
      .data([`${reductionLabel}_1`, `${reductionLabel}_2`])
      .text((d: string) => d);
  }

  public updateDataset(dataset: SingleCellDataset): void {
    this.dataset = dataset;
    this.selection.selectedCells.clear();
    this.initPlot();
  }

  public clearSelection(): void {
    this.selection.selectedCells.clear();
    this.selection.highlightedCluster = null;
    this.selection.highlightedCellType = null;
    this.plotArea.selectAll('.cell-point').classed('selected', false).classed('muted', false);
    this.updateSelectionInfo();
  }

  public getSelectedCells(): Cell[] {
    return this.dataset.cells.filter((c) => this.selection.selectedCells.has(c.id));
  }

  public exportSelection(): string {
    const selected = this.getSelectedCells();
    const headers = ['barcode', 'cluster', 'cellType', 'nGenes', 'nUMI'];
    const rows = selected.map((c) =>
      [c.barcode, c.cluster, c.cellType, c.nGenes, c.nUMI].join('\t')
    );
    return [headers.join('\t'), ...rows].join('\n');
  }
}
