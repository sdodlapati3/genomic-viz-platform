/**
 * Protein Panel Main Entry
 *
 * Demo application showcasing the protein visualization panel
 */

import { ProteinPanel } from './components/ProteinPanel';
import { getTP53Data } from './data/sampleData';
import { CONSEQUENCE_COLORS, CONSEQUENCE_LABELS } from './types/mutation';
import type { Mutation, ProteinDomain } from './types';

// Styles
const styles = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  
  body {
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
    background: #f5f6f8;
    padding: 20px;
    min-height: 100vh;
  }
  
  .app-container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .header {
    margin-bottom: 20px;
  }
  
  .header h1 {
    font-size: 24px;
    color: #333;
    margin-bottom: 8px;
  }
  
  .header p {
    font-size: 14px;
    color: #666;
  }
  
  .panel-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    padding: 20px;
    margin-bottom: 20px;
  }
  
  .controls {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #eee;
  }
  
  .control-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .control-group label {
    font-size: 11px;
    font-weight: 600;
    color: #666;
    text-transform: uppercase;
  }
  
  .control-group select,
  .control-group button {
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 13px;
    background: white;
    cursor: pointer;
  }
  
  .control-group button:hover {
    background: #f5f5f5;
  }
  
  .control-group button.active {
    background: #3498DB;
    color: white;
    border-color: #3498DB;
  }
  
  .filter-buttons {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
  }
  
  .filter-btn {
    padding: 4px 10px;
    border: 1px solid #ddd;
    border-radius: 3px;
    font-size: 11px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  
  .filter-btn:hover {
    background: #f5f5f5;
  }
  
  .filter-btn.active {
    border-color: currentColor;
    background: currentColor;
    color: white;
  }
  
  .filter-btn.active .dot {
    background: white !important;
  }
  
  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  
  .info-panel {
    background: #f8f9fa;
    border-radius: 6px;
    padding: 16px;
    margin-top: 16px;
  }
  
  .info-panel h3 {
    font-size: 13px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
  }
  
  .info-content {
    font-size: 13px;
    color: #666;
    line-height: 1.6;
  }
  
  .info-content strong {
    color: #333;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 12px;
    margin-top: 12px;
  }
  
  .stat-item {
    background: white;
    padding: 12px;
    border-radius: 4px;
    text-align: center;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: 600;
    color: #333;
  }
  
  .stat-label {
    font-size: 11px;
    color: #888;
    text-transform: uppercase;
    margin-top: 4px;
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = styles;
document.head.appendChild(styleSheet);

// Main application
function main() {
  // Get TP53 data
  const { protein, domains, mutations, fusions } = getTP53Data();

  // Create app container
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="app-container">
      <div class="header">
        <h1>🧬 Protein Panel Visualization</h1>
        <p>Interactive lollipop plot for ${protein.symbol} - ${protein.name}</p>
      </div>
      
      <div class="panel-container">
        <div class="controls">
          <div class="control-group">
            <label>Filter by Consequence</label>
            <div class="filter-buttons" id="filter-buttons">
              <!-- Generated dynamically -->
            </div>
          </div>
          
          <div class="control-group">
            <label>Zoom</label>
            <div style="display: flex; gap: 4px;">
              <button id="zoom-dbd">DNA-Binding Domain</button>
              <button id="zoom-reset">Reset</button>
            </div>
          </div>
          
          <div class="control-group">
            <label>Export</label>
            <button id="export-svg">Download SVG</button>
          </div>
        </div>
        
        <div id="protein-panel"></div>
        
        <div class="info-panel">
          <h3>Selected: <span id="selected-info">None</span></h3>
          <div class="info-content" id="info-content">
            Click on a mutation or domain to see details
          </div>
          
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-value">${protein.length}</div>
              <div class="stat-label">Amino Acids</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${domains.length}</div>
              <div class="stat-label">Domains</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${mutations.length}</div>
              <div class="stat-label">Mutations</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${mutations.reduce((sum, m) => sum + m.sampleCount, 0)}</div>
              <div class="stat-label">Total Samples</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Create protein panel
  const panel = new ProteinPanel({
    container: '#protein-panel',
    protein,
    domains,
    mutations,
    fusions,
    dimensions: {
      width: Math.min(1100, window.innerWidth - 80),
      height: 320,
    },
    interactions: {
      onMutationClick: handleMutationClick,
      onMutationHover: handleMutationHover,
      onDomainClick: handleDomainClick,
      onDomainHover: handleDomainHover,
    },
  });

  // Generate filter buttons
  const filterContainer = document.getElementById('filter-buttons');
  const activeFilters = new Set<string>();

  Object.entries(CONSEQUENCE_COLORS).forEach(([type, color]) => {
    if (type === 'synonymous') return; // Skip synonymous

    const btn = document.createElement('button');
    btn.className = 'filter-btn active';
    btn.dataset.type = type;
    btn.innerHTML = `<span class="dot" style="background: ${color}"></span>${CONSEQUENCE_LABELS[type as keyof typeof CONSEQUENCE_LABELS]}`;
    btn.style.color = color;
    activeFilters.add(type);

    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      if (activeFilters.has(type)) {
        activeFilters.delete(type);
      } else {
        activeFilters.add(type);
      }
      panel.filterByConsequence(Array.from(activeFilters));
    });

    filterContainer?.appendChild(btn);
  });

  // Zoom controls
  document.getElementById('zoom-dbd')?.addEventListener('click', () => {
    const dbd = domains.find((d) => d.shortName === 'DBD');
    if (dbd) {
      panel.zoomTo(dbd.start, dbd.end);
    }
  });

  document.getElementById('zoom-reset')?.addEventListener('click', () => {
    panel.resetZoom();
  });

  // Export
  document.getElementById('export-svg')?.addEventListener('click', () => {
    const svgContent = panel.exportSVG();
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${protein.symbol}_protein_panel.svg`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Handle window resize
  window.addEventListener('resize', () => {
    panel.resize(Math.min(1100, window.innerWidth - 80), 320);
  });

  // Event handlers
  function handleMutationClick(mutation: Mutation) {
    const selectedInfo = document.getElementById('selected-info');
    const infoContent = document.getElementById('info-content');

    if (selectedInfo) {
      selectedInfo.textContent =
        mutation.hgvsp || `p.${mutation.refAA}${mutation.position}${mutation.altAA}`;
    }

    if (infoContent) {
      infoContent.innerHTML = `
        <p><strong>Position:</strong> ${mutation.position}</p>
        <p><strong>Consequence:</strong> ${CONSEQUENCE_LABELS[mutation.consequence]}</p>
        <p><strong>Origin:</strong> ${mutation.origin}</p>
        <p><strong>Samples:</strong> ${mutation.sampleCount}</p>
        ${mutation.clinicalSignificance ? `<p><strong>Clinical:</strong> ${mutation.clinicalSignificance}</p>` : ''}
        ${mutation.cosmicId ? `<p><strong>COSMIC:</strong> ${mutation.cosmicId}</p>` : ''}
        ${mutation.isHotspot ? `<p>🔥 <strong>Mutation Hotspot</strong></p>` : ''}
      `;
    }

    panel.highlightMutation(mutation.id);
  }

  function handleMutationHover(mutation: Mutation | null) {
    // Hover handling is done by tooltip
  }

  function handleDomainClick(domain: ProteinDomain) {
    const selectedInfo = document.getElementById('selected-info');
    const infoContent = document.getElementById('info-content');

    if (selectedInfo) {
      selectedInfo.textContent = domain.name;
    }

    if (infoContent) {
      infoContent.innerHTML = `
        <p><strong>Domain:</strong> ${domain.name}</p>
        <p><strong>Position:</strong> ${domain.start} - ${domain.end} (${domain.end - domain.start + 1} aa)</p>
        <p><strong>Source:</strong> ${domain.source.toUpperCase()}</p>
        ${domain.description ? `<p><strong>Description:</strong> ${domain.description}</p>` : ''}
        ${domain.externalId ? `<p><strong>ID:</strong> ${domain.externalId}</p>` : ''}
      `;
    }

    // Zoom to domain
    panel.zoomTo(domain.start, domain.end);
  }

  function handleDomainHover(domain: ProteinDomain | null) {
    // Hover handling is done by DomainTrack tooltip
  }
}

// Run on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

// Export for module usage
export { ProteinPanel } from './components/ProteinPanel';
export * from './types';
export * from './data/sampleData';
