/**
 * Box Plot Component
 * Interactive box plot with outliers, notches, and mean markers
 */
import * as d3 from 'd3';
import type { BoxDataPoint, BoxGroup, BoxPlotConfig, BoxStats } from '../types';
import { colorSchemes } from '../data/datasets';

export class BoxPlot {
  private container: HTMLElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private config: BoxPlotConfig;
  private data: BoxDataPoint[] = [];
  private groups: BoxGroup[] = [];
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
      orientation: 'vertical',
      showOutliers: true,
      showNotch: false,
      showMean: true,
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
    this.svg.append('g').attr('class', 'boxes');
    this.svg.append('g').attr('class', 'outliers');
    this.svg.append('g').attr('class', 'x-axis');
    this.svg.append('g').attr('class', 'y-axis');
    this.svg.append('text').attr('class', 'y-axis-label axis-label');
  }

  setData(data: BoxDataPoint[], yLabel: string): void {
    this.data = data;
    this.yLabel = yLabel;
    this.processData();
    this.render();
    this.renderStats();
    this.renderLegend();
  }

  setShowOutliers(show: boolean): void {
    this.config.showOutliers = show;
    this.render();
  }

  setShowNotch(show: boolean): void {
    this.config.showNotch = show;
    this.render();
  }

  setShowMean(show: boolean): void {
    this.config.showMean = show;
    this.render();
  }

  setOrientation(orientation: 'vertical' | 'horizontal'): void {
    this.config.orientation = orientation;
    this.render();
  }

  private processData(): void {
    const groupNames = [...new Set(this.data.map((d) => d.group))];

    this.groups = groupNames.map((name, i) => {
      const values = this.data.filter((d) => d.group === name).map((d) => d.value);
      const stats = this.calculateStats(values);
      const outliers = values.filter((v) => v < stats.whiskerLow || v > stats.whiskerHigh);

      return {
        name,
        values,
        stats,
        outliers,
        color: this.config.colorScheme[i % this.config.colorScheme.length],
      };
    });
  }

  private calculateStats(values: number[]): BoxStats {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;

    const q1 = d3.quantile(sorted, 0.25) || 0;
    const q3 = d3.quantile(sorted, 0.75) || 0;
    const iqr = q3 - q1;

    // Whiskers extend to 1.5 * IQR
    const whiskerLow = Math.max(sorted[0], q1 - 1.5 * iqr);
    const whiskerHigh = Math.min(sorted[n - 1], q3 + 1.5 * iqr);

    // Find actual whisker values (closest data points within range)
    const actualWhiskerLow = sorted.find((v) => v >= whiskerLow) || sorted[0];
    const actualWhiskerHigh = [...sorted].reverse().find((v) => v <= whiskerHigh) || sorted[n - 1];

    return {
      min: sorted[0],
      max: sorted[n - 1],
      median: d3.median(sorted) || 0,
      q1,
      q3,
      iqr,
      whiskerLow: actualWhiskerLow,
      whiskerHigh: actualWhiskerHigh,
      mean: d3.mean(sorted) || 0,
      std: d3.deviation(sorted) || 0,
      n,
    };
  }

  private render(): void {
    const { width, height, margin, orientation, animationDuration } = this.config;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const isVertical = orientation === 'vertical';

    // Scales
    const categoryScale = d3
      .scaleBand()
      .domain(this.groups.map((g) => g.name))
      .range(isVertical ? [0, innerWidth] : [0, innerHeight])
      .padding(0.3);

    const allValues = this.data.map((d) => d.value);
    const yMin = Math.min(0, (d3.min(allValues) || 0) * 0.9);
    const yMax = (d3.max(allValues) || 0) * 1.1;

    const valueScale = d3
      .scaleLinear()
      .domain([yMin, yMax])
      .range(isVertical ? [innerHeight, 0] : [0, innerWidth]);

    // Render axes
    this.renderAxes(categoryScale, valueScale, margin, innerWidth, innerHeight, isVertical);

    // Render grid
    this.renderGrid(valueScale, margin, innerWidth, innerHeight, isVertical);

    // Render boxes
    this.renderBoxes(categoryScale, valueScale, margin, isVertical, animationDuration);

    // Render outliers if enabled
    if (this.config.showOutliers) {
      this.renderOutliers(categoryScale, valueScale, margin, isVertical, animationDuration);
    } else {
      this.svg.select('.outliers').selectAll('*').remove();
    }
  }

  private renderAxes(
    categoryScale: d3.ScaleBand<string>,
    valueScale: d3.ScaleLinear<number, number>,
    margin: { top: number; right: number; bottom: number; left: number },
    innerWidth: number,
    innerHeight: number,
    isVertical: boolean
  ): void {
    const xAxis = isVertical ? d3.axisBottom(categoryScale) : d3.axisBottom(valueScale).ticks(8);

    const yAxis = isVertical ? d3.axisLeft(valueScale).ticks(8) : d3.axisLeft(categoryScale);

    this.svg
      .select<SVGGElement>('.x-axis')
      .attr('transform', `translate(${margin.left}, ${margin.top + innerHeight})`)
      .transition()
      .duration(this.config.animationDuration)
      .call(xAxis);

    this.svg
      .select<SVGGElement>('.y-axis')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .transition()
      .duration(this.config.animationDuration)
      .call(yAxis);

    // Y-axis label
    this.svg
      .select('.y-axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(margin.top + innerHeight / 2))
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .text(isVertical ? this.yLabel : 'Group');
  }

  private renderGrid(
    valueScale: d3.ScaleLinear<number, number>,
    margin: { top: number; right: number; bottom: number; left: number },
    innerWidth: number,
    innerHeight: number,
    isVertical: boolean
  ): void {
    const gridGroup = this.svg
      .select<SVGGElement>('.grid')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const gridAxis = isVertical
      ? d3
          .axisLeft(valueScale)
          .ticks(8)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      : d3
          .axisBottom(valueScale)
          .ticks(8)
          .tickSize(-innerHeight)
          .tickFormat(() => '');

    gridGroup.call(gridAxis);
    gridGroup.select('.domain').remove();
  }

  private renderBoxes(
    categoryScale: d3.ScaleBand<string>,
    valueScale: d3.ScaleLinear<number, number>,
    margin: { top: number; right: number; bottom: number; left: number },
    isVertical: boolean,
    animationDuration: number
  ): void {
    const boxesGroup = this.svg
      .select<SVGGElement>('.boxes')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const boxWidth = Math.min(60, categoryScale.bandwidth() * 0.8);

    // Box groups
    const boxGroups = boxesGroup
      .selectAll<SVGGElement, BoxGroup>('.box-group')
      .data(this.groups, (d) => d.name);

    const boxGroupsEnter = boxGroups.enter().append('g').attr('class', 'box-group');

    const boxGroupsMerged = boxGroupsEnter.merge(boxGroups);

    boxGroupsMerged
      .transition()
      .duration(animationDuration)
      .attr('transform', (d) =>
        isVertical
          ? `translate(${(categoryScale(d.name) || 0) + categoryScale.bandwidth() / 2}, 0)`
          : `translate(0, ${(categoryScale(d.name) || 0) + categoryScale.bandwidth() / 2})`
      );

    boxGroups.exit().remove();

    // Render box elements for each group
    boxGroupsMerged.each((d, i, nodes) => {
      const group = d3.select(nodes[i]);
      const stats = d.stats;
      const color = d.color;

      // Whisker (low)
      this.updateLine(
        group,
        'whisker-low',
        {
          x1: isVertical ? 0 : valueScale(stats.whiskerLow),
          x2: isVertical ? 0 : valueScale(stats.q1),
          y1: isVertical ? valueScale(stats.whiskerLow) : 0,
          y2: isVertical ? valueScale(stats.q1) : 0,
        },
        color,
        animationDuration
      );

      // Whisker (high)
      this.updateLine(
        group,
        'whisker-high',
        {
          x1: isVertical ? 0 : valueScale(stats.q3),
          x2: isVertical ? 0 : valueScale(stats.whiskerHigh),
          y1: isVertical ? valueScale(stats.q3) : 0,
          y2: isVertical ? valueScale(stats.whiskerHigh) : 0,
        },
        color,
        animationDuration
      );

      // Whisker caps
      const capSize = boxWidth / 3;
      this.updateLine(
        group,
        'cap-low',
        {
          x1: isVertical ? -capSize : valueScale(stats.whiskerLow),
          x2: isVertical ? capSize : valueScale(stats.whiskerLow),
          y1: isVertical ? valueScale(stats.whiskerLow) : -capSize,
          y2: isVertical ? valueScale(stats.whiskerLow) : capSize,
        },
        color,
        animationDuration
      );

      this.updateLine(
        group,
        'cap-high',
        {
          x1: isVertical ? -capSize : valueScale(stats.whiskerHigh),
          x2: isVertical ? capSize : valueScale(stats.whiskerHigh),
          y1: isVertical ? valueScale(stats.whiskerHigh) : -capSize,
          y2: isVertical ? valueScale(stats.whiskerHigh) : capSize,
        },
        color,
        animationDuration
      );

      // Box
      if (this.config.showNotch) {
        this.renderNotchedBox(
          group,
          stats,
          valueScale,
          boxWidth,
          color,
          isVertical,
          animationDuration
        );
      } else {
        this.renderSimpleBox(
          group,
          stats,
          valueScale,
          boxWidth,
          color,
          isVertical,
          animationDuration
        );
      }

      // Median line
      this.updateLine(
        group,
        'median-line',
        {
          x1: isVertical ? -boxWidth / 2 : valueScale(stats.median),
          x2: isVertical ? boxWidth / 2 : valueScale(stats.median),
          y1: isVertical ? valueScale(stats.median) : -boxWidth / 2,
          y2: isVertical ? valueScale(stats.median) : boxWidth / 2,
        },
        '#fff',
        animationDuration,
        2
      );

      // Mean marker
      if (this.config.showMean) {
        const meanMarker = group.selectAll('.mean-marker').data([stats.mean]);
        meanMarker
          .enter()
          .append('path')
          .attr('class', 'mean-marker')
          .attr('d', d3.symbol().type(d3.symbolDiamond).size(60))
          .merge(meanMarker as d3.Selection<SVGPathElement, number, SVGGElement, BoxGroup>)
          .transition()
          .duration(animationDuration)
          .attr('transform', (m) =>
            isVertical ? `translate(0, ${valueScale(m)})` : `translate(${valueScale(m)}, 0)`
          );
        meanMarker.exit().remove();
      } else {
        group.selectAll('.mean-marker').remove();
      }
    });

    // Add hover events
    boxGroupsMerged
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip());
  }

  private renderSimpleBox(
    group: d3.Selection<SVGGElement, BoxGroup, SVGGElement, unknown>,
    stats: BoxStats,
    valueScale: d3.ScaleLinear<number, number>,
    boxWidth: number,
    color: string,
    isVertical: boolean,
    animationDuration: number
  ): void {
    // Remove notched box if exists
    group.selectAll('.notched-box').remove();

    const box = group.selectAll('.box-rect').data([stats]);
    box
      .enter()
      .append('rect')
      .attr('class', 'box-rect')
      .merge(box as d3.Selection<SVGRectElement, BoxStats, SVGGElement, BoxGroup>)
      .attr('fill', color)
      .attr('fill-opacity', 0.6)
      .attr('stroke', color)
      .attr('stroke-width', 1.5)
      .transition()
      .duration(animationDuration)
      .attr('x', isVertical ? -boxWidth / 2 : valueScale(stats.q1))
      .attr('width', isVertical ? boxWidth : valueScale(stats.q3) - valueScale(stats.q1))
      .attr('y', isVertical ? valueScale(stats.q3) : -boxWidth / 2)
      .attr('height', isVertical ? valueScale(stats.q1) - valueScale(stats.q3) : boxWidth);
  }

  private renderNotchedBox(
    group: d3.Selection<SVGGElement, BoxGroup, SVGGElement, unknown>,
    stats: BoxStats,
    valueScale: d3.ScaleLinear<number, number>,
    boxWidth: number,
    color: string,
    isVertical: boolean,
    animationDuration: number
  ): void {
    // Remove simple box if exists
    group.selectAll('.box-rect').remove();

    // Notch calculation (95% CI for median)
    const notchWidth = (1.57 * stats.iqr) / Math.sqrt(stats.n);
    const notchLow = stats.median - notchWidth;
    const notchHigh = stats.median + notchWidth;
    const notchIndent = boxWidth * 0.3;

    // Create path for notched box
    const pathData = isVertical
      ? `M ${-boxWidth / 2} ${valueScale(stats.q1)}
         L ${-boxWidth / 2} ${valueScale(notchLow)}
         L ${-boxWidth / 2 + notchIndent} ${valueScale(stats.median)}
         L ${-boxWidth / 2} ${valueScale(notchHigh)}
         L ${-boxWidth / 2} ${valueScale(stats.q3)}
         L ${boxWidth / 2} ${valueScale(stats.q3)}
         L ${boxWidth / 2} ${valueScale(notchHigh)}
         L ${boxWidth / 2 - notchIndent} ${valueScale(stats.median)}
         L ${boxWidth / 2} ${valueScale(notchLow)}
         L ${boxWidth / 2} ${valueScale(stats.q1)}
         Z`
      : `M ${valueScale(stats.q1)} ${-boxWidth / 2}
         L ${valueScale(notchLow)} ${-boxWidth / 2}
         L ${valueScale(stats.median)} ${-boxWidth / 2 + notchIndent}
         L ${valueScale(notchHigh)} ${-boxWidth / 2}
         L ${valueScale(stats.q3)} ${-boxWidth / 2}
         L ${valueScale(stats.q3)} ${boxWidth / 2}
         L ${valueScale(notchHigh)} ${boxWidth / 2}
         L ${valueScale(stats.median)} ${boxWidth / 2 - notchIndent}
         L ${valueScale(notchLow)} ${boxWidth / 2}
         L ${valueScale(stats.q1)} ${boxWidth / 2}
         Z`;

    const notchedBox = group.selectAll('.notched-box').data([stats]);
    notchedBox
      .enter()
      .append('path')
      .attr('class', 'notched-box')
      .merge(notchedBox as d3.Selection<SVGPathElement, BoxStats, SVGGElement, BoxGroup>)
      .attr('fill', color)
      .attr('fill-opacity', 0.6)
      .attr('stroke', color)
      .attr('stroke-width', 1.5)
      .transition()
      .duration(animationDuration)
      .attr('d', pathData);
  }

  private updateLine(
    group: d3.Selection<SVGGElement, BoxGroup, SVGGElement, unknown>,
    className: string,
    coords: { x1: number; x2: number; y1: number; y2: number },
    color: string,
    animationDuration: number,
    strokeWidth: number = 1.5
  ): void {
    const line = group.selectAll(`.${className}`).data([coords]);
    line
      .enter()
      .append('line')
      .attr('class', `${className} whisker`)
      .merge(line as d3.Selection<SVGLineElement, typeof coords, SVGGElement, BoxGroup>)
      .attr('stroke', color)
      .attr('stroke-width', strokeWidth)
      .transition()
      .duration(animationDuration)
      .attr('x1', (d) => d.x1)
      .attr('x2', (d) => d.x2)
      .attr('y1', (d) => d.y1)
      .attr('y2', (d) => d.y2);
  }

  private renderOutliers(
    categoryScale: d3.ScaleBand<string>,
    valueScale: d3.ScaleLinear<number, number>,
    margin: { top: number; right: number; bottom: number; left: number },
    isVertical: boolean,
    animationDuration: number
  ): void {
    const outliersGroup = this.svg
      .select<SVGGElement>('.outliers')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Flatten outliers with group info
    const outlierData = this.groups.flatMap((g) =>
      g.outliers.map((v) => ({
        group: g.name,
        value: v,
        color: g.color,
      }))
    );

    const outliers = outliersGroup
      .selectAll<SVGCircleElement, (typeof outlierData)[0]>('.outlier')
      .data(outlierData, (d) => `${d.group}-${d.value}`);

    outliers
      .enter()
      .append('circle')
      .attr('class', 'outlier')
      .attr('r', 4)
      .attr('cx', (d) =>
        isVertical
          ? (categoryScale(d.group) || 0) +
            categoryScale.bandwidth() / 2 +
            (Math.random() - 0.5) * 10
          : valueScale(d.value)
      )
      .attr('cy', (d) =>
        isVertical
          ? valueScale(d.value)
          : (categoryScale(d.group) || 0) +
            categoryScale.bandwidth() / 2 +
            (Math.random() - 0.5) * 10
      )
      .attr('fill', (d) => d.color)
      .attr('stroke', (d) => d.color)
      .attr('opacity', 0)
      .on('mouseover', (event, d) => {
        this.tooltip.innerHTML = `<div class="tooltip-title">Outlier</div><div class="tooltip-row"><span>Group:</span><span>${d.group}</span></div><div class="tooltip-row"><span>Value:</span><span>${d.value.toFixed(2)}</span></div>`;
        this.tooltip.classList.add('visible');
        this.tooltip.style.left = `${event.clientX + 15}px`;
        this.tooltip.style.top = `${event.clientY - 10}px`;
      })
      .on('mouseout', () => this.hideTooltip())
      .transition()
      .duration(animationDuration)
      .attr('opacity', 0.6);

    outliers
      .exit()
      .transition()
      .duration(animationDuration / 2)
      .attr('opacity', 0)
      .remove();
  }

  private showTooltip(event: MouseEvent, group: BoxGroup): void {
    const stats = group.stats;

    this.tooltip.innerHTML = `
      <div class="tooltip-title">${group.name}</div>
      <div class="tooltip-row"><span>n:</span><span>${stats.n}</span></div>
      <div class="tooltip-row"><span>Median:</span><span>${stats.median.toFixed(2)}</span></div>
      <div class="tooltip-row"><span>Mean:</span><span>${stats.mean.toFixed(2)}</span></div>
      <div class="tooltip-row"><span>Q1-Q3:</span><span>${stats.q1.toFixed(2)} - ${stats.q3.toFixed(2)}</span></div>
      <div class="tooltip-row"><span>IQR:</span><span>${stats.iqr.toFixed(2)}</span></div>
      <div class="tooltip-row"><span>Range:</span><span>${stats.min.toFixed(2)} - ${stats.max.toFixed(2)}</span></div>
      <div class="tooltip-row"><span>Outliers:</span><span>${group.outliers.length}</span></div>
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
        <div class="stat-row"><span class="stat-label">Median:</span><span class="stat-value">${stats.median.toFixed(2)}</span></div>
        <div class="stat-row"><span class="stat-label">IQR:</span><span class="stat-value">${stats.iqr.toFixed(2)}</span></div>
        <div class="stat-row"><span class="stat-label">Outliers:</span><span class="stat-value">${group.outliers.length}</span></div>
      `;

      this.statsContainer.appendChild(div);
    });
  }

  private renderLegend(): void {
    this.legendContainer.innerHTML = '';

    this.groups.forEach((group) => {
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `<div class="legend-color" style="background: ${group.color}"></div><span>${group.name}</span>`;
      this.legendContainer.appendChild(item);
    });
  }

  resize(): void {
    this.initSvg();
    this.render();
  }
}
