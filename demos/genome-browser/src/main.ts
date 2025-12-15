/**
 * Genome Browser Demo - Main Entry Point
 */

import { GenomeBrowser } from './GenomeBrowser';
import './styles.css';

// Initialize browser when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Create the genome browser
  const browser = new GenomeBrowser('#ruler', '#tracks', {
    width: 1100,
    trackAreaHeight: 350,
    rulerHeight: 50,
    labelWidth: 80,
  });

  // Set up navigation controls
  setupNavigationControls(browser);

  // Set up region input
  setupRegionInput(browser);

  // Set up track controls
  setupTrackControls(browser);

  // Feature info display
  browser.setFeatureSelectCallback((feature) => {
    displayFeatureInfo(feature);
  });

  // Region change callback
  browser.setRegionChangeCallback((region) => {
    const input = document.getElementById('region') as HTMLInputElement;
    if (input) {
      input.value = `${region.start}-${region.end}`;
    }
  });

  // Initial render
  browser.render();

  // Store browser instance globally for debugging
  (window as unknown as { browser: GenomeBrowser }).browser = browser;
});

function setupNavigationControls(browser: GenomeBrowser): void {
  const zoomInBtn = document.getElementById('zoom-in');
  const zoomOutBtn = document.getElementById('zoom-out');
  const panLeftBtn = document.getElementById('pan-left');
  const panRightBtn = document.getElementById('pan-right');

  zoomInBtn?.addEventListener('click', () => browser.zoomIn());
  zoomOutBtn?.addEventListener('click', () => browser.zoomOut());
  panLeftBtn?.addEventListener('click', () => browser.panLeft());
  panRightBtn?.addEventListener('click', () => browser.panRight());

  // Keyboard shortcuts
  document.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement) return;

    switch (event.key) {
      case '+':
      case '=':
        browser.zoomIn();
        break;
      case '-':
        browser.zoomOut();
        break;
      case 'ArrowLeft':
        browser.panLeft();
        break;
      case 'ArrowRight':
        browser.panRight();
        break;
    }
  });
}

function setupRegionInput(browser: GenomeBrowser): void {
  const regionInput = document.getElementById('region') as HTMLInputElement;
  const goBtn = document.getElementById('go-btn');
  const chromSelect = document.getElementById('chromosome') as HTMLSelectElement;

  // Set initial value
  const region = browser.getRegion();
  regionInput.value = `${region.start}-${region.end}`;

  const navigateToRegion = () => {
    const value = regionInput.value.trim();
    const match = value.match(/^(\d+)\s*[-:]\s*(\d+)$/);

    if (match) {
      const start = parseInt(match[1], 10);
      const end = parseInt(match[2], 10);

      if (start < end) {
        browser.setRegion({
          chromosome: chromSelect.value,
          start,
          end,
        });
      }
    }
  };

  goBtn?.addEventListener('click', navigateToRegion);
  regionInput?.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      navigateToRegion();
    }
  });

  chromSelect?.addEventListener('change', () => {
    // Reset to default region for the chromosome
    const regions: Record<string, { start: number; end: number }> = {
      chr17: { start: 7560000, end: 7730000 }, // TP53
      chr12: { start: 25350000, end: 25420000 }, // KRAS
      chr7: { start: 55000000, end: 55300000 }, // EGFR
    };

    const defaultRegion = regions[chromSelect.value] || regions.chr17;
    browser.setRegion({
      chromosome: chromSelect.value,
      ...defaultRegion,
    });

    regionInput.value = `${defaultRegion.start}-${defaultRegion.end}`;
  });
}

function setupTrackControls(browser: GenomeBrowser): void {
  const trackList = document.getElementById('track-list');

  const updateTrackList = () => {
    if (!trackList) return;

    trackList.innerHTML = '';

    const tracks = browser.getTrackList();
    tracks.forEach((track) => {
      const item = document.createElement('div');
      item.className = 'track-item';

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `track-${track.id}`;
      checkbox.checked = track.visible;
      checkbox.addEventListener('change', () => {
        browser.toggleTrackVisibility(track.id);
        updateTrackList();
      });

      const label = document.createElement('label');
      label.htmlFor = `track-${track.id}`;
      label.textContent = track.name;

      const typeSpan = document.createElement('span');
      typeSpan.className = 'track-type';
      typeSpan.textContent = track.type;

      item.appendChild(checkbox);
      item.appendChild(label);
      item.appendChild(typeSpan);
      trackList.appendChild(item);
    });
  };

  updateTrackList();

  // Add track dropdown
  const addTrackSelect = document.getElementById('add-track') as HTMLSelectElement;
  addTrackSelect?.addEventListener('change', () => {
    const trackType = addTrackSelect.value;
    if (trackType) {
      // For demo, we just show what would be added
      alert(
        `Would add a new ${trackType} track. In a full implementation, this would open a data source selector.`
      );
      addTrackSelect.value = '';
    }
  });
}

function displayFeatureInfo(feature: unknown): void {
  const infoPanel = document.getElementById('feature-info');
  if (!infoPanel) return;

  const feat = feature as Record<string, unknown>;

  let html = '<div class="feature-details">';

  if (feat.gene) {
    const gene = feat.gene as {
      symbol: string;
      id: string;
      chromosome: string;
      start: number;
      end: number;
      strand: string;
    };
    html += `
      <h4>${gene.symbol}</h4>
      <p><strong>ID:</strong> ${gene.id}</p>
      <p><strong>Location:</strong> ${gene.chromosome}:${gene.start.toLocaleString()}-${gene.end.toLocaleString()}</p>
      <p><strong>Strand:</strong> ${gene.strand === '+' ? 'Forward' : 'Reverse'}</p>
    `;
  } else if (feat.consequence) {
    const mut = feat as {
      gene?: string;
      aaChange?: string;
      chromosome: string;
      position: number;
      consequence: string;
      sampleCount: number;
    };
    html += `
      <h4>${mut.gene || 'Unknown'} - ${mut.aaChange || 'Unknown'}</h4>
      <p><strong>Position:</strong> ${mut.chromosome}:${mut.position.toLocaleString()}</p>
      <p><strong>Type:</strong> ${mut.consequence}</p>
      <p><strong>Samples:</strong> ${mut.sampleCount}</p>
    `;
  } else if (feat.type) {
    const ann = feat as { name: string; type: string; start: number; end: number };
    html += `
      <h4>${ann.name}</h4>
      <p><strong>Type:</strong> ${ann.type}</p>
      <p><strong>Size:</strong> ${(ann.end - ann.start).toLocaleString()} bp</p>
    `;
  } else {
    html += '<p>Select a feature to see details</p>';
  }

  html += '</div>';
  infoPanel.innerHTML = html;
}
