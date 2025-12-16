/**
 * Regression Plot Component
 *
 * Visualizes regression analysis with:
 * - Scatter plot of data points
 * - Fitted regression line
 * - Confidence interval bands
 * - Residual plot option
 */

import * as d3 from 'd3';
import type { DataPoint, RegressionResult, RegressionSettings, RegressionType } from '../types';

const DEFAULT_SETTINGS: RegressionSettings = {
  width: 700,
  height: 500,
  margin: { top: 40, right: 40, bottom: 60, left: 70 },
  showConfidenceInterval: true,
  showResiduals: false,
  confidenceLevel: 0.95,
  polynomialDegree: 2,
  pointColor: '#3498db',
  lineColor: '#e74c3c',
  ciColor: '#e74c3c',
};

export class RegressionPlot {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private settings: RegressionSettings;
  private tooltip: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;

  constructor(containerId: string, settings?: Partial<RegressionSettings>) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    this.container = container;

    this.settings = { ...DEFAULT_SETTINGS, ...settings };

    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.settings.width)
      .attr('height', this.settings.height);

    this.tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('display', 'none');
  }

  update(
    data: DataPoint[],
    xLabel: string,
    yLabel: string,
    regressionType: RegressionType = 'linear'
  ): RegressionResult | null {
    this.svg.selectAll('*').remove();

    const { width, height, margin } = this.settings;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    // Create main group
    const g = this.svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xExtent = d3.extent(data, (d) => d.x) as [number, number];
    const yExtent = d3.extent(data, (d) => d.y) as [number, number];

    const xPadding = (xExtent[1] - xExtent[0]) * 0.1;
    const yPadding = (yExtent[1] - yExtent[0]) * 0.1;

    const xScale = d3
      .scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([0, plotWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([plotHeight, 0])
      .nice();

    // Calculate regression
    let result: RegressionResult | null = null;

    switch (regressionType) {
      case 'linear':
        result = this.calculateLinearRegression(data);
        break;
      case 'polynomial':
        result = this.calculatePolynomialRegression(data, this.settings.polynomialDegree);
        break;
      case 'logistic':
        result = this.calculateLinearRegression(data); // Simplified for demo
        break;
    }

    if (result && this.settings.showConfidenceInterval) {
      this.renderConfidenceInterval(g, data, result, xScale, yScale, plotWidth, regressionType);
    }

    // Render regression line
    if (result) {
      this.renderRegressionLine(g, data, result, xScale, yScale, plotWidth, regressionType);
    }

    // Render data points
    this.renderDataPoints(g, data, xScale, yScale);

    // Render axes
    this.renderAxes(g, xScale, yScale, plotWidth, plotHeight, xLabel, yLabel);

    // Render title
    this.svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .attr('fill', '#333')
      .text(`${regressionType.charAt(0).toUpperCase() + regressionType.slice(1)} Regression`);

    return result;
  }

  private calculateLinearRegression(data: DataPoint[]): RegressionResult {
    const n = data.length;
    const sumX = d3.sum(data, (d) => d.x);
    const sumY = d3.sum(data, (d) => d.y);
    const sumXY = d3.sum(data, (d) => d.x * d.y);
    const sumX2 = d3.sum(data, (d) => d.x * d.x);

    const meanX = sumX / n;
    const meanY = sumY / n;

    // Calculate slope and intercept
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = meanY - slope * meanX;

    // Calculate predicted values and residuals
    const predicted = data.map((d) => intercept + slope * d.x);
    const residuals = data.map((d, i) => d.y - predicted[i]);

    // Calculate R-squared
    const ssRes = d3.sum(residuals, (r) => r * r);
    const ssTot = d3.sum(data, (d) => Math.pow(d.y - meanY, 2));
    const rSquared = 1 - ssRes / ssTot;
    const adjustedRSquared = 1 - ((1 - rSquared) * (n - 1)) / (n - 2);

    // Calculate standard error
    const standardError = Math.sqrt(ssRes / (n - 2));

    // Calculate F-statistic and p-value (simplified)
    const ssReg = ssTot - ssRes;
    const fStatistic = ssReg / 1 / (ssRes / (n - 2));
    const pValue = Math.exp(-fStatistic / 2); // Simplified approximation

    // Calculate confidence interval
    const tCritical = 1.96; // For 95% CI, approximate

    const xRange = d3.range(
      d3.min(data, (d) => d.x)! - 1,
      d3.max(data, (d) => d.x)! + 1,
      (d3.max(data, (d) => d.x)! - d3.min(data, (d) => d.x)!) / 100
    );

    const lower = xRange.map((x) => {
      const yHat = intercept + slope * x;
      const seY =
        standardError *
        Math.sqrt(1 / n + Math.pow(x - meanX, 2) / d3.sum(data, (d) => Math.pow(d.x - meanX, 2)));
      return yHat - tCritical * seY;
    });

    const upper = xRange.map((x) => {
      const yHat = intercept + slope * x;
      const seY =
        standardError *
        Math.sqrt(1 / n + Math.pow(x - meanX, 2) / d3.sum(data, (d) => Math.pow(d.x - meanX, 2)));
      return yHat + tCritical * seY;
    });

    return {
      coefficients: [intercept, slope],
      rSquared,
      adjustedRSquared,
      standardError,
      pValue,
      fStatistic,
      residuals,
      predicted,
      confidenceInterval: { lower, upper },
    };
  }

  private calculatePolynomialRegression(data: DataPoint[], degree: number): RegressionResult {
    // Simplified polynomial regression using normal equations
    // For a proper implementation, use matrix operations

    const n = data.length;
    const coefficients: number[] = [];

    // Use simple polynomial fitting (least squares approximation)
    // This is a simplified version - real implementation would use matrix algebra

    // For demo, we'll use a quadratic fit with gradient descent approximation
    const meanX = d3.mean(data, (d) => d.x) ?? 0;
    const meanY = d3.mean(data, (d) => d.y) ?? 0;

    // Center the data
    const centeredData = data.map((d) => ({
      x: d.x - meanX,
      y: d.y - meanY,
    }));

    // Estimate coefficients
    let a = 0,
      b = 0,
      c = meanY;
    const iterations = 1000;
    const learningRate = 0.0001;

    for (let iter = 0; iter < iterations; iter++) {
      let gradA = 0,
        gradB = 0,
        gradC = 0;

      for (const d of centeredData) {
        const pred = a * d.x * d.x + b * d.x + c - meanY;
        const error = pred - d.y;
        gradA += error * d.x * d.x;
        gradB += error * d.x;
        gradC += error;
      }

      a -= (learningRate * gradA) / n;
      b -= (learningRate * gradB) / n;
      c -= (learningRate * gradC) / n;
    }

    // Adjust for centering
    const a0 = a;
    const a1 = b - 2 * a * meanX;
    const a2 = c + a * meanX * meanX - b * meanX + meanY;

    coefficients.push(a2, a1, a0);

    // Calculate predicted and residuals
    const predicted = data.map((d) => a2 + a1 * d.x + a0 * d.x * d.x);
    const residuals = data.map((d, i) => d.y - predicted[i]);

    // Calculate R-squared
    const ssRes = d3.sum(residuals, (r) => r * r);
    const ssTot = d3.sum(data, (d) => Math.pow(d.y - meanY, 2));
    const rSquared = Math.max(0, 1 - ssRes / ssTot);

    return {
      coefficients,
      rSquared,
      adjustedRSquared: rSquared - ((1 - rSquared) * degree) / (n - degree - 1),
      standardError: Math.sqrt(ssRes / (n - degree - 1)),
      pValue: 0.001, // Placeholder
      fStatistic: (ssTot - ssRes) / degree / (ssRes / (n - degree - 1)),
      residuals,
      predicted,
      confidenceInterval: { lower: [], upper: [] },
    };
  }

  private renderDataPoints(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: DataPoint[],
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>
  ): void {
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    g.selectAll('circle.data-point')
      .data(data)
      .join('circle')
      .attr('class', 'data-point')
      .attr('cx', (d) => xScale(d.x))
      .attr('cy', (d) => yScale(d.y))
      .attr('r', 5)
      .attr('fill', (d) => (d.group ? colorScale(d.group) : this.settings.pointColor))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1.5)
      .attr('opacity', 0.8)
      .style('cursor', 'pointer')
      .on('mouseover', (event, d) => {
        d3.select(event.target).attr('r', 8).attr('opacity', 1);
        this.showTooltip(event, d);
      })
      .on('mouseout', (event) => {
        d3.select(event.target).attr('r', 5).attr('opacity', 0.8);
        this.hideTooltip();
      });
  }

  private renderRegressionLine(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: DataPoint[],
    result: RegressionResult,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    _width: number,
    regressionType: RegressionType
  ): void {
    const xMin = d3.min(data, (d) => d.x)!;
    const xMax = d3.max(data, (d) => d.x)!;
    const numPoints = 100;
    const step = (xMax - xMin) / numPoints;

    const lineData: Array<{ x: number; y: number }> = [];

    for (let x = xMin; x <= xMax; x += step) {
      let y: number;
      if (regressionType === 'polynomial' && result.coefficients.length > 2) {
        y = result.coefficients[0] + result.coefficients[1] * x + result.coefficients[2] * x * x;
      } else {
        y = result.coefficients[0] + result.coefficients[1] * x;
      }
      lineData.push({ x, y });
    }

    const line = d3
      .line<{ x: number; y: number }>()
      .x((d) => xScale(d.x))
      .y((d) => yScale(d.y));

    g.append('path')
      .datum(lineData)
      .attr('class', 'regression-line')
      .attr('d', line)
      .attr('fill', 'none')
      .attr('stroke', this.settings.lineColor)
      .attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round');
  }

  private renderConfidenceInterval(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    data: DataPoint[],
    result: RegressionResult,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    _width: number,
    regressionType: RegressionType
  ): void {
    if (regressionType === 'polynomial') return; // Skip for polynomial

    const xMin = d3.min(data, (d) => d.x)!;
    const xMax = d3.max(data, (d) => d.x)!;
    const numPoints = 100;
    const step = (xMax - xMin) / numPoints;

    const n = data.length;
    const meanX = d3.mean(data, (d) => d.x)!;
    const ssX = d3.sum(data, (d) => Math.pow(d.x - meanX, 2));
    const tCritical = 1.96;

    const areaData: Array<{ x: number; lower: number; upper: number }> = [];

    for (let i = 0, x = xMin; x <= xMax; x += step, i++) {
      const yHat = result.coefficients[0] + result.coefficients[1] * x;
      const seY = result.standardError * Math.sqrt(1 / n + Math.pow(x - meanX, 2) / ssX);

      areaData.push({
        x,
        lower: yHat - tCritical * seY,
        upper: yHat + tCritical * seY,
      });
    }

    const area = d3
      .area<{ x: number; lower: number; upper: number }>()
      .x((d) => xScale(d.x))
      .y0((d) => yScale(d.lower))
      .y1((d) => yScale(d.upper));

    g.append('path')
      .datum(areaData)
      .attr('class', 'confidence-interval')
      .attr('d', area)
      .attr('fill', this.settings.ciColor)
      .attr('fill-opacity', 0.2);
  }

  private renderAxes(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    xScale: d3.ScaleLinear<number, number>,
    yScale: d3.ScaleLinear<number, number>,
    width: number,
    height: number,
    xLabel: string,
    yLabel: string
  ): void {
    // X axis
    const xAxis = d3.axisBottom(xScale).ticks(8);
    g.append('g').attr('class', 'x-axis').attr('transform', `translate(0, ${height})`).call(xAxis);

    g.append('text')
      .attr('class', 'axis-label')
      .attr('x', width / 2)
      .attr('y', height + 45)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('fill', '#555')
      .text(xLabel);

    // Y axis
    const yAxis = d3.axisLeft(yScale).ticks(8);
    g.append('g').attr('class', 'y-axis').call(yAxis);

    g.append('text')
      .attr('class', 'axis-label')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -50)
      .attr('text-anchor', 'middle')
      .attr('font-size', '13px')
      .attr('fill', '#555')
      .text(yLabel);
  }

  private showTooltip(event: MouseEvent, d: DataPoint): void {
    this.tooltip
      .style('display', 'block')
      .html(
        `
        <div class="tooltip-title">${d.label ?? 'Data Point'}</div>
        <div class="tooltip-row">
          <span class="tooltip-label">X:</span>
          <span class="tooltip-value">${d.x.toFixed(2)}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">Y:</span>
          <span class="tooltip-value">${d.y.toFixed(2)}</span>
        </div>
        ${
          d.group
            ? `
          <div class="tooltip-row">
            <span class="tooltip-label">Group:</span>
            <span class="tooltip-value">${d.group}</span>
          </div>
        `
            : ''
        }
      `
      )
      .style('left', `${event.pageX + 10}px`)
      .style('top', `${event.pageY - 10}px`);
  }

  private hideTooltip(): void {
    this.tooltip.style('display', 'none');
  }

  setShowCI(show: boolean): void {
    this.settings.showConfidenceInterval = show;
  }
}

/**
 * Residual Plot Component
 */
export class ResidualPlot {
  private container: HTMLElement;
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined>;
  private settings: RegressionSettings;

  constructor(containerId: string, settings?: Partial<RegressionSettings>) {
    const container = document.getElementById(containerId);
    if (!container) throw new Error(`Container ${containerId} not found`);
    this.container = container;

    this.settings = { ...DEFAULT_SETTINGS, width: 600, height: 250, ...settings };

    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.settings.width)
      .attr('height', this.settings.height);
  }

  update(predicted: number[], residuals: number[]): void {
    this.svg.selectAll('*').remove();

    const { width, height, margin } = this.settings;
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;

    const g = this.svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(predicted) as [number, number])
      .range([0, plotWidth])
      .nice();

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(residuals) as [number, number])
      .range([plotHeight, 0])
      .nice();

    // Zero line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', yScale(0))
      .attr('x2', plotWidth)
      .attr('y2', yScale(0))
      .attr('stroke', '#e74c3c')
      .attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,2');

    // Points
    g.selectAll('circle')
      .data(predicted.map((p, i) => ({ predicted: p, residual: residuals[i] })))
      .join('circle')
      .attr('cx', (d) => xScale(d.predicted))
      .attr('cy', (d) => yScale(d.residual))
      .attr('r', 4)
      .attr('fill', '#3498db')
      .attr('opacity', 0.6);

    // Axes
    g.append('g')
      .attr('transform', `translate(0, ${plotHeight})`)
      .call(d3.axisBottom(xScale).ticks(6));

    g.append('g').call(d3.axisLeft(yScale).ticks(5));

    // Labels
    g.append('text')
      .attr('x', plotWidth / 2)
      .attr('y', plotHeight + 35)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#555')
      .text('Fitted Values');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -plotHeight / 2)
      .attr('y', -40)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('fill', '#555')
      .text('Residuals');
  }
}
