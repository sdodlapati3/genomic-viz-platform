/**
 * Expression View
 * 
 * Displays heatmap, volcano plot, and UMAP
 */

import * as d3 from 'd3';

export class ExpressionView {
  constructor(options) {
    this.container = options.container;
    this.dataService = options.dataService;
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('updateHeatmap')?.addEventListener('click', () => {
      this.renderHeatmap();
    });
  }

  render() {
    this.renderHeatmap();
    this.renderVolcano();
    this.renderUMAP();
  }

  renderHeatmap() {
    const container = document.getElementById('heatmapPlot');
    if (!container) return;
    
    container.innerHTML = '';
    
    const data = this.dataService.getExpressionData();
    
    const width = container.clientWidth || 600;
    const height = 400;
    const margin = { top: 60, right: 100, bottom: 80, left: 100 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

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
      .text('Gene Expression Heatmap');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Get genes and samples
    const genes = data.genes;
    const samples = data.samples;
    const expressionMatrix = data.expression;

    // Flatten data for visualization
    const flatData = [];
    genes.forEach((gene, i) => {
      samples.forEach((sample, j) => {
        flatData.push({
          gene,
          sample,
          value: expressionMatrix[i][j]
        });
      });
    });

    // Scales
    const x = d3.scaleBand()
      .domain(samples)
      .range([0, innerWidth])
      .padding(0.05);

    const y = d3.scaleBand()
      .domain(genes)
      .range([0, innerHeight])
      .padding(0.05);

    // Color scale - diverging blue-white-red
    const colorExtent = d3.extent(flatData, d => d.value);
    const maxAbs = Math.max(Math.abs(colorExtent[0]), Math.abs(colorExtent[1]));
    
    const color = d3.scaleSequential()
      .domain([-maxAbs, maxAbs])
      .interpolator(d3.interpolateRdBu);

    // Draw cells
    g.selectAll('.cell')
      .data(flatData)
      .enter()
      .append('rect')
      .attr('class', 'cell')
      .attr('x', d => x(d.sample))
      .attr('y', d => y(d.gene))
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .attr('fill', d => color(d.value))
      .attr('rx', 2)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke', '#0f172a')
          .attr('stroke-width', 2);

        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');

        tooltip.html(`
          <strong>${d.gene}</strong><br>
          Sample: ${d.sample}<br>
          Expression: ${d.value.toFixed(2)}
        `);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke', null);
        d3.selectAll('.tooltip').remove();
      });

    // Y axis - genes
    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y))
      .selectAll('text')
      .attr('font-size', '10px');

    // X axis - samples
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

    // Color legend
    const legendWidth = 15;
    const legendHeight = innerHeight;
    const legendX = innerWidth + 20;

    const legendScale = d3.scaleLinear()
      .domain([-maxAbs, maxAbs])
      .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
      .ticks(5)
      .tickFormat(d3.format('.1f'));

    const legend = g.append('g')
      .attr('transform', `translate(${legendX}, 0)`);

    // Create gradient
    const defs = svg.append('defs');
    const gradient = defs.append('linearGradient')
      .attr('id', 'heatmap-gradient')
      .attr('x1', '0%').attr('y1', '100%')
      .attr('x2', '0%').attr('y2', '0%');

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', color(-maxAbs));
    gradient.append('stop')
      .attr('offset', '50%')
      .attr('stop-color', color(0));
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color(maxAbs));

    legend.append('rect')
      .attr('width', legendWidth)
      .attr('height', legendHeight)
      .style('fill', 'url(#heatmap-gradient)');

    legend.append('g')
      .attr('transform', `translate(${legendWidth}, 0)`)
      .call(legendAxis);
  }

  renderVolcano() {
    const container = document.getElementById('volcanoPlot');
    if (!container) return;
    
    container.innerHTML = '';
    
    const data = this.dataService.getExpressionData();
    
    const width = container.clientWidth || 500;
    const height = 350;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

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
      .text('Differential Expression Volcano Plot');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Generate mock differential expression data
    const volcanoData = data.genes.map((gene, i) => ({
      gene,
      log2FC: (Math.random() - 0.5) * 6, // log2 fold change
      pValue: Math.random() * 0.1, // p-value
      negLogP: -Math.log10(Math.random() * 0.1 + 0.0001)
    }));

    // Scales
    const x = d3.scaleLinear()
      .domain([-4, 4])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(volcanoData, d => d.negLogP) + 1])
      .range([innerHeight, 0]);

    // Thresholds
    const fcThreshold = 1;
    const pThreshold = -Math.log10(0.05);

    // Draw threshold lines
    g.append('line')
      .attr('x1', x(-fcThreshold))
      .attr('x2', x(-fcThreshold))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#94a3b8')
      .attr('stroke-dasharray', '4,4');

    g.append('line')
      .attr('x1', x(fcThreshold))
      .attr('x2', x(fcThreshold))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#94a3b8')
      .attr('stroke-dasharray', '4,4');

    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', y(pThreshold))
      .attr('y2', y(pThreshold))
      .attr('stroke', '#94a3b8')
      .attr('stroke-dasharray', '4,4');

    // Color function
    const getPointColor = (d) => {
      if (d.negLogP > pThreshold && Math.abs(d.log2FC) > fcThreshold) {
        return d.log2FC > 0 ? '#ef4444' : '#3b82f6'; // Up: red, Down: blue
      }
      return '#94a3b8'; // Not significant: gray
    };

    // Draw points
    g.selectAll('.point')
      .data(volcanoData)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', d => x(d.log2FC))
      .attr('cy', d => y(d.negLogP))
      .attr('r', 5)
      .attr('fill', getPointColor)
      .attr('opacity', 0.7)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('r', 8)
          .attr('opacity', 1);

        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');

        tooltip.html(`
          <strong>${d.gene}</strong><br>
          Log2 FC: ${d.log2FC.toFixed(2)}<br>
          -Log10 P: ${d.negLogP.toFixed(2)}
        `);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('r', 5)
          .attr('opacity', 0.7);
        d3.selectAll('.tooltip').remove();
      });

    // Axes
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y));

    // Axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .text('Log2 Fold Change');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .text('-Log10 P-value');

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth - 100}, 10)`);

    [
      { color: '#ef4444', label: 'Up-regulated' },
      { color: '#3b82f6', label: 'Down-regulated' },
      { color: '#94a3b8', label: 'Not significant' }
    ].forEach((item, i) => {
      legend.append('circle')
        .attr('cx', 0)
        .attr('cy', i * 20)
        .attr('r', 5)
        .attr('fill', item.color);

      legend.append('text')
        .attr('x', 15)
        .attr('y', i * 20)
        .attr('dy', '0.35em')
        .attr('font-size', '11px')
        .attr('fill', '#64748b')
        .text(item.label);
    });
  }

  renderUMAP() {
    const container = document.getElementById('umapPlot');
    if (!container) return;
    
    container.innerHTML = '';
    
    const data = this.dataService.getExpressionData();
    
    const width = container.clientWidth || 500;
    const height = 350;
    const margin = { top: 40, right: 100, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

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
      .text('UMAP Dimensionality Reduction');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Generate mock UMAP coordinates with cluster structure
    const cancerTypes = ['ALL', 'AML', 'Neuroblastoma', 'Osteosarcoma'];
    const clusterCenters = {
      'ALL': { x: -3, y: 2 },
      'AML': { x: 2, y: 3 },
      'Neuroblastoma': { x: -2, y: -3 },
      'Osteosarcoma': { x: 3, y: -2 }
    };
    const clusterColors = {
      'ALL': '#3b82f6',
      'AML': '#ef4444',
      'Neuroblastoma': '#10b981',
      'Osteosarcoma': '#f59e0b'
    };

    const umapData = data.samples.map((sample, i) => {
      const cancerType = cancerTypes[i % cancerTypes.length];
      const center = clusterCenters[cancerType];
      return {
        sample,
        cancerType,
        umap1: center.x + (Math.random() - 0.5) * 2,
        umap2: center.y + (Math.random() - 0.5) * 2
      };
    });

    // Scales
    const xExtent = d3.extent(umapData, d => d.umap1);
    const yExtent = d3.extent(umapData, d => d.umap2);
    const padding = 1;

    const x = d3.scaleLinear()
      .domain([xExtent[0] - padding, xExtent[1] + padding])
      .range([0, innerWidth]);

    const y = d3.scaleLinear()
      .domain([yExtent[0] - padding, yExtent[1] + padding])
      .range([innerHeight, 0]);

    // Draw points
    g.selectAll('.umap-point')
      .data(umapData)
      .enter()
      .append('circle')
      .attr('class', 'umap-point')
      .attr('cx', d => x(d.umap1))
      .attr('cy', d => y(d.umap2))
      .attr('r', 8)
      .attr('fill', d => clusterColors[d.cancerType])
      .attr('opacity', 0.8)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('r', 12)
          .attr('opacity', 1);

        const tooltip = d3.select('body').append('div')
          .attr('class', 'tooltip')
          .style('left', (event.pageX + 10) + 'px')
          .style('top', (event.pageY - 10) + 'px');

        tooltip.html(`
          <strong>${d.sample}</strong><br>
          Type: ${d.cancerType}<br>
          UMAP1: ${d.umap1.toFixed(2)}<br>
          UMAP2: ${d.umap2.toFixed(2)}
        `);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('r', 8)
          .attr('opacity', 0.8);
        d3.selectAll('.tooltip').remove();
      });

    // Axes
    g.append('g')
      .attr('class', 'axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5));

    g.append('g')
      .attr('class', 'axis')
      .call(d3.axisLeft(y).ticks(5));

    // Axis labels
    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .text('UMAP 1');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .text('UMAP 2');

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(${innerWidth + 10}, 10)`);

    Object.entries(clusterColors).forEach(([type, color], i) => {
      legend.append('circle')
        .attr('cx', 0)
        .attr('cy', i * 25)
        .attr('r', 6)
        .attr('fill', color);

      legend.append('text')
        .attr('x', 15)
        .attr('y', i * 25)
        .attr('dy', '0.35em')
        .attr('font-size', '11px')
        .attr('fill', '#64748b')
        .text(type);
    });
  }
}
