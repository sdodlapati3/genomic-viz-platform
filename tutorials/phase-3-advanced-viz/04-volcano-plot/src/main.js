/**
 * Tutorial 3.4: Volcano Plot - Main Entry Point
 */

import { VolcanoPlot } from './components/VolcanoPlot.js';
import { generateDEData, getSummaryStats, GENE_CATEGORIES } from './data/deData.js';

let plot = null;
let data = null;
let fcThreshold = 1;
let pThreshold = 0.05;

function init() {
  console.log('Initializing...');
  
  // Generate data (20,000 genes - full human transcriptome!)
  console.time('generateData');
  data = generateDEData(20000, 10, 50);
  console.timeEnd('generateData');
  console.log('Generated', data.length, 'genes');
  
  // Setup controls
  setupControls();
  
  // Create plot
  plot = new VolcanoPlot('#chart', {
    width: 850,
    height: 550,
    fcThreshold,
    pValueThreshold: pThreshold,
    title: 'Differential Expression Analysis',
    onGeneSelect: showGeneDetails
  });
  
  plot.setData(data);
  updateStats();
  
  console.log('Plot created successfully');
}

function setupControls() {
  // FC threshold slider
  const fcSlider = document.getElementById('fcThreshold');
  const fcValue = document.getElementById('fcValue');
  if (fcSlider) {
    fcSlider.addEventListener('input', (e) => {
      fcThreshold = parseFloat(e.target.value);
      fcValue.textContent = fcThreshold.toFixed(1);
      if (plot) {
        plot.setFCThreshold(fcThreshold);
        updateStats();
      }
    });
  }
  
  // P-value slider
  const pSlider = document.getElementById('pValueThreshold');
  const pValue = document.getElementById('pValue');
  if (pSlider) {
    pSlider.addEventListener('input', (e) => {
      pThreshold = parseFloat(e.target.value);
      pValue.textContent = pThreshold.toFixed(3);
      if (plot) {
        plot.setPValueThreshold(pThreshold);
        updateStats();
      }
    });
  }
  
  // Category filter
  const catSelect = document.getElementById('categoryFilter');
  if (catSelect) {
    catSelect.innerHTML = '<option value="All">All Categories</option>';
    Object.keys(GENE_CATEGORIES).forEach(cat => {
      catSelect.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
  }
  
  // Gene search
  const searchInput = document.getElementById('geneSearch');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (q.length >= 2 && plot) {
        const matches = data.filter(d => d.gene.toLowerCase().includes(q)).map(d => d.gene);
        plot.highlightGenes(matches.slice(0, 10));
      } else if (plot) {
        plot.resetHighlight();
      }
    });
  }
  
  // Regenerate button
  const regenBtn = document.getElementById('regenerateData');
  if (regenBtn) {
    regenBtn.addEventListener('click', () => {
      console.time('regenerate');
      data = generateDEData(20000, 10, 50);
      plot.setData(data);
      updateStats();
      console.timeEnd('regenerate');
    });
  }
}

function updateStats() {
  const stats = getSummaryStats(data, fcThreshold, pThreshold);
  
  const el = (id) => document.getElementById(id);
  if (el('totalGenes')) el('totalGenes').textContent = stats.total;
  if (el('upregulated')) el('upregulated').textContent = stats.upregulated;
  if (el('downregulated')) el('downregulated').textContent = stats.downregulated;
  if (el('notSignificant')) el('notSignificant').textContent = stats.notSignificant;
  
  // Update tables
  updateTable('topUpTable', stats.topUpregulated);
  updateTable('topDownTable', stats.topDownregulated);
}

function updateTable(id, genes) {
  const tbody = document.getElementById(id);
  if (!tbody) return;
  
  tbody.innerHTML = genes.map(g => `
    <tr style="cursor:pointer" onclick="window.selectGene('${g.gene}')">
      <td><strong>${g.gene}</strong></td>
      <td>${g.log2FoldChange.toFixed(2)}</td>
      <td>${g.padj.toExponential(1)}</td>
    </tr>
  `).join('');
}

// Global function for table clicks
window.selectGene = function(name) {
  const gene = data.find(d => d.gene === name);
  if (gene) {
    plot.highlightGenes([name]);
    showGeneDetails(gene);
  }
};

function showGeneDetails(gene) {
  const panel = document.getElementById('geneDetails');
  if (!panel) return;
  
  const dir = gene.log2FoldChange > 0 ? 'Upregulated' : 'Downregulated';
  const color = gene.log2FoldChange > 0 ? '#e74c3c' : '#3498db';
  
  panel.innerHTML = `
    <h4>${gene.gene}</h4>
    <p><strong>Status:</strong> <span style="color:${color}">${dir}</span></p>
    <p><strong>log₂ FC:</strong> ${gene.log2FoldChange.toFixed(3)}</p>
    <p><strong>p-value:</strong> ${gene.pValue.toExponential(2)}</p>
    <p><strong>Adj. p-value:</strong> ${gene.padj.toExponential(2)}</p>
    <p><strong>Category:</strong> ${gene.category}</p>
  `;
  panel.style.display = 'block';
}

// Start when DOM ready
document.addEventListener('DOMContentLoaded', init);
