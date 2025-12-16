/**
 * Violin Plot Component
 * Interactive violin plot with box overlay and kernel density estimation
 */
import * as d3 from 'd3';
import type { ViolinDataPoint, ViolinGroup, ViolinChartConfig, GroupStats } from '../types';
import { colorSchemes } from '../data/datasets';

export class ViolinPlot {
  private container: HTMLElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private config: ViolinChartConfig;
  private data: ViolinDataPoint[] = [];
  private groups: ViolinGroup[] = [];
  private yLabel: string = 'Value';
  private tooltip: HTMLElement;
  private statsContainer: HTMLElement;
  private legendContainer: HTMLElement;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    this.container = container;

    this.tooltip = document.getElementById('tooltip') || this.createTooltip();
    this.statsContainer = document.getElementById('stats') || document.createElement('div');
    this.legendContainer = document.getElementById('legend') || document.createElement('div');

    this.config = {
      width: 800,
      height: 500,
      margin: { top: 40, right: 30, bottom: 60, left: 80 },
      showBox: true,
      showPoints: false,
      bandwidth: 0.7,
      colorScheme: colorSchemes.categorical,
      animationDuration: 500,
    };

    this.initSvg();
  }

  private createTooltip(): HTMLElement {
    const tooltip = document.createElement('div');
    tooltip.id = 'tooltip';
    tooltip.className = 'tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
  }

  private initSvg(): void {
    this.container.innerHTML = '';

    const containerRect = this.container.getBoundingClientRect();
    this.config.width = containerRect.width || 800;
    this.config.height = 500;

    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.config.width)
      .attr('height', this.config.height);

    // Add groups for layered rendering
    this.svg.append('g').attr('class', 'grid');
    this.svg.append('g').attr('class', 'violins');
    this.svg.append('g').attr('class', 'boxes');
    this.svg.append('g').attr('class', 'points');
    this.svg.append('g').attr('class', 'x-axis');
    this.svg.append('g').attr('class', 'y-axis');
    this.svg.append('text').attr('class', 'y-axis-label axis-label');
  }

  setData(data: ViolinDataPoint[], yLabel: string): void {
    this.data = data;
    this.yLabel = yLabel;
    this.processData();
    this.render();
    this.renderStats();
    this.renderLegend();
  }

  setShowBox(show: boolean): void {
    this.config.showBox = show;
    this.render();
  }

  setShowPoints(show: boolean): void {
    this.config.showPoints = show;
    this.render();
  }

  setBandwidth(bandwidth: number): void {
    this.config.bandwidth = bandwidth;
    this.processData();
    this.render();
  }

  private processData(): void {
    const groupNames = [...new Set(this.data.map((d) => d.group))];

    this.groups = groupNames.map((name, i) => {
      const values = this.data.filter((d) => d.group === name).map((d) => d.value);
      const stats = this.calculateStats(values);
      const density = this.kernelDensityEstimation(values, stats.min, stats.max);

      return {
        name,
        values,
        stats,
        density,
        color: this.config.colorScheme[i % this.config.colorScheme.length],
      };
    });
  }

  private calculateStats(values: number[]): GroupStats {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    return {
      min: sorted[0],
      max: sorted[n - 1],
      median: d3.median(sorted) || 0,
      q1: d3.quantile(sorted, 0.25) || 0,
      q3: d3.quantile(sorted, 0.75) || 0,
      mean: d3.mean(sorted) || 0,
      std: d3.deviation(sorted) || 0,
      n,
    };
  }

  private kernelDensityEstimation(
    values: number[],
    min: number,
    max: number
  ): { x: number; y: number }[] {
    const bandwidth = this.config.bandwidth * d3.deviation(values)!;
    const nBins = 50;
    const step = (max - min) / nBins;

    // Gaussian kernel
    const kernel = (u: number) => Math.exp(-0.5 * u * u) / Math.sqrt(2 * Math.PI);

    const density: { x: number; y: number }[] = [];

    for (let i = 0; i <= nBins; i++) {
      const x = min + i * step;
      let sum = 0;

      for (const v of values) {
        sum += kernel((x - v) / bandwidth);
      }

      density.push({ x, y: sum / (values.length * bandwidth) });
    }

    return density;
  }

  private render(): void {
    const { width, height, margin, animationDuration } = this.config;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Scales
    const xScale = d3
      .scaleBand()
      .domain(this.groups.map((g) => g.name))
      .range([0, innerWidth])
      .padding(0.2);

    const allValues = this.data.map((d) => d.value);
    const yMin = Math.min(0, d3.min(allValues) || 0);
    const yMax = (d3.max(allValues) || 0) * 1.1;

    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]);

    // Find max density for scaling violin width
    const maxDensity = d3.max(this.groups.flatMap((g) => g.density.map((d) => d.y))) || 1;
    const violinWidth = xScale.bandwidth() / 2;

    // Render axes
    this.renderAxes(xScale, yScale, margin, innerWidth, innerHeight);

    // Render grid
    this.renderGrid(yScale, margin, innerWidth, innerHeight);

    // Render violins
    this.renderViolins(xScale, yScale, violinWidth, maxDensity, margin, animationDuration);

    // Render boxes if enabled
    if (this.config.showBox) {
      this.renderBoxes(xScale, yScale, margin, animationDuration);
    } else {
      this.svg.select('.boxes').selectAll('*').remove();
    }

    // Render points if enabled
    if (this.config.showPoints) {
      this.renderPoints(xScale, yScale, margin, animationDuration);
    } else {
      this.svg.select('.points').selectAll('*').remove();
    }
  }

  private renderAxes(
    xScale: d3.ScaleBand<string>,
    yScale: d3.ScaleLinear<number, number>,
    margin: { top: number; right: number; bottom: number; left: number },
    innerWidth: number,
    innerHeight: number
  ): void {
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(8);

    this.svg
      .select<SVGGElement>('.x-axis')
      .attr('transform', `translate(${margin.left}, ${margin.top + innerHeight})`)
      .call(xAxis);

    this.svg
      .select<SVGGElement>('.y-axis')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .call(yAxis);

    // Y-axis label
    this.svg
      .select('.y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(margin.top + innerHeight / 2))
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .text(this.yLabel);
  }

  private renderGrid(
    yScale: d3.ScaleLinear<number, number>,
    margin: { top: number; right: number; bottom: number; left: number },
    innerWidth: number,
    innerHeight: number
  ): void {
    const gridGroup = this.svg
      .select<SVGGElement>('.grid')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const gridAxis = d3
      .axisLeft(yScale)
      .ticks(8)
      .tickSize(-innerWidth)
      .tickFormat(() => '');

    gridGroup.call(gridAxis);
    gridGroup.select('.domain').remove();
  }

  private renderViolins(
    xScale: d3.ScaleBand<string>,
    yScale: d3.ScaleLinear<number, number>,
    violinWidth: number,
    maxDensity: number,
    margin: { top: number; right: number; bottom: number; left: number },
    animationDuration: number
  ): void {
    const violinsGroup = this.svg
      .select<SVGGElement>('.violins')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Area generator for violin shape
    const areaGenerator = d3
      .area<{ x: number; y: number }>()
      .x0((d) => (-d.y * violinWidth) / maxDensity)
      .x1((d) => (d.y * violinWidth) / maxDensity)
      .y((d) => yScale(d.x))
      .curve(d3.curveCatmullRom);

    const violins = violinsGroup
      .selectAll<SVGPathElement, ViolinGroup>('.violin-path')
      .data(this.groups, (d) => d.name);

    // Enter
    const violinsEnter = violins
      .enter()
      .append('path')
      .attr('class', 'violin-path')
      .attr('fill', (d) => d.color)
      .attr('fill-opacity', 0.6)
      .attr('stroke', (d) => d.color)
      .attr('stroke-width', 1.5)
      .attr('transform', (d) => `translate(${(xScale(d.name) || 0) + xScale.bandwidth() / 2}, 0)`)
      .attr('d', (d) => areaGenerator(d.density.map((p) => ({ x: p.x, y: 0 }))));

    // Update + Enter
    violinsEnter
      .merge(violins)
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip())
      .transition()
      .duration(animationDuration)
      .attr('transform', (d) => `translate(${(xScale(d.name) || 0) + xScale.bandwidth() / 2}, 0)`)
      .attr('d', (d) => areaGenerator(d.density));

    // Exit
    violins
      .exit()
      .transition()
      .duration(animationDuration / 2)
      .attr('opacity', 0)
      .remove();
  }

  private renderBoxes(
    xScale: d3.ScaleBand<string>,
    yScale: d3.ScaleLinear<number, number>,
    margin: { top: number; right: number; bottom: number; left: number },
    animationDuration: number
  ): void {
    const boxesGroup = this.svg
      .select<SVGGElement>('.boxes')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const boxWidth = Math.min(20, xScale.bandwidth() * 0.15);

    // Box groups
    const boxGroups = boxesGroup
      .selectAll<SVGGElement, ViolinGroup>('.box-group')
      .data(this.groups, (d) => d.name);

    const boxGroupsEnter = boxGroups.enter().append('g').attr('class', 'box-group');

    const boxGroupsMerged = boxGroupsEnter
      .merge(boxGroups)
      .attr('transform', (d) => `translate(${(xScale(d.name) || 0) + xScale.bandwidth() / 2}, 0)`);

    boxGroups.exit().remove();

    // Render box elements for each group
    boxGroupsMerged.each((d, i, nodes) => {
      const group = d3.select(nodes[i]);
      const stats = d.stats;

      // Box (Q1 to Q3)
      const box = group.selectAll('.box').data([stats]);
      box
        .enter()
        .append('rect')
        .attr('class', 'box')
        .merge(box as d3.Selection<SVGRectElement, GroupStats, SVGGElement, ViolinGroup>)
        .transition()
        .duration(animationDuration)
        .attr('x', -boxWidth / 2)
        .attr('width', boxWidth)
        .attr('y', yScale(stats.q3))
        .attr('height', Math.max(1, yScale(stats.q1) - yScale(stats.q3)));

      // Median line
      const median = group.selectAll('.median-line').data([stats]);
      median
        .enter()
        .append('line')
        .attr('class', 'median-line')
        .merge(median as d3.Selection<SVGLineElement, GroupStats, SVGGElement, ViolinGroup>)
        .transition()
        .duration(animationDuration)
        .attr('x1', -boxWidth / 2)
        .attr('x2', boxWidth / 2)
        .attr('y1', yScale(stats.median))
        .attr('y2', yScale(stats.median));

      // Whiskers
      const whiskerData = [
        { y1: stats.q1, y2: stats.min },
        { y1: stats.q3, y2: stats.max },
      ];

      const whiskers = group.selectAll('.whisker').data(whiskerData);
      whiskers
        .enter()
        .append('line')
        .attr('class', 'whisker')
        .merge(
          whiskers as d3.Selection<
            SVGLineElement,
            (typeof whiskerData)[0],
            SVGGElement,
            ViolinGroup
          >
        )
        .transition()
        .duration(animationDuration)
        .attr('x1', 0)
        .attr('x2', 0)
        .attr('y1', (w) => yScale(w.y1))
        .attr('y2', (w) => yScale(w.y2));

      // Whisker caps
      const capData = [stats.min, stats.max];
      const caps = group.selectAll('.whisker-cap').data(capData);
      caps
        .enter()
        .append('line')
        .attr('class', 'whisker-cap box-line')
        .merge(caps as d3.Selection<SVGLineElement, number, SVGGElement, ViolinGroup>)
        .transition()
        .duration(animationDuration)
        .attr('x1', -boxWidth / 3)
        .attr('x2', boxWidth / 3)
        .attr('y1', (c) => yScale(c))
        .attr('y2', (c) => yScale(c));
    });
  }

  private renderPoints(
    xScale: d3.ScaleBand<string>,
    yScale: d3.ScaleLinear<number, number>,
    margin: { top: number; right: number; bottom: number; left: number },
    animationDuration: number
  ): void {
    const pointsGroup = this.svg
      .select<SVGGElement>('.points')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Jitter points horizontally
    const jitterWidth = xScale.bandwidth() * 0.3;

    const points = pointsGroup
      .selectAll<SVGCircleElement, ViolinDataPoint>('.point')
      .data(this.data, (d) => `${d.group}-${d.sampleId}`);

    points
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('r', 2)
      .attr(
        'cx',
        (d) => (xScale(d.group) || 0) + xScale.bandwidth() / 2 + (Math.random() - 0.5) * jitterWidth
      )
      .attr('cy', (d) => yScale(d.value))
      .attr('opacity', 0)
      .transition()
      .duration(animationDuration)
      .attr('opacity', 0.6);

    points
      .exit()
      .transition()
      .duration(animationDuration / 2)
      .attr('opacity', 0)
      .remove();
  }

  private showTooltip(event: MouseEvent, group: ViolinGroup): void {
    const stats = group.stats;

    this.tooltip.innerHTML = `
      <div class="tooltip-title">${group.name}</div>
      <div class="tooltip-row"><span>n:</span><span>${stats.n}</span></div>
      <div class="tooltip-row"><span>Mean:</span><span>${stats.mean.toFixed(2)}</span></div>
      <div class="tooltip-row"><span>Median:</span><span>${stats.median.toFixed(2)}</span></div>
      <div class="tooltip-row"><span>Std Dev:</span><span>${stats.std.toFixed(2)}</span></div>
      <div class="tooltip-row"><span>Range:</span><span>${stats.min.toFixed(1)} - ${stats.max.toFixed(1)}</span></div>
    `;

    this.tooltip.classList.add('visible');
    this.tooltip.style.left = `${event.clientX + 15}px`;
    this.tooltip.style.top = `${event.clientY - 10}px`;
  }

  private hideTooltip(): void {
    this.tooltip.classList.remove('visible');
  }

  private renderStats(): void {
    this.statsContainer.innerHTML = '';

    this.groups.forEach((group) => {
      const stats = group.stats;
      const div = document.createElement('div');
      div.className = 'stat-group';
      div.style.borderColor = group.color;

      div.innerHTML = `
        <div class="stat-group-title" style="color: ${group.color}">${group.name}</div>
        <div class="stat-row"><span class="stat-label">n:</span><span class="stat-value">${stats.n}</span></div>
        <div class="stat-row"><span class="stat-label">Mean:</span><span class="stat-value">${stats.mean.toFixed(2)}</span></div>
        <div class="stat-row"><span class="stat-label">Median:</span><span class="stat-value">${stats.median.toFixed(2)}</span></div>
        <div class="stat-row"><span class="stat-label">Std:</span><span class="stat-value">${stats.std.toFixed(2)}</span></div>
      `;

      this.statsContainer.appendChild(div);
    });
  }

  private renderLegend(): void {
    this.legendContainer.innerHTML = '';

    this.groups.forEach((group) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<div class="legend-color" style="background: ${group.color}"></div><span>${group.name} (n=${group.stats.n})</span>`;
      this.legendContainer.appendChild(item);
    });
  }

  resize(): void {
    this.initSvg();
    this.render();
  }
}
