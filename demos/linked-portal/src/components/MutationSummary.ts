/**
 * MutationSummary - Summary statistics and charts for current cohort
 *
 * Features:
 * - Mutation type distribution (pie/bar chart)
 * - Disease distribution
 * - Position distribution histogram
 * - Key statistics
 */

import * as d3 from 'd3';
import { CohortStore, type CohortState } from '../state';
import type { Mutation, Sample, ConsequenceType } from '../types';
import { MUTATION_COLORS, MUTATION_LABELS, DISEASE_COLORS } from '../types';

export interface MutationSummaryConfig {
  width: number;
  chartHeight: number;
}

const DEFAULT_CONFIG: MutationSummaryConfig = {
  width: 300,
  chartHeight: 150,
};

export class MutationSummary {
  private container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>;
  private config: MutationSummaryConfig;

  // Data
  private mutations: Mutation[] = [];
  private samples: Sample[] = [];

  constructor(selector: string, config: Partial<MutationSummaryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Clear and create container
    const parent = d3.select(selector);
    parent.selectAll('*').remove();

    this.container = parent
      .append('div')
      .attr('class', 'mutation-summary')
      .style('width', `${this.config.width}px`);

    this.setupStoreSubscription();
  }

  private setupStoreSubscription(): void {
    CohortStore.subscribe((state: CohortState) => {
      if (state.filteredMutations && state.filteredSamples) {
        this.mutations = state.filteredMutations;
        this.samples = state.filteredSamples;
        this.render();
      }
    });
  }

  /**
   * Set data directly
   */
  setData(mutations: Mutation[], samples: Sample[]): void {
    this.mutations = mutations;
    this.samples = samples;
    this.render();
  }

  render(): void {
    this.container.selectAll('*').remove();

    this.renderStats();
    this.renderMutationTypeChart();
    this.renderDiseaseChart();
    this.renderPositionHistogram();
  }

  private renderStats(): void {
    const stats = this.container
      .append('div')
      .attr('class', 'stats-grid')
      .style('display', 'grid')
      .style('grid-template-columns', 'repeat(2, 1fr)')
      .style('gap', '12px')
      .style('margin-bottom', '20px');

    const totalMutations = d3.sum(this.mutations, (m) => m.count);
    const uniquePositions = new Set(this.mutations.map((m) => m.position)).size;
    const avgMutationsPerSample =
      this.samples.length > 0 ? (totalMutations / this.samples.length).toFixed(1) : '0';

    const statItems = [
      { label: 'Mutations', value: this.mutations.length, color: '#4facfe' },
      { label: 'Samples', value: this.samples.length, color: '#00f2fe' },
      { label: 'Unique Positions', value: uniquePositions, color: '#f093fb' },
      { label: 'Avg/Sample', value: avgMutationsPerSample, color: '#f5576c' },
    ];

    statItems.forEach((item) => {
      const card = stats
        .append('div')
        .style('background', `linear-gradient(135deg, ${item.color}15, ${item.color}05)`)
        .style('border', `1px solid ${item.color}30`)
        .style('border-radius', '8px')
        .style('padding', '12px')
        .style('text-align', 'center');

      card
        .append('div')
        .style('font-size', '24px')
        .style('font-weight', '700')
        .style('color', item.color)
        .text(item.value);

      card
        .append('div')
        .style('font-size', '11px')
        .style('color', '#666')
        .style('text-transform', 'uppercase')
        .style('letter-spacing', '0.5px')
        .text(item.label);
    });
  }

  private renderMutationTypeChart(): void {
    const section = this.createSection('Mutation Types');

    // Aggregate by type
    const byType = d3.rollup(
      this.mutations,
      (v) => d3.sum(v, (m) => m.count),
      (m) => m.type
    );

    const data = Array.from(byType, ([type, count]) => ({
      type: type as ConsequenceType,
      count,
      label: MUTATION_LABELS[type as ConsequenceType] || type,
      color: MUTATION_COLORS[type as ConsequenceType],
    })).sort((a, b) => b.count - a.count);

    if (data.length === 0) {
      section
        .append('div')
        .style('color', '#999')
        .style('font-size', '13px')
        .style('text-align', 'center')
        .style('padding', '20px')
        .text('No mutations to display');
      return;
    }

    const total = d3.sum(data, (d) => d.count);

    // Horizontal bar chart
    const barHeight = 20;
    const maxWidth = this.config.width - 100;

    const maxCount = d3.max(data, (d) => d.count) || 1;
    const xScale = d3.scaleLinear().domain([0, maxCount]).range([0, maxWidth]);

    data.forEach((d) => {
      const row = section
        .append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('margin-bottom', '8px')
        .style('cursor', 'pointer')
        .on('click', () => this.filterByType(d.type))
        .on('mouseover', function () {
          d3.select(this).style('opacity', 0.8);
        })
        .on('mouseout', function () {
          d3.select(this).style('opacity', 1);
        });

      // Label
      row
        .append('div')
        .style('width', '80px')
        .style('font-size', '11px')
        .style('color', '#444')
        .style('overflow', 'hidden')
        .style('text-overflow', 'ellipsis')
        .style('white-space', 'nowrap')
        .attr('title', d.label)
        .text(d.label);

      // Bar
      const barContainer = row
        .append('div')
        .style('flex', '1')
        .style('height', `${barHeight}px`)
        .style('background', '#f0f0f0')
        .style('border-radius', '4px')
        .style('overflow', 'hidden')
        .style('margin-right', '8px');

      barContainer
        .append('div')
        .style('width', `${xScale(d.count)}px`)
        .style('height', '100%')
        .style('background', d.color)
        .style('transition', 'width 0.3s');

      // Count
      row
        .append('div')
        .style('width', '40px')
        .style('font-size', '12px')
        .style('font-weight', '600')
        .style('color', '#333')
        .style('text-align', 'right')
        .text(d.count);

      // Percentage
      row
        .append('div')
        .style('width', '40px')
        .style('font-size', '11px')
        .style('color', '#999')
        .style('text-align', 'right')
        .text(`${Math.round((d.count / total) * 100)}%`);
    });
  }

  private renderDiseaseChart(): void {
    const section = this.createSection('Disease Distribution');

    // Aggregate by disease
    const byDisease = d3.rollup(
      this.samples,
      (v) => v.length,
      (s) => s.disease
    );

    const data = Array.from(byDisease, ([disease, count]) => ({
      disease,
      count,
      color: DISEASE_COLORS[disease] || '#999',
    })).sort((a, b) => b.count - a.count);

    if (data.length === 0) {
      section
        .append('div')
        .style('color', '#999')
        .style('font-size', '13px')
        .style('text-align', 'center')
        .style('padding', '20px')
        .text('No samples to display');
      return;
    }

    // Pie chart using SVG
    const size = 100;
    const radius = size / 2;

    const pieContainer = section
      .append('div')
      .style('display', 'flex')
      .style('align-items', 'center')
      .style('gap', '16px');

    const svg = pieContainer.append('svg').attr('width', size).attr('height', size);

    const g = svg.append('g').attr('transform', `translate(${radius}, ${radius})`);

    const pie = d3
      .pie<(typeof data)[0]>()
      .value((d) => d.count)
      .sort(null);

    const arc = d3
      .arc<d3.PieArcDatum<(typeof data)[0]>>()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);

    g.selectAll('path')
      .data(pie(data))
      .join('path')
      .attr('d', arc)
      .attr('fill', (d) => d.data.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => this.filterByDisease(d.data.disease))
      .on('mouseover', function () {
        d3.select(this).attr('opacity', 0.8);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 1);
      });

    // Legend
    const legend = pieContainer.append('div').style('flex', '1');

    data.forEach((d) => {
      const item = legend
        .append('div')
        .style('display', 'flex')
        .style('align-items', 'center')
        .style('gap', '6px')
        .style('margin-bottom', '4px')
        .style('font-size', '12px')
        .style('cursor', 'pointer')
        .on('click', () => this.filterByDisease(d.disease));

      item
        .append('span')
        .style('display', 'inline-block')
        .style('width', '10px')
        .style('height', '10px')
        .style('border-radius', '2px')
        .style('background', d.color);

      item.append('span').style('color', '#444').text(`${d.disease}`);

      item.append('span').style('color', '#999').text(`(${d.count})`);
    });
  }

  private renderPositionHistogram(): void {
    const section = this.createSection('Position Distribution');

    if (this.mutations.length === 0) {
      section
        .append('div')
        .style('color', '#999')
        .style('font-size', '13px')
        .style('text-align', 'center')
        .style('padding', '20px')
        .text('No mutations to display');
      return;
    }

    const { width, chartHeight } = this.config;
    const margin = { top: 10, right: 10, bottom: 20, left: 30 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    const svg = section.append('svg').attr('width', width).attr('height', chartHeight);

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create histogram bins
    const positions = this.mutations.map((m) => m.position);
    const xExtent = d3.extent(positions) as [number, number];

    const xScale = d3
      .scaleLinear()
      .domain([xExtent[0] - 10, xExtent[1] + 10])
      .range([0, innerWidth]);

    const histogram = d3
      .bin<number, number>()
      .domain(xScale.domain() as [number, number])
      .thresholds(20);

    const bins = histogram(positions);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(bins, (b) => b.length) || 1])
      .range([innerHeight, 0]);

    // Bars
    g.selectAll('rect')
      .data(bins)
      .join('rect')
      .attr('x', (d) => xScale(d.x0 || 0))
      .attr('y', (d) => yScale(d.length))
      .attr('width', (d) => Math.max(0, xScale(d.x1 || 0) - xScale(d.x0 || 0) - 1))
      .attr('height', (d) => innerHeight - yScale(d.length))
      .attr('fill', '#4facfe')
      .attr('opacity', 0.7)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        if (d.x0 !== undefined && d.x1 !== undefined) {
          this.filterByPosition([d.x0, d.x1]);
        }
      })
      .on('mouseover', function () {
        d3.select(this).attr('opacity', 1);
      })
      .on('mouseout', function () {
        d3.select(this).attr('opacity', 0.7);
      });

    // X-axis
    g.append('g')
      .attr('transform', `translate(0, ${innerHeight})`)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(5)
          .tickFormat((d) => `${d}`)
      )
      .selectAll('text')
      .style('font-size', '10px');

    // Y-axis
    g.append('g').call(d3.axisLeft(yScale).ticks(3)).selectAll('text').style('font-size', '10px');
  }

  private createSection(
    title: string
  ): d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown> {
    const section = this.container
      .append('div')
      .attr('class', 'summary-section')
      .style('margin-bottom', '20px');

    section
      .append('h4')
      .style('margin', '0 0 12px 0')
      .style('font-size', '13px')
      .style('font-weight', '600')
      .style('color', '#333')
      .text(title);

    return section;
  }

  private filterByType(type: ConsequenceType): void {
    const currentFilters = CohortStore.filters || {};
    const currentTypes: string[] = currentFilters.mutationType || [];

    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t: string) => t !== type)
      : [...currentTypes, type];

    CohortStore.applyFilters({
      ...currentFilters,
      mutationType: newTypes.length > 0 ? newTypes : undefined,
    });
  }

  private filterByDisease(disease: string): void {
    const currentFilters = CohortStore.filters || {};
    const currentDiseases: string[] = currentFilters.disease || [];

    const newDiseases = currentDiseases.includes(disease)
      ? currentDiseases.filter((d: string) => d !== disease)
      : [...currentDiseases, disease];

    CohortStore.applyFilters({
      ...currentFilters,
      disease: newDiseases.length > 0 ? newDiseases : undefined,
    });
  }

  private filterByPosition(range: [number, number]): void {
    const currentFilters = CohortStore.filters || {};

    CohortStore.applyFilters({
      ...currentFilters,
      positionRange: range,
    });
  }

  /**
   * Destroy the component
   */
  destroy(): void {
    this.container.remove();
  }
}
