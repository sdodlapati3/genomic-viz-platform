/**
 * Module 5: Complete Lollipop Plot
 * Production-ready visualization with all features
 */

import * as d3 from 'd3';

// Gene data (real protein lengths and domains)
const geneData = {
  TP53: {
    length: 393,
    name: 'TP53',
    fullName: 'Tumor Protein P53',
    domains: [
      { name: 'TAD1', start: 1, end: 40, color: '#ef4444', description: 'Transactivation Domain 1' },
      { name: 'TAD2', start: 41, end: 61, color: '#f97316', description: 'Transactivation Domain 2' },
      { name: 'PRD', start: 64, end: 92, color: '#eab308', description: 'Proline-Rich Domain' },
      { name: 'DBD', start: 102, end: 292, color: '#3b82f6', description: 'DNA Binding Domain' },
      { name: 'NLS', start: 305, end: 322, color: '#a855f7', description: 'Nuclear Localization Signal' },
      { name: 'TET', start: 323, end: 356, color: '#22c55e', description: 'Tetramerization Domain' },
      { name: 'REG', start: 363, end: 393, color: '#06b6d4', description: 'Regulatory Domain' }
    ],
    mutations: [
      { position: 175, aaChange: 'R175H', count: 350, type: 'Missense' },
      { position: 248, aaChange: 'R248Q', count: 420, type: 'Missense' },
      { position: 248, aaChange: 'R248W', count: 280, type: 'Missense' },
      { position: 249, aaChange: 'R249S', count: 180, type: 'Missense' },
      { position: 273, aaChange: 'R273H', count: 380, type: 'Missense' },
      { position: 273, aaChange: 'R273C', count: 220, type: 'Missense' },
      { position: 282, aaChange: 'R282W', count: 280, type: 'Missense' },
      { position: 158, aaChange: 'R158H', count: 85, type: 'Missense' },
      { position: 179, aaChange: 'H179R', count: 95, type: 'Missense' },
      { position: 196, aaChange: 'R196*', count: 45, type: 'Nonsense' },
      { position: 213, aaChange: 'R213*', count: 120, type: 'Nonsense' },
      { position: 220, aaChange: 'Y220C', count: 150, type: 'Missense' },
      { position: 234, aaChange: 'Y234C', count: 65, type: 'Missense' },
      { position: 245, aaChange: 'G245S', count: 140, type: 'Missense' },
      { position: 22, aaChange: 'E22fs', count: 35, type: 'Frameshift' },
      { position: 47, aaChange: 'T47fs', count: 25, type: 'Frameshift' },
      { position: 125, aaChange: 'splice', count: 55, type: 'Splice' },
      { position: 224, aaChange: 'splice', count: 75, type: 'Splice' },
      { position: 307, aaChange: 'splice', count: 40, type: 'Splice' },
      { position: 337, aaChange: 'R337C', count: 65, type: 'Missense' },
      { position: 342, aaChange: 'L344P', count: 45, type: 'Missense' }
    ]
  },
  KRAS: {
    length: 189,
    name: 'KRAS',
    fullName: 'KRAS Proto-Oncogene',
    domains: [
      { name: 'G1', start: 10, end: 17, color: '#ef4444', description: 'P-loop' },
      { name: 'Switch I', start: 30, end: 38, color: '#3b82f6', description: 'Switch I Region' },
      { name: 'Switch II', start: 59, end: 76, color: '#22c55e', description: 'Switch II Region' },
      { name: 'HVR', start: 167, end: 189, color: '#f59e0b', description: 'Hypervariable Region' }
    ],
    mutations: [
      { position: 12, aaChange: 'G12D', count: 850, type: 'Missense' },
      { position: 12, aaChange: 'G12V', count: 720, type: 'Missense' },
      { position: 12, aaChange: 'G12C', count: 480, type: 'Missense' },
      { position: 13, aaChange: 'G13D', count: 280, type: 'Missense' },
      { position: 61, aaChange: 'Q61H', count: 180, type: 'Missense' },
      { position: 61, aaChange: 'Q61L', count: 120, type: 'Missense' },
      { position: 146, aaChange: 'A146T', count: 65, type: 'Missense' }
    ]
  },
  EGFR: {
    length: 1210,
    name: 'EGFR',
    fullName: 'Epidermal Growth Factor Receptor',
    domains: [
      { name: 'L1', start: 1, end: 165, color: '#3b82f6', description: 'Ligand Binding Domain 1' },
      { name: 'CR1', start: 166, end: 310, color: '#ef4444', description: 'Cysteine-Rich Domain 1' },
      { name: 'L2', start: 311, end: 480, color: '#3b82f6', description: 'Ligand Binding Domain 2' },
      { name: 'CR2', start: 481, end: 620, color: '#ef4444', description: 'Cysteine-Rich Domain 2' },
      { name: 'TM', start: 645, end: 668, color: '#8b5cf6', description: 'Transmembrane Domain' },
      { name: 'JM', start: 669, end: 710, color: '#f59e0b', description: 'Juxtamembrane Domain' },
      { name: 'Kinase', start: 711, end: 979, color: '#22c55e', description: 'Kinase Domain' },
      { name: 'C-tail', start: 980, end: 1210, color: '#06b6d4', description: 'C-terminal Tail' }
    ],
    mutations: [
      { position: 746, aaChange: 'E746_A750del', count: 420, type: 'Inframe' },
      { position: 790, aaChange: 'T790M', count: 380, type: 'Missense' },
      { position: 858, aaChange: 'L858R', count: 520, type: 'Missense' },
      { position: 719, aaChange: 'G719S', count: 85, type: 'Missense' },
      { position: 768, aaChange: 'S768I', count: 45, type: 'Missense' },
      { position: 861, aaChange: 'L861Q', count: 65, type: 'Missense' }
    ]
  }
};

const mutationColors = {
  'Missense': '#3b82f6',
  'Nonsense': '#ef4444',
  'Frameshift': '#22c55e',
  'Splice': '#f59e0b',
  'Inframe': '#8b5cf6'
};

let currentGene = 'TP53';

export function initCompleteModule() {
  setupGeneSelector();
  setupExportButtons();
  renderCompletePlot();
}

function setupGeneSelector() {
  d3.select('#gene-select').on('change', function() {
    currentGene = this.value;
    renderCompletePlot();
  });
}

function setupExportButtons() {
  d3.select('#export-svg').on('click', exportSVG);
  d3.select('#export-png').on('click', exportPNG);
}

function renderCompletePlot() {
  const container = d3.select('#complete-demo');
  container.selectAll('*').remove();
  
  const gene = geneData[currentGene];
  
  const width = 1000;
  const height = 450;
  const margin = { top: 60, right: 60, bottom: 70, left: 70 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  
  const svg = container.append('svg')
    .attr('id', 'lollipop-svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('background', '#0d1117');
  
  const g = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);
  
  // Title
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 30)
    .attr('text-anchor', 'middle')
    .attr('fill', '#e4e4e7')
    .attr('font-size', 18)
    .attr('font-weight', 600)
    .text(`${gene.name} Mutation Profile`);
  
  svg.append('text')
    .attr('x', width / 2)
    .attr('y', 50)
    .attr('text-anchor', 'middle')
    .attr('fill', '#6b7280')
    .attr('font-size', 12)
    .text(gene.fullName);
  
  // Cluster mutations
  const clusteredMutations = clusterMutations(gene.mutations);
  
  // Scales
  const xScale = d3.scaleLinear()
    .domain([0, gene.length])
    .range([0, plotWidth]);
  
  const maxCount = d3.max(clusteredMutations, d => d.totalCount) || 100;
  const yScale = d3.scaleLinear()
    .domain([0, maxCount * 1.15])
    .range([plotHeight - 60, 0]);
  
  const radiusScale = d3.scaleSqrt()
    .domain([0, maxCount])
    .range([5, 22]);
  
  const colorScale = d3.scaleOrdinal()
    .domain(Object.keys(mutationColors))
    .range(Object.values(mutationColors));
  
  const backboneY = plotHeight - 35;
  const backboneHeight = 24;
  
  // Grid lines
  const yGrid = g.append('g').attr('class', 'grid');
  yScale.ticks(5).forEach(tick => {
    yGrid.append('line')
      .attr('x1', 0)
      .attr('x2', plotWidth)
      .attr('y1', yScale(tick))
      .attr('y2', yScale(tick))
      .attr('stroke', '#1f2937')
      .attr('stroke-dasharray', '3,3');
  });
  
  // Draw backbone
  g.append('rect')
    .attr('class', 'protein-backbone')
    .attr('x', 0)
    .attr('y', backboneY - backboneHeight / 2)
    .attr('width', plotWidth)
    .attr('height', backboneHeight)
    .attr('rx', 4)
    .attr('fill', '#374151');
  
  // Draw domains
  const domainsGroup = g.append('g').attr('class', 'domains');
  
  gene.domains.forEach(domain => {
    const x = xScale(domain.start);
    const domainWidth = xScale(domain.end) - x;
    
    domainsGroup.append('rect')
      .attr('class', 'domain')
      .attr('x', x)
      .attr('y', backboneY - backboneHeight / 2)
      .attr('width', domainWidth)
      .attr('height', backboneHeight)
      .attr('fill', domain.color)
      .attr('rx', 3)
      .attr('opacity', 0.9)
      .style('cursor', 'pointer')
      .on('mouseover', function(event) {
        d3.select(this).attr('opacity', 1);
        showDomainTooltip(event, domain);
      })
      .on('mouseout', function() {
        d3.select(this).attr('opacity', 0.9);
        hideTooltip();
      });
    
    // Domain label
    if (domainWidth > 35) {
      domainsGroup.append('text')
        .attr('x', x + domainWidth / 2)
        .attr('y', backboneY + 5)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('font-size', Math.min(11, domainWidth / 4))
        .attr('font-weight', 500)
        .text(domain.name)
        .style('pointer-events', 'none');
    }
  });
  
  // Draw lollipops
  const lollipopsGroup = g.append('g').attr('class', 'lollipops');
  
  clusteredMutations.forEach(cluster => {
    const x = xScale(cluster.position);
    const y = yScale(cluster.totalCount);
    const radius = radiusScale(cluster.totalCount);
    
    // Stem
    lollipopsGroup.append('line')
      .attr('class', 'lollipop-stem')
      .attr('x1', x)
      .attr('y1', backboneY - backboneHeight / 2)
      .attr('x2', x)
      .attr('y2', y + radius);
    
    // If multiple types, create pie chart
    if (cluster.types.length > 1) {
      const pie = d3.pie()
        .value(d => d.count)
        .sort(null);
      
      const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
      
      const pieGroup = lollipopsGroup.append('g')
        .attr('class', 'lollipop-head-group')
        .attr('transform', `translate(${x}, ${y})`)
        .style('cursor', 'pointer');
      
      pieGroup.selectAll('path')
        .data(pie(cluster.types))
        .enter()
        .append('path')
        .attr('class', 'lollipop-head')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.type))
        .attr('stroke', 'white')
        .attr('stroke-width', 1);
      
      pieGroup
        .on('mouseover', function(event) {
          d3.select(this).selectAll('path')
            .transition()
            .duration(150)
            .attr('d', d3.arc().innerRadius(0).outerRadius(radius * 1.2));
          showMutationTooltip(event, cluster, gene.domains);
        })
        .on('mouseout', function() {
          d3.select(this).selectAll('path')
            .transition()
            .duration(150)
            .attr('d', arc);
          hideTooltip();
        });
    } else {
      // Single mutation type
      lollipopsGroup.append('circle')
        .attr('class', 'lollipop-head')
        .attr('cx', x)
        .attr('cy', y)
        .attr('r', radius)
        .attr('fill', colorScale(cluster.types[0].type))
        .style('cursor', 'pointer')
        .on('mouseover', function(event) {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('r', radius * 1.3);
          showMutationTooltip(event, cluster, gene.domains);
        })
        .on('mouseout', function() {
          d3.select(this)
            .transition()
            .duration(150)
            .attr('r', radius);
          hideTooltip();
        });
    }
  });
  
  // Axes
  const yAxis = d3.axisLeft(yScale)
    .ticks(5)
    .tickFormat(d => d);
  
  g.append('g')
    .call(yAxis)
    .selectAll('text')
    .attr('fill', '#9ca3af')
    .attr('font-size', 11);
  
  g.selectAll('.domain line, .domain path')
    .attr('stroke', '#4b5563');
  
  g.append('text')
    .attr('transform', 'rotate(-90)')
    .attr('x', -(plotHeight - 60) / 2)
    .attr('y', -55)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', 12)
    .attr('font-weight', 500)
    .text('Mutation Frequency');
  
  const xAxis = d3.axisBottom(xScale)
    .ticks(Math.min(10, gene.length / 50))
    .tickFormat(d => d);
  
  g.append('g')
    .attr('transform', `translate(0, ${plotHeight})`)
    .call(xAxis)
    .selectAll('text')
    .attr('fill', '#9ca3af')
    .attr('font-size', 11);
  
  g.append('text')
    .attr('x', plotWidth / 2)
    .attr('y', plotHeight + 50)
    .attr('text-anchor', 'middle')
    .attr('fill', '#9ca3af')
    .attr('font-size', 12)
    .attr('font-weight', 500)
    .text('Amino Acid Position');
  
  // Legend
  const legend = g.append('g')
    .attr('transform', `translate(${plotWidth - 130}, 0)`);
  
  legend.append('rect')
    .attr('x', -10)
    .attr('y', -10)
    .attr('width', 140)
    .attr('height', Object.keys(mutationColors).length * 22 + 30)
    .attr('fill', 'rgba(0,0,0,0.5)')
    .attr('rx', 4);
  
  legend.append('text')
    .attr('x', 0)
    .attr('y', 8)
    .attr('fill', '#9ca3af')
    .attr('font-size', 10)
    .attr('font-weight', 600)
    .text('MUTATION TYPE');
  
  Object.entries(mutationColors).forEach(([type, color], i) => {
    const row = legend.append('g')
      .attr('transform', `translate(0, ${25 + i * 22})`);
    
    row.append('circle')
      .attr('cx', 8)
      .attr('cy', 0)
      .attr('r', 6)
      .attr('fill', color);
    
    row.append('text')
      .attr('x', 22)
      .attr('y', 4)
      .attr('fill', '#d1d5db')
      .attr('font-size', 11)
      .text(type);
  });
  
  // Update statistics
  updateStatistics(gene.mutations, clusteredMutations);
}

function clusterMutations(mutations) {
  const positionMap = new Map();
  
  mutations.forEach(mut => {
    if (!positionMap.has(mut.position)) {
      positionMap.set(mut.position, {
        position: mut.position,
        types: [],
        totalCount: 0
      });
    }
    
    const cluster = positionMap.get(mut.position);
    cluster.types.push({
      type: mut.type,
      aaChange: mut.aaChange,
      count: mut.count
    });
    cluster.totalCount += mut.count;
  });
  
  return Array.from(positionMap.values());
}

function showMutationTooltip(event, cluster, domains) {
  const tooltip = d3.select('#complete-tooltip');
  
  const domain = domains.find(d => 
    cluster.position >= d.start && cluster.position <= d.end
  );
  
  let mutationsList = cluster.types
    .sort((a, b) => b.count - a.count)
    .map(t => `
      <div class="tooltip-row">
        <span class="tooltip-label">${t.aaChange}</span>
        <span class="tooltip-value" style="color: ${mutationColors[t.type]}">${t.count}</span>
      </div>
    `).join('');
  
  tooltip
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 10) + 'px')
    .classed('visible', true)
    .html(`
      <div class="tooltip-title">Position ${cluster.position}</div>
      <div class="tooltip-row">
        <span class="tooltip-label">Domain:</span>
        <span class="tooltip-value">${domain ? domain.name : 'Linker region'}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Total:</span>
        <span class="tooltip-value">${cluster.totalCount}</span>
      </div>
      <hr style="border-color: #374151; margin: 8px 0;">
      ${mutationsList}
    `);
}

function showDomainTooltip(event, domain) {
  const tooltip = d3.select('#complete-tooltip');
  
  tooltip
    .style('left', (event.pageX + 15) + 'px')
    .style('top', (event.pageY - 10) + 'px')
    .classed('visible', true)
    .html(`
      <div class="tooltip-title">${domain.name}</div>
      <div class="tooltip-row">
        <span class="tooltip-label">Full Name:</span>
        <span class="tooltip-value">${domain.description}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Position:</span>
        <span class="tooltip-value">${domain.start} - ${domain.end}</span>
      </div>
      <div class="tooltip-row">
        <span class="tooltip-label">Length:</span>
        <span class="tooltip-value">${domain.end - domain.start + 1} aa</span>
      </div>
    `);
}

function hideTooltip() {
  d3.select('#complete-tooltip').classed('visible', false);
}

function updateStatistics(mutations, clusteredMutations) {
  const totalCount = mutations.reduce((sum, m) => sum + m.count, 0);
  const uniquePositions = clusteredMutations.length;
  const hotspots = clusteredMutations.filter(c => c.totalCount > 100).length;
  
  const topMutation = mutations.reduce((max, m) => 
    m.count > max.count ? m : max
  , { count: 0 });
  
  d3.select('#total-mutations').text(totalCount.toLocaleString());
  d3.select('#unique-positions').text(uniquePositions);
  d3.select('#hotspot-count').text(hotspots);
  d3.select('#top-mutation').text(topMutation.aaChange || '-');
}

function exportSVG() {
  const svgEl = document.getElementById('lollipop-svg');
  if (!svgEl) return;
  
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const blob = new Blob([svgData], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentGene}_lollipop.svg`;
  link.click();
  
  URL.revokeObjectURL(url);
}

function exportPNG() {
  const svgEl = document.getElementById('lollipop-svg');
  if (!svgEl) return;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const scale = 2; // Higher resolution
  
  canvas.width = svgEl.width.baseVal.value * scale;
  canvas.height = svgEl.height.baseVal.value * scale;
  
  const svgData = new XMLSerializer().serializeToString(svgEl);
  const img = new Image();
  
  img.onload = function() {
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `${currentGene}_lollipop.png`;
    link.click();
  };
  
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}
