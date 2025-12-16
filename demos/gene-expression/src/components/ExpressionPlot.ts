import * as d3 from 'd3';
import { ExpressionDataset, ExpressionConfig, Gene, Sample } from '../types';

export class ExpressionPlot {
  private config: ExpressionConfig;
  private dataset: ExpressionDataset;
  private svg!: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private plotArea!: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>;
  private tooltip!: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private normalizedMatrix: number[][] = [];
  private rowOrder: number[] = [];
  private colOrder: number[] = [];

  constructor(config: ExpressionConfig, dataset: ExpressionDataset) {
    this.config = config;
    this.dataset = dataset;
    this.tooltip = d3.select('#tooltip');
    this.initPlot();
  }

  private initPlot(): void {
    // Normalize data
    this.normalizedMatrix = this.normalizeMatrix();

    // Cluster if needed
    this.rowOrder = this.config.clusterRows
      ? this.clusterRows()
      : d3.range(this.dataset.genes.length);
    this.colOrder = this.config.clusterCols
      ? this.clusterCols()
      : d3.range(this.dataset.samples.length);

    // Render based on view type
    switch (this.config.view) {
      case 'heatmap':
        this.renderHeatmap();
        break;
      case 'profile':
        this.renderProfile();
        break;
      case 'comparison':
        this.renderComparison();
        break;
    }

    this.updateSidebar();
  }

  private normalizeMatrix(): number[][] {
    const matrix = this.dataset.matrix;

    if (this.config.normalize === 'raw') {
      return matrix;
    }

    if (this.config.normalize === 'log2') {
      return matrix.map((row) => row.map((v) => Math.log2(v + 1)));
    }

    // Z-score normalization per row
    return matrix.map((row) => {
      const mean = d3.mean(row) || 0;
      const std = d3.deviation(row) || 1;
      return row.map((v) => (v - mean) / std);
    });
  }

  private clusterRows(): number[] {
    // Simple hierarchical clustering simulation
    // In production, use proper clustering algorithm
    const distances = this.calculateDistances(this.normalizedMatrix);
    return this.orderByCorrelation(distances);
  }

  private clusterCols(): number[] {
    // Transpose and cluster
    const transposed = d3.transpose(this.normalizedMatrix);
    const distances = this.calculateDistances(transposed);
    return this.orderByCorrelation(distances);
  }

  private calculateDistances(matrix: number[][]): number[][] {
    const n = matrix.length;
    const distances: number[][] = Array(n)
      .fill(null)
      .map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        // Euclidean distance
        let sum = 0;
        for (let k = 0; k < matrix[i].length; k++) {
          sum += Math.pow(matrix[i][k] - matrix[j][k], 2);
        }
        distances[i][j] = distances[j][i] = Math.sqrt(sum);
      }
    }

    return distances;
  }

  private orderByCorrelation(distances: number[][]): number[] {
    // Simple greedy ordering
    const n = distances.length;
    const visited = new Set<number>();
    const order: number[] = [];

    // Start with first element
    let current = 0;
    visited.add(0);
    order.push(0);

    while (order.length < n) {
      let minDist = Infinity;
      let next = -1;

      for (let i = 0; i < n; i++) {
        if (!visited.has(i) && distances[current][i] < minDist) {
          minDist = distances[current][i];
          next = i;
        }
      }

      if (next >= 0) {
        visited.add(next);
        order.push(next);
        current = next;
      }
    }

    return order;
  }

  private renderHeatmap(): void {
    const container = d3.select(this.config.container);
    container.selectAll('*').remove();

    const { margin } = this.config;
    const labelWidth = 80;
    const labelHeight = 100;
    const rowDendrogramWidth = this.config.clusterRows ? 50 : 0;
    const colDendrogramHeight = this.config.clusterCols ? 50 : 0;

    const nGenes = this.dataset.genes.length;
    const nSamples = this.dataset.samples.length;

    const cellWidth = Math.max(
      15,
      Math.min(
        30,
        (this.config.width - margin.left - margin.right - labelWidth - rowDendrogramWidth) /
          nSamples
      )
    );
    const cellHeight = Math.max(
      12,
      Math.min(
        20,
        (this.config.height - margin.top - margin.bottom - labelHeight - colDendrogramHeight) /
          nGenes
      )
    );

    const plotWidth = cellWidth * nSamples;
    const plotHeight = cellHeight * nGenes;

    // Layout: [margin.left][labelWidth][plotWidth][rowDendrogramWidth][margin.right]
    const totalWidth = margin.left + labelWidth + plotWidth + rowDendrogramWidth + margin.right;
    const totalHeight = margin.top + colDendrogramHeight + plotHeight + labelHeight + margin.bottom;

    this.svg = container.append('svg').attr('width', totalWidth).attr('height', totalHeight);

    // Color scale
    const colorScale = this.getColorScale();

    // Heatmap area - labels on left, dendrogram on right
    const heatmapG = this.svg
      .append('g')
      .attr(
        'transform',
        `translate(${margin.left + labelWidth},${margin.top + colDendrogramHeight})`
      );

    // Draw cells
    this.rowOrder.forEach((geneIdx, i) => {
      this.colOrder.forEach((sampleIdx, j) => {
        const value = this.normalizedMatrix[geneIdx][sampleIdx];

        heatmapG
          .append('rect')
          .attr('class', 'heatmap-cell')
          .attr('x', j * cellWidth)
          .attr('y', i * cellHeight)
          .attr('width', cellWidth)
          .attr('height', cellHeight)
          .attr('fill', colorScale(value))
          .on('mouseover', (event) => this.showCellTooltip(event, geneIdx, sampleIdx, value))
          .on('mouseout', () => this.hideTooltip())
          .on('click', () => this.selectGene(this.dataset.genes[geneIdx].symbol));
      });
    });

    // Row labels (genes) - on the left side
    const rowLabelsG = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top + colDendrogramHeight})`);

    this.rowOrder.forEach((geneIdx, i) => {
      rowLabelsG
        .append('text')
        .attr('class', 'row-label')
        .attr('x', labelWidth - 5)
        .attr('y', i * cellHeight + cellHeight / 2)
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .text(this.dataset.genes[geneIdx].symbol)
        .on('click', () => this.selectGene(this.dataset.genes[geneIdx].symbol));
    });

    // Column labels (samples)
    const colLabelsG = this.svg
      .append('g')
      .attr(
        'transform',
        `translate(${margin.left + labelWidth},${margin.top + colDendrogramHeight + plotHeight})`
      );

    this.colOrder.forEach((sampleIdx, j) => {
      const sample = this.dataset.samples[sampleIdx];
      const group = this.dataset.groups.find((g) => g.id === sample.group);

      colLabelsG
        .append('text')
        .attr('class', 'col-label')
        .attr('x', j * cellWidth + cellWidth / 2)
        .attr('y', 10)
        .attr('transform', `rotate(45, ${j * cellWidth + cellWidth / 2}, 10)`)
        .attr('text-anchor', 'start')
        .text(sample.name);

      // Group color bar
      colLabelsG
        .append('rect')
        .attr('x', j * cellWidth)
        .attr('y', -5)
        .attr('width', cellWidth)
        .attr('height', 4)
        .attr('fill', group?.color || '#888');
    });

    // Draw dendrograms if clustering
    // Row dendrogram - on the RIGHT side of the heatmap
    if (this.config.clusterRows) {
      this.drawDendrogram(
        this.svg,
        margin.left + labelWidth + plotWidth,
        margin.top + colDendrogramHeight,
        rowDendrogramWidth,
        plotHeight,
        'row'
      );
    }

    // Column dendrogram - on TOP of the heatmap
    if (this.config.clusterCols) {
      this.drawDendrogram(
        this.svg,
        margin.left + labelWidth,
        margin.top,
        plotWidth,
        colDendrogramHeight,
        'col'
      );
    }

    // Color legend
    this.drawColorLegend(colorScale, totalWidth - 150, margin.top);
  }

  private renderProfile(): void {
    const container = d3.select(this.config.container);
    container.selectAll('*').remove();

    const { width, height, margin } = this.config;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    this.svg = container.append('svg').attr('width', width).attr('height', height);

    this.plotArea = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get selected genes or top 5
    const selectedGenes =
      this.config.selectedGenes.length > 0
        ? this.config.selectedGenes
        : this.dataset.genes.slice(0, 5).map((g) => g.symbol);

    const geneIndices = selectedGenes
      .map((symbol) => this.dataset.genes.findIndex((g) => g.symbol === symbol))
      .filter((i) => i >= 0);

    // X scale - samples
    const xScale = d3
      .scaleBand()
      .domain(this.dataset.samples.map((s) => s.id))
      .range([0, plotWidth])
      .padding(0.1);

    // Y scale - expression values
    const allValues = geneIndices.flatMap((gi) => this.normalizedMatrix[gi]);
    const yExtent = d3.extent(allValues) as [number, number];
    const yScale = d3
      .scaleLinear()
      .domain([Math.min(0, yExtent[0]), yExtent[1] * 1.1])
      .range([plotHeight, 0]);

    // Color scale for genes
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(selectedGenes);

    // Draw axes
    const xAxis = d3.axisBottom(xScale).tickValues(xScale.domain().filter((_, i) => i % 4 === 0));
    this.plotArea
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${plotHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end');

    const yAxis = d3.axisLeft(yScale).ticks(5);
    this.plotArea.append('g').attr('class', 'axis y-axis').call(yAxis);

    // Y axis label
    this.plotArea
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -plotHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .text(this.config.normalize === 'zscore' ? 'Z-Score' : 'Expression');

    // Draw lines for each gene
    const line = d3
      .line<number>()
      .x((_, i) => (xScale(this.dataset.samples[i].id) || 0) + xScale.bandwidth() / 2)
      .y((d) => yScale(d));

    geneIndices.forEach((geneIdx, gi) => {
      const gene = this.dataset.genes[geneIdx];
      const values = this.normalizedMatrix[geneIdx];

      this.plotArea
        .append('path')
        .datum(values)
        .attr('class', 'profile-line')
        .attr('d', line)
        .attr('stroke', colorScale(gene.symbol))
        .attr('opacity', 0.8);

      // Points
      this.plotArea
        .selectAll(`.point-${gi}`)
        .data(values)
        .enter()
        .append('circle')
        .attr('cx', (_, i) => (xScale(this.dataset.samples[i].id) || 0) + xScale.bandwidth() / 2)
        .attr('cy', (d) => yScale(d))
        .attr('r', 3)
        .attr('fill', colorScale(gene.symbol))
        .on('mouseover', (event, d) => {
          const sampleIdx = values.indexOf(d);
          this.showProfileTooltip(event, gene, this.dataset.samples[sampleIdx], d);
        })
        .on('mouseout', () => this.hideTooltip());
    });

    // Legend
    const legend = this.plotArea.append('g').attr('transform', `translate(${plotWidth - 120}, 10)`);

    selectedGenes.forEach((symbol, i) => {
      const g = legend.append('g').attr('transform', `translate(0, ${i * 20})`);

      g.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 0)
        .attr('y2', 0)
        .attr('stroke', colorScale(symbol))
        .attr('stroke-width', 2);

      g.append('text')
        .attr('x', 25)
        .attr('y', 4)
        .attr('fill', '#ccc')
        .attr('font-size', 11)
        .text(symbol);
    });
  }

  private renderComparison(): void {
    const container = d3.select(this.config.container);
    container.selectAll('*').remove();

    const { width, height, margin } = this.config;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    this.svg = container.append('svg').attr('width', width).attr('height', height);

    this.plotArea = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get selected genes
    const selectedGenes =
      this.config.selectedGenes.length > 0
        ? this.config.selectedGenes
        : this.dataset.genes.slice(0, 8).map((g) => g.symbol);

    const geneIndices = selectedGenes
      .map((symbol) => this.dataset.genes.findIndex((g) => g.symbol === symbol))
      .filter((i) => i >= 0);

    // Calculate group means
    const groupMeans = this.dataset.groups.map((group) => {
      const sampleIndices = this.dataset.samples
        .map((s, i) => ({ s, i }))
        .filter(({ s }) => s.group === group.id)
        .map(({ i }) => i);

      return {
        group,
        means: geneIndices.map((gi) => {
          const values = sampleIndices.map((si) => this.normalizedMatrix[gi][si]);
          return d3.mean(values) || 0;
        }),
      };
    });

    // Scales
    const x0Scale = d3.scaleBand().domain(selectedGenes).range([0, plotWidth]).padding(0.2);

    const x1Scale = d3
      .scaleBand()
      .domain(this.dataset.groups.map((g) => g.id))
      .range([0, x0Scale.bandwidth()])
      .padding(0.05);

    const allMeans = groupMeans.flatMap((gm) => gm.means);
    const yExtent = d3.extent(allMeans) as [number, number];
    const yScale = d3
      .scaleLinear()
      .domain([Math.min(0, yExtent[0] * 1.1), yExtent[1] * 1.1])
      .range([plotHeight, 0]);

    // Axes
    const xAxis = d3.axisBottom(x0Scale);
    this.plotArea
      .append('g')
      .attr('class', 'axis x-axis')
      .attr('transform', `translate(0,${plotHeight})`)
      .call(xAxis);

    const yAxis = d3.axisLeft(yScale).ticks(5);
    this.plotArea.append('g').attr('class', 'axis y-axis').call(yAxis);

    // Y axis label
    this.plotArea
      .append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -plotHeight / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .text('Mean Expression');

    // Zero line
    if (yScale.domain()[0] < 0) {
      this.plotArea
        .append('line')
        .attr('x1', 0)
        .attr('x2', plotWidth)
        .attr('y1', yScale(0))
        .attr('y2', yScale(0))
        .attr('stroke', 'rgba(255,255,255,0.3)')
        .attr('stroke-dasharray', '3,3');
    }

    // Draw bars
    selectedGenes.forEach((symbol, geneIndex) => {
      const geneG = this.plotArea.append('g').attr('transform', `translate(${x0Scale(symbol)},0)`);

      groupMeans.forEach(({ group, means }) => {
        const value = means[geneIndex];
        const barHeight = Math.abs(yScale(value) - yScale(0));
        const y = value >= 0 ? yScale(value) : yScale(0);

        geneG
          .append('rect')
          .attr('class', 'expression-bar')
          .attr('x', x1Scale(group.id))
          .attr('y', y)
          .attr('width', x1Scale.bandwidth())
          .attr('height', barHeight)
          .attr('fill', group.color)
          .on('mouseover', (event) => {
            this.showComparisonTooltip(event, symbol, group.name, value);
          })
          .on('mouseout', () => this.hideTooltip());
      });
    });

    // Legend
    const legend = this.plotArea.append('g').attr('transform', `translate(${plotWidth - 120}, 10)`);

    this.dataset.groups.forEach((group, i) => {
      const g = legend.append('g').attr('transform', `translate(0, ${i * 20})`);

      g.append('rect').attr('width', 15).attr('height', 15).attr('fill', group.color);

      g.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .attr('fill', '#ccc')
        .attr('font-size', 11)
        .text(group.name);
    });
  }

  private getColorScale(): d3.ScaleSequential<string, never> | d3.ScaleDiverging<string, never> {
    const values = this.normalizedMatrix.flat();
    const extent = d3.extent(values) as [number, number];

    switch (this.config.colorScale) {
      case 'redblue':
        const maxAbs = Math.max(Math.abs(extent[0]), Math.abs(extent[1]));
        return d3.scaleDiverging(d3.interpolateRdBu).domain([maxAbs, 0, -maxAbs]);
      case 'yellowred':
        return d3.scaleSequential(d3.interpolateYlOrRd).domain(extent);
      case 'blues':
        return d3.scaleSequential(d3.interpolateBlues).domain(extent);
      default: // viridis
        return d3.scaleSequential(d3.interpolateViridis).domain(extent);
    }
  }

  private drawDendrogram(
    svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
    x: number,
    y: number,
    width: number,
    height: number,
    orientation: 'row' | 'col'
  ): void {
    const g = svg.append('g').attr('class', 'dendrogram').attr('transform', `translate(${x},${y})`);

    // Simplified dendrogram visualization
    const n = orientation === 'row' ? this.rowOrder.length : this.colOrder.length;
    const step = orientation === 'row' ? height / n : width / n;

    // Draw connecting lines (simplified hierarchical structure)
    for (let i = 0; i < n - 1; i += 2) {
      const pos1 = i * step + step / 2;
      const pos2 = (i + 1) * step + step / 2;
      const depth = Math.random() * (orientation === 'row' ? width * 0.6 : height * 0.6);

      if (orientation === 'row') {
        // Row dendrogram: draws from left edge (connecting to heatmap) extending right
        g.append('path')
          .attr('d', `M0,${pos1} H${depth} V${pos2} H0`)
          .attr('fill', 'none')
          .attr('stroke', 'rgba(255,255,255,0.3)');
      } else {
        // Column dendrogram: draws from bottom (connecting to heatmap) extending up
        g.append('path')
          .attr('d', `M${pos1},${height} V${height - depth} H${pos2} V${height}`)
          .attr('fill', 'none')
          .attr('stroke', 'rgba(255,255,255,0.3)');
      }
    }
  }

  private drawColorLegend(
    colorScale: d3.ScaleSequential<string, never> | d3.ScaleDiverging<string, never>,
    x: number,
    y: number
  ): void {
    const legendG = this.svg.append('g').attr('transform', `translate(${x},${y})`);

    const legendWidth = 120;
    const legendHeight = 15;
    const domain = colorScale.domain() as number[];

    // Gradient
    const gradientId = 'color-gradient';
    const defs = this.svg.append('defs');
    const gradient = defs.append('linearGradient').attr('id', gradientId);

    const nStops = 10;
    for (let i = 0; i <= nStops; i++) {
      const t = i / nStops;
      const value = domain[0] + t * (domain[domain.length - 1] - domain[0]);
      gradient
        .append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', colorScale(value) as string);
    }

    legendG
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', `url(#${gradientId})`);

    legendG
      .append('text')
      .attr('x', 0)
      .attr('y', legendHeight + 12)
      .attr('fill', '#888')
      .attr('font-size', 10)
      .text(domain[0].toFixed(1));

    legendG
      .append('text')
      .attr('x', legendWidth)
      .attr('y', legendHeight + 12)
      .attr('text-anchor', 'end')
      .attr('fill', '#888')
      .attr('font-size', 10)
      .text(domain[domain.length - 1].toFixed(1));
  }

  private showCellTooltip(
    event: MouseEvent,
    geneIdx: number,
    sampleIdx: number,
    value: number
  ): void {
    const gene = this.dataset.genes[geneIdx];
    const sample = this.dataset.samples[sampleIdx];
    const rawValue = this.dataset.matrix[geneIdx][sampleIdx];

    this.tooltip
      .html(
        `
      <div class="tooltip-title">${gene.symbol}</div>
      <div class="tooltip-row"><span>Sample:</span><span>${sample.name}</span></div>
      <div class="tooltip-row"><span>Group:</span><span>${sample.group}</span></div>
      <div class="tooltip-row"><span>Raw Value:</span><span>${rawValue.toFixed(2)}</span></div>
      <div class="tooltip-row"><span>Normalized:</span><span>${value.toFixed(2)}</span></div>
    `
      )
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .classed('visible', true);
  }

  private showProfileTooltip(event: MouseEvent, gene: Gene, sample: Sample, value: number): void {
    this.tooltip
      .html(
        `
      <div class="tooltip-title">${gene.symbol}</div>
      <div class="tooltip-row"><span>Sample:</span><span>${sample.name}</span></div>
      <div class="tooltip-row"><span>Group:</span><span>${sample.group}</span></div>
      <div class="tooltip-row"><span>Expression:</span><span>${value.toFixed(2)}</span></div>
    `
      )
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .classed('visible', true);
  }

  private showComparisonTooltip(
    event: MouseEvent,
    gene: string,
    group: string,
    value: number
  ): void {
    this.tooltip
      .html(
        `
      <div class="tooltip-title">${gene}</div>
      <div class="tooltip-row"><span>Group:</span><span>${group}</span></div>
      <div class="tooltip-row"><span>Mean:</span><span>${value.toFixed(3)}</span></div>
    `
      )
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .classed('visible', true);
  }

  private hideTooltip(): void {
    this.tooltip.classed('visible', false);
  }

  private selectGene(symbol: string): void {
    if (!this.config.selectedGenes.includes(symbol)) {
      this.config.selectedGenes.push(symbol);
    } else {
      this.config.selectedGenes = this.config.selectedGenes.filter((s) => s !== symbol);
    }
    this.updateGeneList();
  }

  private updateSidebar(): void {
    this.updateGeneList();
    this.updateSampleGroups();
    this.updateStats();
  }

  private updateGeneList(): void {
    const container = d3.select('#gene-list');
    container.selectAll('*').remove();

    this.dataset.genes.forEach((gene) => {
      const isSelected = this.config.selectedGenes.includes(gene.symbol);

      const item = container
        .append('div')
        .attr('class', `gene-item ${isSelected ? 'selected' : ''}`)
        .on('click', () => this.selectGene(gene.symbol));

      item.append('span').attr('class', 'gene-symbol').text(gene.symbol);

      item.append('span').attr('class', 'gene-desc').text(gene.name);
    });
  }

  private updateSampleGroups(): void {
    const container = d3.select('#sample-groups');
    container.selectAll('*').remove();

    this.dataset.groups.forEach((group) => {
      const item = container.append('div').attr('class', 'group-item');

      item.append('div').attr('class', 'group-color').style('background-color', group.color);

      item.append('span').attr('class', 'group-label').text(group.name);

      item.append('span').attr('class', 'group-count').text(group.samples.length);
    });
  }

  private updateStats(): void {
    const container = d3.select('#stats');
    container.selectAll('*').remove();

    const stats = [
      { label: 'Genes', value: this.dataset.metadata.nGenes },
      { label: 'Samples', value: this.dataset.metadata.nSamples },
      { label: 'Groups', value: this.dataset.groups.length },
      { label: 'Value Type', value: this.dataset.metadata.valueType },
      { label: 'Organism', value: this.dataset.metadata.organism },
    ];

    stats.forEach((stat) => {
      const row = container.append('div').attr('class', 'stat-row');
      row.append('span').attr('class', 'stat-label').text(stat.label);
      row.append('span').attr('class', 'stat-value').text(stat.value);
    });
  }

  // Public methods
  public updateConfig(newConfig: Partial<ExpressionConfig>): void {
    const needsRebuild =
      'view' in newConfig ||
      'normalize' in newConfig ||
      'clusterRows' in newConfig ||
      'clusterCols' in newConfig ||
      'colorScale' in newConfig;

    this.config = { ...this.config, ...newConfig };

    if (needsRebuild) {
      this.initPlot();
    }
  }

  public updateDataset(dataset: ExpressionDataset): void {
    this.dataset = dataset;
    this.config.selectedGenes = [];
    this.initPlot();
  }
}
