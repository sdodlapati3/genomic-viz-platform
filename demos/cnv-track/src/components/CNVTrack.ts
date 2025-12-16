import * as d3 from 'd3';
import { CNVSample, CNVConfig, CNVSegment, CNVColors } from '../types';
import { chromosomes, getChromosome } from '../data/datasets';

export class CNVTrack {
  private config: CNVConfig;
  private sample: CNVSample;
  private svg!: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>;
  private tooltip!: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private selectedSegment: CNVSegment | null = null;

  private colors: CNVColors = {
    amplification: '#c62828',
    gain: '#ef5350',
    neutral: '#9e9e9e',
    loss: '#42a5f5',
    deepDeletion: '#1565c0',
  };

  constructor(config: CNVConfig, sample: CNVSample) {
    this.config = config;
    this.sample = sample;
    this.tooltip = d3.select('#tooltip');
    this.render();
  }

  private render(): void {
    switch (this.config.view) {
      case 'linear':
        this.renderLinearTrack();
        break;
      case 'heatmap':
        this.renderHeatmap();
        break;
      case 'segments':
        this.renderSegmentsOnly();
        break;
    }
    this.updateSidebar();
  }

  private renderLinearTrack(): void {
    const container = d3.select(this.config.container);
    container.selectAll('*').remove();

    const { width, height, margin } = this.config;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    this.svg = container.append('svg').attr('width', width).attr('height', height);

    const plotArea = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get relevant segments
    const segments =
      this.config.chromosome === 'all'
        ? this.sample.segments
        : this.sample.segments.filter((s) => s.chromosome === this.config.chromosome);

    // Get relevant chromosomes
    const relevantChroms =
      this.config.chromosome === 'all'
        ? chromosomes.slice(0, 10) // Limit to first 10 for genome-wide
        : chromosomes.filter((c) => c.id === this.config.chromosome);

    if (this.config.chromosome === 'all') {
      this.renderGenomeWide(plotArea, segments, relevantChroms, plotWidth, plotHeight);
    } else {
      this.renderSingleChromosome(plotArea, segments, relevantChroms[0], plotWidth, plotHeight);
    }
  }

  private renderGenomeWide(
    plotArea: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
    segments: CNVSegment[],
    chroms: typeof chromosomes,
    width: number,
    height: number
  ): void {
    const totalGenomeSize = chroms.reduce((sum, c) => sum + c.size, 0);
    const chrGap = 5;
    const trackHeight = height - 60;

    // X scale - cumulative genome position
    let cumOffset = 0;
    const chrOffsets = new Map<string, number>();
    chroms.forEach((chr) => {
      chrOffsets.set(chr.id, cumOffset);
      cumOffset += chr.size;
    });

    const xScale = d3
      .scaleLinear()
      .domain([0, totalGenomeSize])
      .range([0, width - chroms.length * chrGap]);

    // Y scale - log2 ratio
    const yScale = d3.scaleLinear().domain([-2.5, 2.5]).range([trackHeight, 0]);

    // Draw chromosome backgrounds and labels
    let xOffset = 0;
    chroms.forEach((chr, i) => {
      const chrWidth = xScale(chr.size);

      // Background
      plotArea
        .append('rect')
        .attr('x', xOffset)
        .attr('y', 0)
        .attr('width', chrWidth)
        .attr('height', trackHeight)
        .attr('fill', i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)');

      // Centromere
      if (this.config.showCytobands) {
        const centStart = xScale(chr.centromereStart);
        const centEnd = xScale(chr.centromereEnd);
        plotArea
          .append('rect')
          .attr('x', xOffset + centStart)
          .attr('y', 0)
          .attr('width', centEnd - centStart)
          .attr('height', trackHeight)
          .attr('fill', 'rgba(255,100,100,0.1)');
      }

      // Label
      plotArea
        .append('text')
        .attr('class', 'chromosome-label')
        .attr('x', xOffset + chrWidth / 2)
        .attr('y', trackHeight + 15)
        .attr('text-anchor', 'middle')
        .text(chr.name);

      xOffset += chrWidth + chrGap;
    });

    // Draw zero line
    plotArea
      .append('line')
      .attr('class', 'zero-line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0));

    // Draw threshold lines
    [0.3, -0.3, 1, -1].forEach((threshold) => {
      plotArea
        .append('line')
        .attr('class', 'threshold-line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(threshold))
        .attr('y2', yScale(threshold));
    });

    // Y axis
    const yAxis = d3.axisLeft(yScale).ticks(5);
    plotArea.append('g').attr('class', 'axis').call(yAxis);

    // Draw segments
    segments.forEach((seg) => {
      const chr = chroms.find((c) => c.id === seg.chromosome);
      if (!chr) return;

      const chrIdx = chroms.indexOf(chr);
      const baseOffset = chroms
        .slice(0, chrIdx)
        .reduce((sum, c) => sum + xScale(c.size) + chrGap, 0);

      const x = baseOffset + xScale(seg.start);
      const segWidth = Math.max(1, xScale(seg.end - seg.start));
      const y = yScale(Math.max(-2.5, Math.min(2.5, seg.log2Ratio)));
      const barHeight = Math.abs(yScale(seg.log2Ratio) - yScale(0));

      plotArea
        .append('rect')
        .attr('class', 'cnv-segment')
        .attr('x', x)
        .attr('y', seg.log2Ratio >= 0 ? y : yScale(0))
        .attr('width', segWidth)
        .attr('height', barHeight)
        .attr('fill', this.getSegmentColor(seg))
        .classed('selected', this.selectedSegment?.id === seg.id)
        .on('mouseover', (event) => this.showTooltip(event, seg))
        .on('mouseout', () => this.hideTooltip())
        .on('click', () => this.selectSegment(seg));
    });

    // Draw gene markers if enabled
    if (this.config.showGenes) {
      this.sample.genes.forEach((gene) => {
        const chr = chroms.find((c) => c.id === gene.chromosome);
        if (!chr) return;

        const chrIdx = chroms.indexOf(chr);
        const baseOffset = chroms
          .slice(0, chrIdx)
          .reduce((sum, c) => sum + xScale(c.size) + chrGap, 0);
        const x = baseOffset + xScale(gene.start);

        plotArea
          .append('line')
          .attr('class', 'gene-marker')
          .attr('x1', x)
          .attr('x2', x)
          .attr('y1', trackHeight + 20)
          .attr('y2', trackHeight + 30)
          .attr('stroke', gene.type === 'oncogene' ? '#ff7043' : '#4fc3f7')
          .attr('stroke-width', 2);

        plotArea
          .append('text')
          .attr('class', 'gene-label')
          .attr('x', x)
          .attr('y', trackHeight + 42)
          .attr('text-anchor', 'middle')
          .text(gene.symbol);
      });
    }
  }

  private renderSingleChromosome(
    plotArea: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
    segments: CNVSegment[],
    chr: (typeof chromosomes)[0],
    width: number,
    height: number
  ): void {
    const trackHeight = height - 80;

    // X scale - chromosome position
    const xScale = d3.scaleLinear().domain([0, chr.size]).range([0, width]);

    // Y scale - log2 ratio
    const yScale = d3.scaleLinear().domain([-2.5, 2.5]).range([trackHeight, 0]);

    // Draw chromosome background
    plotArea
      .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', trackHeight)
      .attr('fill', 'rgba(255,255,255,0.03)');

    // Draw centromere
    if (this.config.showCytobands) {
      plotArea
        .append('rect')
        .attr('x', xScale(chr.centromereStart))
        .attr('y', 0)
        .attr('width', xScale(chr.centromereEnd - chr.centromereStart))
        .attr('height', trackHeight)
        .attr('fill', 'rgba(255,100,100,0.15)');
    }

    // Draw axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(10)
      .tickFormat((d) => `${((d as number) / 1000000).toFixed(0)}Mb`);
    plotArea
      .append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${trackHeight})`)
      .call(xAxis);

    const yAxis = d3.axisLeft(yScale).ticks(5);
    plotArea.append('g').attr('class', 'axis').call(yAxis);

    // Y axis label
    plotArea
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -trackHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#888')
      .text('Log2 Ratio');

    // Draw zero and threshold lines
    plotArea
      .append('line')
      .attr('class', 'zero-line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0));

    [0.3, -0.3, 1, -1].forEach((threshold) => {
      plotArea
        .append('line')
        .attr('class', 'threshold-line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', yScale(threshold))
        .attr('y2', yScale(threshold));
    });

    // Draw probes if single chromosome
    const chrProbes = this.sample.probes.filter((p) => p.chromosome === chr.id);
    chrProbes.slice(0, 500).forEach((probe) => {
      plotArea
        .append('circle')
        .attr('cx', xScale(probe.position))
        .attr('cy', yScale(Math.max(-2.5, Math.min(2.5, probe.log2Ratio))))
        .attr('r', 2)
        .attr('fill', 'rgba(255,255,255,0.3)');
    });

    // Draw segments
    segments.forEach((seg) => {
      const x = xScale(seg.start);
      const segWidth = Math.max(2, xScale(seg.end) - xScale(seg.start));

      plotArea
        .append('rect')
        .attr('class', 'cnv-segment')
        .attr('x', x)
        .attr('y', yScale(Math.max(-2.5, Math.min(2.5, seg.log2Ratio))) - 3)
        .attr('width', segWidth)
        .attr('height', 6)
        .attr('fill', this.getSegmentColor(seg))
        .attr('rx', 2)
        .classed('selected', this.selectedSegment?.id === seg.id)
        .on('mouseover', (event) => this.showTooltip(event, seg))
        .on('mouseout', () => this.hideTooltip())
        .on('click', () => this.selectSegment(seg));
    });

    // Draw genes
    if (this.config.showGenes) {
      const chrGenes = this.sample.genes.filter((g) => g.chromosome === chr.id);
      chrGenes.forEach((gene) => {
        const x = xScale(gene.start);
        const geneWidth = Math.max(5, xScale(gene.end) - xScale(gene.start));

        plotArea
          .append('rect')
          .attr('class', 'gene-marker')
          .attr('x', x)
          .attr('y', trackHeight + 25)
          .attr('width', geneWidth)
          .attr('height', 8)
          .attr('fill', gene.type === 'oncogene' ? '#ff7043' : '#4fc3f7')
          .attr('rx', 2);

        plotArea
          .append('text')
          .attr('class', 'gene-label')
          .attr('x', x + geneWidth / 2)
          .attr('y', trackHeight + 45)
          .attr('text-anchor', 'middle')
          .text(gene.symbol);
      });
    }
  }

  private renderHeatmap(): void {
    const container = d3.select(this.config.container);
    container.selectAll('*').remove();

    const { width, height, margin } = this.config;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    this.svg = container.append('svg').attr('width', width).attr('height', height);

    const plotArea = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const chroms = chromosomes.slice(0, 22); // Autosomes only
    const cellWidth = plotWidth / chroms.length;
    const nBins = 50;
    const cellHeight = plotHeight / nBins;

    // Color scale
    const colorScale = d3.scaleSequential(d3.interpolateRdBu).domain([2, -2]);

    chroms.forEach((chr, chrIdx) => {
      const chrSegs = this.sample.segments.filter((s) => s.chromosome === chr.id);
      const binSize = chr.size / nBins;

      for (let binIdx = 0; binIdx < nBins; binIdx++) {
        const binStart = binIdx * binSize;
        const binEnd = (binIdx + 1) * binSize;

        // Find segments overlapping this bin
        const overlapping = chrSegs.filter((s) => s.start < binEnd && s.end > binStart);

        let value = 0;
        if (overlapping.length > 0) {
          value = d3.mean(overlapping, (s) => s.log2Ratio) || 0;
        }

        plotArea
          .append('rect')
          .attr('x', chrIdx * cellWidth)
          .attr('y', binIdx * cellHeight)
          .attr('width', cellWidth - 1)
          .attr('height', cellHeight - 1)
          .attr('fill', colorScale(value));
      }

      // Chromosome label
      plotArea
        .append('text')
        .attr('class', 'chromosome-label')
        .attr('x', chrIdx * cellWidth + cellWidth / 2)
        .attr('y', plotHeight + 15)
        .attr('text-anchor', 'middle')
        .text(chr.name);
    });

    // Color legend
    this.drawColorLegend(plotArea, colorScale, plotWidth - 100, -30);
  }

  private renderSegmentsOnly(): void {
    const container = d3.select(this.config.container);
    container.selectAll('*').remove();

    const { width, height, margin } = this.config;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    this.svg = container.append('svg').attr('width', width).attr('height', height);

    const plotArea = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Filter to CNV segments only
    const cnvSegments = this.sample.segments.filter((s) => s.call !== 'neutral');

    // Sort by absolute log2 ratio
    cnvSegments.sort((a, b) => Math.abs(b.log2Ratio) - Math.abs(a.log2Ratio));

    // Take top 50
    const topSegments = cnvSegments.slice(0, 50);

    const barHeight = Math.min(15, plotHeight / topSegments.length - 2);

    // X scale
    const maxRatio = d3.max(topSegments, (s) => Math.abs(s.log2Ratio)) || 2;
    const xScale = d3.scaleLinear().domain([-maxRatio, maxRatio]).range([0, plotWidth]);

    // Draw bars
    topSegments.forEach((seg, i) => {
      const y = i * (barHeight + 2);
      const x = seg.log2Ratio >= 0 ? xScale(0) : xScale(seg.log2Ratio);
      const barWidth = Math.abs(xScale(seg.log2Ratio) - xScale(0));

      // Bar
      plotArea
        .append('rect')
        .attr('class', 'cnv-segment')
        .attr('x', x)
        .attr('y', y)
        .attr('width', barWidth)
        .attr('height', barHeight)
        .attr('fill', this.getSegmentColor(seg))
        .attr('rx', 2)
        .on('mouseover', (event) => this.showTooltip(event, seg))
        .on('mouseout', () => this.hideTooltip())
        .on('click', () => this.selectSegment(seg));

      // Label
      const label = `${seg.chromosome.replace('chr', '')}:${(seg.start / 1000000).toFixed(1)}-${(seg.end / 1000000).toFixed(1)}Mb`;
      plotArea
        .append('text')
        .attr('x', seg.log2Ratio >= 0 ? xScale(0) - 5 : xScale(0) + 5)
        .attr('y', y + barHeight / 2 + 4)
        .attr('text-anchor', seg.log2Ratio >= 0 ? 'end' : 'start')
        .attr('fill', '#888')
        .attr('font-size', 10)
        .text(label);

      // Genes
      if (seg.genes.length > 0) {
        plotArea
          .append('text')
          .attr('x', xScale(seg.log2Ratio) + (seg.log2Ratio >= 0 ? 5 : -5))
          .attr('y', y + barHeight / 2 + 4)
          .attr('text-anchor', seg.log2Ratio >= 0 ? 'start' : 'end')
          .attr('fill', '#4ecdc4')
          .attr('font-size', 10)
          .text(seg.genes.join(', '));
      }
    });

    // Draw zero line
    plotArea
      .append('line')
      .attr('x1', xScale(0))
      .attr('x2', xScale(0))
      .attr('y1', 0)
      .attr('y2', plotHeight)
      .attr('stroke', 'rgba(255,255,255,0.5)')
      .attr('stroke-width', 1);

    // X axis
    const xAxis = d3.axisBottom(xScale).ticks(7);
    plotArea
      .append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${plotHeight})`)
      .call(xAxis);

    plotArea
      .append('text')
      .attr('x', plotWidth / 2)
      .attr('y', plotHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', '#888')
      .text('Log2 Ratio');
  }

  private getSegmentColor(seg: CNVSegment): string {
    if (this.config.colorBy === 'gainloss') {
      return this.colors[seg.call];
    }

    // Continuous color scale for log2 ratio
    const colorScale = d3.scaleSequential(d3.interpolateRdBu).domain([2, -2]);
    return colorScale(seg.log2Ratio);
  }

  private drawColorLegend(
    g: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
    scale: d3.ScaleSequential<string, never>,
    x: number,
    y: number
  ): void {
    const legendWidth = 100;
    const legendHeight = 10;

    const legendG = g.append('g').attr('transform', `translate(${x},${y})`);

    // Gradient
    const gradientId = 'cnv-gradient';
    const defs = this.svg.append('defs');
    const gradient = defs.append('linearGradient').attr('id', gradientId);

    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      const value = 2 - t * 4;
      gradient
        .append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', scale(value));
    }

    legendG
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', `url(#${gradientId})`);

    legendG
      .append('text')
      .attr('x', 0)
      .attr('y', -3)
      .attr('fill', '#888')
      .attr('font-size', 9)
      .text('Loss');

    legendG
      .append('text')
      .attr('x', legendWidth)
      .attr('y', -3)
      .attr('text-anchor', 'end')
      .attr('fill', '#888')
      .attr('font-size', 9)
      .text('Gain');
  }

  private showTooltip(event: MouseEvent, seg: CNVSegment): void {
    const size = ((seg.end - seg.start) / 1000000).toFixed(2);

    this.tooltip
      .html(
        `
      <div class="tooltip-title">${seg.chromosome}:${seg.start.toLocaleString()}-${seg.end.toLocaleString()}</div>
      <div class="tooltip-row"><span>Size:</span><span>${size} Mb</span></div>
      <div class="tooltip-row"><span>Log2 Ratio:</span><span>${seg.log2Ratio.toFixed(3)}</span></div>
      <div class="tooltip-row"><span>Segment Mean:</span><span>${seg.segmentMean.toFixed(3)}</span></div>
      <div class="tooltip-row"><span>Call:</span><span>${seg.call.replace('_', ' ')}</span></div>
      <div class="tooltip-row"><span>Probes:</span><span>${seg.probeCount}</span></div>
      ${seg.genes.length > 0 ? `<div class="tooltip-row"><span>Genes:</span><span>${seg.genes.join(', ')}</span></div>` : ''}
    `
      )
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`)
      .classed('visible', true);
  }

  private hideTooltip(): void {
    this.tooltip.classed('visible', false);
  }

  private selectSegment(seg: CNVSegment): void {
    this.selectedSegment = this.selectedSegment?.id === seg.id ? null : seg;
    this.updateSelectionInfo();
    this.render();
  }

  private updateSidebar(): void {
    this.updateLegend();
    this.updateStats();
    this.updateAffectedGenes();
    this.updateSelectionInfo();
  }

  private updateLegend(): void {
    const container = d3.select('#legend');
    container.html('');

    if (this.config.colorBy === 'gainloss') {
      const items = [
        { label: 'Amplification (>1)', color: this.colors.amplification },
        { label: 'Gain (>0.3)', color: this.colors.gain },
        { label: 'Neutral', color: this.colors.neutral },
        { label: 'Loss (<-0.3)', color: this.colors.loss },
        { label: 'Deep Deletion (<-1)', color: this.colors.deepDeletion },
      ];

      items.forEach((item) => {
        const div = container.append('div').attr('class', 'legend-item');
        div.append('div').attr('class', 'legend-color').style('background-color', item.color);
        div.append('span').text(item.label);
      });
    } else {
      // Gradient legend
      container
        .append('div')
        .attr('class', 'legend-gradient')
        .style('background', 'linear-gradient(to right, #1565c0, #9e9e9e, #c62828)');

      const labels = container.append('div').attr('class', 'gradient-labels');
      labels.append('span').text('-2');
      labels.append('span').text('0');
      labels.append('span').text('+2');
    }
  }

  private updateStats(): void {
    const container = d3.select('#stats');
    container.html('');

    const meta = this.sample.metadata;
    const gains = this.sample.segments.filter(
      (s) => s.call === 'gain' || s.call === 'amplification'
    ).length;
    const losses = this.sample.segments.filter(
      (s) => s.call === 'loss' || s.call === 'deep_deletion'
    ).length;

    const stats = [
      { label: 'Total Segments', value: meta.nSegments, class: '' },
      { label: 'Gains/Amps', value: gains, class: 'gain' },
      { label: 'Losses/Dels', value: losses, class: 'loss' },
      {
        label: 'Fraction Altered',
        value: `${(meta.fractionAltered * 100).toFixed(1)}%`,
        class: '',
      },
      { label: 'Ploidy', value: meta.ploidy.toFixed(2), class: '' },
      { label: 'Purity', value: `${(meta.purity * 100).toFixed(0)}%`, class: '' },
    ];

    stats.forEach((stat) => {
      const row = container.append('div').attr('class', 'stat-row');
      row.append('span').attr('class', 'stat-label').text(stat.label);
      row.append('span').attr('class', `stat-value ${stat.class}`).text(stat.value);
    });
  }

  private updateAffectedGenes(): void {
    const container = d3.select('#affected-genes');
    container.html('');

    const cnvSegments = this.sample.segments.filter((s) => s.call !== 'neutral');
    const geneMap = new Map<string, 'amplified' | 'deleted'>();

    cnvSegments.forEach((seg) => {
      seg.genes.forEach((gene) => {
        if (seg.call === 'amplification' || seg.call === 'gain') {
          geneMap.set(gene, 'amplified');
        } else {
          geneMap.set(gene, 'deleted');
        }
      });
    });

    geneMap.forEach((status, gene) => {
      container.append('span').attr('class', `gene-chip ${status}`).text(gene);
    });
  }

  private updateSelectionInfo(): void {
    const container = d3.select('#selection-info');
    container.html('');

    if (!this.selectedSegment) {
      container.append('p').text('Click on a segment for details');
      return;
    }

    const seg = this.selectedSegment;
    const size = ((seg.end - seg.start) / 1000000).toFixed(2);

    container.html(`
      <div class="selection-detail">
        <div class="label">Region</div>
        <div class="value">${seg.chromosome}:${seg.start.toLocaleString()}-${seg.end.toLocaleString()}</div>
      </div>
      <div class="selection-detail">
        <div class="label">Size</div>
        <div class="value">${size} Mb</div>
      </div>
      <div class="selection-detail">
        <div class="label">Log2 Ratio</div>
        <div class="value">${seg.log2Ratio.toFixed(3)}</div>
      </div>
      <div class="selection-detail">
        <div class="label">Call</div>
        <div class="value">${seg.call.replace('_', ' ')}</div>
      </div>
      <div class="selection-detail">
        <div class="label">Genes</div>
        <div class="value">${seg.genes.length > 0 ? seg.genes.join(', ') : 'None'}</div>
      </div>
    `);
  }

  // Public methods
  public updateConfig(newConfig: Partial<CNVConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.render();
  }

  public updateSample(sample: CNVSample): void {
    this.sample = sample;
    this.selectedSegment = null;
    this.render();
  }
}
