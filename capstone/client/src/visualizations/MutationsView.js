/**
 * Mutations View
 * 
 * Displays lollipop plot and oncoprint
 */

import * as d3 from 'd3';

// Protein domain data for TP53
const PROTEIN_DOMAINS = {
  TP53: {
    length: 393,
    domains: [
      { name: 'TAD', start: 1, end: 61, color: '#93c5fd' },
      { name: 'PRD', start: 62, end: 94, color: '#a5b4fc' },
      { name: 'DBD', start: 95, end: 289, color: '#f87171' },
      { name: 'TET', start: 290, end: 360, color: '#86efac' },
      { name: 'CTD', start: 361, end: 393, color: '#fcd34d' }
    ]
  },
  BRCA1: {
    length: 1863,
    domains: [
      { name: 'RING', start: 1, end: 109, color: '#93c5fd' },
      { name: 'BRCT', start: 1650, end: 1863, color: '#f87171' }
    ]
  },
  EGFR: {
    length: 1210,
    domains: [
      { name: 'ECD', start: 1, end: 621, color: '#93c5fd' },
      { name: 'TM', start: 622, end: 644, color: '#86efac' },
      { name: 'TK', start: 712, end: 979, color: '#f87171' }
    ]
  }
};

const MUTATION_COLORS = {
  missense: '#3b82f6',
  nonsense: '#ef4444',
  frameshift: '#8b5cf6',
  splice: '#f59e0b',
  inframe: '#10b981',
  silent: '#6b7280'
};

export class MutationsView {
  constructor(options) {
    this.container = options.container;
    this.dataService = options.dataService;
    this.selectedGene = 'TP53';
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('geneSelect')?.addEventListener('change', (e) => {
      this.selectedGene = e.target.value;
    });

    document.getElementById('updateLollipop')?.addEventListener('click', () => {
      this.render();
    });
  }

  render() {
    this.renderLollipop();
    this.renderOncoprint();
  }

  renderLollipop() {
    const container = document.getElementById('lollipopPlot');
    if (!container) return;
    
    container.innerHTML = '';
    
    const mutations = this.dataService.getMutationsByGene(this.selectedGene);
    const proteinData = PROTEIN_DOMAINS[this.selectedGene] || { length: 500, domains: [] };
    
    const width = container.clientWidth || 800;
    const height = 350;
    const margin = { top: 60, right: 40, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const trackHeight = 30;
    const trackY = innerHeight - trackHeight - 20;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 25)
      .attr('text-anchor', 'middle')
      .attr('font-size', '16px')
      .attr('font-weight', '600')
      .attr('fill', '#0f172a')
      .text(`${this.selectedGene} Mutation Lollipop Plot`);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale - protein position
    const x = d3.scaleLinear()
      .domain([0, proteinData.length])
      .range([0, innerWidth]);

    // Y scale - mutation count at position
    const positionCounts = {};
    mutations.forEach(m => {
      positionCounts[m.position] = (positionCounts[m.position] || 0) + 1;
    });
    
    const maxCount = Math.max(...Object.values(positionCounts), 1);
    const y = d3.scaleLinear()
      .domain([0, maxCount + 1])
      .range([trackY, 30]);

    // X axis
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(10))
      .append('text')
      .attr('x', innerWidth / 2)
      .attr('y', 40)
      .attr('fill', '#64748b')
      .attr('text-anchor', 'middle')
      .text('Amino Acid Position');

    // Protein track background
    g.append('rect')
      .attr('x', 0)
      .attr('y', trackY)
      .attr('width', innerWidth)
      .attr('height', trackHeight)
      .attr('fill', '#e2e8f0')
      .attr('rx', 4);

    // Protein domains
    proteinData.domains.forEach(domain => {
      g.append('rect')
        .attr('class', 'protein-domain')
        .attr('x', x(domain.start))
        .attr('y', trackY)
        .attr('width', x(domain.end) - x(domain.start))
        .attr('height', trackHeight)
        .attr('fill', domain.color)
        .attr('rx', 4);

      // Domain label
      g.append('text')
        .attr('x', x((domain.start + domain.end) / 2))
        .attr('y', trackY + trackHeight / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('font-weight', '500')
        .attr('fill', '#1e293b')
        .text(domain.name);
    });

    // Group mutations by position
    const groupedMutations = {};
    mutations.forEach(m => {
      if (!groupedMutations[m.position]) {
        groupedMutations[m.position] = [];
      }
      groupedMutations[m.position].push(m);
    });

    // Draw lollipops
    Object.entries(groupedMutations).forEach(([pos, muts]) => {
      const position = parseInt(pos);
      const count = muts.length;
      const mainType = muts[0].type;
      
      // Stem
      g.append('line')
        .attr('class', 'lollipop-stem')
        .attr('x1', x(position))
        .attr('x2', x(position))
        .attr('y1', trackY)
        .attr('y2', y(count))
        .attr('stroke', '#94a3b8')
        .attr('stroke-width', 1.5);

      // Head
      const head = g.append('circle')
        .attr('class', 'lollipop-head')
        .attr('cx', x(position))
        .attr('cy', y(count))
        .attr('r', Math.min(6 + count * 2, 15))
        .attr('fill', MUTATION_COLORS[mainType] || '#6b7280')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer');

      // Tooltip
      head.on('mouseover', function(event) {
        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');

        tooltip.html(`
          <strong>${muts[0].ref}${position}${muts[0].alt}</strong><br>
          Type: ${mainType}<br>
          Count: ${count}<br>
          Samples: ${muts.map(m => m.sample).join(', ')}
        `);
      }).on('mouseout', function() {
        d3.selectAll('.tooltip').remove();
      });
    });

    // Legend
    const legendData = Object.entries(MUTATION_COLORS).slice(0, 4);
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth - 120}, 0)`);

    legendData.forEach(([type, color], i) => {
      legend.append('circle')
        .attr('cx', 0)
        .attr('cy', i * 20)
        .attr('r', 6)
        .attr('fill', color);

      legend.append('text')
        .attr('x', 15)
        .attr('y', i * 20)
        .attr('dy', '0.35em')
        .attr('font-size', '11px')
        .attr('fill', '#64748b')
        .text(type);
    });
  }

  renderOncoprint() {
    const container = document.getElementById('oncoprintPlot');
    if (!container) return;
    
    container.innerHTML = '';
    
    const mutations = this.dataService.getFilteredMutations();
    
    // Get unique genes and samples
    const genes = [...new Set(mutations.map(m => m.gene))].slice(0, 10);
    const samples = [...new Set(mutations.map(m => m.sample))];
    
    if (genes.length === 0 || samples.length === 0) {
      container.innerHTML = '<div class="loading">No data available</div>';
      return;
    }

    const width = container.clientWidth || 600;
    const height = 300;
    const margin = { top: 40, right: 20, bottom: 40, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const x = d3.scaleBand()
      .domain(samples)
      .range([0, innerWidth])
      .padding(0.1);

    const y = d3.scaleBand()
      .domain(genes)
      .range([0, innerHeight])
      .padding(0.2);

    // Create mutation lookup
    const mutationMap = new Map();
    mutations.forEach(m => {
      const key = `${m.gene}-${m.sample}`;
      mutationMap.set(key, m);
    });

    // Draw grid background
    genes.forEach(gene => {
      samples.forEach(sample => {
        g.append('rect')
          .attr('x', x(sample))
          .attr('y', y(gene))
          .attr('width', x.bandwidth())
          .attr('height', y.bandwidth())
          .attr('fill', '#f8fafc')
          .attr('stroke', '#e2e8f0')
          .attr('stroke-width', 0.5);
      });
    });

    // Draw mutations
    genes.forEach(gene => {
      samples.forEach(sample => {
        const key = `${gene}-${sample}`;
        const mutation = mutationMap.get(key);
        
        if (mutation) {
          g.append('rect')
            .attr('x', x(sample))
            .attr('y', y(gene) + y.bandwidth() * 0.1)
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth() * 0.8)
            .attr('fill', MUTATION_COLORS[mutation.type] || '#6b7280')
            .attr('rx', 2);
        }
      });
    });

    // Gene labels
    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    // Sample labels (rotated)
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'rotate(-45)')
      .attr('text-anchor', 'end')
      .attr('dx', '-0.5em')
      .attr('dy', '0.5em')
      .attr('font-size', '10px');
  }
}
