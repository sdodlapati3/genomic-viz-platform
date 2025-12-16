/**
 * Bar Chart Component
 * Interactive bar chart with grouped/stacked/simple variants
 */
import * as d3 from 'd3';
import type {
  BarDataPoint,
  BarChartConfig,
  GroupedBarData,
  StackedBarData,
  SortType,
} from '../types';
import { colorSchemes } from '../data/datasets';

export class BarChart {
  private container: HTMLElement;
  private svg!: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private config: BarChartConfig;
  private data: BarDataPoint[] = [];
  private groups: string[] = [];
  private tooltip: HTMLElement;
  private legendContainer: HTMLElement;
  private statsContainer: HTMLElement;
  private disabledGroups: Set<string> = new Set();
  private sortType: SortType = 'value-desc';

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    this.container = container;

    this.tooltip = document.getElementById('tooltip') || this.createTooltip();
    this.legendContainer = document.getElementById('legend') || document.createElement('div');
    this.statsContainer = document.getElementById('stats') || document.createElement('div');

    this.config = {
      width: 800,
      height: 500,
      margin: { top: 40, right: 30, bottom: 80, left: 70 },
      chartType: 'grouped',
      orientation: 'vertical',
      colorScheme: colorSchemes.categorical,
      showGrid: true,
      showValues: false,
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
    this.svg.append('g').attr('class', 'x-axis');
    this.svg.append('g').attr('class', 'y-axis');
    this.svg.append('g').attr('class', 'bars');
    this.svg.append('text').attr('class', 'chart-title');
    this.svg.append('text').attr('class', 'x-axis-label axis-label');
    this.svg.append('text').attr('class', 'y-axis-label axis-label');
  }

  setData(data: BarDataPoint[], groups?: string[]): void {
    this.data = data;
    this.groups = groups || [...new Set(data.map((d) => d.group).filter(Boolean) as string[])];
    this.disabledGroups.clear();
    this.render();
    this.renderLegend();
    this.renderStats();
  }

  setChartType(type: 'simple' | 'grouped' | 'stacked'): void {
    this.config.chartType = type;
    this.render();
  }

  setOrientation(orientation: 'vertical' | 'horizontal'): void {
    this.config.orientation = orientation;
    this.render();
  }

  setSortType(sortType: SortType): void {
    this.sortType = sortType;
    this.render();
  }

  private getFilteredData(): BarDataPoint[] {
    if (this.disabledGroups.size === 0) return this.data;
    return this.data.filter((d) => !d.group || !this.disabledGroups.has(d.group));
  }

  private getSortedCategories(): string[] {
    const categories = [...new Set(this.data.map((d) => d.category))];
    const filteredData = this.getFilteredData();

    switch (this.sortType) {
      case 'value-desc':
        return categories.sort((a, b) => {
          const sumA = filteredData
            .filter((d) => d.category === a)
            .reduce((s, d) => s + d.value, 0);
          const sumB = filteredData
            .filter((d) => d.category === b)
            .reduce((s, d) => s + d.value, 0);
          return sumB - sumA;
        });
      case 'value-asc':
        return categories.sort((a, b) => {
          const sumA = filteredData
            .filter((d) => d.category === a)
            .reduce((s, d) => s + d.value, 0);
          const sumB = filteredData
            .filter((d) => d.category === b)
            .reduce((s, d) => s + d.value, 0);
          return sumA - sumB;
        });
      case 'alpha':
        return categories.sort();
      case 'original':
      default:
        return categories;
    }
  }

  private render(): void {
    const { width, height, margin, chartType, orientation } = this.config;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const filteredData = this.getFilteredData();
    const categories = this.getSortedCategories();
    const activeGroups = this.groups.filter((g) => !this.disabledGroups.has(g));

    // Choose render method based on chart type and data structure
    if (chartType === 'simple' || activeGroups.length === 0) {
      this.renderSimple(filteredData, categories, innerWidth, innerHeight, margin);
    } else if (chartType === 'stacked') {
      this.renderStacked(filteredData, categories, activeGroups, innerWidth, innerHeight, margin);
    } else {
      this.renderGrouped(filteredData, categories, activeGroups, innerWidth, innerHeight, margin);
    }
  }

  private renderSimple(
    data: BarDataPoint[],
    categories: string[],
    innerWidth: number,
    innerHeight: number,
    margin: { top: number; right: number; bottom: number; left: number }
  ): void {
    const { orientation, animationDuration } = this.config;
    const isVertical = orientation === 'vertical';

    // Aggregate data by category
    const aggregated = categories.map((cat) => ({
      category: cat,
      value: data.filter((d) => d.category === cat).reduce((s, d) => s + d.value, 0),
    }));

    // Create scales
    const categoryScale = d3
      .scaleBand()
      .domain(categories)
      .range(isVertical ? [0, innerWidth] : [0, innerHeight])
      .padding(0.3);

    const maxValue = d3.max(aggregated, (d) => d.value) || 0;
    const valueScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range(isVertical ? [innerHeight, 0] : [0, innerWidth]);

    const colorScale = d3.scaleOrdinal<string>().domain(categories).range(this.config.colorScheme);

    // Render axes
    this.renderAxes(categoryScale, valueScale, margin, innerWidth, innerHeight, isVertical);

    // Render bars
    const barsGroup = this.svg
      .select<SVGGElement>('.bars')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    const bars = barsGroup
      .selectAll<SVGRectElement, (typeof aggregated)[0]>('.bar')
      .data(aggregated, (d) => d.category);

    // Enter
    const barsEnter = bars
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('fill', (d) => colorScale(d.category))
      .attr(isVertical ? 'x' : 'y', (d) => categoryScale(d.category) || 0)
      .attr(isVertical ? 'width' : 'height', categoryScale.bandwidth())
      .attr(isVertical ? 'y' : 'x', isVertical ? innerHeight : 0)
      .attr(isVertical ? 'height' : 'width', 0);

    // Update + Enter
    barsEnter
      .merge(bars)
      .on('mouseover', (event, d) =>
        this.showTooltip(event, d.category, [{ group: 'Total', value: d.value }])
      )
      .on('mouseout', () => this.hideTooltip())
      .transition()
      .duration(animationDuration)
      .attr(isVertical ? 'x' : 'y', (d) => categoryScale(d.category) || 0)
      .attr(isVertical ? 'width' : 'height', categoryScale.bandwidth())
      .attr(isVertical ? 'y' : 'x', (d) => (isVertical ? valueScale(d.value) : 0))
      .attr(isVertical ? 'height' : 'width', (d) =>
        isVertical ? innerHeight - valueScale(d.value) : valueScale(d.value)
      );

    // Exit
    bars
      .exit()
      .transition()
      .duration(animationDuration / 2)
      .attr(isVertical ? 'height' : 'width', 0)
      .remove();

    this.renderGridLines(valueScale, margin, innerWidth, innerHeight, isVertical);
  }

  private renderGrouped(
    data: BarDataPoint[],
    categories: string[],
    groups: string[],
    innerWidth: number,
    innerHeight: number,
    margin: { top: number; right: number; bottom: number; left: number }
  ): void {
    const { orientation, animationDuration } = this.config;
    const isVertical = orientation === 'vertical';

    // Prepare grouped data
    const groupedData: GroupedBarData[] = categories.map((cat) => ({
      category: cat,
      values: groups.map((g) => ({
        group: g,
        value: data.find((d) => d.category === cat && d.group === g)?.value || 0,
      })),
    }));

    // Create scales
    const categoryScale = d3
      .scaleBand()
      .domain(categories)
      .range(isVertical ? [0, innerWidth] : [0, innerHeight])
      .padding(0.2);

    const groupScale = d3
      .scaleBand()
      .domain(groups)
      .range([0, categoryScale.bandwidth()])
      .padding(0.1);

    const maxValue = d3.max(data, (d) => d.value) || 0;
    const valueScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range(isVertical ? [innerHeight, 0] : [0, innerWidth]);

    const colorScale = d3.scaleOrdinal<string>().domain(groups).range(this.config.colorScheme);

    // Render axes
    this.renderAxes(categoryScale, valueScale, margin, innerWidth, innerHeight, isVertical);

    // Render bars
    const barsGroup = this.svg
      .select<SVGGElement>('.bars')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Category groups
    const categoryGroups = barsGroup
      .selectAll<SVGGElement, GroupedBarData>('.category-group')
      .data(groupedData, (d) => d.category);

    const categoryGroupsEnter = categoryGroups.enter().append('g').attr('class', 'category-group');

    const categoryGroupsMerged = categoryGroupsEnter
      .merge(categoryGroups)
      .attr('transform', (d) =>
        isVertical
          ? `translate(${categoryScale(d.category)}, 0)`
          : `translate(0, ${categoryScale(d.category)})`
      );

    categoryGroups.exit().remove();

    // Bars within each category
    categoryGroupsMerged.each((catData, i, nodes) => {
      const group = d3.select(nodes[i]);

      const bars = group
        .selectAll<SVGRectElement, (typeof catData.values)[0]>('.bar')
        .data(catData.values, (d) => d.group);

      const barsEnter = bars
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('fill', (d) => colorScale(d.group))
        .attr(isVertical ? 'x' : 'y', (d) => groupScale(d.group) || 0)
        .attr(isVertical ? 'width' : 'height', groupScale.bandwidth())
        .attr(isVertical ? 'y' : 'x', isVertical ? innerHeight : 0)
        .attr(isVertical ? 'height' : 'width', 0);

      barsEnter
        .merge(bars)
        .on('mouseover', (event, d) => this.showTooltip(event, catData.category, [d]))
        .on('mouseout', () => this.hideTooltip())
        .transition()
        .duration(animationDuration)
        .attr(isVertical ? 'x' : 'y', (d) => groupScale(d.group) || 0)
        .attr(isVertical ? 'width' : 'height', groupScale.bandwidth())
        .attr(isVertical ? 'y' : 'x', (d) => (isVertical ? valueScale(d.value) : 0))
        .attr(isVertical ? 'height' : 'width', (d) =>
          isVertical ? innerHeight - valueScale(d.value) : valueScale(d.value)
        );

      bars
        .exit()
        .transition()
        .duration(animationDuration / 2)
        .attr(isVertical ? 'height' : 'width', 0)
        .remove();
    });

    this.renderGridLines(valueScale, margin, innerWidth, innerHeight, isVertical);
  }

  private renderStacked(
    data: BarDataPoint[],
    categories: string[],
    groups: string[],
    innerWidth: number,
    innerHeight: number,
    margin: { top: number; right: number; bottom: number; left: number }
  ): void {
    const { orientation, animationDuration } = this.config;
    const isVertical = orientation === 'vertical';

    // Prepare stacked data
    const stackedData: StackedBarData[] = categories.map((cat) => {
      let cumulative = 0;
      const values = groups.map((g) => {
        const value = data.find((d) => d.category === cat && d.group === g)?.value || 0;
        const start = cumulative;
        cumulative += value;
        return { group: g, value, start, end: cumulative };
      });
      return { category: cat, values, total: cumulative };
    });

    // Create scales
    const categoryScale = d3
      .scaleBand()
      .domain(categories)
      .range(isVertical ? [0, innerWidth] : [0, innerHeight])
      .padding(0.3);

    const maxValue = d3.max(stackedData, (d) => d.total) || 0;
    const valueScale = d3
      .scaleLinear()
      .domain([0, maxValue * 1.1])
      .range(isVertical ? [innerHeight, 0] : [0, innerWidth]);

    const colorScale = d3.scaleOrdinal<string>().domain(groups).range(this.config.colorScheme);

    // Render axes
    this.renderAxes(categoryScale, valueScale, margin, innerWidth, innerHeight, isVertical);

    // Render bars
    const barsGroup = this.svg
      .select<SVGGElement>('.bars')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Category groups
    const categoryGroups = barsGroup
      .selectAll<SVGGElement, StackedBarData>('.category-group')
      .data(stackedData, (d) => d.category);

    const categoryGroupsEnter = categoryGroups.enter().append('g').attr('class', 'category-group');

    const categoryGroupsMerged = categoryGroupsEnter
      .merge(categoryGroups)
      .attr('transform', (d) =>
        isVertical
          ? `translate(${categoryScale(d.category)}, 0)`
          : `translate(0, ${categoryScale(d.category)})`
      );

    categoryGroups.exit().remove();

    // Stacked bars within each category
    categoryGroupsMerged.each((catData, i, nodes) => {
      const group = d3.select(nodes[i]);

      const bars = group
        .selectAll<SVGRectElement, (typeof catData.values)[0]>('.bar')
        .data(catData.values, (d) => d.group);

      const barsEnter = bars
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('fill', (d) => colorScale(d.group))
        .attr(isVertical ? 'x' : 'y', 0)
        .attr(isVertical ? 'width' : 'height', categoryScale.bandwidth())
        .attr(isVertical ? 'y' : 'x', isVertical ? innerHeight : 0)
        .attr(isVertical ? 'height' : 'width', 0);

      barsEnter
        .merge(bars)
        .on('mouseover', (event, d) => this.showTooltip(event, catData.category, catData.values))
        .on('mouseout', () => this.hideTooltip())
        .transition()
        .duration(animationDuration)
        .attr(isVertical ? 'x' : 'y', 0)
        .attr(isVertical ? 'width' : 'height', categoryScale.bandwidth())
        .attr(isVertical ? 'y' : 'x', (d) =>
          isVertical ? valueScale(d.end!) : valueScale(d.start!)
        )
        .attr(isVertical ? 'height' : 'width', (d) =>
          isVertical
            ? valueScale(d.start!) - valueScale(d.end!)
            : valueScale(d.end!) - valueScale(d.start!)
        );

      bars
        .exit()
        .transition()
        .duration(animationDuration / 2)
        .attr(isVertical ? 'height' : 'width', 0)
        .remove();
    });

    this.renderGridLines(valueScale, margin, innerWidth, innerHeight, isVertical);
  }

  private renderAxes(
    categoryScale: d3.ScaleBand<string>,
    valueScale: d3.ScaleLinear<number, number>,
    margin: { top: number; right: number; bottom: number; left: number },
    innerWidth: number,
    innerHeight: number,
    isVertical: boolean
  ): void {
    const xAxis = isVertical ? d3.axisBottom(categoryScale) : d3.axisBottom(valueScale).ticks(6);

    const yAxis = isVertical ? d3.axisLeft(valueScale).ticks(6) : d3.axisLeft(categoryScale);

    this.svg
      .select<SVGGElement>('.x-axis')
      .attr('transform', `translate(${margin.left}, ${margin.top + innerHeight})`)
      .transition()
      .duration(this.config.animationDuration)
      .call(xAxis)
      .selectAll('text')
      .attr('transform', isVertical ? 'rotate(-45)' : null)
      .style('text-anchor', isVertical ? 'end' : 'middle');

    this.svg
      .select<SVGGElement>('.y-axis')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .transition()
      .duration(this.config.animationDuration)
      .call(yAxis);

    // Axis labels
    this.svg
      .select('.x-axis-label')
      .attr('x', margin.left + innerWidth / 2)
      .attr('y', this.config.height - 10)
      .attr('text-anchor', 'middle')
      .text(isVertical ? 'Category' : 'Value');

    this.svg
      .select('.y-axis-label')
      .attr('transform', `rotate(-90)`)
      .attr('x', -(margin.top + innerHeight / 2))
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .text(isVertical ? 'Value' : 'Category');
  }

  private renderGridLines(
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
          .ticks(6)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      : d3
          .axisBottom(valueScale)
          .ticks(6)
          .tickSize(-innerHeight)
          .tickFormat(() => '');

    gridGroup.call(gridAxis);
    gridGroup.select('.domain').remove();
  }

  private showTooltip(
    event: MouseEvent,
    category: string,
    values: { group: string; value: number }[]
  ): void {
    const total = values.reduce((s, v) => s + v.value, 0);

    let html = `<div class="tooltip-title">${category}</div>`;
    values.forEach((v) => {
      html += `<div class="tooltip-row"><span>${v.group}:</span><span>${v.value.toLocaleString()}</span></div>`;
    });
    if (values.length > 1) {
      html += `<div class="tooltip-row" style="border-top: 1px solid #444; margin-top: 4px; padding-top: 4px;"><span><strong>Total:</strong></span><span><strong>${total.toLocaleString()}</strong></span></div>`;
    }

    this.tooltip.innerHTML = html;
    this.tooltip.classList.add('visible');
    this.tooltip.style.left = `${event.clientX + 15}px`;
    this.tooltip.style.top = `${event.clientY - 10}px`;
  }

  private hideTooltip(): void {
    this.tooltip.classList.remove('visible');
  }

  private renderLegend(): void {
    this.legendContainer.innerHTML = '';

    const colorScale = d3.scaleOrdinal<string>().domain(this.groups).range(this.config.colorScheme);

    if (this.groups.length === 0) {
      // Simple chart - show categories
      const categories = [...new Set(this.data.map((d) => d.category))].slice(0, 8);
      const catColorScale = d3
        .scaleOrdinal<string>()
        .domain(categories)
        .range(this.config.colorScheme);

      categories.forEach((cat) => {
        const item = document.createElement('div');
        item.className = 'legend-item';
        item.innerHTML = `<div class="legend-color" style="background: ${catColorScale(cat)}"></div><span>${cat}</span>`;
        this.legendContainer.appendChild(item);
      });
    } else {
      // Grouped/stacked - show groups
      this.groups.forEach((group) => {
        const item = document.createElement('div');
        item.className = `legend-item ${this.disabledGroups.has(group) ? 'disabled' : ''}`;
        item.innerHTML = `<div class="legend-color" style="background: ${colorScale(group)}"></div><span>${group}</span>`;
        item.addEventListener('click', () => this.toggleGroup(group));
        this.legendContainer.appendChild(item);
      });
    }
  }

  private toggleGroup(group: string): void {
    if (this.disabledGroups.has(group)) {
      this.disabledGroups.delete(group);
    } else {
      // Don't allow disabling all groups
      if (this.disabledGroups.size < this.groups.length - 1) {
        this.disabledGroups.add(group);
      }
    }
    this.render();
    this.renderLegend();
    this.renderStats();
  }

  private renderStats(): void {
    const filteredData = this.getFilteredData();
    const total = filteredData.reduce((s, d) => s + d.value, 0);
    const categories = [...new Set(filteredData.map((d) => d.category))];
    const max = d3.max(filteredData, (d) => d.value) || 0;
    const min = d3.min(filteredData, (d) => d.value) || 0;
    const avg = total / filteredData.length;

    this.statsContainer.innerHTML = `
      <div class="stat-item"><span class="stat-label">Categories:</span><span class="stat-value">${categories.length}</span></div>
      <div class="stat-item"><span class="stat-label">Total:</span><span class="stat-value">${total.toLocaleString()}</span></div>
      <div class="stat-item"><span class="stat-label">Max:</span><span class="stat-value">${max.toLocaleString()}</span></div>
      <div class="stat-item"><span class="stat-label">Min:</span><span class="stat-value">${min.toLocaleString()}</span></div>
      <div class="stat-item"><span class="stat-label">Average:</span><span class="stat-value">${avg.toFixed(1)}</span></div>
    `;
  }

  resize(): void {
    this.initSvg();
    this.render();
  }
}
