/**
 * Numeric Mode Component
 *
 * Provides flexible numeric data display modes for continuous values:
 * - Multiple scale options (linear, log, sqrt, quantile)
 * - Color mapping with customizable palettes
 * - Support for various chart types
 * - Statistical annotations
 * - Dynamic range adjustment
 */

import * as d3 from 'd3';

export interface NumericDataPoint {
  id: string;
  value: number;
  label?: string;
  group?: string;
  metadata?: Record<string, unknown>;
}

export type ScaleType = 'linear' | 'log' | 'sqrt' | 'quantile' | 'threshold';
export type DisplayMode = 'bar' | 'dot' | 'heatcell' | 'area' | 'text';
export type ColorPalette =
  | 'viridis'
  | 'plasma'
  | 'inferno'
  | 'magma'
  | 'blues'
  | 'reds'
  | 'greens'
  | 'diverging'
  | 'custom';

export interface NumericModeSettings {
  width: number;
  height: number;
  margin: { top: number; right: number; bottom: number; left: number };
  scaleType: ScaleType;
  displayMode: DisplayMode;
  colorPalette: ColorPalette;
  customColors?: string[];
  domainMin?: number;
  domainMax?: number;
  showAxis: boolean;
  showGridlines: boolean;
  showStats: boolean;
  showLabels: boolean;
  orientation: 'horizontal' | 'vertical';
  sortBy: 'value' | 'label' | 'none';
  sortOrder: 'asc' | 'desc';
  thresholds?: number[]; // For threshold scale
  nullColor: string;
  title?: string;
  onDataPointClick?: (point: NumericDataPoint) => void;
  onDataPointHover?: (point: NumericDataPoint | null) => void;
}

const DEFAULT_SETTINGS: NumericModeSettings = {
  width: 600,
  height: 300,
  margin: { top: 40, right: 80, bottom: 40, left: 80 },
  scaleType: 'linear',
  displayMode: 'bar',
  colorPalette: 'viridis',
  showAxis: true,
  showGridlines: true,
  showStats: true,
  showLabels: false,
  orientation: 'horizontal',
  sortBy: 'none',
  sortOrder: 'desc',
  nullColor: '#444',
};

/**
 * Color palette definitions
 */
const COLOR_PALETTES: Record<string, (t: number) => string> = {
  viridis: d3.interpolateViridis,
  plasma: d3.interpolatePlasma,
  inferno: d3.interpolateInferno,
  magma: d3.interpolateMagma,
  blues: d3.interpolateBlues,
  reds: d3.interpolateReds,
  greens: d3.interpolateGreens,
  diverging: d3.interpolateRdBu,
};

/**
 * Numeric Mode Visualization Component
 */
export class NumericMode {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private settings: NumericModeSettings;
  private data: NumericDataPoint[] = [];
  private colorScale:
    | d3.ScaleSequential<string>
    | d3.ScaleQuantize<string>
    | d3.ScaleThreshold<number, string>
    | null = null;
  private valueScale:
    | d3.ScaleLinear<number, number>
    | d3.ScaleLogarithmic<number, number>
    | d3.ScalePower<number, number>
    | null = null;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private stats: { min: number; max: number; mean: number; median: number; std: number } | null =
    null;

  constructor(containerId: string, settings?: Partial<NumericModeSettings>) {
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
      .attr('class', 'numeric-mode');

    // Create tooltip
    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'numeric-tooltip')
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
   * Load data
   */
  public loadData(data: NumericDataPoint[]): void {
    this.data = data.filter((d) => d.value !== null && !isNaN(d.value));
    this.calculateStats();
    this.setupScales();
  }

  /**
   * Calculate statistics
   */
  private calculateStats(): void {
    if (this.data.length === 0) {
      this.stats = null;
      return;
    }

    const values = this.data.map((d) => d.value).sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;
    const median =
      values.length % 2 === 0
        ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2
        : values[Math.floor(values.length / 2)];

    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(variance);

    this.stats = {
      min: d3.min(values) || 0,
      max: d3.max(values) || 0,
      mean,
      median,
      std,
    };
  }

  /**
   * Setup scales based on settings
   */
  private setupScales(): void {
    if (!this.stats) return;

    const { scaleType, colorPalette, customColors, domainMin, domainMax, thresholds } =
      this.settings;

    // Determine domain
    const min = domainMin ?? this.stats.min;
    const max = domainMax ?? this.stats.max;

    // Setup value scale
    switch (scaleType) {
      case 'log':
        this.valueScale = d3
          .scaleLog()
          .domain([Math.max(0.01, min), max])
          .clamp(true);
        break;
      case 'sqrt':
        this.valueScale = d3.scaleSqrt().domain([min, max]);
        break;
      default:
        this.valueScale = d3.scaleLinear().domain([min, max]);
    }

    // Setup color scale
    if (colorPalette === 'custom' && customColors && customColors.length > 0) {
      if (scaleType === 'threshold' && thresholds) {
        this.colorScale = d3
          .scaleThreshold<number, string>()
          .domain(thresholds)
          .range(customColors);
      } else {
        const quantize = d3.scaleQuantize<string>().domain([min, max]).range(customColors);
        this.colorScale = quantize;
      }
    } else {
      const interpolator = COLOR_PALETTES[colorPalette] || COLOR_PALETTES.viridis;
      this.colorScale = d3.scaleSequential(interpolator).domain([min, max]);
    }
  }

  /**
   * Update settings
   */
  public updateSettings(newSettings: Partial<NumericModeSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.setupScales();
    this.render();
  }

  /**
   * Main render function
   */
  public render(): void {
    this.svg.selectAll('*').remove();

    if (this.data.length === 0) {
      this.renderEmptyState();
      return;
    }

    const { width, height, margin, displayMode, title, showStats } = this.settings;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Create main group
    const mainGroup = this.svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Sort data if needed
    const sortedData = this.getSortedData();

    // Render based on display mode
    switch (displayMode) {
      case 'bar':
        this.renderBars(mainGroup, sortedData, plotWidth, plotHeight);
        break;
      case 'dot':
        this.renderDots(mainGroup, sortedData, plotWidth, plotHeight);
        break;
      case 'heatcell':
        this.renderHeatcells(mainGroup, sortedData, plotWidth, plotHeight);
        break;
      case 'area':
        this.renderArea(mainGroup, sortedData, plotWidth, plotHeight);
        break;
      case 'text':
        this.renderText(mainGroup, sortedData, plotWidth, plotHeight);
        break;
    }

    // Title
    if (title) {
      this.svg
        .append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('fill', '#e0e0e0')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .text(title);
    }

    // Stats panel
    if (showStats && this.stats) {
      this.renderStatsPanel(mainGroup, plotWidth, plotHeight);
    }

    // Color legend
    this.renderColorLegend(plotWidth, plotHeight);
  }

  /**
   * Get sorted data
   */
  private getSortedData(): NumericDataPoint[] {
    const { sortBy, sortOrder } = this.settings;

    if (sortBy === 'none') return [...this.data];

    return [...this.data].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'value') {
        comparison = a.value - b.value;
      } else if (sortBy === 'label') {
        comparison = (a.label || a.id).localeCompare(b.label || b.id);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Render bar chart
   */
  private renderBars(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: NumericDataPoint[],
    plotWidth: number,
    plotHeight: number
  ): void {
    if (!this.valueScale || !this.colorScale) return;

    const { orientation, showAxis, showGridlines, showLabels } = this.settings;
    const isHorizontal = orientation === 'horizontal';

    // Setup scales for positioning
    const bandScale = d3
      .scaleBand()
      .domain(data.map((d) => d.id))
      .range(isHorizontal ? [0, plotWidth] : [plotHeight, 0])
      .padding(0.2);

    const valueRange = isHorizontal ? [plotHeight, 0] : [0, plotWidth];
    this.valueScale.range(valueRange);

    // Gridlines
    if (showGridlines) {
      const gridValues = this.valueScale.ticks(5);
      const gridGroup = group.append('g').attr('class', 'gridlines');

      gridValues.forEach((v) => {
        const pos = this.valueScale!(v);
        if (isHorizontal) {
          gridGroup
            .append('line')
            .attr('x1', 0)
            .attr('x2', plotWidth)
            .attr('y1', pos)
            .attr('y2', pos)
            .attr('stroke', '#333')
            .attr('stroke-dasharray', '2,2');
        } else {
          gridGroup
            .append('line')
            .attr('x1', pos)
            .attr('x2', pos)
            .attr('y1', 0)
            .attr('y2', plotHeight)
            .attr('stroke', '#333')
            .attr('stroke-dasharray', '2,2');
        }
      });
    }

    // Bars
    const bars = group
      .selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => (isHorizontal ? bandScale(d.id)! : 0))
      .attr('y', (d) => (isHorizontal ? this.valueScale!(d.value) : bandScale(d.id)!))
      .attr('width', (d) => (isHorizontal ? bandScale.bandwidth() : this.valueScale!(d.value)))
      .attr('height', (d) =>
        isHorizontal ? plotHeight - this.valueScale!(d.value) : bandScale.bandwidth()
      )
      .attr('fill', (d) => this.getColor(d.value))
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip())
      .on('click', (_, d) => this.settings.onDataPointClick?.(d));

    // Hover effect
    bars
      .on('mouseenter', function () {
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('opacity', 1);
      });

    // Labels
    if (showLabels) {
      group
        .selectAll('.bar-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', (d) =>
          isHorizontal
            ? bandScale(d.id)! + bandScale.bandwidth() / 2
            : this.valueScale!(d.value) + 5
        )
        .attr('y', (d) =>
          isHorizontal
            ? this.valueScale!(d.value) - 5
            : bandScale(d.id)! + bandScale.bandwidth() / 2
        )
        .attr('text-anchor', isHorizontal ? 'middle' : 'start')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#e0e0e0')
        .attr('font-size', '9px')
        .text((d) => this.formatValue(d.value));
    }

    // Axes
    if (showAxis) {
      // Value axis
      const valueAxis = isHorizontal
        ? d3.axisLeft(this.valueScale)
        : d3.axisBottom(this.valueScale);
      group
        .append('g')
        .attr('class', 'value-axis')
        .attr('transform', isHorizontal ? '' : `translate(0, ${plotHeight})`)
        .call(valueAxis.ticks(5))
        .selectAll('text')
        .attr('fill', '#888')
        .attr('font-size', '10px');

      group.selectAll('.value-axis .domain, .value-axis .tick line').attr('stroke', '#444');

      // Band axis (labels)
      if (data.length <= 20) {
        const bandAxis = isHorizontal ? d3.axisBottom(bandScale) : d3.axisLeft(bandScale);
        group
          .append('g')
          .attr('class', 'band-axis')
          .attr('transform', isHorizontal ? `translate(0, ${plotHeight})` : '')
          .call(
            bandAxis.tickFormat((d) => {
              const point = data.find((p) => p.id === d);
              return point?.label || d;
            })
          )
          .selectAll('text')
          .attr('fill', '#888')
          .attr('font-size', '9px')
          .attr('text-anchor', isHorizontal ? 'end' : 'middle')
          .attr('transform', isHorizontal ? 'rotate(-45)' : '');

        group.selectAll('.band-axis .domain, .band-axis .tick line').attr('stroke', '#444');
      }
    }
  }

  /**
   * Render dot plot
   */
  private renderDots(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: NumericDataPoint[],
    plotWidth: number,
    plotHeight: number
  ): void {
    if (!this.valueScale || !this.colorScale) return;

    const { showAxis, showGridlines } = this.settings;

    // X scale for dots (index-based)
    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([20, plotWidth - 20]);

    this.valueScale.range([plotHeight - 20, 20]);

    // Gridlines
    if (showGridlines) {
      const gridValues = this.valueScale.ticks(5);
      gridValues.forEach((v) => {
        group
          .append('line')
          .attr('x1', 0)
          .attr('x2', plotWidth)
          .attr('y1', this.valueScale!(v))
          .attr('y2', this.valueScale!(v))
          .attr('stroke', '#333')
          .attr('stroke-dasharray', '2,2');
      });
    }

    // Dots
    group
      .selectAll('.dot')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', (_, i) => xScale(i))
      .attr('cy', (d) => this.valueScale!(d.value))
      .attr('r', 6)
      .attr('fill', (d) => this.getColor(d.value))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip())
      .on('click', (_, d) => this.settings.onDataPointClick?.(d));

    // Value axis
    if (showAxis) {
      const yAxis = d3.axisLeft(this.valueScale).ticks(5);
      group
        .append('g')
        .attr('class', 'y-axis')
        .call(yAxis)
        .selectAll('text')
        .attr('fill', '#888')
        .attr('font-size', '10px');

      group.selectAll('.y-axis .domain, .y-axis .tick line').attr('stroke', '#444');
    }
  }

  /**
   * Render heatmap cells
   */
  private renderHeatcells(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: NumericDataPoint[],
    plotWidth: number,
    plotHeight: number
  ): void {
    if (!this.colorScale) return;

    // Grid layout
    const cols = Math.ceil(Math.sqrt(data.length * (plotWidth / plotHeight)));
    const rows = Math.ceil(data.length / cols);
    const cellWidth = plotWidth / cols;
    const cellHeight = plotHeight / rows;

    group
      .selectAll('.heatcell')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'heatcell')
      .attr('x', (_, i) => (i % cols) * cellWidth)
      .attr('y', (_, i) => Math.floor(i / cols) * cellHeight)
      .attr('width', cellWidth - 1)
      .attr('height', cellHeight - 1)
      .attr('fill', (d) => this.getColor(d.value))
      .attr('rx', 2)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => this.showTooltip(event, d))
      .on('mouseout', () => this.hideTooltip())
      .on('click', (_, d) => this.settings.onDataPointClick?.(d));

    // Cell labels if cells are large enough
    if (cellWidth > 40 && cellHeight > 25) {
      group
        .selectAll('.cell-label')
        .data(data)
        .enter()
        .append('text')
        .attr('class', 'cell-label')
        .attr('x', (_, i) => (i % cols) * cellWidth + cellWidth / 2)
        .attr('y', (_, i) => Math.floor(i / cols) * cellHeight + cellHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .attr('fill', '#fff')
        .attr('font-size', '10px')
        .text((d) => this.formatValue(d.value));
    }
  }

  /**
   * Render area chart
   */
  private renderArea(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: NumericDataPoint[],
    plotWidth: number,
    plotHeight: number
  ): void {
    if (!this.valueScale) return;

    const xScale = d3
      .scaleLinear()
      .domain([0, data.length - 1])
      .range([0, plotWidth]);

    this.valueScale.range([plotHeight, 0]);

    // Area
    const area = d3
      .area<NumericDataPoint>()
      .x((_, i) => xScale(i))
      .y0(plotHeight)
      .y1((d) => this.valueScale!(d.value))
      .curve(d3.curveMonotoneX);

    // Gradient
    const gradient = this.svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    gradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3498db')
      .attr('stop-opacity', 0.8);
    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#3498db')
      .attr('stop-opacity', 0.1);

    group
      .append('path')
      .datum(data)
      .attr('class', 'area')
      .attr('d', area)
      .attr('fill', 'url(#area-gradient)');

    // Line
    const line = d3
      .line<NumericDataPoint>()
      .x((_, i) => xScale(i))
      .y((d) => this.valueScale!(d.value))
      .curve(d3.curveMonotoneX);

    group
      .append('path')
      .datum(data)
      .attr('class', 'line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', '#3498db')
      .attr('stroke-width', 2);

    // Y-axis
    const yAxis = d3.axisLeft(this.valueScale).ticks(5);
    group.append('g').call(yAxis).selectAll('text').attr('fill', '#888').attr('font-size', '10px');
  }

  /**
   * Render text display
   */
  private renderText(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: NumericDataPoint[],
    plotWidth: number,
    plotHeight: number
  ): void {
    const fontSize = Math.min(14, plotHeight / (data.length * 1.5));
    const lineHeight = fontSize * 1.8;
    const startY = Math.max(0, (plotHeight - data.length * lineHeight) / 2);

    data.forEach((d, i) => {
      const y = startY + i * lineHeight;
      if (y > plotHeight) return;

      // Label
      group
        .append('text')
        .attr('x', 0)
        .attr('y', y + fontSize)
        .attr('fill', '#888')
        .attr('font-size', `${fontSize}px`)
        .text(d.label || d.id);

      // Value
      group
        .append('text')
        .attr('x', plotWidth / 2)
        .attr('y', y + fontSize)
        .attr('fill', this.getColor(d.value))
        .attr('font-size', `${fontSize}px`)
        .attr('font-weight', 'bold')
        .text(this.formatValue(d.value));

      // Mini bar
      const barWidth = (d.value / (this.stats?.max || 1)) * (plotWidth / 3);
      group
        .append('rect')
        .attr('x', (plotWidth * 2) / 3)
        .attr('y', y)
        .attr('width', barWidth)
        .attr('height', fontSize)
        .attr('fill', this.getColor(d.value))
        .attr('rx', 2);
    });
  }

  /**
   * Render stats panel
   */
  private renderStatsPanel(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    plotWidth: number,
    plotHeight: number
  ): void {
    if (!this.stats) return;

    const statsGroup = group
      .append('g')
      .attr('class', 'stats-panel')
      .attr('transform', `translate(${plotWidth + 10}, 0)`);

    const stats = [
      { label: 'n', value: this.data.length.toString() },
      { label: 'Min', value: this.formatValue(this.stats.min) },
      { label: 'Max', value: this.formatValue(this.stats.max) },
      { label: 'Mean', value: this.formatValue(this.stats.mean) },
      { label: 'Median', value: this.formatValue(this.stats.median) },
      { label: 'Std', value: this.formatValue(this.stats.std) },
    ];

    stats.forEach((stat, i) => {
      statsGroup
        .append('text')
        .attr('x', 0)
        .attr('y', i * 18)
        .attr('fill', '#666')
        .attr('font-size', '10px')
        .text(`${stat.label}:`);

      statsGroup
        .append('text')
        .attr('x', 50)
        .attr('y', i * 18)
        .attr('fill', '#e0e0e0')
        .attr('font-size', '10px')
        .text(stat.value);
    });
  }

  /**
   * Render color legend
   */
  private renderColorLegend(plotWidth: number, plotHeight: number): void {
    if (!this.stats || !this.colorScale) return;

    const { margin } = this.settings;
    const legendWidth = 20;
    const legendHeight = Math.min(150, plotHeight);

    const legendGroup = this.svg
      .append('g')
      .attr('class', 'color-legend')
      .attr(
        'transform',
        `translate(${margin.left + plotWidth + 30}, ${margin.top + (plotHeight - legendHeight) / 2})`
      );

    // Gradient bar
    const gradientId = 'legend-gradient';
    const gradient = this.svg
      .append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%');

    const numStops = 10;
    for (let i = 0; i <= numStops; i++) {
      const t = i / numStops;
      const value = this.stats.min + t * (this.stats.max - this.stats.min);
      gradient
        .append('stop')
        .attr('offset', `${t * 100}%`)
        .attr('stop-color', this.getColor(value));
    }

    legendGroup
      .append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .attr('fill', `url(#${gradientId})`);

    // Legend axis
    const legendScale = d3
      .scaleLinear()
      .domain([this.stats.min, this.stats.max])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale).ticks(5);

    legendGroup
      .append('g')
      .attr('class', 'legend-axis')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(legendAxis)
      .selectAll('text')
      .attr('fill', '#888')
      .attr('font-size', '9px');

    legendGroup.selectAll('.legend-axis .domain, .legend-axis .tick line').attr('stroke', '#444');
  }

  /**
   * Get color for value
   */
  private getColor(value: number): string {
    if (value === null || isNaN(value)) return this.settings.nullColor;
    if (!this.colorScale) return '#3498db';

    // Handle different color scale types
    if ('interpolator' in this.colorScale) {
      return this.colorScale(value);
    }
    return (this.colorScale as d3.ScaleQuantize<string>)(value);
  }

  /**
   * Format value for display
   */
  private formatValue(value: number): string {
    if (Math.abs(value) >= 1e6) return value.toExponential(2);
    if (Math.abs(value) >= 1000)
      return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
    if (Math.abs(value) >= 1) return value.toFixed(2);
    if (Math.abs(value) >= 0.01) return value.toFixed(3);
    return value.toExponential(2);
  }

  /**
   * Render empty state
   */
  private renderEmptyState(): void {
    const { width, height } = this.settings;

    this.svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '14px')
      .text('No data available');
  }

  /**
   * Show tooltip
   */
  private showTooltip(event: MouseEvent, point: NumericDataPoint): void {
    this.tooltip
      .style('display', 'block')
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY + 10}px`).html(`
        <div style="font-weight: bold; margin-bottom: 4px;">${point.label || point.id}</div>
        <div><strong>Value:</strong> ${this.formatValue(point.value)}</div>
        ${point.group ? `<div><strong>Group:</strong> ${point.group}</div>` : ''}
      `);

    this.settings.onDataPointHover?.(point);
  }

  /**
   * Hide tooltip
   */
  private hideTooltip(): void {
    this.tooltip.style('display', 'none');
    this.settings.onDataPointHover?.(null);
  }

  /**
   * Get statistics
   */
  public getStats(): typeof this.stats {
    return this.stats;
  }

  /**
   * Get current data
   */
  public getData(): NumericDataPoint[] {
    return this.data;
  }

  /**
   * Export as PNG
   */
  public exportPNG(filename: string = 'numeric_chart.png'): void {
    const svgElement = this.svg.node();
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
  }
}

/**
 * CSS styles for Numeric Mode
 */
export const numericModeStyles = `
  .numeric-mode {
    background: #1a1a2e;
    border-radius: 8px;
  }
  
  .numeric-mode .bar:hover {
    opacity: 0.8;
  }
  
  .numeric-mode .dot:hover {
    r: 8;
  }
  
  .numeric-mode .heatcell:hover {
    stroke: #fff;
    stroke-width: 2;
  }
`;

/**
 * Generate sample numeric data for demo
 */
export function generateSampleNumericData(numPoints: number = 50): NumericDataPoint[] {
  const data: NumericDataPoint[] = [];
  const groups = ['Group A', 'Group B', 'Group C'];

  for (let i = 0; i < numPoints; i++) {
    const group = groups[i % groups.length];
    const baseValue = group === 'Group A' ? 50 : group === 'Group B' ? 75 : 100;

    data.push({
      id: `sample_${i + 1}`,
      label: `Sample ${i + 1}`,
      value: baseValue + (Math.random() - 0.5) * 50,
      group,
      metadata: {
        batch: Math.floor(i / 10) + 1,
        qc_passed: Math.random() > 0.1,
      },
    });
  }

  return data;
}
