/**
 * Dashboard View
 * 
 * Shows overview statistics and summary charts
 */

import * as d3 from 'd3';

export class DashboardView {
  constructor(options) {
    this.container = options.container;
    this.dataService = options.dataService;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('refreshDashboard')?.addEventListener('click', () => {
      this.render();
    });
  }

  render() {
    this.renderMutationChart();
    this.renderVariantTypeChart();
    this.renderTopGenesChart();
    this.renderSampleChart();
  }

  renderMutationChart() {
    const container = document.getElementById('mutationChart');
    if (!container) return;
    
    container.innerHTML = '';
    
    const data = this.dataService.getCancerTypeDistribution();
    if (!data.length) {
      container.innerHTML = '<div class="loading">No data available</div>';
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight || 250;
    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.type))
      .range([0, innerWidth])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) * 1.1])
      .range([innerHeight, 0]);

    // Bars
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.type))
      .attr('width', x.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('fill', '#3b82f6')
      .attr('rx', 4)
      .transition()
      .duration(800)
      .attr('y', d => y(d.count))
      .attr('height', d => innerHeight - y(d.count));

    // X axis
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .style('text-transform', 'capitalize');

    // Y axis
    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y).ticks(5));

    // Y label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '12px')
      .text('Mutation Count');
  }

  renderVariantTypeChart() {
    const container = document.getElementById('variantTypeChart');
    if (!container) return;
    
    container.innerHTML = '';
    
    const data = this.dataService.getMutationTypeDistribution();
    if (!data.length) {
      container.innerHTML = '<div class="loading">No data available</div>';
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight || 250;
    const radius = Math.min(width, height) / 2 - 20;

    const colors = {
      missense: '#3b82f6',
      nonsense: '#ef4444',
      frameshift: '#8b5cf6',
      splice: '#f59e0b',
      silent: '#6b7280',
      inframe: '#10b981'
    };

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const pie = d3.pie()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc()
      .innerRadius(radius * 0.5)
      .outerRadius(radius);

    const arcs = g.selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => colors[d.data.type] || '#6b7280')
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .transition()
      .duration(800)
      .style('opacity', 1);

    // Labels
    arcs.append('text')
      .attr('transform', d => `translate(${arc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', 'white')
      .attr('font-weight', '600')
      .text(d => d.data.count > 0 ? d.data.type : '');
  }

  renderTopGenesChart() {
    const container = document.getElementById('topGenesChart');
    if (!container) return;
    
    container.innerHTML = '';
    
    const data = this.dataService.getTopMutatedGenes(8);
    if (!data.length) {
      container.innerHTML = '<div class="loading">No data available</div>';
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight || 250;
    const margin = { top: 20, right: 20, bottom: 20, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand()
      .domain(data.map(d => d.gene))
      .range([0, innerHeight])
      .padding(0.3);

    const x = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.count) * 1.1])
      .range([0, innerWidth]);

    // Bars
    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('y', d => y(d.gene))
      .attr('height', y.bandwidth())
      .attr('x', 0)
      .attr('width', 0)
      .attr('fill', '#10b981')
      .attr('rx', 4)
      .transition()
      .duration(800)
      .attr('width', d => x(d.count));

    // Labels on bars
    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('y', d => y(d.gene) + y.bandwidth() / 2)
      .attr('x', d => x(d.count) + 5)
      .attr('dy', '0.35em')
      .attr('font-size', '12px')
      .attr('fill', '#64748b')
      .text(d => d.count);

    // Y axis
    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));
  }

  renderSampleChart() {
    const container = document.getElementById('sampleChart');
    if (!container) return;
    
    container.innerHTML = '';
    
    const stats = this.dataService.getGlobalStats();
    
    // Simple metric display
    const html = `
      <div style="display: flex; flex-direction: column; gap: 16px; padding: 20px;">
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #f1f5f9; border-radius: 8px;">
          <span style="color: #64748b;">Total Samples</span>
          <span style="font-weight: 600; color: #0f172a;">${stats.totalSamples}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #f1f5f9; border-radius: 8px;">
          <span style="color: #64748b;">Variants per Sample</span>
          <span style="font-weight: 600; color: #0f172a;">${(stats.totalVariants / stats.totalSamples).toFixed(1)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 12px; background: #f1f5f9; border-radius: 8px;">
          <span style="color: #64748b;">Unique Genes</span>
          <span style="font-weight: 600; color: #0f172a;">${stats.totalGenes}</span>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
  }
}
