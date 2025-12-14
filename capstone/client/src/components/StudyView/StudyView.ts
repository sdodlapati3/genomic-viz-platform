/**
 * Study View Component
 * 
 * Dashboard-style view for cohort exploration with:
 * - Multiple synchronized charts
 * - Interactive filtering
 * - Cross-chart selection
 */

import * as d3 from 'd3';
import type { StudyViewConfig } from '../../embed/config.schema';

// ============================================
// Types
// ============================================

interface StudyData {
  samples: SampleInfo[];
  summary: StudySummary;
}

interface SampleInfo {
  id: string;
  cancerType: string;
  sampleType: string;
  age?: number;
  gender?: string;
  mutations: string[];
  survivalMonths?: number;
  vitalStatus?: 'alive' | 'deceased';
}

interface StudySummary {
  totalSamples: number;
  cancerTypes: Record<string, number>;
  sampleTypes: Record<string, number>;
  mutationFrequencies: Record<string, number>;
  ageDistribution: number[];
}

interface Filter {
  field: string;
  values: string[];
}

type ChartType = 
  | 'mutationFrequency'
  | 'cancerType'
  | 'sampleType'
  | 'ageDistribution'
  | 'survivalOverview'
  | 'geneExpression'
  | 'mutationType';

// ============================================
// Study View Class
// ============================================

export class StudyView {
  private container: HTMLElement;
  private config: StudyViewConfig;
  private data: StudyData | null = null;
  private filters: Filter[] = [];
  private selectedSamples: Set<string> = new Set();
  
  private chartContainers: Map<ChartType, HTMLElement> = new Map();
  private onFilterChange: ((filters: Filter[]) => void)[] = [];
  private onSelectionChange: ((sampleIds: string[]) => void)[] = [];

  constructor(container: HTMLElement | string, config: StudyViewConfig) {
    if (typeof container === 'string') {
      const el = document.querySelector(container);
      if (!el || !(el instanceof HTMLElement)) {
        throw new Error(`Container not found: ${container}`);
      }
      this.container = el;
    } else {
      this.container = container;
    }

    this.config = {
      charts: ['mutationFrequency', 'cancerType', 'survivalOverview'],
      layout: 'grid',
      columns: 2,
      interactive: true,
      filterSync: true,
      ...config,
    };

    this.init();
  }

  // ============================================
  // Initialization
  // ============================================

  private async init(): Promise<void> {
    this.container.innerHTML = '';
    
    // Create main layout
    const wrapper = document.createElement('div');
    wrapper.className = 'study-view';
    wrapper.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
      font-family: system-ui, -apple-system, sans-serif;
    `;

    // Header with filters
    wrapper.appendChild(this.createHeader());

    // Summary stats
    wrapper.appendChild(this.createSummaryBar());

    // Charts grid
    wrapper.appendChild(this.createChartsGrid());

    this.container.appendChild(wrapper);

    // Load data
    await this.loadData();
  }

  // ============================================
  // UI Components
  // ============================================

  private createHeader(): HTMLElement {
    const header = document.createElement('div');
    header.className = 'study-view-header';
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 15px;
      border-bottom: 2px solid #eee;
    `;

    // Title
    const title = document.createElement('h2');
    title.style.cssText = 'margin: 0; font-size: 24px; color: #333;';
    title.textContent = `Study: ${this.config.study}`;
    header.appendChild(title);

    // Filter controls
    const filterControls = document.createElement('div');
    filterControls.style.cssText = 'display: flex; gap: 10px; align-items: center;';

    // Clear filters button
    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Clear Filters';
    clearBtn.style.cssText = `
      padding: 8px 16px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
      cursor: pointer;
      font-size: 13px;
    `;
    clearBtn.addEventListener('click', () => this.clearFilters());
    filterControls.appendChild(clearBtn);

    // Sample count
    const sampleCount = document.createElement('span');
    sampleCount.className = 'sample-count';
    sampleCount.style.cssText = `
      padding: 6px 12px;
      background: #3498db;
      color: #fff;
      border-radius: 4px;
      font-size: 13px;
      font-weight: 500;
    `;
    sampleCount.textContent = 'Loading...';
    filterControls.appendChild(sampleCount);

    header.appendChild(filterControls);
    return header;
  }

  private createSummaryBar(): HTMLElement {
    const summary = document.createElement('div');
    summary.className = 'study-view-summary';
    summary.style.cssText = `
      display: flex;
      gap: 20px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    `;

    const stats = [
      { label: 'Total Samples', id: 'stat-total', value: '-' },
      { label: 'Cancer Types', id: 'stat-cancer', value: '-' },
      { label: 'Mutated Genes', id: 'stat-genes', value: '-' },
      { label: 'Median Age', id: 'stat-age', value: '-' },
    ];

    stats.forEach(stat => {
      const statBox = document.createElement('div');
      statBox.id = stat.id;
      statBox.style.cssText = `
        flex: 1;
        text-align: center;
        padding: 10px;
        background: #fff;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      `;
      statBox.innerHTML = `
        <div style="font-size: 24px; font-weight: bold; color: #333;">${stat.value}</div>
        <div style="font-size: 12px; color: #666; margin-top: 5px;">${stat.label}</div>
      `;
      summary.appendChild(statBox);
    });

    return summary;
  }

  private createChartsGrid(): HTMLElement {
    const grid = document.createElement('div');
    grid.className = 'study-view-charts';
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(${this.config.columns}, 1fr);
      gap: 20px;
    `;

    this.config.charts!.forEach(chartType => {
      const chartContainer = this.createChartContainer(chartType);
      this.chartContainers.set(chartType as ChartType, chartContainer);
      grid.appendChild(chartContainer);
    });

    return grid;
  }

  private createChartContainer(chartType: string): HTMLElement {
    const container = document.createElement('div');
    container.className = `chart-container chart-${chartType}`;
    container.style.cssText = `
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    `;

    // Chart header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 12px 15px;
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
      font-weight: 500;
      font-size: 14px;
      color: #333;
    `;
    header.textContent = this.getChartTitle(chartType);
    container.appendChild(header);

    // Chart body
    const body = document.createElement('div');
    body.className = 'chart-body';
    body.style.cssText = 'padding: 15px; height: 250px;';
    container.appendChild(body);

    return container;
  }

  private getChartTitle(chartType: string): string {
    const titles: Record<string, string> = {
      mutationFrequency: 'Mutation Frequency',
      cancerType: 'Cancer Type Distribution',
      sampleType: 'Sample Type Distribution',
      ageDistribution: 'Age Distribution',
      survivalOverview: 'Survival Overview',
      geneExpression: 'Gene Expression',
      mutationType: 'Mutation Type Distribution',
    };
    return titles[chartType] || chartType;
  }

  // ============================================
  // Data Loading
  // ============================================

  private async loadData(): Promise<void> {
    // Mock data - in production would call API
    this.data = this.generateMockData();
    this.updateSummary();
    this.renderAllCharts();
  }

  private generateMockData(): StudyData {
    const cancerTypes = ['Lung', 'Breast', 'Colorectal', 'Prostate', 'Melanoma'];
    const sampleTypes = ['Primary', 'Metastatic', 'Recurrent'];
    const genes = ['TP53', 'EGFR', 'KRAS', 'BRAF', 'PIK3CA', 'PTEN', 'RB1', 'CDKN2A'];

    const samples: SampleInfo[] = [];
    for (let i = 0; i < 200; i++) {
      const numMutations = Math.floor(Math.random() * 4);
      const mutations = Array.from(
        { length: numMutations },
        () => genes[Math.floor(Math.random() * genes.length)]
      );

      samples.push({
        id: `S${String(i + 1).padStart(4, '0')}`,
        cancerType: cancerTypes[Math.floor(Math.random() * cancerTypes.length)],
        sampleType: sampleTypes[Math.floor(Math.random() * sampleTypes.length)],
        age: Math.floor(Math.random() * 50) + 30,
        gender: Math.random() > 0.5 ? 'Male' : 'Female',
        mutations,
        survivalMonths: Math.floor(Math.random() * 60) + 6,
        vitalStatus: Math.random() > 0.3 ? 'alive' : 'deceased',
      });
    }

    // Calculate summary
    const summary: StudySummary = {
      totalSamples: samples.length,
      cancerTypes: {},
      sampleTypes: {},
      mutationFrequencies: {},
      ageDistribution: [],
    };

    samples.forEach(s => {
      summary.cancerTypes[s.cancerType] = (summary.cancerTypes[s.cancerType] || 0) + 1;
      summary.sampleTypes[s.sampleType] = (summary.sampleTypes[s.sampleType] || 0) + 1;
      s.mutations.forEach(m => {
        summary.mutationFrequencies[m] = (summary.mutationFrequencies[m] || 0) + 1;
      });
      if (s.age) summary.ageDistribution.push(s.age);
    });

    return { samples, summary };
  }

  // ============================================
  // Update Methods
  // ============================================

  private updateSummary(): void {
    if (!this.data) return;

    const filteredSamples = this.getFilteredSamples();
    
    // Update sample count
    const countEl = this.container.querySelector('.sample-count');
    if (countEl) {
      countEl.textContent = `${filteredSamples.length} / ${this.data.samples.length} samples`;
    }

    // Update stat boxes
    const totalEl = this.container.querySelector('#stat-total div:first-child');
    if (totalEl) totalEl.textContent = String(filteredSamples.length);

    const cancerEl = this.container.querySelector('#stat-cancer div:first-child');
    if (cancerEl) {
      const uniqueCancers = new Set(filteredSamples.map(s => s.cancerType)).size;
      cancerEl.textContent = String(uniqueCancers);
    }

    const genesEl = this.container.querySelector('#stat-genes div:first-child');
    if (genesEl) {
      const uniqueGenes = new Set(filteredSamples.flatMap(s => s.mutations)).size;
      genesEl.textContent = String(uniqueGenes);
    }

    const ageEl = this.container.querySelector('#stat-age div:first-child');
    if (ageEl) {
      const ages = filteredSamples.map(s => s.age).filter(a => a) as number[];
      const median = ages.length ? ages.sort((a, b) => a - b)[Math.floor(ages.length / 2)] : '-';
      ageEl.textContent = String(median);
    }
  }

  private getFilteredSamples(): SampleInfo[] {
    if (!this.data) return [];
    
    return this.data.samples.filter(sample => {
      return this.filters.every(filter => {
        const value = (sample as any)[filter.field];
        if (Array.isArray(value)) {
          return filter.values.some(v => value.includes(v));
        }
        return filter.values.includes(value);
      });
    });
  }

  // ============================================
  // Chart Rendering
  // ============================================

  private renderAllCharts(): void {
    this.config.charts!.forEach(chartType => {
      this.renderChart(chartType as ChartType);
    });
  }

  private renderChart(chartType: ChartType): void {
    const container = this.chartContainers.get(chartType);
    if (!container || !this.data) return;

    const body = container.querySelector('.chart-body') as HTMLElement;
    if (!body) return;

    body.innerHTML = '';
    
    const filteredSamples = this.getFilteredSamples();

    switch (chartType) {
      case 'mutationFrequency':
        this.renderMutationFrequencyChart(body, filteredSamples);
        break;
      case 'cancerType':
        this.renderPieChart(body, filteredSamples, 'cancerType');
        break;
      case 'sampleType':
        this.renderPieChart(body, filteredSamples, 'sampleType');
        break;
      case 'ageDistribution':
        this.renderHistogram(body, filteredSamples);
        break;
      case 'survivalOverview':
        this.renderSurvivalMini(body, filteredSamples);
        break;
    }
  }

  private renderMutationFrequencyChart(container: HTMLElement, samples: SampleInfo[]): void {
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;
    const margin = { top: 20, right: 20, bottom: 60, left: 50 };

    // Calculate frequencies
    const freqs: Record<string, number> = {};
    samples.forEach(s => {
      s.mutations.forEach(m => {
        freqs[m] = (freqs[m] || 0) + 1;
      });
    });

    const data = Object.entries(freqs)
      .map(([gene, count]) => ({ gene, count, pct: (count / samples.length) * 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleBand()
      .domain(data.map(d => d.gene))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.pct) || 100])
      .nice()
      .range([innerHeight, 0]);

    // Bars
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.gene)!)
      .attr('y', d => y(d.pct))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.pct))
      .attr('fill', '#3498db')
      .style('cursor', 'pointer')
      .on('click', (event, d) => this.addFilter('mutations', d.gene));

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('font-size', '10px');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${d}%`));
  }

  private renderPieChart(container: HTMLElement, samples: SampleInfo[], field: keyof SampleInfo): void {
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;
    const radius = Math.min(width, height) / 2 - 30;

    // Calculate distribution
    const counts: Record<string, number> = {};
    samples.forEach(s => {
      const val = s[field] as string;
      counts[val] = (counts[val] || 0) + 1;
    });

    const data = Object.entries(counts).map(([name, value]) => ({ name, value }));
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie<{ name: string; value: number }>()
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<{ name: string; value: number }>>()
      .innerRadius(radius * 0.4)
      .outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .join('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', (d, i) => color(String(i)))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => this.addFilter(field, d.data.name));

    // Labels
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#fff')
      .text(d => d.data.value > samples.length * 0.05 ? d.data.name : '');
  }

  private renderHistogram(container: HTMLElement, samples: SampleInfo[]): void {
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;
    const margin = { top: 20, right: 20, bottom: 40, left: 40 };

    const ages = samples.map(s => s.age).filter(a => a) as number[];
    if (ages.length === 0) {
      container.innerHTML = '<div style="padding: 20px; color: #999;">No age data available</div>';
      return;
    }

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain([d3.min(ages)! - 5, d3.max(ages)! + 5])
      .range([0, innerWidth]);

    const histogram = d3.bin()
      .domain(x.domain() as [number, number])
      .thresholds(x.ticks(15));

    const bins = histogram(ages);

    const y = d3.scaleLinear()
      .domain([0, d3.max(bins, d => d.length) || 1])
      .nice()
      .range([innerHeight, 0]);

    g.selectAll('.bar')
      .data(bins)
      .join('rect')
      .attr('x', d => x(d.x0!) + 1)
      .attr('y', d => y(d.length))
      .attr('width', d => Math.max(0, x(d.x1!) - x(d.x0!) - 2))
      .attr('height', d => innerHeight - y(d.length))
      .attr('fill', '#2ecc71');

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(8));

    g.append('g')
      .call(d3.axisLeft(y).ticks(5));
  }

  private renderSurvivalMini(container: HTMLElement, samples: SampleInfo[]): void {
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 250;
    const margin = { top: 20, right: 20, bottom: 40, left: 50 };

    // Simple survival curve
    const survivalData = samples
      .filter(s => s.survivalMonths !== undefined)
      .map(s => ({
        time: s.survivalMonths!,
        event: s.vitalStatus === 'deceased' ? 1 : 0,
      }))
      .sort((a, b) => a.time - b.time);

    if (survivalData.length === 0) {
      container.innerHTML = '<div style="padding: 20px; color: #999;">No survival data available</div>';
      return;
    }

    // Kaplan-Meier estimation
    let atRisk = survivalData.length;
    let survival = 1;
    const curve = [{ time: 0, survival: 1 }];

    survivalData.forEach(d => {
      if (d.event === 1) {
        survival = survival * (atRisk - 1) / atRisk;
        curve.push({ time: d.time, survival });
      }
      atRisk--;
    });

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const x = d3.scaleLinear()
      .domain([0, d3.max(curve, d => d.time) || 60])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);

    const line = d3.line<{ time: number; survival: number }>()
      .x(d => x(d.time))
      .y(d => y(d.survival))
      .curve(d3.curveStepAfter);

    g.append('path')
      .datum(curve)
      .attr('fill', 'none')
      .attr('stroke', '#e74c3c')
      .attr('stroke-width', 2)
      .attr('d', line);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(6))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 30)
      .attr('fill', '#333')
      .attr('text-anchor', 'middle')
      .text('Months');

    g.append('g')
      .call(d3.axisLeft(y).ticks(5).tickFormat(d => `${(d as number) * 100}%`));
  }

  // ============================================
  // Filter Methods
  // ============================================

  public addFilter(field: string, value: string): void {
    const existing = this.filters.find(f => f.field === field);
    if (existing) {
      if (!existing.values.includes(value)) {
        existing.values.push(value);
      }
    } else {
      this.filters.push({ field, values: [value] });
    }
    this.applyFilters();
  }

  public removeFilter(field: string, value?: string): void {
    if (value) {
      const existing = this.filters.find(f => f.field === field);
      if (existing) {
        existing.values = existing.values.filter(v => v !== value);
        if (existing.values.length === 0) {
          this.filters = this.filters.filter(f => f.field !== field);
        }
      }
    } else {
      this.filters = this.filters.filter(f => f.field !== field);
    }
    this.applyFilters();
  }

  public clearFilters(): void {
    this.filters = [];
    this.applyFilters();
  }

  private applyFilters(): void {
    this.updateSummary();
    this.renderAllCharts();
    
    if (this.config.onFilterChange) {
      this.config.onFilterChange(
        Object.fromEntries(this.filters.map(f => [f.field, f.values]))
      );
    }
    
    this.onFilterChange.forEach(cb => cb(this.filters));
  }

  // ============================================
  // Event Subscriptions
  // ============================================

  public onFiltersChanged(callback: (filters: Filter[]) => void): () => void {
    this.onFilterChange.push(callback);
    return () => {
      this.onFilterChange = this.onFilterChange.filter(cb => cb !== callback);
    };
  }

  public onSamplesSelected(callback: (sampleIds: string[]) => void): () => void {
    this.onSelectionChange.push(callback);
    return () => {
      this.onSelectionChange = this.onSelectionChange.filter(cb => cb !== callback);
    };
  }

  public destroy(): void {
    this.container.innerHTML = '';
    this.chartContainers.clear();
    this.onFilterChange = [];
    this.onSelectionChange = [];
  }
}

export default StudyView;
